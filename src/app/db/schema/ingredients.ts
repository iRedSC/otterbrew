import { pgTable, uuid, text, varchar, jsonb } from "drizzle-orm/pg-core";

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

export const ingredients = pgTable("ingredients", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  attributes: jsonb("attributes").notNull(),
});

export type Ingredient = typeof ingredients.$inferSelect;
export type NewIngredient = typeof ingredients.$inferInsert;
