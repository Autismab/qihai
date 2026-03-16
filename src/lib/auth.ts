import crypto from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";
import { canUseDemoBootstrap, ensureDemoBootstrap, isProductionEnvironment } from "@/lib/bootstrap";
import { DEMO_USER_EMAIL } from "@/lib/demo-user";

const scryptAsync = promisify(crypto.scrypt);
const SESSION_COOKIE_NAME = "date-match-session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30;
const MIN_PASSWORD_LENGTH = 8;
const NICKNAME_MAX_LENGTH = 24;

type CookieStore = Awaited<ReturnType<typeof cookies>>;
type SessionPayload = {
  userId: string;
  issuedAt: number;
  version: 1;
};

type SafeCurrentUser = Awaited<ReturnType<typeof fetchCurrentUserRecord>>;

function getSessionSecret() {
  const secret = process.env.AUTH_SESSION_SECRET;
  if (secret) return secret;
  if (isProductionEnvironment()) {
    throw new Error("AUTH_SESSION_SECRET_MISSING");
  }
  return "date-match-dev-secret";
}

function base64UrlEncode(input: string) {
  return Buffer.from(input, "utf8").toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function timingSafeEqualHex(a: string, b: string) {
  const left = Buffer.from(a, "hex");
  const right = Buffer.from(b, "hex");
  if (left.length !== right.length) return false;
  return crypto.timingSafeEqual(left, right);
}

function signValue(value: string) {
  return crypto.createHmac("sha256", getSessionSecret()).update(value).digest("hex");
}

function encodeSession(payload: SessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function decodeSession(rawValue: string | undefined): SessionPayload | null {
  if (!rawValue) return null;
  const parts = rawValue.split(".");
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  const expected = signValue(encodedPayload);
  if (!timingSafeEqualHex(signature, expected)) return null;

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as Partial<SessionPayload>;
    if (!payload.userId || typeof payload.userId !== "string") return null;
    if (!payload.issuedAt || typeof payload.issuedAt !== "number") return null;
    if (payload.version !== 1) return null;
    return {
      userId: payload.userId,
      issuedAt: payload.issuedAt,
      version: 1,
    };
  } catch {
    return null;
  }
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function normalizeNickname(nickname?: string | null) {
  const value = nickname?.trim() ?? "";
  return value.length > 0 ? value.slice(0, NICKNAME_MAX_LENGTH) : null;
}

function validateSignupInput(email: string, password: string, nickname?: string | null) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("EMAIL_REQUIRED");
  if (!isValidEmail(normalizedEmail)) throw new Error("EMAIL_INVALID");
  if (password.length < MIN_PASSWORD_LENGTH) throw new Error("PASSWORD_TOO_SHORT");
  if (nickname && nickname.trim().length > 40) throw new Error("NICKNAME_TOO_LONG");
  return {
    email: normalizedEmail,
    password,
    nickname: normalizeNickname(nickname),
  };
}

function validateSigninInput(email: string, password: string) {
  const normalizedEmail = normalizeEmail(email);
  if (!normalizedEmail) throw new Error("EMAIL_REQUIRED");
  if (!isValidEmail(normalizedEmail)) throw new Error("EMAIL_INVALID");
  if (!password) throw new Error("PASSWORD_REQUIRED");
  return {
    email: normalizedEmail,
    password,
  };
}

async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  return `scrypt:${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, passwordHash: string | null | undefined) {
  if (!passwordHash) return false;
  const [algorithm, salt, hash] = passwordHash.split(":");
  if (algorithm !== "scrypt" || !salt || !hash) return false;
  const derivedKey = (await scryptAsync(password, salt, 64)) as Buffer;
  const actual = derivedKey.toString("hex");
  return timingSafeEqualHex(actual, hash);
}

async function getCookieStore(): Promise<CookieStore> {
  return cookies();
}

async function fetchCurrentUserRecord(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      profile: true,
      preference: true,
    },
  });
}

export function getAuthErrorMessage(error: unknown) {
  const code = error instanceof Error ? error.message : "UNKNOWN_AUTH_ERROR";
  switch (code) {
    case "EMAIL_REQUIRED":
      return "请输入邮箱";
    case "EMAIL_INVALID":
      return "邮箱格式不正确";
    case "PASSWORD_REQUIRED":
      return "请输入密码";
    case "PASSWORD_TOO_SHORT":
      return `密码至少需要 ${MIN_PASSWORD_LENGTH} 位`;
    case "NICKNAME_TOO_LONG":
      return "昵称长度不能超过 40 个字符";
    case "EMAIL_ALREADY_EXISTS":
      return "该邮箱已注册，请直接登录";
    case "INVALID_CREDENTIALS":
      return "邮箱或密码错误";
    case "UNAUTHORIZED":
      return "请先登录";
    default:
      return "认证失败，请稍后再试";
  }
}

export async function createAuthSession(userId: string) {
  const cookieStore = await getCookieStore();
  cookieStore.set(SESSION_COOKIE_NAME, encodeSession({ userId, issuedAt: Date.now(), version: 1 }), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  });
}

export async function clearAuthSession() {
  const cookieStore = await getCookieStore();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

export async function getCurrentSession() {
  const cookieStore = await getCookieStore();
  const session = decodeSession(cookieStore.get(SESSION_COOKIE_NAME)?.value);
  if (!session) return null;

  const user = await fetchCurrentUserRecord(session.userId);
  if (!user || user.status !== "ACTIVE") {
    return null;
  }

  return { session, user };
}

export async function getCurrentUser(): Promise<SafeCurrentUser | null> {
  const current = await getCurrentSession();
  return current?.user ?? null;
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user;
}

export async function ensureCurrentUser() {
  const currentUser = await getCurrentUser();
  if (currentUser) return currentUser;

  if (!canUseDemoBootstrap()) {
    throw new Error("UNAUTHORIZED");
  }

  const { user } = await ensureDemoBootstrap();
  await createAuthSession(user.id);
  return fetchCurrentUserRecord(user.id);
}

export async function registerWithPassword(email: string, password: string, nickname?: string | null) {
  const input = validateSignupInput(email, password, nickname);

  if (input.email === DEMO_USER_EMAIL) {
    if (!canUseDemoBootstrap()) {
      throw new Error("INVALID_CREDENTIALS");
    }
    const { user } = await ensureDemoBootstrap();
    const nextPasswordHash = await hashPassword(password);
    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: nextPasswordHash,
        nickname: input.nickname ?? user.nickname,
      },
    });
    await createAuthSession(updatedUser.id);
    return updatedUser;
  }

  const existingUser = await prisma.user.findUnique({ where: { email: input.email } });
  if (existingUser) {
    throw new Error("EMAIL_ALREADY_EXISTS");
  }

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      nickname: input.nickname,
    },
  });

  await createAuthSession(user.id);
  return user;
}

export async function signInWithPassword(email: string, password: string) {
  const input = validateSigninInput(email, password);

  let user = await prisma.user.findUnique({ where: { email: input.email } });

  if (input.email === DEMO_USER_EMAIL) {
    if (!canUseDemoBootstrap()) {
      throw new Error("INVALID_CREDENTIALS");
    }
    const bootstrapped = await ensureDemoBootstrap();
    user = await prisma.user.findUnique({ where: { id: bootstrapped.user.id } });

    if (user && !user.passwordHash) {
      const passwordHash = await hashPassword(password);
      user = await prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      });
      await createAuthSession(user.id);
      return user;
    }
  }

  if (!user || user.status !== "ACTIVE") {
    throw new Error("INVALID_CREDENTIALS");
  }

  const isValid = await verifyPassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new Error("INVALID_CREDENTIALS");
  }

  await createAuthSession(user.id);
  return user;
}
