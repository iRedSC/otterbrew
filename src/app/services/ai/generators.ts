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
import { generateIngredientAttributes } from "./attribute-generator.js";
import {
  calculateRarityFromAttributes,
  generateRandomRarity,
} from "./rarity-calculator.js";

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

function validateSeedOutput(
  data: unknown,
  preGeneratedRarity: RarityTier,
): SeedGenerationOutput {
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

  // Validate that AI didn't try to override rarity
  if (obj.rarity !== undefined && obj.rarity !== null) {
    throw new Error("AI should not provide rarity - it is pre-generated");
  }

  if (obj.emoji !== undefined && (typeof obj.emoji !== "string" || obj.emoji.length > 10)) {
    throw new Error("Invalid emoji: must be string with max 10 characters");
  }

  return {
    name: obj.name,
    description: obj.description,
    rarity: preGeneratedRarity,
    emoji: obj.emoji,
  };
}

function validateIngredientOutput(
  data: unknown,
  preGeneratedAttributes: IngredientAttributes,
  preGeneratedRarity: RarityTier,
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

  // Validate that AI didn't try to override attributes or rarity
  if (obj.attributes !== undefined && obj.attributes !== null) {
    throw new Error("AI should not provide attributes - they are pre-generated");
  }

  if (obj.rarity !== undefined && obj.rarity !== null) {
    throw new Error("AI should not provide rarity - it is pre-generated");
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
    attributes: preGeneratedAttributes,
    rarity: preGeneratedRarity,
    emoji: obj.emoji,
  };
}

function validateSpecialIngredientOutput(
  data: unknown,
  preGeneratedRarity: RarityTier,
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

  // Validate that AI didn't try to override rarity
  if (obj.rarity !== undefined && obj.rarity !== null) {
    throw new Error("AI should not provide rarity - it is pre-generated");
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
    rarity: preGeneratedRarity,
    emoji: obj.emoji,
  };
}

async function callOpenAI(prompt: string): Promise<string> {
  const client = getOpenAIClient();
  const useReasoningModel =
    process.env.USE_REASONING_MODEL === "true" ||
    process.env.USE_REASONING_MODEL === "1";

  const response = await retryWithBackoff(async () => {
    if (useReasoningModel) {
      // Use o3-mini with low reasoning effort for limited reasoning
      const completion = await client.chat.completions.create({
        model: "o3-mini",
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
        reasoning_effort: "low", // Limited reasoning time
        max_completion_tokens: 500, // Limit final output tokens
      });

      // For reasoning models, check both content and potentially other fields
      const content = completion.choices[0]?.message?.content;
      if (!content) {
        // Log the full response for debugging
        console.error("[AI:callOpenAI] No content in reasoning model response:", {
          choices: completion.choices?.length,
          firstChoice: completion.choices?.[0],
          message: completion.choices?.[0]?.message,
          finishReason: completion.choices?.[0]?.finish_reason,
          fullResponse: JSON.stringify(completion, null, 2),
        });
        throw new Error("No content in OpenAI response");
      }

      return content;
    } else {
      // Standard model (gpt-4o-mini)
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
        // Log the full response for debugging
        console.error("[AI:callOpenAI] No content in standard model response:", {
          choices: completion.choices?.length,
          firstChoice: completion.choices?.[0],
          message: completion.choices?.[0]?.message,
          finishReason: completion.choices?.[0]?.finish_reason,
          fullResponse: JSON.stringify(completion, null, 2),
        });
        throw new Error("No content in OpenAI response");
      }

      return content;
    }
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
  // Generate rarity beforehand
  const rarity = generateRandomRarity();
  const prompt = getSeedGenerationPrompt({ rarity });

  const content = await callOpenAI(prompt);
  const parsed = parseJSONResponse(content);
  return validateSeedOutput(parsed, rarity);
}

export async function generateIngredient(): Promise<IngredientGenerationOutput> {
  // Generate attributes and rarity beforehand
  const attributes = generateIngredientAttributes();
  const rarity = calculateRarityFromAttributes(attributes);
  const prompt = getIngredientGenerationPrompt({ attributes, rarity });

  const content = await callOpenAI(prompt);
  const parsed = parseJSONResponse(content);
  const validated = validateIngredientOutput(parsed, attributes, rarity);
  console.log(`[AI:GenerateIngredient] Successfully generated: ${validated.name}`);
  return validated;
}

export async function generateSpecialIngredient(): Promise<SpecialIngredientGenerationOutput> {
  // Generate rarity beforehand
  const rarity = generateRandomRarity();
  const prompt = getSpecialIngredientGenerationPrompt({ rarity });

  const content = await callOpenAI(prompt);
  const parsed = parseJSONResponse(content);
  return validateSpecialIngredientOutput(parsed, rarity);
}
