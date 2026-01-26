import type { RarityTier } from "../../db/schema/seeds.js";
import type { IngredientAttributes } from "../../db/schema/ingredients.js";

export interface SeedGenerationInput {
  rarity: RarityTier;
}

export interface SeedGenerationOutput {
  name: string;
  description: string;
  rarity: RarityTier;
  emoji?: string;
}

export interface IngredientGenerationInput {
  attributes: IngredientAttributes;
  rarity: RarityTier;
}

export interface IngredientGenerationOutput {
  name: string;
  description: string;
  attributes: IngredientAttributes;
  rarity: RarityTier;
  emoji?: string;
}

export interface SpecialIngredientGenerationInput {
  rarity: RarityTier;
}

export interface SpecialIngredientGenerationOutput {
  name: string;
  description: string;
  rarity: RarityTier;
  emoji?: string;
}
