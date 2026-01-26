import { pgTable, uuid, text, varchar, jsonb, timestamp, index, real } from "drizzle-orm/pg-core";

export type RarityTier =
  | "basic"
  | "uncommon"
  | "rare"
  | "epic"
  | "legendary"
  | "mythic";

export type EffectType =
  | "gold_multiplier"
  | "brew_speed"
  | "garden_growth_speed"
  | "garden_yield_multiplier"
  | "shop_reroll_cost"
  | "ingredient_quality"
  | "effect_duration"
  | "overdose_immunity"
  | "discovery_bonus"
  | "adventure_cooldown"
  | "bazaar_cooldown"
  | "story_difficulty_modifier"
  | "customer_satisfaction_bonus";

export interface PotionEffect {
  type: EffectType;
  operation: "multiply" | "add" | "set";
  value: number;
  duration: number; // seconds, 0 = permanent
  overdoseThreshold: number;
  overdoseEffect?: PotionEffect;
}

export const potions = pgTable(
  "potions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 50 }).notNull(),
    description: text("description").notNull(),
    flavorText: text("flavor_text"),
    tier: varchar("tier", { length: 20 }).notNull(),
    qualityThreshold: real("quality_threshold").notNull(),
    effects: jsonb("effects").$type<PotionEffect[]>().notNull(),
    lore: text("lore"),
    discoveredBy: varchar("discovered_by", { length: 20 }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    tierIdx: index("potions_tier_idx").on(table.tier),
    discoveredByIdx: index("potions_discovered_by_idx").on(table.discoveredBy),
  }),
);

export type Potion = typeof potions.$inferSelect;
export type NewPotion = typeof potions.$inferInsert;
