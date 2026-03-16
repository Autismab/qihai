import { prisma } from "@/lib/prisma";
import { ensureInitializedCurrentUser } from "@/lib/user-init";
import { extractPreferenceStructuredFields, extractProfileStructuredFields, firstNonNullBoolean } from "@/lib/structured-fields";

const PROFILE_FIELDS = [
  "gender",
  "birthYear",
  "workCity",
  "heightCm",
  "weightKg",
  "education",
  "incomeLevel",
  "housingStatus",
  "carStatus",
] as const;
const PREFERENCE_FIELDS = [
  "targetGender",
  "ageMin",
  "ageMax",
  "preferredCities",
  "minEducation",
  "minIncomeLevel",
  "preferredHousingStatus",
  "preferredCarStatus",
  "partnerExpectation",
] as const;

function countFilled(values: Array<unknown>) {
  return values.filter((value) => {
    if (typeof value === "string") return value.trim().length > 0;
    return value !== null && value !== undefined;
  }).length;
}

function toPercent(filled: number, total: number) {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((filled / total) * 100)));
}

function formatNullableText(value: string | null | undefined, fallback: string) {
  return value && value.trim() ? value : fallback;
}

function readJsonText(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

export type DashboardSnapshot = Awaited<ReturnType<typeof getDashboardSnapshot>>;

export async function getDashboardSnapshot() {
  try {
    const user = await ensureInitializedCurrentUser();
    const questionCount = await prisma.surveyQuestion.count();

    const surveyAnsweredRaw = await prisma.surveyAnswer.findMany({
      where: { userId: user.id },
      select: { questionId: true },
    });
    const surveyAnswered = new Set(surveyAnsweredRaw.map((item: { questionId: string }) => item.questionId)).size;

    const structuredProfile = extractProfileStructuredFields(user.profile ?? {});
    const structuredPreference = extractPreferenceStructuredFields(user.preference ?? {});
    const profileJson = structuredProfile.extra;
    const preferenceJson = structuredPreference.extra;

    const derivedProfile = {
      workCity: user.profile?.workCity ?? user.profile?.city ?? structuredProfile.currentCity,
      heightCm: user.profile?.heightCm ?? readJsonText(profileJson, "height"),
      weightKg: user.profile?.weightKg ?? readJsonText(profileJson, "weight"),
      education: user.profile?.education ?? readJsonText(profileJson, "education"),
      incomeLevel: user.profile?.incomeLevel ?? readJsonText(profileJson, "income"),
      housingStatus: user.profile?.housingStatus ?? readJsonText(profileJson, "housing"),
      carStatus: user.profile?.carStatus ?? readJsonText(profileJson, "car"),
      hometown: structuredProfile.hometown,
      maritalStatus: structuredProfile.maritalStatus,
      childrenStatus: structuredProfile.childrenStatus,
      planReturnToQidong: structuredProfile.planReturnToQidong,
    };

    const derivedPreference = {
      preferredCities: user.preference?.preferredCities ?? user.preference?.cityPreference,
      minEducation: user.preference?.minEducation ?? readJsonText(preferenceJson, "educationPreference"),
      minIncomeLevel: user.preference?.minIncomeLevel ?? readJsonText(preferenceJson, "incomePreference"),
      preferredHousingStatus: user.preference?.preferredHousingStatus ?? readJsonText(preferenceJson, "housingPreference"),
      preferredCarStatus: user.preference?.preferredCarStatus ?? readJsonText(preferenceJson, "carPreference"),
      partnerExpectation:
        user.preference?.partnerExpectation ?? readJsonText(preferenceJson, "partnerKeywords") ?? readJsonText(preferenceJson, "marriageIntent"),
      acceptLongDistance: structuredPreference.acceptLongDistance,
      acceptRelocateToQidong: structuredPreference.acceptRelocateToQidong,
      preferredHometown: structuredPreference.preferredHometown,
      acceptedMaritalStatuses: structuredPreference.acceptedMaritalStatuses,
      acceptPartnerWithChildren: structuredPreference.acceptPartnerWithChildren,
    };

    const profileFilled = countFilled([
      user.profile?.gender,
      user.profile?.birthYear,
      derivedProfile.workCity,
      derivedProfile.heightCm,
      derivedProfile.weightKg,
      derivedProfile.education,
      derivedProfile.incomeLevel,
      derivedProfile.housingStatus,
      derivedProfile.carStatus,
    ]);

    const preferenceFilled = countFilled([
      user.preference?.targetGender,
      user.preference?.ageMin,
      user.preference?.ageMax,
      derivedPreference.preferredCities,
      derivedPreference.minEducation,
      derivedPreference.minIncomeLevel,
      derivedPreference.preferredHousingStatus,
      derivedPreference.preferredCarStatus,
      derivedPreference.partnerExpectation,
    ]);

    const profileCompletion = toPercent(profileFilled, PROFILE_FIELDS.length);
    const preferenceCompletion = toPercent(preferenceFilled, PREFERENCE_FIELDS.length);
    const surveyCompletion = questionCount > 0 ? toPercent(surveyAnswered, questionCount) : 0;
    const overallCompletion = Math.round((profileCompletion + preferenceCompletion + surveyCompletion) / 3);

    const match = await prisma.match.findFirst({
      where: {
        OR: [{ userAId: user.id }, { userBId: user.id }],
      },
      include: {
        batch: true,
        userA: { select: { nickname: true, email: true } },
        userB: { select: { nickname: true, email: true } },
      },
      orderBy: [{ createdAt: "desc" }],
    });

    const hasCoreProfile = profileFilled >= 6;
    const hasCorePreference = preferenceFilled >= 5;
    const surveyDone = questionCount > 0 && surveyAnswered >= questionCount;
    const isPoolReady = Boolean(user.preference?.dailyActive ?? user.preference?.weeklyActive) && hasCoreProfile && hasCorePreference && surveyDone;

    const counterpart = match
      ? match.userAId === user.id
        ? match.userB.nickname ?? match.userB.email
        : match.userA.nickname ?? match.userA.email
      : null;

    return {
      authenticated: true,
      ready: true,
      profileCompletion,
      preferenceCompletion,
      surveyCompletion,
      overallCompletion,
      profileStatus: profileFilled
        ? `${profileFilled}/${PROFILE_FIELDS.length} 项已完善 · ${formatNullableText(derivedProfile.workCity, "工作城市待补充")}`
        : "婚恋资料尚未填写",
      preferenceStatus: preferenceFilled
        ? `${preferenceFilled}/${PREFERENCE_FIELDS.length} 项已设置 · ${(user.preference?.dailyActive ?? user.preference?.weeklyActive) ? "已开启每日匹配" : "已暂停入池"}`
        : "择偶要求尚未设置",
      surveyStatus:
        questionCount > 0
          ? `${surveyAnswered}/${questionCount} 题已完成${surveyDone ? " · 可参与每日评分" : " · 继续补完问卷"}`
          : "题库尚未初始化",
      poolStatus: isPoolReady
        ? "已满足入池条件，今天可参与相亲匹配"
        : (user.preference?.dailyActive ?? user.preference?.weeklyActive) === false
          ? "你已手动关闭今日入池"
          : "暂未满足入池条件，继续补完结构化资料即可",
      poolTone: isPoolReady ? ("ready" as const) : ("idle" as const),
      nextActions: [
        !hasCoreProfile ? "补完结构化婚恋资料" : null,
        !user.preference || !hasCorePreference ? "完善择偶要求" : null,
        !surveyDone ? "完成剩余问卷题目" : null,
        (user.preference?.dailyActive ?? user.preference?.weeklyActive) === false ? "重新开启每日匹配" : null,
      ].filter((item): item is string => Boolean(item)),
      currentMatchSummary: match
        ? `最近一次匹配状态：${match.status} · 对象：${counterpart ?? "待分配"} · 批次 ${match.batch.dayKey}`
        : "今天还没有生成你的匹配结果。",
      metrics: {
        nickname: formatNullableText(user.nickname, "未设置昵称"),
        gender: formatNullableText(user.profile?.gender, "未填写"),
        city: formatNullableText(derivedProfile.workCity, "未知城市"),
        target: formatNullableText(user.preference?.targetGender, "未设置偏好"),
        relationshipGoal: formatNullableText(readJsonText(preferenceJson, "marriageIntent") || user.preference?.relationshipGoal, "未设置目标"),
        hometown: formatNullableText(derivedProfile.hometown, "未填写家乡"),
        maritalStatus: formatNullableText(derivedProfile.maritalStatus, "未填写婚姻状态"),
        childrenStatus: formatNullableText(derivedProfile.childrenStatus, "未填写子女情况"),
        planReturnToQidong: firstNonNullBoolean(derivedProfile.planReturnToQidong) === null ? "未设置" : derivedProfile.planReturnToQidong ? "计划回启东" : "暂无回启东计划",
        acceptLongDistance: firstNonNullBoolean(derivedPreference.acceptLongDistance) === null ? "未设置" : derivedPreference.acceptLongDistance ? "接受异地" : "不接受异地",
        acceptRelocateToQidong:
          firstNonNullBoolean(derivedPreference.acceptRelocateToQidong) === null
            ? "未设置"
            : derivedPreference.acceptRelocateToQidong
              ? "接受落地启东"
              : "不接受落地启东",
        preferredHometown: formatNullableText(derivedPreference.preferredHometown, "未设置家乡偏好"),
        acceptedMaritalStatuses: derivedPreference.acceptedMaritalStatuses.length ? derivedPreference.acceptedMaritalStatuses.join(" / ") : "未设置",
        acceptPartnerWithChildren:
          firstNonNullBoolean(derivedPreference.acceptPartnerWithChildren) === null
            ? "未设置"
            : derivedPreference.acceptPartnerWithChildren
              ? "接受对方有子女"
              : "不接受对方有子女",
        surveyAnswered,
        surveyTotal: questionCount,
      },
    };
  } catch {
    return {
      authenticated: false,
      ready: false,
      profileCompletion: 0,
      preferenceCompletion: 0,
      surveyCompletion: 0,
      overallCompletion: 0,
      profileStatus: "数据库暂不可用",
      preferenceStatus: "无法读取偏好数据",
      surveyStatus: "无法读取问卷状态",
      poolStatus: "系统初始化中，稍后再试",
      poolTone: "error" as const,
      nextActions: ["确认数据库已迁移", "重新登录", "刷新 dashboard"],
      currentMatchSummary: "当前无法读取匹配结果。",
      metrics: {
        nickname: "未知",
        gender: "未知",
        city: "未知",
        target: "未知",
        relationshipGoal: "未知",
        surveyAnswered: 0,
        surveyTotal: 0,
      },
    };
  }
}
