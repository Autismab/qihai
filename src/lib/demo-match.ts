import { DEMO_USER_EMAIL } from "@/lib/demo-user";
import { generateMatchForUser } from "@/lib/matching-engine";
import { prisma } from "@/lib/prisma";

function buildProfileNote(input: {
  heightCm: number;
  weightKg: number;
  education: string;
  incomeLevel: string;
  housingStatus: string;
  carStatus: string;
  partnerNote: string;
}) {
  return JSON.stringify({
    height: String(input.heightCm),
    weight: String(input.weightKg),
    education: input.education,
    income: input.incomeLevel,
    housing: input.housingStatus,
    car: input.carStatus,
    marriageGoal: input.partnerNote,
    partnerExpectation: input.partnerNote,
  });
}

const DEMO_MATCH_EMAIL = "starlight@datematch.local";

export async function ensureDemoMatch() {
  const demoUser = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: { nickname: "Demo User" },
    create: {
      email: DEMO_USER_EMAIL,
      nickname: "Demo User",
    },
  });

  return ensureMatchForUser(demoUser.id);
}

export async function ensureMatchForUser(userId: string) {
  const currentUser = await prisma.user.findUnique({ where: { id: userId } });
  if (!currentUser) throw new Error("USER_NOT_FOUND");

  await prisma.profile.upsert({
    where: { userId: currentUser.id },
    update: {
      gender: "男",
      birthYear: 1997,
      city: "上海",
      bio: buildProfileNote({
        heightCm: 178,
        weightKg: 72,
        education: "本科",
        incomeLevel: "30-50万",
        housingStatus: "已购房",
        carStatus: "已购车",
        partnerNote: "理性、稳定、重视长期关系与家庭责任。",
      }),
    },
    create: {
      userId: currentUser.id,
      gender: "男",
      birthYear: 1997,
      city: "上海",
      bio: buildProfileNote({
        heightCm: 178,
        weightKg: 72,
        education: "本科",
        incomeLevel: "30-50万",
        housingStatus: "已购房",
        carStatus: "已购车",
        partnerNote: "理性、稳定、重视长期关系与家庭责任。",
      }),
    },
  });

  await prisma.preference.upsert({
    where: { userId: currentUser.id },
    update: {
      targetGender: "女",
      ageMin: 24,
      ageMax: 31,
      cityPreference: "上海",
      relationshipGoal: JSON.stringify({
        marriageIntent: "一年内认真结婚",
        educationPreference: "本科及以上",
        incomePreference: "年收入20万以上",
        housingPreference: "不强制",
        carPreference: "不强制",
        partnerKeywords: "真诚、愿意进入婚姻、沟通直接",
      }),
      weeklyActive: true,
    },
    create: {
      userId: currentUser.id,
      targetGender: "女",
      ageMin: 24,
      ageMax: 31,
      cityPreference: "上海",
      relationshipGoal: JSON.stringify({
        marriageIntent: "一年内认真结婚",
        educationPreference: "本科及以上",
        incomePreference: "年收入20万以上",
        housingPreference: "不强制",
        carPreference: "不强制",
        partnerKeywords: "真诚、愿意进入婚姻、沟通直接",
      }),
      weeklyActive: true,
    },
  });

  const partner = await prisma.user.upsert({
    where: { email: DEMO_MATCH_EMAIL },
    update: { nickname: "星星" },
    create: {
      email: DEMO_MATCH_EMAIL,
      nickname: "星星",
    },
  });

  await prisma.profile.upsert({
    where: { userId: partner.id },
    update: {
      gender: "女",
      birthYear: 1998,
      city: "上海",
      bio: buildProfileNote({
        heightCm: 165,
        weightKg: 51,
        education: "硕士",
        incomeLevel: "20-30万",
        housingStatus: "有购房计划",
        carStatus: "暂无购车计划",
        partnerNote: "产品经理，重视真诚沟通和稳定家庭关系。",
      }),
    },
    create: {
      userId: partner.id,
      gender: "女",
      birthYear: 1998,
      city: "上海",
      bio: buildProfileNote({
        heightCm: 165,
        weightKg: 51,
        education: "硕士",
        incomeLevel: "20-30万",
        housingStatus: "有购房计划",
        carStatus: "暂无购车计划",
        partnerNote: "产品经理，重视真诚沟通和稳定家庭关系。",
      }),
    },
  });

  await prisma.preference.upsert({
    where: { userId: partner.id },
    update: {
      targetGender: "男",
      ageMin: 26,
      ageMax: 34,
      cityPreference: "上海",
      relationshipGoal: JSON.stringify({
        marriageIntent: "认真相亲，适合则结婚",
        educationPreference: "本科及以上",
        incomePreference: "稳定即可",
        housingPreference: "不强制",
        carPreference: "不强制",
        partnerKeywords: "成熟、有责任心、明确以结婚为目标",
      }),
      weeklyActive: true,
    },
    create: {
      userId: partner.id,
      targetGender: "男",
      ageMin: 26,
      ageMax: 34,
      cityPreference: "上海",
      relationshipGoal: JSON.stringify({
        marriageIntent: "认真相亲，适合则结婚",
        educationPreference: "本科及以上",
        incomePreference: "稳定即可",
        housingPreference: "不强制",
        carPreference: "不强制",
        partnerKeywords: "成熟、有责任心、明确以结婚为目标",
      }),
      weeklyActive: true,
    },
  });

  const questions = await prisma.surveyQuestion.findMany({ orderBy: { orderIndex: "asc" } });
  for (const [index, question] of questions.entries()) {
    await prisma.surveyAnswer.upsert({
      where: {
        userId_questionId: {
          userId: currentUser.id,
          questionId: question.id,
        },
      },
      update: {
        answer: "比较同意",
        score: 4 - (index % 2),
      },
      create: {
        userId: currentUser.id,
        questionId: question.id,
        answer: "比较同意",
        score: 4 - (index % 2),
      },
    });

    await prisma.surveyAnswer.upsert({
      where: {
        userId_questionId: {
          userId: partner.id,
          questionId: question.id,
        },
      },
      update: {
        answer: "非常同意",
        score: 5 - (index % 2),
      },
      create: {
        userId: partner.id,
        questionId: question.id,
        answer: "非常同意",
        score: 5 - (index % 2),
      },
    });
  }

  const result = await generateMatchForUser(currentUser.id);
  if (!result.generated || !result.matchId) {
    throw new Error(result.skippedReason ?? "MATCH_GENERATION_FAILED");
  }

  const match = await prisma.match.findUnique({ where: { id: result.matchId } });
  if (!match) {
    throw new Error("MATCH_NOT_FOUND_AFTER_GENERATION");
  }

  return match;
}
