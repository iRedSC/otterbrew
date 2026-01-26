import type { RarityTier } from "../../db/schema/seeds.js";
import type { IngredientAttributes } from "../../db/schema/ingredients.js";

export interface SeedGenerationOutput {
  name: string;
  description: string;
  rarity: RarityTier;
  emoji?: string;
}

export interface IngredientGenerationOutput {
  name: string;
  description: string;
  attributes: IngredientAttributes;
  emoji?: string;
}

export interface SpecialIngredientGenerationOutput {
  name: string;
  description: string;
  rarity: RarityTier;
  emoji?: string;
}
