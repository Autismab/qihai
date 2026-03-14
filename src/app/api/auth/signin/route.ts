import { NextRequest, NextResponse } from "next/server";
import { getAuthErrorMessage, signInWithPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "");
    const password = String(body?.password ?? "");

    const user = await signInWithPassword(email, password);
    return NextResponse.json({ ok: true, user: { id: user.id, email: user.email, nickname: user.nickname } });
  } catch (error) {
    const message = getAuthErrorMessage(error);
    const code = error instanceof Error ? error.message : "UNKNOWN_AUTH_ERROR";
    const status = ["EMAIL_REQUIRED", "EMAIL_INVALID", "PASSWORD_REQUIRED"].includes(code)
      ? 400
      : code === "INVALID_CREDENTIALS"
        ? 401
        : 500;

    return NextResponse.json({ error: message, code }, { status });
  }
}
