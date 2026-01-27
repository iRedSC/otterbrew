import type {
  AffectedStat,
  EffectConfig,
  EffectOperation,
  EffectTrigger,
} from "./types.js";

// Stat-specific effect configurations
export const statEffectConfigs: Record<AffectedStat, EffectConfig> = {
  gold: {
    goodDirection: "increase", // More gold is good
    supportedOperations: [
      "multiply",
      "add",
      "subtract",
      "set",
      "add_over_time",
      "subtract_over_time",
    ],
    supportedTriggers: [
      "value",
      "change_good",
      "change_bad", // Stat triggers
      "adventure",
      "bazaar",
      "shopping", // Context triggers
      "on_craft",
      "periodic", // Event triggers
    ],
    allowsOverTime: true,
  },
  mana: {
    goodDirection: "increase", // More mana is good
    supportedOperations: [
      "multiply",
      "add",
      "subtract",
      "set",
      "add_over_time",
      "subtract_over_time",
    ],
    supportedTriggers: [
      "value",
      "change_good",
      "change_bad",
      "on_consume",
      "periodic",
    ],
    allowsOverTime: true,
  },
  brew_time: {
    goodDirection: "decrease", // Less brew time is good
    supportedOperations: ["multiply", "add", "subtract", "set"],
    supportedTriggers: [
      "value", // Only instant modification
      "brewing", // Context-specific
    ],
    allowsOverTime: false,
  },
  garden_growth_time: {
    goodDirection: "decrease", // Less growth time is good
    supportedOperations: ["multiply", "add", "subtract", "set"],
    supportedTriggers: ["value", "harvesting"],
    allowsOverTime: false,
  },
  garden_yield: {
    goodDirection: "increase", // More yield is good
    supportedOperations: ["multiply", "add", "subtract", "set"],
    supportedTriggers: [
      "value",
      "change_good",
      "change_bad",
      "harvesting", // Context-specific
    ],
    allowsOverTime: false,
  },
  shop_reroll_cost: {
    goodDirection: "decrease", // Less reroll cost is good
    supportedOperations: ["multiply", "add", "subtract", "set"],
    supportedTriggers: ["value", "shopping"],
    allowsOverTime: false,
  },
  adventure_cooldown: {
    goodDirection: "decrease", // Less cooldown is good
    supportedOperations: ["multiply", "add", "subtract", "set"],
    supportedTriggers: ["value", "adventure"],
    allowsOverTime: false,
  },
  bazaar_cooldown: {
    goodDirection: "decrease", // Less cooldown is good
    supportedOperations: ["multiply", "add", "subtract", "set"],
    supportedTriggers: ["value", "bazaar"],
    allowsOverTime: false,
  },
  ingredient_quality: {
    goodDirection: "increase",
    supportedOperations: ["multiply", "add", "subtract"],
    supportedTriggers: [
      "value",
      "brewing",
      "harvesting", // Context-specific
    ],
    allowsOverTime: false,
  },
  customer_satisfaction: {
    goodDirection: "increase",
    supportedOperations: ["multiply", "add", "subtract", "set"],
    supportedTriggers: [
      "value",
      "change_good",
      "change_bad",
      "bazaar", // Context-specific
    ],
    allowsOverTime: false,
  },
  discovery_bonus: {
    goodDirection: "increase",
    supportedOperations: ["multiply", "add", "subtract"],
    supportedTriggers: ["value", "on_craft"],
    allowsOverTime: false,
  },
  story_difficulty: {
    goodDirection: "decrease", // Less difficulty is good
    supportedOperations: ["multiply", "add", "subtract", "set"],
    supportedTriggers: ["value", "adventure", "bazaar", "combat"],
    allowsOverTime: false,
  },
};

// Get configuration for a stat
export function getStatConfig(stat: AffectedStat): EffectConfig {
  return statEffectConfigs[stat];
}

// Check if operation is supported for a stat
export function isOperationSupported(
  stat: AffectedStat,
  operation: EffectOperation,
): boolean {
  const config = getStatConfig(stat);
  return config.supportedOperations.includes(operation);
}

// Check if trigger is supported for a stat
export function isTriggerSupported(
  stat: AffectedStat,
  trigger: EffectTrigger,
): boolean {
  const config = getStatConfig(stat);
  return config.supportedTriggers.includes(trigger);
}

// Check if stat supports over-time operations
export function allowsOverTime(stat: AffectedStat): boolean {
  const config = getStatConfig(stat);
  return config.allowsOverTime;
}
