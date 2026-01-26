ALTER TABLE "ingredients" ADD COLUMN "rarity" varchar(20);--> statement-breakpoint
UPDATE "ingredients" SET "rarity" = 'basic' WHERE "rarity" IS NULL;--> statement-breakpoint
ALTER TABLE "ingredients" ALTER COLUMN "rarity" SET DEFAULT 'basic';--> statement-breakpoint
ALTER TABLE "ingredients" ALTER COLUMN "rarity" SET NOT NULL;--> statement-breakpoint
