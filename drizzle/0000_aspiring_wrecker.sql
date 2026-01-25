CREATE TABLE "users" (
	"discord_id" text PRIMARY KEY NOT NULL,
	"gold" integer DEFAULT 0 NOT NULL,
	"potions_discovered" integer DEFAULT 0 NOT NULL,
	"potions_brewed" integer DEFAULT 0 NOT NULL,
	"total_gold_earned" integer DEFAULT 0 NOT NULL,
	"adventures_completed" integer DEFAULT 0 NOT NULL,
	"bazaar_encounters_completed" integer DEFAULT 0 NOT NULL,
	"grimoires_collected" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
