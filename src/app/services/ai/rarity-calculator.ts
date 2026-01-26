import type { RarityTier } from "../../db/schema/seeds.js";
import type { IngredientAttributes } from "../../db/schema/ingredients.js";

/**
 * Calculates rarity tier based on the sum of absolute values of all attributes.
 * Uses the same thresholds as the potion system:
 * - 1-50: basic
 * - 51-100: uncommon
 * - 101-200: rare
 * - 201-350: epic
 * - 351-500: legendary
 * - 501+: mythic
 */
export function calculateRarityFromAttributes(
  attributes: IngredientAttributes,
): RarityTier {
  const sum = Math.abs(attributes.spice) +
    Math.abs(attributes.time) +
    Math.abs(attributes.fizz) +
    Math.abs(attributes.zest) +
    Math.abs(attributes.bane) +
    Math.abs(attributes.fantasy) +
    Math.abs(attributes.chaos) +
    Math.abs(attributes.darkness);

  if (sum <= 50) {
    return "basic";
  } else if (sum <= 100) {
    return "uncommon";
  } else if (sum <= 200) {
    return "rare";
  } else if (sum <= 350) {
    return "epic";
  } else if (sum <= 500) {
    return "legendary";
  } else {
    return "mythic";
  }
}

/**
 * Generates a random rarity tier with weighted distribution favoring lower rarities.
 * Distribution:
 * - basic: 40%
 * - uncommon: 30%
 * - rare: 20%
 * - epic: 7%
 * - legendary: 2.5%
 * - mythic: 0.5%
 */
export function generateRandomRarity(): RarityTier {
  const random = Math.random();
  const cumulative = [
    { threshold: 0.4, rarity: "basic" as RarityTier },
    { threshold: 0.7, rarity: "uncommon" as RarityTier },
    { threshold: 0.9, rarity: "rare" as RarityTier },
    { threshold: 0.97, rarity: "epic" as RarityTier },
    { threshold: 0.995, rarity: "legendary" as RarityTier },
    { threshold: 1.0, rarity: "mythic" as RarityTier },
  ];

  for (const { threshold, rarity } of cumulative) {
    if (random < threshold) {
      return rarity;
    }
  }

  // Fallback (should never reach here)
  return "basic";
}
