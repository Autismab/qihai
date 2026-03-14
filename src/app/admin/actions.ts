"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { ensureAdminUser } from "@/lib/admin";
import { ensureMatchForUser } from "@/lib/demo-match";
import { runDailyMatchBatch } from "@/lib/matching-engine";

const ADMIN_RESULT_COOKIE = "date-match-admin-result";

async function executeRealBatch() {
  const adminUser = await ensureAdminUser();
  await ensureMatchForUser(adminUser.id);
  const batch = await runDailyMatchBatch();

  const cookieStore = await cookies();
  cookieStore.set(
    ADMIN_RESULT_COOKIE,
    JSON.stringify({
      type: "success",
      message: `Daily batch 已执行：参与 ${batch.eligibleUserCount} 人，生成 ${batch.generatedCount} 条相亲匹配，未生成 ${batch.skippedCount} 人。`,
      at: new Date().toISOString(),
    }),
    {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/admin",
      maxAge: 60 * 5,
    },
  );
}

async function handleAction() {
  try {
    await executeRealBatch();
  } catch (error) {
    const cookieStore = await cookies();
    cookieStore.set(
      ADMIN_RESULT_COOKIE,
      JSON.stringify({
        type: "error",
        message: error instanceof Error ? error.message : "UNKNOWN_ERROR",
        at: new Date().toISOString(),
      }),
      {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/admin",
        maxAge: 60 * 5,
      },
    );
  }

  revalidatePath("/admin");
}

export async function runRealBatchAction() {
  await handleAction();
}

export async function refreshDemoMatchAction() {
  await handleAction();
}
