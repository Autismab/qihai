import { prisma } from "@/lib/prisma";
import { DEMO_USER_EMAIL } from "@/lib/demo-user";
import { ensureDemoMatch } from "@/lib/demo-match";

const seedQuestions = [
  { dimension: "lifestyle", prompt: "你更喜欢提前规划还是临场发挥？", orderIndex: 1 },
  { dimension: "communication", prompt: "遇到冲突时你更愿意立刻沟通吗？", orderIndex: 2 },
  { dimension: "values", prompt: "你更重视情绪价值还是共同成长？", orderIndex: 3 },
];

export function isProductionEnvironment() {
  return process.env.NODE_ENV === "production";
}

export function canUseDemoBootstrap() {
  return !isProductionEnvironment();
}

export async function ensureDemoBootstrap() {
  if (!canUseDemoBootstrap()) {
    throw new Error("DEMO_BOOTSTRAP_DISABLED");
  }
  const user = await prisma.user.upsert({
    where: { email: DEMO_USER_EMAIL },
    update: {},
    create: {
      email: DEMO_USER_EMAIL,
      nickname: "Demo User",
    },
  });

  for (const question of seedQuestions) {
    await prisma.surveyQuestion.upsert({
      where: { id: `${question.dimension}-${question.orderIndex}` },
      update: {
        prompt: question.prompt,
        dimension: question.dimension,
        orderIndex: question.orderIndex,
        optionsJson: ["非常同意", "比较同意", "中立", "比较不同意", "非常不同意"],
      },
      create: {
        id: `${question.dimension}-${question.orderIndex}`,
        dimension: question.dimension,
        prompt: question.prompt,
        orderIndex: question.orderIndex,
        optionsJson: ["非常同意", "比较同意", "中立", "比较不同意", "非常不同意"],
      },
    });
  }

  const match = await ensureDemoMatch();

  return { user, match };
}
