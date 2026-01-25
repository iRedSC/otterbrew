ALTER TABLE "users" ADD COLUMN "max_inventory_slots" integer DEFAULT 25 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "inventory" jsonb DEFAULT '[]' NOT NULL;