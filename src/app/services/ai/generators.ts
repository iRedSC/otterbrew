import { getOpenAIClient, retryWithBackoff } from "./client.js";
import {
  getSeedGenerationPrompt,
  getIngredientGenerationPrompt,
  getSpecialIngredientGenerationPrompt,
} from "./prompts.js";
import type {
  SeedGenerationOutput,
  IngredientGenerationOutput,
  SpecialIngredientGenerationOutput,
} from "./types.js";
import type { RarityTier } from "../../db/schema/seeds.js";
import type { IngredientAttributes } from "../../db/schema/ingredients.js";

const VALID_RARITIES: RarityTier[] = [
  "basic",
  "uncommon",
  "rare",
  "epic",
  "legendary",
  "mythic",
];

function isValidRarity(rarity: string): rarity is RarityTier {
  return VALID_RARITIES.includes(rarity as RarityTier);
}

function validateSeedOutput(data: unknown): SeedGenerationOutput {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid seed output: not an object");
  }

  const obj = data as Record<string, unknown>;

  if (typeof obj.name !== "string" || obj.name.length < 3 || obj.name.length > 50) {
    throw new Error("Invalid seed name: must be 3-50 characters");
  }

  if (
    typeof obj.description !== "string" ||
    obj.description.length < 10 ||
    obj.description.length > 500
  ) {
    throw new Error("Invalid seed description: must be 10-500 characters");
  }

  if (!isValidRarity(obj.rarity)) {
    throw new Error(`Invalid rarity: ${obj.rarity}`);
  }

  if (obj.emoji !== undefined && (typeof obj.emoji !== "string" || obj.emoji.length > 10)) {
    throw new Error("Invalid emoji: must be string with max 10 characters");
  }

  return {
    name: obj.name,
    description: obj.description,
    rarity: obj.rarity,
    emoji: obj.emoji,
  };
}

function validateIngredientOutput(
  data: unknown,
): IngredientGenerationOutput {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid ingredient output: not an object");
  }

  const obj = data as Record<string, unknown>;

  if (
    typeof obj.name !== "string" ||
    obj.name.length < 3 ||
    obj.name.length > 50
  ) {
    throw new Error("Invalid ingredient name: must be 3-50 characters");
  }

  if (
    typeof obj.description !== "string" ||
    obj.description.length < 10 ||
    obj.description.length > 500
  ) {
    throw new Error("Invalid ingredient description: must be 10-500 characters");
  }

  if (!obj.attributes || typeof obj.attributes !== "object") {
    throw new Error("Invalid attributes: must be an object");
  }

  const attrs = obj.attributes as Record<string, unknown>;
  const requiredAttrs = [
    "spice",
    "time",
    "fizz",
    "zest",
    "bane",
    "fantasy",
    "chaos",
    "darkness",
  ];

  for (const attr of requiredAttrs) {
    if (
      typeof attrs[attr] !== "number" ||
      attrs[attr] < -100 ||
      attrs[attr] > 100
    ) {
      throw new Error(
        `Invalid ${attr}: must be number between -100 and 100`,
      );
    }
  }

  if (
    obj.emoji !== undefined &&
    (typeof obj.emoji !== "string" || obj.emoji.length > 10)
  ) {
    throw new Error("Invalid emoji: must be string with max 10 characters");
  }

  return {
    name: obj.name,
    description: obj.description,
    attributes: attrs as IngredientAttributes,
    emoji: obj.emoji,
  };
}

function validateSpecialIngredientOutput(
  data: unknown,
): SpecialIngredientGenerationOutput {
  if (!data || typeof data !== "object") {
    throw new Error("Invalid special ingredient output: not an object");
  }

  const obj = data as Record<string, unknown>;

  if (
    typeof obj.name !== "string" ||
    obj.name.length < 3 ||
    obj.name.length > 50
  ) {
    throw new Error("Invalid special ingredient name: must be 3-50 characters");
  }

  if (
    typeof obj.description !== "string" ||
    obj.description.length < 10 ||
    obj.description.length > 500
  ) {
    throw new Error(
      "Invalid special ingredient description: must be 10-500 characters",
    );
  }

  if (!isValidRarity(obj.rarity)) {
    throw new Error(`Invalid rarity: ${obj.rarity}`);
  }

  if (
    obj.emoji !== undefined &&
    (typeof obj.emoji !== "string" || obj.emoji.length > 10)
  ) {
    throw new Error("Invalid emoji: must be string with max 10 characters");
  }

  return {
    name: obj.name,
    description: obj.description,
    rarity: obj.rarity,
    emoji: obj.emoji,
  };
}

async function callOpenAI(prompt: string): Promise<string> {
  const client = getOpenAIClient();

  const response = await retryWithBackoff(async () => {
    const completion = await client.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that generates game content. Always respond with valid JSON only, no additional text.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.9,
      max_tokens: 500,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error("No content in OpenAI response");
    }

    return content;
  });

  return response;
}

function parseJSONResponse(content: string): unknown {
  // Try to extract JSON from markdown code blocks if present
  const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
  if (jsonMatch) {
    return JSON.parse(jsonMatch[1]!);
  }

  // Try parsing the whole content
  return JSON.parse(content);
}

export async function generateSeed(): Promise<SeedGenerationOutput> {
  const prompt = getSeedGenerationPrompt();

  try {
    const content = await callOpenAI(prompt);
    const parsed = parseJSONResponse(content);
    return validateSeedOutput(parsed);
  } catch (error) {
    console.error("[AI:GenerateSeed] Error:", error);
    // Fallback to template-based generation
    return {
      name: "Mysterious Seed",
      description: "A mysterious seed that glimmers with potential.",
      rarity: "basic",
      emoji: "🌱",
    };
  }
}

export async function generateIngredient(): Promise<IngredientGenerationOutput> {
  const prompt = getIngredientGenerationPrompt();

  try {
    const content = await callOpenAI(prompt);
    const parsed = parseJSONResponse(content);
    return validateIngredientOutput(parsed);
  } catch (error) {
    console.error("[AI:GenerateIngredient] Error:", error);
    // Fallback to template-based generation
    return {
      name: "Mysterious Ingredient",
      description: "A powerful alchemical ingredient with mysterious properties.",
      attributes: {
        spice: 0,
        time: 0,
        fizz: 0,
        zest: 0,
        bane: 0,
        fantasy: 0,
        chaos: 0,
        darkness: 0,
      },
      emoji: "✨",
    };
  }
}

export async function generateSpecialIngredient(): Promise<SpecialIngredientGenerationOutput> {
  const prompt = getSpecialIngredientGenerationPrompt();

  try {
    const content = await callOpenAI(prompt);
    const parsed = parseJSONResponse(content);
    return validateSpecialIngredientOutput(parsed);
  } catch (error) {
    console.error("[AI:GenerateSpecialIngredient] Error:", error);
    // Fallback to template-based generation
    return {
      name: "Mysterious Catalyst",
      description: "A mysterious catalyst that transforms potions in unknown ways.",
      rarity: "basic",
      emoji: "✨",
    };
  }
}
