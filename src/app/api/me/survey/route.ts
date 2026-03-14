import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureInitializedCurrentUser } from "@/lib/user-init";

export async function GET() {
  try {
    const user = await ensureInitializedCurrentUser();
    const questions = await prisma.surveyQuestion.findMany({ orderBy: { orderIndex: "asc" } });
    const answers = await prisma.surveyAnswer.findMany({ where: { userId: user.id } });

    return NextResponse.json({ questions, answers });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load survey", detail: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await ensureInitializedCurrentUser();
    const body = await request.json();
    const answers: Array<{ questionId: string; answer: string; score?: number | null }> = Array.isArray(body.answers)
      ? body.answers
      : [];

    await prisma.$transaction(
      answers.map((item) =>
        prisma.surveyAnswer.upsert({
          where: {
            userId_questionId: {
              userId: user.id,
              questionId: item.questionId,
            },
          },
          update: {
            answer: item.answer,
            score: item.score ?? null,
          },
          create: {
            userId: user.id,
            questionId: item.questionId,
            answer: item.answer,
            score: item.score ?? null,
          },
        }),
      ),
    );

    return NextResponse.json({ ok: true, count: answers.length });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save survey", detail: String(error) }, { status: 500 });
  }
}
