ALTER TABLE "ingredients" ADD COLUMN "string_id" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "potion_modifiers" ADD COLUMN "string_id" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "seeds" ADD COLUMN "string_id" varchar(100) NOT NULL;--> statement-breakpoint
CREATE INDEX "ingredients_string_id_idx" ON "ingredients" USING btree ("string_id");--> statement-breakpoint
CREATE INDEX "potion_modifiers_string_id_idx" ON "potion_modifiers" USING btree ("string_id");--> statement-breakpoint
CREATE INDEX "seeds_string_id_idx" ON "seeds" USING btree ("string_id");--> statement-breakpoint
ALTER TABLE "ingredients" ADD CONSTRAINT "ingredients_string_id_unique" UNIQUE("string_id");--> statement-breakpoint
ALTER TABLE "potion_modifiers" ADD CONSTRAINT "potion_modifiers_string_id_unique" UNIQUE("string_id");--> statement-breakpoint
ALTER TABLE "seeds" ADD CONSTRAINT "seeds_string_id_unique" UNIQUE("string_id");