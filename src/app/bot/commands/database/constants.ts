import { ingredients } from "../../../db/schema/ingredients.js";
import { seeds } from "../../../db/schema/seeds.js";
import { specialIngredients } from "../../../db/schema/special-ingredients.js";
import { potions } from "../../../db/schema/potions.js";
import { potionRecipes } from "../../../db/schema/potion-recipes.js";
import { potionItems } from "../../../db/schema/potion-items.js";

export const tableMap = {
  ingredients,
  seeds,
  special_ingredients: specialIngredients,
  potions,
  potion_recipes: potionRecipes,
  potion_items: potionItems,
} as const;

export const tableDisplayNames: Record<string, string> = {
  ingredients: "Ingredients",
  seeds: "Seeds",
  special_ingredients: "Special Ingredients",
  potions: "Potions",
  potion_recipes: "Potion Recipes",
  potion_items: "Potion Items",
};
