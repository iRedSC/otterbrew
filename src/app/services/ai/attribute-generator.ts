import type { IngredientAttributes } from "../../db/schema/ingredients.js";

const REGULAR_ATTRIBUTES = ["spice", "time", "fizz", "zest", "bane"] as const;
const RARE_ATTRIBUTES = ["fantasy", "chaos", "darkness"] as const;
const ALL_ATTRIBUTES = [
  ...REGULAR_ATTRIBUTES,
  ...RARE_ATTRIBUTES,
] as const;

type AttributeName = (typeof ALL_ATTRIBUTES)[number];

/**
 * Generates ingredient attributes with the following rules:
 * - Randomly selects 1-4 attributes to modify (weighted: 1=50%, 2=35%, 3=12%, 4=3%)
 * - Regular attributes (spice, time, fizz, zest, bane): 95% chance each
 * - Rare attributes (fantasy, chaos, darkness): 5% chance each
 * - Positive values: 70% chance, range 1-100
 * - Negative values: 30% chance, range -100 to -1
 * - All non-selected attributes are set to 0
 */
export function generateIngredientAttributes(): IngredientAttributes {
  // Initialize all attributes to 0
  const attributes: IngredientAttributes = {
    spice: 0,
    time: 0,
    fizz: 0,
    zest: 0,
    bane: 0,
    fantasy: 0,
    chaos: 0,
    darkness: 0,
  };

  // Randomly select 1-4 attributes to modify
  // Weighted distribution: 1 attribute = 50%, 2 attributes = 35%, 3 attributes = 12%, 4 attributes = 3%
  const random = Math.random();
  let numAttributes: number;
  if (random < 0.5) {
    numAttributes = 1;
  } else if (random < 0.85) {
    numAttributes = 2;
  } else if (random < 0.97) {
    numAttributes = 3;
  } else {
    numAttributes = 4;
  }
  const selectedAttributes: AttributeName[] = [];
  const availableAttributes: AttributeName[] = [...ALL_ATTRIBUTES];

  // Select attributes with weighted probabilities
  // Rare attributes: 5% chance each (total 15%)
  // Regular attributes: share remaining 85% equally (~17% each)
  while (selectedAttributes.length < numAttributes && availableAttributes.length > 0) {
    // Calculate weights: rare = 5% each, regular = equal share of remaining
    const rareWeight = 0.05;
    const regularWeight = (1 - RARE_ATTRIBUTES.length * rareWeight) / REGULAR_ATTRIBUTES.length;
    
    // Build weighted array
    const weighted: Array<{ attr: AttributeName; weight: number }> = [];
    for (const attr of availableAttributes) {
      const isRare = RARE_ATTRIBUTES.includes(attr as typeof RARE_ATTRIBUTES[number]);
      weighted.push({ attr, weight: isRare ? rareWeight : regularWeight });
    }

    // Select based on weighted random
    const totalWeight = weighted.reduce((sum, w) => sum + w.weight, 0);
    let random = Math.random() * totalWeight;
    
    for (const { attr, weight } of weighted) {
      random -= weight;
      if (random <= 0) {
        selectedAttributes.push(attr);
        // Remove selected attribute to avoid duplicates
        const index = availableAttributes.indexOf(attr);
        if (index > -1) {
          availableAttributes.splice(index, 1);
        }
        break;
      }
    }
  }

  // Generate values for selected attributes
  for (const attr of selectedAttributes) {
    const isNegative = Math.random() < 0.3; // 30% chance of negative
    const magnitude = Math.floor(Math.random() * 100) + 1; // 1-100
    attributes[attr] = isNegative ? -magnitude : magnitude;
  }

  return attributes;
}
