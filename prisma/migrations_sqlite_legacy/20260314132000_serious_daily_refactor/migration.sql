-- Add structured serious-marriage profile fields
ALTER TABLE "Profile" ADD COLUMN "workCity" TEXT;
ALTER TABLE "Profile" ADD COLUMN "heightCm" INTEGER;
ALTER TABLE "Profile" ADD COLUMN "weightKg" INTEGER;
ALTER TABLE "Profile" ADD COLUMN "education" TEXT;
ALTER TABLE "Profile" ADD COLUMN "incomeLevel" TEXT;
ALTER TABLE "Profile" ADD COLUMN "housingStatus" TEXT;
ALTER TABLE "Profile" ADD COLUMN "carStatus" TEXT;
ALTER TABLE "Profile" ADD COLUMN "partnerNote" TEXT;

-- Backfill workCity from legacy city when possible
UPDATE "Profile" SET "workCity" = "city" WHERE "workCity" IS NULL AND "city" IS NOT NULL;
UPDATE "Profile" SET "partnerNote" = "bio" WHERE "partnerNote" IS NULL AND "bio" IS NOT NULL;

-- Add structured partner preference fields
ALTER TABLE "Preference" ADD COLUMN "preferredCities" TEXT;
ALTER TABLE "Preference" ADD COLUMN "minEducation" TEXT;
ALTER TABLE "Preference" ADD COLUMN "minIncomeLevel" TEXT;
ALTER TABLE "Preference" ADD COLUMN "requireHousing" BOOLEAN;
ALTER TABLE "Preference" ADD COLUMN "requireCar" BOOLEAN;
ALTER TABLE "Preference" ADD COLUMN "preferredHousingStatus" TEXT;
ALTER TABLE "Preference" ADD COLUMN "preferredCarStatus" TEXT;
ALTER TABLE "Preference" ADD COLUMN "partnerExpectation" TEXT;
ALTER TABLE "Preference" ADD COLUMN "dailyActive" BOOLEAN NOT NULL DEFAULT true;

-- Backfill daily preference from legacy weekly flag
UPDATE "Preference" SET "preferredCities" = "cityPreference" WHERE "preferredCities" IS NULL AND "cityPreference" IS NOT NULL;
UPDATE "Preference" SET "dailyActive" = "weeklyActive";

-- Add day-based batch key while preserving legacy weekKey for compatibility
ALTER TABLE "MatchBatch" ADD COLUMN "dayKey" TEXT;
UPDATE "MatchBatch" SET "dayKey" = COALESCE("dayKey", "weekKey");
CREATE UNIQUE INDEX "MatchBatch_dayKey_key" ON "MatchBatch"("dayKey");
