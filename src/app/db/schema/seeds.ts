import { pgTable, uuid, text, varchar, index } from "drizzle-orm/pg-core";

export type RarityTier =
  | "basic"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export const seeds = pgTable(
  "seeds",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    stringId: varchar("string_id", { length: 100 }).notNull().unique(),
    name: varchar("name", { length: 100 }).notNull(),
    description: text("description").notNull(),
    rarity: varchar("rarity", { length: 20 }).notNull(),
  },
  (table) => ({
    stringIdIdx: index("seeds_string_id_idx").on(table.stringId),
  }),
);

export type Seed = typeof seeds.$inferSelect;
export type NewSeed = typeof seeds.$inferInsert;
