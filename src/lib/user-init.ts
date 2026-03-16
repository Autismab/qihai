import { canUseDemoBootstrap, ensureDemoBootstrap, isProductionEnvironment } from "@/lib/bootstrap";
import { createAuthSession, getCurrentUser } from "@/lib/auth";

function shouldAutoSeedDemoSession() {
  if (isProductionEnvironment()) {
    return false;
  }
  return process.env.AUTO_BOOTSTRAP_DEMO_SESSION !== "false";
}

export async function ensureAppSeedData() {
  if (!canUseDemoBootstrap()) {
    return;
  }
  await ensureDemoBootstrap();
}

export async function ensureInitializedCurrentUser() {
  await ensureAppSeedData();

  const currentUser = await getCurrentUser();
  if (currentUser) {
    return currentUser;
  }

  if (!shouldAutoSeedDemoSession() || !canUseDemoBootstrap()) {
    throw new Error("UNAUTHORIZED");
  }

  const { user } = await ensureDemoBootstrap();
  await createAuthSession(user.id);

  const nextUser = await getCurrentUser();
  if (!nextUser) {
    throw new Error("UNAUTHORIZED");
  }

  return nextUser;
}
