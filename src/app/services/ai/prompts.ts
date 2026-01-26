const FLAVOR_TAGS = [
  "dormant",
  "flashy",
  "necromantic",
  "somber",
  "elevated",
  "crystalline",
  "ethereal",
  "volcanic",
  "prismatic",
  "shadowy",
  "luminous",
  "ancient",
  "whimsical",
  "ominous",
  "radiant",
  "corrupted",
  "serene",
  "chaotic",
  "mystical",
  "forbidden",
  "celestial",
  "abyssal",
  "verdant",
  "crimson",
  "azure",
  "golden",
  "silver",
  "ebony",
  "ivory",
  "emerald",
  "sapphire",
  "ruby",
  "amber",
  "pearl",
  "obsidian",
  "jade",
  "platinum",
  "copper",
  "bronze",
  "iron",
  "vibrant",
  "muted",
  "glowing",
  "pulsing",
  "shimmering",
  "glimmering",
  "sparkling",
  "dazzling",
  "brilliant",
  "dim",
  "faded",
  "weathered",
  "pristine",
  "tarnished",
  "polished",
  "rough",
  "smooth",
  "textured",
  "glossy",
  "matte",
  "translucent",
  "opaque",
  "transparent",
  "murky",
  "clear",
  "cloudy",
  "misty",
  "foggy",
  "hazy",
  "crisp",
  "soft",
  "hard",
  "flexible",
  "rigid",
  "brittle",
  "durable",
  "fragile",
  "resilient",
  "delicate",
  "sturdy",
  "wispy",
  "dense",
  "light",
  "heavy",
  "weightless",
  "massive",
  "tiny",
  "gigantic",
  "minute",
  "colossal",
  "microscopic",
  "towering",
  "petite",
  "grand",
  "humble",
  "majestic",
  "regal",
  "noble",
  "common",
  "rare",
  "exotic",
  "foreign",
  "native",
  "wild",
  "tamed",
  "feral",
  "domestic",
  "untamed",
  "civilized",
  "savage",
  "gentle",
  "fierce",
  "peaceful",
  "warlike",
  "calm",
  "stormy",
  "turbulent",
  "still",
  "active",
  "passive",
  "energetic",
  "lethargic",
  "dynamic",
  "static",
  "living",
  "undead",
  "inanimate",
  "sentient",
  "conscious",
  "unconscious",
  "awakened",
  "slumbering",
  "dormant",
  "active",
  "resting",
  "vigilant",
  "watchful",
  "alert",
  "drowsy",
  "energetic",
  "exhausted",
  "refreshed",
  "weary",
  "rejuvenated",
  "decaying",
  "blooming",
  "withering",
  "thriving",
  "dying",
  "flourishing",
  "fading",
  "growing",
  "shrinking",
  "expanding",
  "contracting",
  "evolving",
  "stagnant",
  "progressive",
  "regressive",
  "advancing",
  "retreating",
  "forward",
  "backward",
  "upward",
  "downward",
  "lateral",
  "vertical",
  "horizontal",
  "diagonal",
  "spiral",
  "circular",
  "linear",
  "curved",
  "straight",
  "twisted",
  "winding",
  "meandering",
  "direct",
  "indirect",
  "complex",
  "simple",
  "intricate",
  "basic",
  "advanced",
  "primitive",
  "sophisticated",
  "crude",
  "refined",
  "raw",
  "processed",
  "natural",
  "artificial",
  "organic",
  "synthetic",
  "magical",
  "mundane",
  "enchanted",
  "cursed",
  "blessed",
  "holy",
  "unholy",
  "sacred",
  "profane",
  "divine",
  "demonic",
  "angelic",
  "infernal",
  "heavenly",
  "hellish",
  "celestial",
  "terrestrial",
  "cosmic",
  "planar",
  "dimensional",
  "temporal",
  "spatial",
  "eternal",
  "temporary",
  "permanent",
  "transient",
  "enduring",
  "fleeting",
  "lasting",
  "brief",
  "prolonged",
  "instant",
  "gradual",
  "sudden",
  "slow",
  "fast",
  "rapid",
  "swift",
  "sluggish",
  "quick",
  "speedy",
  "hasty",
  "leisurely",
  "urgent",
  "relaxed",
  "tense",
  "anxious",
  "calm",
  "nervous",
  "confident",
  "uncertain",
  "sure",
  "doubtful",
  "hopeful",
  "despairing",
  "optimistic",
  "pessimistic",
  "joyful",
  "sorrowful",
  "happy",
  "sad",
  "cheerful",
  "melancholic",
  "bright",
  "dark",
  "light",
  "shadowy",
  "sunny",
  "gloomy",
  "warm",
  "cold",
  "hot",
  "cool",
  "freezing",
  "burning",
  "scorching",
  "chilling",
  "tepid",
  "lukewarm",
  "frigid",
  "boiling",
  "icy",
  "fiery",
  "frozen",
  "molten",
  "solid",
  "liquid",
  "gaseous",
  "plasma",
  "vapor",
  "steam",
  "smoke",
  "mist",
  "dew",
  "frost",
  "snow",
  "rain",
  "hail",
  "thunder",
  "lightning",
  "storm",
  "wind",
  "breeze",
  "gale",
  "hurricane",
  "tornado",
  "cyclone",
  "calm",
  "still",
  "motionless",
  "moving",
  "shifting",
  "changing",
  "stable",
  "unstable",
  "steady",
  "unsteady",
  "balanced",
  "unbalanced",
  "symmetrical",
  "asymmetrical",
  "even",
  "odd",
  "regular",
  "irregular",
  "uniform",
  "varied",
  "consistent",
  "inconsistent",
  "predictable",
  "unpredictable",
  "reliable",
  "unreliable",
  "trustworthy",
  "deceptive",
  "honest",
  "dishonest",
  "true",
  "false",
  "real",
  "illusory",
  "genuine",
  "fake",
  "authentic",
  "counterfeit",
  "original",
  "copy",
  "unique",
  "common",
  "rare",
  "ordinary",
  "extraordinary",
  "special",
  "normal",
  "abnormal",
  "typical",
  "atypical",
  "standard",
  "nonstandard",
  "conventional",
  "unconventional",
  "traditional",
  "modern",
  "ancient",
  "contemporary",
  "old",
  "new",
  "young",
  "aged",
  "fresh",
  "stale",
  "recent",
  "old",
  "vintage",
  "antique",
  "classic",
  "timeless",
  "dated",
  "current",
  "future",
  "past",
  "present",
  "now",
  "then",
  "before",
  "after",
  "early",
  "late",
  "premature",
  "overdue",
  "punctual",
  "delayed",
  "on-time",
  "timely",
  "untimely",
] as const;

