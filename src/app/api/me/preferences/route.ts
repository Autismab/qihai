import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureInitializedCurrentUser } from "@/lib/user-init";
import { buildPreferenceStructuredGoal, cleanNullableBoolean, cleanNullableText, extractPreferenceStructuredFields } from "@/lib/structured-fields";

function toNullableInt(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function normalizeAcceptedMaritalStatuses(value: unknown): string | null {
  if (Array.isArray(value)) {
    const cleaned = value.map((item: unknown) => cleanNullableText(item)?.toUpperCase()).filter(Boolean);
    return cleaned.length ? cleaned.join(',') : null;
  }
  const text = cleanNullableText(value);
  if (!text) return null;
  return text
    .split(/[，,、\n]/)
    .map((item: string) => item.trim())
    .filter(Boolean)
    .map((item: string) => {
      const upper = item.toUpperCase();
      if (upper === '未婚') return 'SINGLE';
      if (upper === '离异' || upper === '离异未育' || upper === '离异有子女') return 'DIVORCED';
      if (upper === '丧偶') return 'WIDOWED';
      return upper;
    })
    .join(',');
}

function normalizePreferenceResponse<T extends { relationshipGoal?: string | null; partnerExpectation?: string | null; acceptLongDistance?: boolean | null; acceptRelocateToQidong?: boolean | null; preferredHometown?: string | null; acceptedMaritalStatuses?: string | null; acceptPartnerWithChildren?: boolean | null } | null>(preference: T) {
  if (!preference) return preference;
  const structured = extractPreferenceStructuredFields(preference);
  return {
    ...preference,
    acceptLongDistance: preference.acceptLongDistance ?? structured.acceptLongDistance,
    acceptRelocateToQidong: preference.acceptRelocateToQidong ?? structured.acceptRelocateToQidong,
    preferredHometown: preference.preferredHometown ?? structured.preferredHometown,
    acceptedMaritalStatuses: preference.acceptedMaritalStatuses ?? structured.acceptedMaritalStatuses,
    acceptPartnerWithChildren: preference.acceptPartnerWithChildren ?? structured.acceptPartnerWithChildren,
  };
}

export async function GET() {
  try {
    const user = await ensureInitializedCurrentUser();
    const preference = await prisma.preference.findUnique({ where: { userId: user.id } });
    return NextResponse.json({ preference: normalizePreferenceResponse(preference) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to load preferences", detail: String(error) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await ensureInitializedCurrentUser();
    const body = await request.json();
    const dailyActive = body.dailyActive ?? body.weeklyActive ?? true;
    const relationshipGoal = buildPreferenceStructuredGoal({
      existingGoal: typeof body.relationshipGoal === "string" ? body.relationshipGoal : null,
      marriageIntent: body.relationshipGoal,
      educationPreference: body.minEducation,
      incomePreference: body.minIncomeLevel ?? body.incomePreference,
      housingPreference: body.preferredHousingStatus,
      carPreference: body.preferredCarStatus,
      partnerKeywords: body.partnerExpectation,
      acceptLongDistance: body.acceptLongDistance,
      acceptRelocateToQidong: body.acceptRelocateToQidong,
      preferredHometown: body.preferredHometown,
      acceptedMaritalStatuses: body.acceptedMaritalStatuses,
      acceptPartnerWithChildren: body.acceptPartnerWithChildren,
    });

    const preference = await prisma.preference.upsert({
      where: { userId: user.id },
      update: {
        targetGender: cleanNullableText(body.targetGender),
        ageMin: toNullableInt(body.ageMin),
        ageMax: toNullableInt(body.ageMax),
        cityPreference: cleanNullableText(body.cityPreference),
        preferredCities: cleanNullableText(body.preferredCities ?? body.cityPreference),
        minEducation: cleanNullableText(body.minEducation),
        minIncomeLevel: cleanNullableText(body.minIncomeLevel ?? body.incomePreference),
        requireHousing: cleanNullableBoolean(body.requireHousing),
        requireCar: cleanNullableBoolean(body.requireCar),
        preferredHousingStatus: cleanNullableText(body.preferredHousingStatus),
        preferredCarStatus: cleanNullableText(body.preferredCarStatus),
        partnerExpectation: cleanNullableText(body.partnerExpectation),
        acceptLongDistance: cleanNullableBoolean(body.acceptLongDistance),
        acceptRelocateToQidong: cleanNullableBoolean(body.acceptRelocateToQidong),
        preferredHometown: cleanNullableText(body.preferredHometown),
        acceptedMaritalStatuses: normalizeAcceptedMaritalStatuses(body.acceptedMaritalStatuses),
        acceptPartnerWithChildren: cleanNullableBoolean(body.acceptPartnerWithChildren),
        relationshipGoal,
        dailyActive: Boolean(dailyActive),
        weeklyActive: Boolean(dailyActive),
      },
      create: {
        userId: user.id,
        targetGender: cleanNullableText(body.targetGender),
        ageMin: toNullableInt(body.ageMin),
        ageMax: toNullableInt(body.ageMax),
        cityPreference: cleanNullableText(body.cityPreference),
        preferredCities: cleanNullableText(body.preferredCities ?? body.cityPreference),
        minEducation: cleanNullableText(body.minEducation),
        minIncomeLevel: cleanNullableText(body.minIncomeLevel ?? body.incomePreference),
        requireHousing: cleanNullableBoolean(body.requireHousing),
        requireCar: cleanNullableBoolean(body.requireCar),
        preferredHousingStatus: cleanNullableText(body.preferredHousingStatus),
        preferredCarStatus: cleanNullableText(body.preferredCarStatus),
        partnerExpectation: cleanNullableText(body.partnerExpectation),
        acceptLongDistance: cleanNullableBoolean(body.acceptLongDistance),
        acceptRelocateToQidong: cleanNullableBoolean(body.acceptRelocateToQidong),
        preferredHometown: cleanNullableText(body.preferredHometown),
        acceptedMaritalStatuses: normalizeAcceptedMaritalStatuses(body.acceptedMaritalStatuses),
        acceptPartnerWithChildren: cleanNullableBoolean(body.acceptPartnerWithChildren),
        relationshipGoal,
        dailyActive: Boolean(dailyActive),
        weeklyActive: Boolean(dailyActive),
      },
    });

    return NextResponse.json({ ok: true, preference: normalizePreferenceResponse(preference) });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.json({ error: "Failed to save preferences", detail: String(error) }, { status: 500 });
  }
}
