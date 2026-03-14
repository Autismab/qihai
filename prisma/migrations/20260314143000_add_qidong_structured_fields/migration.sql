-- Add structured qidong / marital / children fields to Profile
ALTER TABLE "Profile" ADD COLUMN "maritalStatus" TEXT;
ALTER TABLE "Profile" ADD COLUMN "childrenStatus" TEXT;
ALTER TABLE "Profile" ADD COLUMN "hometown" TEXT;
ALTER TABLE "Profile" ADD COLUMN "currentCity" TEXT;
ALTER TABLE "Profile" ADD COLUMN "planReturnToQidong" BOOLEAN;

-- Backfill Profile city semantics from existing columns
UPDATE "Profile"
SET "currentCity" = COALESCE("currentCity", "workCity", "city")
WHERE "currentCity" IS NULL;

UPDATE "Profile"
SET "hometown" = COALESCE("hometown", CASE WHEN "city" = '启东' THEN '启东' ELSE NULL END)
WHERE "hometown" IS NULL;

UPDATE "Profile"
SET "planReturnToQidong" = 1
WHERE "planReturnToQidong" IS NULL
  AND (
    "hometown" = '启东'
    OR "city" = '启东'
    OR "workCity" = '启东'
    OR "currentCity" = '启东'
  );

-- Add structured qidong / marital / children preference fields
ALTER TABLE "Preference" ADD COLUMN "acceptLongDistance" BOOLEAN;
ALTER TABLE "Preference" ADD COLUMN "acceptRelocateToQidong" BOOLEAN;
ALTER TABLE "Preference" ADD COLUMN "preferredHometown" TEXT;
ALTER TABLE "Preference" ADD COLUMN "acceptedMaritalStatuses" TEXT;
ALTER TABLE "Preference" ADD COLUMN "acceptPartnerWithChildren" BOOLEAN;

-- Minimal viable backfill for existing preference records
UPDATE "Preference"
SET "acceptLongDistance" = CASE
  WHEN "acceptLongDistance" IS NOT NULL THEN "acceptLongDistance"
  WHEN "preferredCities" IS NOT NULL AND (instr("preferredCities", '异地') > 0 OR instr("preferredCities", '长三角') > 0) THEN 1
  WHEN "cityPreference" IS NOT NULL AND instr("cityPreference", '异地') > 0 THEN 1
  ELSE 0
END
WHERE "acceptLongDistance" IS NULL;

UPDATE "Preference"
SET "acceptRelocateToQidong" = CASE
  WHEN "acceptRelocateToQidong" IS NOT NULL THEN "acceptRelocateToQidong"
  WHEN "preferredCities" IS NOT NULL AND instr("preferredCities", '启东') > 0 THEN 1
  WHEN "cityPreference" IS NOT NULL AND instr("cityPreference", '启东') > 0 THEN 1
  ELSE NULL
END
WHERE "acceptRelocateToQidong" IS NULL;

UPDATE "Preference"
SET "preferredHometown" = COALESCE("preferredHometown", CASE
  WHEN "preferredCities" IS NOT NULL AND instr("preferredCities", '启东') > 0 THEN '启东'
  WHEN "cityPreference" IS NOT NULL AND instr("cityPreference", '启东') > 0 THEN '启东'
  ELSE NULL
END)
WHERE "preferredHometown" IS NULL;

UPDATE "Preference"
SET "acceptedMaritalStatuses" = COALESCE("acceptedMaritalStatuses", 'SINGLE')
WHERE "acceptedMaritalStatuses" IS NULL;
