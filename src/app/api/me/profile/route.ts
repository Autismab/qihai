import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureInitializedCurrentUser } from "@/lib/user-init";
import { ChildrenStatus, MaritalStatus } from "@prisma/client";
import { buildProfileStructuredBio, cleanNullableText, extractProfileStructuredFields } from "@/lib/structured-fields";

function toNullableInt(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function toMaritalStatus(value: unknown): MaritalStatus | null {
  const text = cleanNullableText(value)?.toUpperCase();
  if (!text) return null;
  if (text === 'SINGLE' || text === '未婚') return MaritalStatus.SINGLE;
  if (text === 'DIVORCED' || text === '离异' || text === '离异未育' || text === '离异有子女') return MaritalStatus.DIVORCED;
  if (text === 'WIDOWED' || text === '丧偶') return MaritalStatus.WIDOWED;
  return null;
}

function toChildrenStatus(value: unknown): ChildrenStatus | null {
  const text = cleanNullableText(value)?.toUpperCase();
  if (!text) return null;
  if (text === 'NONE' || text === '无子女') return ChildrenStatus.NONE;
  if (text === 'HAS_CHILDREN_LIVING_TOGETHER' || text === '有子女同住') return ChildrenStatus.HAS_CHILDREN_LIVING_TOGETHER;
  if (text === 'HAS_CHILDREN_NOT_LIVING_TOGETHER' || text === '有子女不同住') return ChildrenStatus.HAS_CHILDREN_NOT_LIVING_TOGETHER;
  return null;
}

function normalizeProfileResponse<T extends { bio?: string | null; workCity?: string | null; city?: string | null; partnerNote?: string | null; maritalStatus?: unknown; childrenStatus?: unknown; hometown?: string | null; currentCity?: string | null; planReturnToQidong?: boolean | null } | null>(profile: T) {
  if (!profile) return profile;
  const structured = extractProfileStructuredFields(profile);
  return {
    ...profile,
    maritalStatus: profile.maritalStatus ?? structured.maritalStatus,
    childrenStatus: profile.childrenStatus ?? structured.childrenStatus,
    hometown: profile.hometown ?? structured.hometown,
    currentCity: profile.currentCity ?? structured.currentCity,
    planReturnToQidong: profile.planReturnToQidong ?? structured.planReturnToQidong,
    partnerExpectation: structured.partnerExpectation,
  };
}

export async function GET() {
  try {
    const user = await ensureInitializedCurrentUser();
    const profile = await prisma.profile.findUnique({ where: { userId: user.id } });
    return NextResponse.json({ user, profile: normalizeProfileResponse(profile) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load profile", detail: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await ensureInitializedCurrentUser();
    const body = await request.json();
    const workCity = cleanNullableText(body.workCity ?? body.currentCity ?? body.city);
    const partnerNote = cleanNullableText(body.partnerNote);
    const bio = buildProfileStructuredBio({
      existingBio: typeof body.bio === "string" ? body.bio : null,
      height: body.heightCm ?? body.height,
      weight: body.weightKg ?? body.weight,
      education: body.education,
      income: body.incomeLevel ?? body.income,
      housing: body.housingStatus,
      car: body.carStatus,
      marriageGoal: body.partnerNote,
      partnerExpectation: body.partnerExpectation,
      maritalStatus: body.maritalStatus,
      childrenStatus: body.childrenStatus,
      hometown: body.hometown,
      currentCity: body.currentCity ?? body.workCity ?? body.city,
      planReturnToQidong: body.planReturnToQidong,
    });

    const profile = await prisma.profile.upsert({
      where: { userId: user.id },
      update: {
        gender: cleanNullableText(body.gender),
        birthYear: toNullableInt(body.birthYear),
        workCity,
        city: workCity,
        currentCity: cleanNullableText(body.currentCity ?? body.workCity ?? body.city),
        hometown: cleanNullableText(body.hometown),
        planReturnToQidong: body.planReturnToQidong === null || body.planReturnToQidong === undefined ? null : Boolean(body.planReturnToQidong),
        maritalStatus: toMaritalStatus(body.maritalStatus),
        childrenStatus: toChildrenStatus(body.childrenStatus),
        heightCm: toNullableInt(body.heightCm ?? body.height),
        weightKg: toNullableInt(body.weightKg ?? body.weight),
        education: cleanNullableText(body.education),
        incomeLevel: cleanNullableText(body.incomeLevel ?? body.income),
        housingStatus: cleanNullableText(body.housingStatus),
        carStatus: cleanNullableText(body.carStatus),
        partnerNote,
        bio,
      },
      create: {
        userId: user.id,
        gender: cleanNullableText(body.gender),
        birthYear: toNullableInt(body.birthYear),
        workCity,
        city: workCity,
        currentCity: cleanNullableText(body.currentCity ?? body.workCity ?? body.city),
        hometown: cleanNullableText(body.hometown),
        planReturnToQidong: body.planReturnToQidong === null || body.planReturnToQidong === undefined ? null : Boolean(body.planReturnToQidong),
        maritalStatus: toMaritalStatus(body.maritalStatus),
        childrenStatus: toChildrenStatus(body.childrenStatus),
        heightCm: toNullableInt(body.heightCm ?? body.height),
        weightKg: toNullableInt(body.weightKg ?? body.weight),
        education: cleanNullableText(body.education),
        incomeLevel: cleanNullableText(body.incomeLevel ?? body.income),
        housingStatus: cleanNullableText(body.housingStatus),
        carStatus: cleanNullableText(body.carStatus),
        partnerNote,
        bio,
      },
    });

    if (Object.prototype.hasOwnProperty.call(body, "nickname")) {
      await prisma.user.update({
        where: { id: user.id },
        data: { nickname: body.nickname ? String(body.nickname) : null },
      });
    }

    return NextResponse.json({ ok: true, profile: normalizeProfileResponse(profile) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save profile", detail: String(error) }, { status: 500 });
  }
}
