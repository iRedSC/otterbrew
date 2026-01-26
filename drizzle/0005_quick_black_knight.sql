CREATE EXTENSION IF NOT EXISTS vector;--> statement-breakpoint
CREATE TABLE "potion_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"potion_id" uuid NOT NULL,
	"quality" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "potion_recipes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"potion_id" uuid NOT NULL,
	"attributes" vector(8) NOT NULL,
	"modifier" varchar(100),
	"temperature" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "potion_recipes_potion_id_unique" UNIQUE("potion_id")
);
--> statement-breakpoint
CREATE TABLE "potions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(50) NOT NULL,
	"description" text NOT NULL,
	"flavor_text" text,
	"tier" varchar(20) NOT NULL,
	"quality_threshold" real NOT NULL,
	"effects" jsonb NOT NULL,
	"lore" text,
	"discovered_by" varchar(20),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "potion_items" ADD CONSTRAINT "potion_items_potion_id_potions_id_fk" FOREIGN KEY ("potion_id") REFERENCES "public"."potions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "potion_recipes" ADD CONSTRAINT "potion_recipes_potion_id_potions_id_fk" FOREIGN KEY ("potion_id") REFERENCES "public"."potions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "potion_items_potion_id_idx" ON "potion_items" USING btree ("potion_id");--> statement-breakpoint
CREATE INDEX "potion_items_quality_idx" ON "potion_items" USING btree ("quality");--> statement-breakpoint
CREATE INDEX "potion_recipes_temperature_idx" ON "potion_recipes" USING btree ("temperature");--> statement-breakpoint
CREATE INDEX "potions_tier_idx" ON "potions" USING btree ("tier");--> statement-breakpoint
CREATE INDEX "potions_discovered_by_idx" ON "potions" USING btree ("discovered_by");--> statement-breakpoint
CREATE INDEX "potion_recipes_attributes_idx" ON "potion_recipes" USING ivfflat ("attributes" vector_l2_ops) WITH (lists = 100);