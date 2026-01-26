import { pgTable, uuid, text, varchar, index } from "drizzle-orm/pg-core";

export type RarityTier =
  | "basic"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export const specialIngredients = pgTable(
  "special_ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stringId: varchar("string_id", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description").notNull(),
    rarity: varchar("rarity", { length: 20 }).notNull(),
    emoji: varchar("emoji", { length: 10 }),
  },
  (table) => ({
    stringIdIdx: index("special_ingredients_string_id_idx").on(table.stringId),
  }),
);

export type SpecialIngredient = typeof specialIngredients.$inferSelect;
export type NewSpecialIngredient = typeof specialIngredients.$inferInsert;
