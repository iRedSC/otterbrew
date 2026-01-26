import {
  pgTable,
  uuid,
  varchar,
  integer,
  timestamp,
  index,
  unique,
  customType,
} from "drizzle-orm/pg-core";
import { potions } from "./potions.js";

const vector = customType<{ data: number[]; driverData: string }>({
  dataType() {
    return "vector(8)";
  },
});

export const potionRecipes = pgTable(
  "potion_recipes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    potionId: uuid("potion_id")
      .notNull()
      .references(() => potions.id, { onDelete: "cascade" }),
    attributes: vector("attributes").notNull(),
    modifier: varchar("modifier", { length: 100 }),
    temperature: integer("temperature").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    potionIdIdx: unique("potion_recipes_potion_id_unique").on(table.potionId),
    temperatureIdx: index("potion_recipes_temperature_idx").on(table.temperature),
  }),
);

export type PotionRecipe = typeof potionRecipes.$inferSelect;
export type NewPotionRecipe = typeof potionRecipes.$inferInsert;
