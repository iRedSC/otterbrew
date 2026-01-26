import { pgTable, uuid, text, varchar, jsonb, index } from "drizzle-orm/pg-core";

export type RarityTier =
  | "basic"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export interface IngredientAttributes {
  spice: number;
  time: number;
  fizz: number;
  zest: number;
  bane: number;
  fantasy: number;
  chaos: number;
  darkness: number;
}

export const ingredients = pgTable(
  "ingredients",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stringId: varchar("string_id", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description").notNull(),
    attributes: jsonb("attributes").notNull(),
  },
  (table) => ({
    stringIdIdx: index("ingredients_string_id_idx").on(table.stringId),
  }),
);

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;
