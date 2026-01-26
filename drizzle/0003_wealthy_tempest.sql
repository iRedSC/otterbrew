-- Add columns as nullable first
ALTER TABLE "ingredients" ADD COLUMN "string_id" varchar(100);--> statement-breakpoint
ALTER TABLE "potion_modifiers" ADD COLUMN "string_id" varchar(100);--> statement-breakpoint
ALTER TABLE "seeds" ADD COLUMN "string_id" varchar(100);--> statement-breakpoint
-- Populate string_id from name (slugified) for existing rows
-- Using lower(name) with spaces/special chars replaced by hyphens, trimmed
UPDATE "ingredients" SET "string_id" = lower(regexp_replace(regexp_replace(trim("name"), '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) WHERE "string_id" IS NULL;--> statement-breakpoint
UPDATE "potion_modifiers" SET "string_id" = lower(regexp_replace(regexp_replace(trim("name"), '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) WHERE "string_id" IS NULL;--> statement-breakpoint
UPDATE "seeds" SET "string_id" = lower(regexp_replace(regexp_replace(trim("name"), '[^a-zA-Z0-9]+', '-', 'g'), '^-+|-+$', '', 'g')) WHERE "string_id" IS NULL;--> statement-breakpoint
-- Handle potential duplicates by appending id suffix
-- This ensures uniqueness by appending a short UUID prefix to duplicates
WITH duplicates AS (
  SELECT "id", "string_id", 
    ROW_NUMBER() OVER (PARTITION BY "string_id" ORDER BY "id") as rn
  FROM "ingredients"
  WHERE "string_id" IN (
    SELECT "string_id" FROM "ingredients" GROUP BY "string_id" HAVING COUNT(*) > 1
  )
)
UPDATE "ingredients" i
SET "string_id" = i."string_id" || '-' || substring(i."id"::text from 1 for 8)
FROM duplicates d
WHERE i."id" = d."id" AND d.rn > 1;--> statement-breakpoint
WITH duplicates AS (
  SELECT "id", "string_id", 
    ROW_NUMBER() OVER (PARTITION BY "string_id" ORDER BY "id") as rn
  FROM "potion_modifiers"
  WHERE "string_id" IN (
    SELECT "string_id" FROM "potion_modifiers" GROUP BY "string_id" HAVING COUNT(*) > 1
  )
)
UPDATE "potion_modifiers" p
SET "string_id" = p."string_id" || '-' || substring(p."id"::text from 1 for 8)
FROM duplicates d
WHERE p."id" = d."id" AND d.rn > 1;--> statement-breakpoint
WITH duplicates AS (
  SELECT "id", "string_id", 
    ROW_NUMBER() OVER (PARTITION BY "string_id" ORDER BY "id") as rn
  FROM "seeds"
  WHERE "string_id" IN (
    SELECT "string_id" FROM "seeds" GROUP BY "string_id" HAVING COUNT(*) > 1
  )
)
UPDATE "seeds" s
SET "string_id" = s."string_id" || '-' || substring(s."id"::text from 1 for 8)
FROM duplicates d
WHERE s."id" = d."id" AND d.rn > 1;--> statement-breakpoint
-- Now make columns NOT NULL
ALTER TABLE "ingredients" ALTER COLUMN "string_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "potion_modifiers" ALTER COLUMN "string_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "seeds" ALTER COLUMN "string_id" SET NOT NULL;--> statement-breakpoint
-- Create indexes
CREATE INDEX "ingredients_string_id_idx" ON "ingredients" USING btree ("string_id");--> statement-breakpoint
CREATE INDEX "potion_modifiers_string_id_idx" ON "potion_modifiers" USING btree ("string_id");--> statement-breakpoint
CREATE INDEX "seeds_string_id_idx" ON "seeds" USING btree ("string_id");--> statement-breakpoint
-- Add unique constraints
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_string_id_unique" UNIQUE("string_id");--> statement-breakpoint
ALTER TABLE "potion_modifiers" ADD CONSTRAINT "potion_modifiers_string_id_unique" UNIQUE("string_id");--> statement-breakpoint
ALTER TABLE "seeds" ADD CONSTRAINT "seeds_string_id_unique" UNIQUE("string_id");