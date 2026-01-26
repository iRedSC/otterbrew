CREATE TABLE "ingredients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"attributes" jsonb NOT NULL
);
--> statement-breakpoint
CREATE TABLE "potion_modifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"rarity" varchar(20) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "seeds" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"rarity" varchar(20) NOT NULL
);
