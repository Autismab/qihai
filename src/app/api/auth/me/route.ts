import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";

export async function GET() {
  const current = await getCurrentSession();

  if (!current) {
    return NextResponse.json({ authenticated: false, user: null, session: null });
  }

  return NextResponse.json({
    authenticated: true,
    session: {
      issuedAt: current.session.issuedAt,
      version: current.session.version,
    },
    user: {
      id: current.user.id,
      email: current.user.email,
      nickname: current.user.nickname,
      status: current.user.status,
      profile: current.user.profile,
      preference: current.user.preference,
    },
  });
}
