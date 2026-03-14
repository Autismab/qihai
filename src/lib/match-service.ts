import { generateMatchForUser } from "@/lib/matching-engine";
import { prisma } from "@/lib/prisma";

enum MatchStatus {
  PENDING = "PENDING",
  DELIVERED = "DELIVERED",
  SKIPPED = "SKIPPED",
  REPORTED = "REPORTED",
}

export async function getCurrentMatchForUser(userId: string) {
  const currentUser = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      preference: true,
    },
  });

  if (!currentUser) {
    return null;
  }

  const match = await prisma.match.findFirst({
    where: {
      OR: [{ userAId: currentUser.id }, { userBId: currentUser.id }],
      status: MatchStatus.DELIVERED,
    },
    include: {
      batch: true,
      userA: {
        include: {
          profile: true,
        },
      },
      userB: {
        include: {
          profile: true,
        },
      },
    },
    orderBy: [{ deliveredAt: "desc" }, { createdAt: "desc" }],
  });

  if (!match) {
    return { currentUser, match: null };
  }

  const partner = match.userAId === currentUser.id ? match.userB : match.userA;
  const explanationItems = (match.explanation ?? "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    currentUser,
    match: {
      id: match.id,
      score: match.score,
      status: match.status,
      deliveredAt: match.deliveredAt,
      dayKey: match.batch.dayKey,
      weekKey: match.batch.weekKey,
      explanation: match.explanation,
      explanationItems,
      partner: {
        id: partner.id,
        nickname: partner.nickname ?? "待完善资料用户",
        email: partner.email,
        profile: partner.profile,
      },
    },
  };
}

export async function ensureCurrentMatchForUser(userId: string) {
  const current = await getCurrentMatchForUser(userId);
  if (current?.match) return current;

  const generated = await generateMatchForUser(userId);
  if (!generated.generated) {
    return getCurrentMatchForUser(userId);
  }

  return getCurrentMatchForUser(userId);
}
