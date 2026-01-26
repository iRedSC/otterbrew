export function getSeedGenerationPrompt(): string {
  return `You are a creative assistant for a fantasy alchemy game called Otterbrew. Generate a unique seed that players can plant in their garden.

Generate a seed with the following properties:
- name: A creative, fantasy-themed seed name (3-50 characters, no special chars except spaces/hyphens)
- description: A vivid description of the seed (10-500 characters)
- rarity: One of: basic, uncommon, rare, epic, legendary, mythic
- emoji: An optional emoji that represents the seed (single emoji, max 10 chars)

The seed should fit a fantasy alchemy theme. Be creative and unique.

Return ONLY valid JSON in this exact format:
{
  "name": "Seed Name",
  "description": "Description text",
  "rarity": "rare",
  "emoji": "🌱"
}`;
}

export function getIngredientGenerationPrompt(): string {
  return `You are a creative assistant for a fantasy alchemy game called Otterbrew. Generate a unique ingredient that players can use to brew potions.

Ingredients have 8-dimensional attributes that affect potion brewing:
- spice: Affects heat/flame properties (-100 to 100)
- time: Affects temporal properties (-100 to 100)
- fizz: Affects effervescence/bubbles (-100 to 100)
- zest: Affects energy/vitality (-100 to 100)
- bane: Affects negative/corrupting properties (-100 to 100)
- fantasy: Affects magical/mystical properties (-100 to 100)
- chaos: Affects unpredictability (-100 to 100)
- darkness: Affects shadow/void properties (-100 to 100)

Generate an ingredient with:
- name: A creative, fantasy-themed ingredient name (3-50 characters, no special chars except spaces/hyphens)
- description: A vivid description of the ingredient (10-500 characters)
- attributes: An object with all 8 attributes as integers (each between -100 and 100)
- emoji: An optional emoji that represents the ingredient (single emoji, max 10 chars)

The ingredient should fit a fantasy alchemy theme. Be creative and unique. The attributes should make sense for the ingredient's theme.

Return ONLY valid JSON in this exact format:
{
  "name": "Ingredient Name",
  "description": "Description text",
  "attributes": {
    "spice": 5,
    "time": -3,
    "fizz": 10,
    "zest": 2,
    "bane": 0,
    "fantasy": 8,
    "chaos": 1,
    "darkness": -2
  },
  "emoji": "✨"
}`;
}

export function getSpecialIngredientGenerationPrompt(): string {
  return `You are a creative assistant for a fantasy alchemy game called Otterbrew. Generate a unique special ingredient that transforms potions in mysterious ways.

Special ingredients are rare items that modify entire potions when used in brewing. Examples include:
- Antimatter: Reverses all attribute signs
- Amplifier: Doubles all attribute values
- Nullifier: Sets all attributes to their absolute values

Generate a special ingredient with:
- name: A creative, fantasy-themed name (3-50 characters, no special chars except spaces/hyphens)
- description: A vivid description explaining how it transforms potions (10-500 characters)
- rarity: One of: basic, uncommon, rare, epic, legendary, mythic
- emoji: An optional emoji that represents the special ingredient (single emoji, max 10 chars)

The special ingredient should fit a fantasy alchemy theme and have a clear transformative effect. Be creative and unique.

Return ONLY valid JSON in this exact format:
{
  "name": "Special Ingredient Name",
  "description": "Description text explaining its transformative effect",
  "rarity": "rare",
  "emoji": "✨"
}`;
}
