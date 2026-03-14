import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { MatchStatus } from "@prisma/client";
import { getCurrentUser } from "@/lib/auth";
import { DEMO_USER_EMAIL } from "@/lib/demo-user";
import { prisma } from "@/lib/prisma";

const ADMIN_RESULT_COOKIE = "date-match-admin-result";

type AdminActionResult = {
  type: "success" | "error";
  message: string;
  at: string;
};

function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";
  return new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export async function requireAdminPageAccess() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/auth/signin");
  }

  if (user.email !== DEMO_USER_EMAIL) {
    redirect("/dashboard");
  }

  return user;
}

export async function ensureAdminUser() {
  const user = await getCurrentUser();
  if (!user || user.email !== DEMO_USER_EMAIL) {
    throw new Error("ADMIN_ONLY");
  }
  return user;
}

export async function getAdminActionResult(): Promise<AdminActionResult | null> {
  const cookieStore = await cookies();
  const rawValue = cookieStore.get(ADMIN_RESULT_COOKIE)?.value;
  if (!rawValue) return null;

  try {
    return JSON.parse(rawValue) as AdminActionResult;
  } catch {
    return {
      type: "error",
      message: "无法解析最近一次执行结果",
      at: new Date().toISOString(),
    };
  }
}

export async function getAdminSnapshot() {
  const currentBatch = await prisma.matchBatch.findFirst({
    orderBy: [{ createdAt: "desc" }],
    include: {
      _count: {
        select: {
          matches: true,
        },
      },
    },
  });

  const [currentMatch, candidateCount, currentBatchMatches, latestBatchMatches, statusEntries] = await Promise.all([
    prisma.match.findFirst({
      orderBy: [{ deliveredAt: "desc" }, { createdAt: "desc" }],
      include: {
        batch: true,
        userA: true,
        userB: true,
      },
    }),
    prisma.user.count({
      where: {
        status: "ACTIVE",
        preference: {
          is: {
            dailyActive: true,
          },
        },
      },
    }),
    currentBatch
      ? prisma.match.findMany({
          where: { batchId: currentBatch.id },
          select: {
            userAId: true,
            userBId: true,
          },
        })
      : Promise.resolve([]),
    currentBatch
      ? prisma.match.findMany({
          where: { batchId: currentBatch.id },
          include: {
            userA: { select: { email: true, nickname: true } },
            userB: { select: { email: true, nickname: true } },
          },
          orderBy: [{ score: "desc" }, { createdAt: "asc" }],
          take: 6,
        })
      : Promise.resolve([]),
    Promise.all(
      Object.values(MatchStatus).map(async (status) => [
        status,
        await prisma.match.count({ where: { status } }),
      ] as const),
    ),
  ]);

  const statusMap = Object.fromEntries(statusEntries) as Record<MatchStatus, number>;
  const participantIds = new Set<string>();
  currentBatchMatches.forEach((item) => {
    participantIds.add(item.userAId);
    participantIds.add(item.userBId);
  });

  return {
    currentBatch: currentBatch
      ? {
          id: currentBatch.id,
          dayKey: currentBatch.dayKey,
          createdAt: currentBatch.createdAt,
          createdAtLabel: formatDateTime(currentBatch.createdAt),
          matchCount: currentBatch._count.matches,
        }
      : null,
    currentMatch: currentMatch
      ? {
          id: currentMatch.id,
          status: currentMatch.status,
          score: currentMatch.score,
          dayKey: currentMatch.batch.dayKey,
          createdAtLabel: formatDateTime(currentMatch.createdAt),
          deliveredAtLabel: formatDateTime(currentMatch.deliveredAt),
          pairLabel: `${currentMatch.userA.nickname ?? currentMatch.userA.email} ↔ ${currentMatch.userB.nickname ?? currentMatch.userB.email}`,
        }
      : null,
    statusMap,
    latestBatchSummary: currentBatch
      ? {
          candidateCount,
          participantCount: participantIds.size,
          matchCount: currentBatch._count.matches,
          unmatchedCount: Math.max(candidateCount - participantIds.size, 0),
          previewMatches: latestBatchMatches.map((match) => ({
            id: match.id,
            score: match.score,
            pairLabel: `${match.userA.nickname ?? match.userA.email} ↔ ${match.userB.nickname ?? match.userB.email}`,
          })),
        }
      : {
          candidateCount,
          participantCount: 0,
          matchCount: 0,
          unmatchedCount: candidateCount,
          previewMatches: [],
        },
  };
}
