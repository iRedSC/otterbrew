import { pgTable, text, integer, timestamp } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  discordId: text("discord_id").primaryKey(),
  gold: integer("gold").notNull().default(0),
  potionsDiscovered: integer("potions_discovered").notNull().default(0),
  potionsBrewed: integer("potions_brewed").notNull().default(0),
  totalGoldEarned: integer("total_gold_earned").notNull().default(0),
  adventuresCompleted: integer("adventures_completed").notNull().default(0),
  bazaarEncountersCompleted: integer("bazaar_encounters_completed")
    .notNull()
    .default(0),
  grimoiresCollected: integer("grimoires_collected").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
