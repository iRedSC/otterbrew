import { pgTable, uuid, text, varchar } from "drizzle-orm/pg-core";

export type RarityTier =
  | "basic"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export const potionModifiers = pgTable("potion_modifiers", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description").notNull(),
  rarity: varchar("rarity", { length: 20 }).notNull(),
});

export type PotionModifier = typeof potionModifiers.$inferSelect;
export type NewPotionModifier = typeof potionModifiers.$inferInsert;
