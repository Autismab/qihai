import { Prisma } from "@prisma/client";

enum MatchStatus {
  PENDING = "PENDING",
  DELIVERED = "DELIVERED",
  SKIPPED = "SKIPPED",
  REPORTED = "REPORTED",
}
import { prisma } from "@/lib/prisma";

const DEFAULT_DAY_PREFIX = "serious-match";
const MIN_SURVEY_ANSWERS = 1;
const MAX_RESULTS_PER_USER = 5;
const AGE_GAP_TOLERANCE = 2;

const EDUCATION_RANK: Record<string, number> = {
  高中: 1,
  中专: 1,
  大专: 2,
  本科: 3,
  硕士: 4,
  博士: 5,
};

const INCOME_RANK: Record<string, number> = {
  "10万以下": 1,
  "10-20万": 2,
  "20-30万": 3,
  "30-50万": 4,
  "50万以上": 5,
};

type UserWithMatchInputs = Prisma.UserGetPayload<{
  include: {
    profile: true;
    preference: true;
    surveyAnswers: {
      include: {
        question: true;
      };
    };
  };
}>;

export type MatchCandidateResult = {
  candidateUserId: string;
  score: number;
  explanation: string;
  breakdown: {
    mutualPreferenceScore: number;
    profileScore: number;
    surveyScore: number;
    totalScore: number;
  };
};

export type GenerateMatchesForUserResult = {
  dayKey: string;
  batchId: string;
  generated: boolean;
  skippedReason?: string;
  matchId?: string;
  topCandidates: MatchCandidateResult[];
};

function getCurrentDayKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${DEFAULT_DAY_PREFIX}-${year}${month}${day}`;
}

function getAgeFromBirthYear(birthYear: number | null | undefined) {
  if (!birthYear) return null;
  return new Date().getFullYear() - birthYear;
}

function isNonEmpty(value: string | null | undefined) {
  return typeof value === "string" && value.trim().length > 0;
}

function normalizeText(value: string | null | undefined) {
  const text = typeof value === "string" ? value.trim() : "";
  return text.length > 0 ? text : null;
}

function normalizeList(value: string | null | undefined) {
  const text = normalizeText(value);
  if (!text) return [];
  return text
    .split(/[，,、\n]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function getSurveyAverage(user: UserWithMatchInputs) {
  const scored = user.surveyAnswers.filter((item) => typeof item.score === "number");
  if (!scored.length) return null;
  return scored.reduce((sum, item) => sum + (item.score ?? 0), 0) / scored.length;
}

function getSurveyAlignmentScore(currentUser: UserWithMatchInputs, candidate: UserWithMatchInputs) {
  const currentByQuestion = new Map(
    currentUser.surveyAnswers
      .filter((item) => typeof item.score === "number")
      .map((item) => [item.questionId, item.score as number]),
  );

  const overlaps = candidate.surveyAnswers
    .filter((item) => typeof item.score === "number")
    .map((item) => {
      const currentScore = currentByQuestion.get(item.questionId);
      if (typeof currentScore !== "number") return null;
      return Math.abs(currentScore - (item.score as number));
    })
    .filter((value): value is number => value !== null);

  if (!overlaps.length) return 10;

  const averageDiff = overlaps.reduce((sum, value) => sum + value, 0) / overlaps.length;
  return Math.max(0, Math.round(25 - averageDiff * 5));
}

function rankAtLeast(actual: string | null | undefined, required: string | null | undefined, rankMap: Record<string, number>) {
  const actualRank = actual ? rankMap[actual] ?? 0 : 0;
  const requiredRank = required ? rankMap[required] ?? 0 : 0;
  if (!requiredRank) return true;
  return actualRank >= requiredRank;
}

function satisfiesOwnPreference(source: UserWithMatchInputs, target: UserWithMatchInputs) {
  const preference = source.preference;
  const targetProfile = target.profile;
  if (!preference || !targetProfile) return false;
  if (!(preference.dailyActive ?? preference.weeklyActive ?? true)) return false;

  const targetGender = normalizeText(preference.targetGender);
  if (targetGender && targetGender !== "不限" && normalizeText(targetProfile.gender) !== targetGender) {
    return false;
  }

  const targetAge = getAgeFromBirthYear(targetProfile.birthYear);
  if (targetAge !== null) {
    if (typeof preference.ageMin === "number" && targetAge < preference.ageMin) return false;
    if (typeof preference.ageMax === "number" && targetAge > preference.ageMax) return false;
  }

  const preferredCities = normalizeList(preference.preferredCities);
  const cityPreference = normalizeText(preference.cityPreference);
  const targetCity = normalizeText(targetProfile.workCity ?? targetProfile.city);
  if (preferredCities.length > 0) {
    if (!targetCity || !preferredCities.includes(targetCity)) return false;
  } else if (cityPreference && cityPreference !== "不限") {
    if (targetCity !== cityPreference) return false;
  }

  if (!rankAtLeast(targetProfile.education, preference.minEducation, EDUCATION_RANK)) return false;
  if (!rankAtLeast(targetProfile.incomeLevel, preference.minIncomeLevel, INCOME_RANK)) return false;

  if (preference.requireHousing === true && !isNonEmpty(targetProfile.housingStatus)) return false;
  if (preference.requireCar === true && !isNonEmpty(targetProfile.carStatus)) return false;

  const preferredHousingStatus = normalizeText(preference.preferredHousingStatus);
  if (preferredHousingStatus && preferredHousingStatus !== "不限") {
    if (normalizeText(targetProfile.housingStatus) !== preferredHousingStatus) return false;
  }

  const preferredCarStatus = normalizeText(preference.preferredCarStatus);
  if (preferredCarStatus && preferredCarStatus !== "不限") {
    if (normalizeText(targetProfile.carStatus) !== preferredCarStatus) return false;
  }

  return true;
}

function isEligibleForMatching(user: UserWithMatchInputs) {
  return Boolean(
    user.status === "ACTIVE" &&
      user.profile &&
      user.preference &&
      (user.preference.dailyActive ?? user.preference.weeklyActive ?? true) &&
      isNonEmpty(user.profile.gender) &&
      typeof user.profile.birthYear === "number" &&
      isNonEmpty(user.profile.workCity ?? user.profile.city) &&
      isNonEmpty(user.profile.education) &&
      isNonEmpty(user.profile.incomeLevel) &&
      user.surveyAnswers.length >= MIN_SURVEY_ANSWERS,
  );
}

function scorePair(currentUser: UserWithMatchInputs, candidate: UserWithMatchInputs): MatchCandidateResult {
  const currentAge = getAgeFromBirthYear(currentUser.profile?.birthYear);
  const candidateAge = getAgeFromBirthYear(candidate.profile?.birthYear);
  const currentCity = normalizeText(currentUser.profile?.workCity ?? currentUser.profile?.city);
  const candidateCity = normalizeText(candidate.profile?.workCity ?? candidate.profile?.city);

  let mutualPreferenceScore = 0;
  if (satisfiesOwnPreference(currentUser, candidate)) mutualPreferenceScore += 25;
  if (satisfiesOwnPreference(candidate, currentUser)) mutualPreferenceScore += 25;

  let profileScore = 0;
  const sameCity = currentCity === candidateCity;
  if (sameCity) profileScore += 10;

  if (normalizeText(currentUser.profile?.education) === normalizeText(candidate.profile?.education)) profileScore += 6;
  if (normalizeText(currentUser.profile?.incomeLevel) === normalizeText(candidate.profile?.incomeLevel)) profileScore += 6;
  if (normalizeText(currentUser.profile?.housingStatus) === normalizeText(candidate.profile?.housingStatus)) profileScore += 4;
  if (normalizeText(currentUser.profile?.carStatus) === normalizeText(candidate.profile?.carStatus)) profileScore += 4;

  if (currentAge !== null && candidateAge !== null) {
    const ageGap = Math.abs(currentAge - candidateAge);
    profileScore += ageGap <= AGE_GAP_TOLERANCE ? 10 : ageGap <= 5 ? 6 : 2;
  }

  const currentSurveyAverage = getSurveyAverage(currentUser);
  const candidateSurveyAverage = getSurveyAverage(candidate);
  let surveyScore = getSurveyAlignmentScore(currentUser, candidate);

  if (currentSurveyAverage !== null && candidateSurveyAverage !== null) {
    const averageGap = Math.abs(currentSurveyAverage - candidateSurveyAverage);
    surveyScore += averageGap <= 0.5 ? 5 : averageGap <= 1 ? 3 : 0;
  }

  const totalScore = Math.max(0, Math.min(100, mutualPreferenceScore + profileScore + surveyScore));

  const reasons = [
    sameCity ? `双方工作城市都在${candidateCity ?? "同城"}，线下见面和婚恋推进效率更高。` : null,
    normalizeText(currentUser.profile?.education) === normalizeText(candidate.profile?.education)
      ? `学历层次接近，长期沟通成本更低。`
      : null,
    normalizeText(currentUser.profile?.incomeLevel) === normalizeText(candidate.profile?.incomeLevel)
      ? `收入区间相近，更容易对齐生活规划。`
      : null,
    currentAge !== null && candidateAge !== null
      ? `年龄差约 ${Math.abs(currentAge - candidateAge)} 岁，处于更容易建立稳定关系的区间。`
      : null,
    surveyScore >= 20 ? "问卷回答趋势接近，价值观与生活节奏更容易对齐。" : "问卷存在一定差异，但保留互补空间。",
    mutualPreferenceScore >= 50 ? "双方择偶要求是双向满足的，不是单边凑合。" : "当前满足度偏单边，建议先谨慎沟通核验核心条件。",
  ].filter((item): item is string => Boolean(item));

  return {
    candidateUserId: candidate.id,
    score: totalScore,
    explanation: reasons.slice(0, 4).join("\n"),
    breakdown: {
      mutualPreferenceScore,
      profileScore,
      surveyScore,
      totalScore,
    },
  };
}

async function loadEligibleUsers(excludeUserIds: string[] = []) {
  return prisma.user.findMany({
    where: {
      status: "ACTIVE",
      id: excludeUserIds.length ? { notIn: excludeUserIds } : undefined,
      profile: { isNot: null },
      preference: { isNot: null },
    },
    include: {
      profile: true,
      preference: true,
      surveyAnswers: {
        include: {
          question: true,
        },
      },
    },
  });
}

export async function buildMatchCandidatesForUser(userId: string): Promise<MatchCandidateResult[]> {
  const users = await loadEligibleUsers();
  const currentUser = users.find((item) => item.id === userId);
  if (!currentUser || !isEligibleForMatching(currentUser)) return [];

  return users
    .filter((candidate) => candidate.id !== currentUser.id)
    .filter((candidate) => isEligibleForMatching(candidate))
    .filter((candidate) => satisfiesOwnPreference(currentUser, candidate) || satisfiesOwnPreference(candidate, currentUser))
    .map((candidate) => scorePair(currentUser, candidate))
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_RESULTS_PER_USER);
}

export async function generateMatchForUser(userId: string, dayKey = getCurrentDayKey()): Promise<GenerateMatchesForUserResult> {
  const topCandidates = await buildMatchCandidatesForUser(userId);
  const batch = await prisma.matchBatch.upsert({
    where: { dayKey },
    update: {
      weekKey: dayKey,
    },
    create: { dayKey, weekKey: dayKey },
  });

  if (!topCandidates.length) {
    return {
      dayKey,
      batchId: batch.id,
      generated: false,
      skippedReason: "NO_ELIGIBLE_CANDIDATES",
      topCandidates: [],
    };
  }

  const best = topCandidates[0];
  const existing = await prisma.match.findFirst({
    where: {
      batchId: batch.id,
      OR: [{ userAId: userId }, { userBId: userId }],
    },
    orderBy: [{ createdAt: "desc" }],
  });

  const match = existing
    ? await prisma.match.update({
        where: { id: existing.id },
        data: {
          userAId: userId,
          userBId: best.candidateUserId,
          score: best.score,
          explanation: best.explanation,
          status: MatchStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      })
    : await prisma.match.create({
        data: {
          batchId: batch.id,
          userAId: userId,
          userBId: best.candidateUserId,
          score: best.score,
          explanation: best.explanation,
          status: MatchStatus.DELIVERED,
          deliveredAt: new Date(),
        },
      });

  return {
    dayKey,
    batchId: batch.id,
    generated: true,
    matchId: match.id,
    topCandidates,
  };
}

export async function runDailyMatchBatch(dayKey = getCurrentDayKey()) {
  const users = await loadEligibleUsers();
  const eligibleUsers = users.filter((user) => isEligibleForMatching(user));
  const results: GenerateMatchesForUserResult[] = [];

  for (const user of eligibleUsers) {
    results.push(await generateMatchForUser(user.id, dayKey));
  }

  return {
    dayKey,
    eligibleUserCount: eligibleUsers.length,
    generatedCount: results.filter((item) => item.generated).length,
    skippedCount: results.filter((item) => !item.generated).length,
    results,
  };
}