function getRandomFlavors(count: number = 3): string[] {
  const shuffled = [...FLAVOR_TAGS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

import type { SeedGenerationInput } from "./types.js";
import type { IngredientGenerationInput } from "./types.js";
import type { SpecialIngredientGenerationInput } from "./types.js";

export function getSeedGenerationPrompt(
  input: SeedGenerationInput,
): string {
  const flavors = getRandomFlavors(3);
  return `You are a creative assistant for a fantasy alchemy game called Otterbrew. Generate a unique seed that players can plant in their garden.

The seed has already been assigned a rarity tier: **${input.rarity}**.

Generate a seed with the following properties:
- name: A creative, fantasy-themed seed name (3-50 characters, no special chars except spaces/hyphens)
- description: A vivid description of the seed (10-500 characters)
- emoji: An emoji that represents the seed (single emoji, max 10 chars)

The seed should fit a fantasy alchemy theme and match the ${input.rarity} rarity tier. Be creative and unique.
Incorporate these flavor themes: ${flavors.join(", ")}.

Return ONLY valid JSON in this exact format:
{
  "name": "Seed Name",
  "description": "Description text",
  "emoji": "🌱"
}`;
}

export function getIngredientGenerationPrompt(
  input: IngredientGenerationInput,
): string {
  const flavors = getRandomFlavors(3);
  const attributeDescriptions: string[] = [];
  
  if (input.attributes.spice !== 0) {
    attributeDescriptions.push(`spice: ${input.attributes.spice} (heat/flame properties)`);
  }
  if (input.attributes.time !== 0) {
    attributeDescriptions.push(`time: ${input.attributes.time} (temporal properties)`);
  }
  if (input.attributes.fizz !== 0) {
    attributeDescriptions.push(`fizz: ${input.attributes.fizz} (effervescence/bubbles)`);
  }
  if (input.attributes.zest !== 0) {
    attributeDescriptions.push(`zest: ${input.attributes.zest} (energy/vitality)`);
  }
  if (input.attributes.bane !== 0) {
    attributeDescriptions.push(`bane: ${input.attributes.bane} (negative/corrupting properties)`);
  }
  if (input.attributes.fantasy !== 0) {
    attributeDescriptions.push(`fantasy: ${input.attributes.fantasy} (magical/mystical properties)`);
  }
  if (input.attributes.chaos !== 0) {
    attributeDescriptions.push(`chaos: ${input.attributes.chaos} (unpredictability)`);
  }
  if (input.attributes.darkness !== 0) {
    attributeDescriptions.push(`darkness: ${input.attributes.darkness} (shadow/void properties)`);
  }

  return `You are a creative assistant for a fantasy alchemy game called Otterbrew. Generate a unique ingredient that players can use to brew potions.

The ingredient has already been assigned attributes and rarity:
- Rarity: **${input.rarity}**
- Attributes: ${attributeDescriptions.length > 0 ? attributeDescriptions.join(", ") : "none (all attributes are 0)"}

Generate an ingredient with:
- name: A creative, fantasy-themed ingredient name (3-50 characters, no special chars except spaces/hyphens)
- description: A vivid description of the ingredient (10-100 characters) that matches the given attributes and rarity
- emoji: An emoji that represents the ingredient (single emoji, max 10 chars)

The ingredient should fit a fantasy alchemy theme. Make them clean and clear. Do not include the attributes in the name or description. The name and description should reflect the ingredient's attributes and ${input.rarity} rarity tier.
Incorporate these flavor themes: ${flavors.join(", ")}.

IMPORTANT - DO NOT INCLUDE THE ATTRIBUTES IN THE NAME OR DESCRIPTION. This is very important.

Important - Negative attributes have the opposite effect of positive attributes. For example, a 100 spice attribute means the ingredient is extremely spicy, while a 100 spice attribute means the ingredient is extremely cold


Name examples:
🍠 Heetroot - spice
🧄 Garlic - spice, bane
🍋 Lemon - zest
🦂 Scorpion - bane
🌸 Popflower - fizz
⏳ Hourglass - time
🦥 Locsoth Soul - chaos, darkness
🦄 Unicorn Tear - fantasy
🎲 Dice - chaos
🎭 Mask of the Dead - darkness

They do not have to be objects that don't exist in the real world.


Return ONLY valid JSON in this exact format:
{
  "name": "Ingredient Name",
  "description": "Description text",
  "emoji": "✨"
}`;
}

export function getSpecialIngredientGenerationPrompt(
  input: SpecialIngredientGenerationInput,
): string {
  const flavors = getRandomFlavors(3);
  return `You are a creative assistant for a fantasy alchemy game called Otterbrew. Generate a unique special ingredient that transforms potions in mysterious ways.

Special ingredients are rare items that modify entire potions when used in brewing. Examples include:
- Antimatter: Reverses all attribute signs
- Amplifier: Doubles all attribute values
- Nullifier: Sets all attributes to their absolute values

The special ingredient has already been assigned a rarity tier: **${input.rarity}**.

Generate a special ingredient with:
- name: A creative, fantasy-themed name (3-50 characters, no special chars except spaces/hyphens)
- description: A vivid description explaining how it transforms potions (10-500 characters)
- emoji: An optional emoji that represents the special ingredient (single emoji, max 10 chars)

The special ingredient should fit a fantasy alchemy theme and have a clear transformative effect. Be creative and unique. Match the ${input.rarity} rarity tier.
Incorporate these flavor themes: ${flavors.join(", ")}.

Return ONLY valid JSON in this exact format:
{
  "name": "Special Ingredient Name",
  "description": "Description text explaining its transformative effect",
  "emoji": "✨"
}`;
}
