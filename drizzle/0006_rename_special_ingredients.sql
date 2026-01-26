ALTER TABLE "potion_modifiers" RENAME TO "special_ingredients";--> statement-breakpoint
ALTER INDEX "potion_modifiers_string_id_idx" RENAME TO "special_ingredients_string_id_idx";--> statement-breakpoint
ALTER TABLE "special_ingredients" RENAME CONSTRAINT "potion_modifiers_string_id_unique" TO "special_ingredients_string_id_unique";--> statement-breakpoint
