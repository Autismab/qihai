type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function parseJsonRecord(raw: string | null | undefined): JsonRecord {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function cleanNullableText(value: unknown) {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
}

export function cleanNullableBoolean(value: unknown) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (!normalized) return null;
    if (["true", "1", "yes", "y", "是"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "否"].includes(normalized)) return false;
  }
  return Boolean(value);
}

export function cleanStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value
      .map((item) => cleanNullableText(item))
      .filter((item): item is string => Boolean(item));
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => cleanNullableText(item))
          .filter((item): item is string => Boolean(item));
      }
    } catch {
      // ignore and fall back to delimiter split
    }

    return trimmed
      .split(/[，,、;；\n]+/)
      .map((item) => item.trim())
      .filter(Boolean);
  }

  return [];
}

export function firstNonEmptyText(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanNullableText(value);
    if (cleaned) return cleaned;
  }
  return null;
}

export function firstNonNullBoolean(...values: unknown[]) {
  for (const value of values) {
    const cleaned = cleanNullableBoolean(value);
    if (cleaned !== null) return cleaned;
  }
  return null;
}

export function buildProfileStructuredBio(input: {
  existingBio?: string | null;
  height?: unknown;
  weight?: unknown;
  education?: unknown;
  income?: unknown;
  housing?: unknown;
  car?: unknown;
  marriageGoal?: unknown;
  partnerExpectation?: unknown;
  maritalStatus?: unknown;
  childrenStatus?: unknown;
  hometown?: unknown;
  currentCity?: unknown;
  planReturnToQidong?: unknown;
}) {
  const existing = parseJsonRecord(input.existingBio);
  const next: JsonRecord = {
    ...existing,
    height: firstNonEmptyText(input.height, existing.height) ?? "",
    weight: firstNonEmptyText(input.weight, existing.weight) ?? "",
    education: firstNonEmptyText(input.education, existing.education) ?? "",
    income: firstNonEmptyText(input.income, existing.income) ?? "",
    housing: firstNonEmptyText(input.housing, existing.housing) ?? "",
    car: firstNonEmptyText(input.car, existing.car) ?? "",
    marriageGoal: firstNonEmptyText(input.marriageGoal, existing.marriageGoal) ?? "",
    partnerExpectation: firstNonEmptyText(input.partnerExpectation, existing.partnerExpectation) ?? "",
    maritalStatus: firstNonEmptyText(input.maritalStatus, existing.maritalStatus) ?? "",
    childrenStatus: firstNonEmptyText(input.childrenStatus, existing.childrenStatus) ?? "",
    hometown: firstNonEmptyText(input.hometown, existing.hometown) ?? "",
    currentCity: firstNonEmptyText(input.currentCity, existing.currentCity) ?? "",
    planReturnToQidong: firstNonNullBoolean(input.planReturnToQidong, existing.planReturnToQidong),
  };
  return JSON.stringify(next);
}

export function extractProfileStructuredFields(profile: {
  bio?: string | null;
  workCity?: string | null;
  city?: string | null;
  partnerNote?: string | null;
}) {
  const extra = parseJsonRecord(profile.bio);
  return {
    maritalStatus: firstNonEmptyText(extra.maritalStatus),
    childrenStatus: firstNonEmptyText(extra.childrenStatus),
    hometown: firstNonEmptyText(extra.hometown),
    currentCity: firstNonEmptyText(extra.currentCity, profile.workCity, profile.city),
    planReturnToQidong: firstNonNullBoolean(extra.planReturnToQidong),
    partnerExpectation: firstNonEmptyText(extra.partnerExpectation),
    marriageGoal: firstNonEmptyText(profile.partnerNote, extra.marriageGoal),
    extra,
  };
}

export function buildPreferenceStructuredGoal(input: {
  existingGoal?: string | null;
  marriageIntent?: unknown;
  educationPreference?: unknown;
  incomePreference?: unknown;
  housingPreference?: unknown;
  carPreference?: unknown;
  partnerKeywords?: unknown;
  acceptLongDistance?: unknown;
  acceptRelocateToQidong?: unknown;
  preferredHometown?: unknown;
  acceptedMaritalStatuses?: unknown;
  acceptPartnerWithChildren?: unknown;
}) {
  const existing = parseJsonRecord(input.existingGoal);
  const acceptedMaritalStatuses = cleanStringArray(input.acceptedMaritalStatuses);
  const fallbackStatuses = cleanStringArray(existing.acceptedMaritalStatuses);

  const next: JsonRecord = {
    ...existing,
    marriageIntent: firstNonEmptyText(input.marriageIntent, existing.marriageIntent) ?? "",
    educationPreference: firstNonEmptyText(input.educationPreference, existing.educationPreference) ?? "",
    incomePreference: firstNonEmptyText(input.incomePreference, existing.incomePreference) ?? "",
    housingPreference: firstNonEmptyText(input.housingPreference, existing.housingPreference) ?? "",
    carPreference: firstNonEmptyText(input.carPreference, existing.carPreference) ?? "",
    partnerKeywords: firstNonEmptyText(input.partnerKeywords, existing.partnerKeywords) ?? "",
    acceptLongDistance: firstNonNullBoolean(input.acceptLongDistance, existing.acceptLongDistance),
    acceptRelocateToQidong: firstNonNullBoolean(input.acceptRelocateToQidong, existing.acceptRelocateToQidong),
    preferredHometown: firstNonEmptyText(input.preferredHometown, existing.preferredHometown) ?? "",
    acceptedMaritalStatuses: acceptedMaritalStatuses.length ? acceptedMaritalStatuses : fallbackStatuses,
    acceptPartnerWithChildren: firstNonNullBoolean(input.acceptPartnerWithChildren, existing.acceptPartnerWithChildren),
  };

  return JSON.stringify(next);
}

export function extractPreferenceStructuredFields(preference: {
  relationshipGoal?: string | null;
  partnerExpectation?: string | null;
}) {
  const extra = parseJsonRecord(preference.relationshipGoal);
  return {
    acceptLongDistance: firstNonNullBoolean(extra.acceptLongDistance),
    acceptRelocateToQidong: firstNonNullBoolean(extra.acceptRelocateToQidong),
    preferredHometown: firstNonEmptyText(extra.preferredHometown),
    acceptedMaritalStatuses: cleanStringArray(extra.acceptedMaritalStatuses),
    acceptPartnerWithChildren: firstNonNullBoolean(extra.acceptPartnerWithChildren),
    marriageIntent: firstNonEmptyText(extra.marriageIntent),
    partnerKeywords: firstNonEmptyText(preference.partnerExpectation, extra.partnerKeywords),
    extra,
  };
}
