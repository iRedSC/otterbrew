import { pgTable, uuid, text, varchar, index } from "drizzle-orm/pg-core";

export type RarityTier =
  | "basic"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export const potionModifiers = pgTable(
  "potion_modifiers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stringId: varchar("string_id", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description").notNull(),
    rarity: varchar("rarity", { length: 20 }).notNull(),
  },
  (table) => ({
    stringIdIdx: index("potion_modifiers_string_id_idx").on(table.stringId),
  }),
);

export type PotionModifier = typeof potionModifiers.$inferSelect;
export type NewPotionModifier = typeof potionModifiers.$inferInsert;
