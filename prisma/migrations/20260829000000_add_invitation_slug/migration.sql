ALTER TABLE "ExpectedGuest" ADD COLUMN "slug" TEXT;

WITH slugged AS (
  SELECT
    "id",
    COALESCE(
      NULLIF(TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE("name", '[^a-zA-Z0-9]+', '-', 'g'))), ''),
      "id"
    ) AS base_slug
  FROM "ExpectedGuest"
), numbered AS (
  SELECT "id", base_slug, ROW_NUMBER() OVER (PARTITION BY base_slug ORDER BY "id") AS occurrence
  FROM slugged
)
UPDATE "ExpectedGuest" AS guest
SET "slug" = CASE
  WHEN numbered.occurrence = 1 THEN numbered.base_slug
  ELSE numbered.base_slug || '-' || numbered.occurrence
END
FROM numbered
WHERE guest."id" = numbered."id";

ALTER TABLE "ExpectedGuest" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "ExpectedGuest_slug_key" ON "ExpectedGuest"("slug");
