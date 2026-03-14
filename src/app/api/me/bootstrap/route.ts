import { NextResponse } from "next/server";
import { ensureCurrentUser } from "@/lib/auth";
import { ensureDemoBootstrap } from "@/lib/bootstrap";
import { ensureCurrentMatchForUser, getCurrentMatchForUser } from "@/lib/match-service";

export async function POST() {
  const user = await ensureCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "BOOTSTRAP_USER_UNAVAILABLE" }, { status: 500 });
  }

  const before = await getCurrentMatchForUser(user.id);

  if (!before?.match) {
    await ensureDemoBootstrap();
  }

  const after = await ensureCurrentMatchForUser(user.id);

  return NextResponse.json({
    ok: true,
    userId: user.id,
    email: user.email,
    hadMatchBefore: Boolean(before?.match),
    hasMatchNow: Boolean(after?.match),
    matchId: after?.match?.id ?? null,
  });
}
