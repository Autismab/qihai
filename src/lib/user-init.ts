import { ensureDemoBootstrap } from "@/lib/bootstrap";
import { createAuthSession, getCurrentUser } from "@/lib/auth";

function shouldAutoSeedDemoSession() {
  return process.env.AUTO_BOOTSTRAP_DEMO_SESSION !== "false";
}

export async function ensureAppSeedData() {
  await ensureDemoBootstrap();
}

export async function ensureInitializedCurrentUser() {
  await ensureAppSeedData();

  const currentUser = await getCurrentUser();
  if (currentUser) {
    return currentUser;
  }

  if (!shouldAutoSeedDemoSession()) {
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
