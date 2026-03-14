import { PrismaClient } from '@prisma/client';
import Database from 'better-sqlite3';

const db = new Database('dev.db');
const prisma = new PrismaClient({ adapter: { provider: 'sqlite', connect: async () => db } });

const PROFILE_FIELDS = ['nickname', 'gender', 'birthYear', 'city', 'bio'];
const PREFERENCE_FIELDS = ['targetGender', 'relationshipGoal', 'ageMin', 'ageMax', 'cityPreference'];
const DEMO_USER_EMAIL = 'demo@datematch.local';

function countFilled(values) {
  return values.filter((value) => {
    if (typeof value === 'string') return value.trim().length > 0;
    return value !== null && value !== undefined;
  }).length;
}
function toPercent(filled, total) {
  if (total <= 0) return 0;
  return Math.round((filled / total) * 100);
}

async function snapshot() {
  const user = await prisma.user.findUnique({
    where: { email: DEMO_USER_EMAIL },
    include: { profile: true, preference: true, surveyAnswers: true },
  });
  const questionCount = await prisma.surveyQuestion.count();
  const profileFilled = countFilled([
    user?.nickname,
    user?.profile?.gender,
    user?.profile?.birthYear,
    user?.profile?.city,
    user?.profile?.bio,
  ]);
  const preferenceFilled = countFilled([
    user?.preference?.targetGender,
    user?.preference?.relationshipGoal,
    user?.preference?.ageMin,
    user?.preference?.ageMax,
    user?.preference?.cityPreference,
  ]);
  const surveyAnswered = user?.surveyAnswers?.length ?? 0;
  const profileCompletion = toPercent(profileFilled, PROFILE_FIELDS.length);
  const preferenceCompletion = toPercent(preferenceFilled, PREFERENCE_FIELDS.length);
  const surveyCompletion = questionCount > 0 ? toPercent(surveyAnswered, questionCount) : 0;
  const overallCompletion = Math.round((profileCompletion + preferenceCompletion + surveyCompletion) / 3);
  const hasCoreProfile = profileFilled >= 3;
  const hasCorePreference = preferenceFilled >= 3;
  const surveyDone = questionCount > 0 && surveyAnswered >= questionCount;
  const isPoolReady = Boolean(user?.preference?.weeklyActive) && hasCoreProfile && hasCorePreference && surveyDone;
  const nextActions = [
    !user?.nickname || !user?.profile?.bio ? '补完个人展示信息' : null,
    !user?.preference || !hasCorePreference ? '完善匹配偏好' : null,
    !surveyDone ? '完成剩余问卷题目' : null,
    user?.preference?.weeklyActive === false ? '重新开启每周匹配' : null,
  ].filter(Boolean);
  return { questionCount, profileFilled, preferenceFilled, surveyAnswered, profileCompletion, preferenceCompletion, surveyCompletion, overallCompletion, surveyDone, isPoolReady, nextActions };
}

async function main() {
  const user = await prisma.user.findUnique({ where: { email: DEMO_USER_EMAIL } });
  if (!user) throw new Error('demo user missing');
  const questions = await prisma.surveyQuestion.findMany({ orderBy: { orderIndex: 'asc' } });
  const before = await snapshot();
  await prisma.surveyAnswer.deleteMany({ where: { userId: user.id } });
  const cleared = await snapshot();
  for (const q of questions) {
    await prisma.surveyAnswer.upsert({
      where: { userId_questionId: { userId: user.id, questionId: q.id } },
      update: { answer: '中立', score: 3 },
      create: { userId: user.id, questionId: q.id, answer: '中立', score: 3 },
    });
  }
  const after = await snapshot();
  console.log(JSON.stringify({ before, cleared, after }, null, 2));
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await prisma.$disconnect();
  process.exit(1);
});
