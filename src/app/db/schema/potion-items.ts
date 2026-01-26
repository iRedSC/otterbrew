import { pgTable, uuid, integer, timestamp, index } from "drizzle-orm/pg-core";
import { potions } from "./potions.js";

export const potionItems = pgTable(
  "potion_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    potionId: uuid("potion_id")
      .notNull()
      .references(() => potions.id, { onDelete: "cascade" }),
    quality: integer("quality").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    potionIdIdx: index("potion_items_potion_id_idx").on(table.potionId),
    qualityIdx: index("potion_items_quality_idx").on(table.quality),
  }),
);

export type PotionItem = typeof potionItems.$inferSelect;
export type NewPotionItem = typeof potionItems.$inferInsert;
