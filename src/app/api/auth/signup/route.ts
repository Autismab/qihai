import { NextRequest, NextResponse } from "next/server";
import { getAuthErrorMessage, registerWithPassword } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const email = String(body?.email ?? "");
    const password = String(body?.password ?? "");
    const nickname = String(body?.nickname ?? "");

    const user = await registerWithPassword(email, password, nickname);
    return NextResponse.json(
      { ok: true, user: { id: user.id, email: user.email, nickname: user.nickname } },
      { status: 201 },
    );
  } catch (error) {
    const message = getAuthErrorMessage(error);
    const code = error instanceof Error ? error.message : "UNKNOWN_AUTH_ERROR";
    const status = ["EMAIL_REQUIRED", "EMAIL_INVALID", "PASSWORD_TOO_SHORT", "NICKNAME_TOO_LONG"].includes(code)
      ? 400
      : code === "EMAIL_ALREADY_EXISTS"
        ? 409
        : 500;

    return NextResponse.json({ error: message, code }, { status });
  }
}
