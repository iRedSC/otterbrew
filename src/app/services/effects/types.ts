// Effect operation types
export type EffectOperation =
  | "multiply"
  | "add"
  | "subtract"
  | "set"
  | "add_over_time"
  | "subtract_over_time";

// Effect trigger types
export type EffectTrigger =
  // Stat change triggers
  | "value"
  | "change_good"
  | "change_bad"
  // Contextual triggers
  | "brewing"
  | "adventure"
  | "bazaar"
  | "combat"
  | "harvesting"
  | "shopping"
  // Event triggers
  | "on_consume"
  | "on_craft"
  | "periodic";

// Trigger category for organization
export type TriggerCategory = "stat" | "context" | "event";

// Stat types that can be affected
export type AffectedStat =
  | "gold"
  | "mana"
  | "brew_time"
  | "garden_growth_time"
  | "garden_yield"
  | "shop_reroll_cost"
  | "adventure_cooldown"
  | "bazaar_cooldown"
  | "ingredient_quality"
  | "customer_satisfaction"
  | "discovery_bonus"
  | "story_difficulty"
  // ... expandable

// Direction that is "good" for a stat
export type StatDirection = "increase" | "decrease";

// Active effect on a player
export interface ActiveEffect {
  effectId: string;
  stat: AffectedStat;
  operation: EffectOperation;
  trigger: EffectTrigger;
  value: number;
  appliedAt: number; // timestamp
  expiresAt: number | null; // timestamp or null for permanent
  tickInterval?: number; // for over_time and periodic effects
  lastTickAt?: number; // for over_time and periodic effects
  sourcePotion: string; // potion name for display
  displayName: string; // e.g., "Lucky Streak [2x gold gain]"
}

// Effect configuration for stat calculations
export interface EffectConfig {
  goodDirection: StatDirection; // What direction is "good" for this stat
  supportedOperations: EffectOperation[];
  supportedTriggers: EffectTrigger[];
  allowsOverTime: boolean;
}

// Helper function to get trigger category
export function getTriggerCategory(
  trigger: EffectTrigger,
): TriggerCategory {
  if (trigger === "value" || trigger === "change_good" || trigger === "change_bad") {
    return "stat";
  }
  if (
    trigger === "brewing" ||
    trigger === "adventure" ||
    trigger === "bazaar" ||
    trigger === "combat" ||
    trigger === "harvesting" ||
    trigger === "shopping"
  ) {
    return "context";
  }
  return "event";
}

// Helper function to check if trigger is stat-based
export function isStatTrigger(trigger: EffectTrigger): boolean {
  return (
    trigger === "value" ||
    trigger === "change_good" ||
    trigger === "change_bad"
  );
}

// Helper function to check if trigger is context-based
export function isContextTrigger(trigger: EffectTrigger): boolean {
  return getTriggerCategory(trigger) === "context";
}

// Helper function to check if trigger is event-based
export function isEventTrigger(trigger: EffectTrigger): boolean {
  return getTriggerCategory(trigger) === "event";
}
