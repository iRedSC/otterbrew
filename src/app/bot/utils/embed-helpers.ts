import type { EmbedBuilder } from "discord.js";
import type { RarityTier } from "../../db/schema/seeds.js";
import type { ItemDetails } from "../../services/item-service.js";

/**
 * Emoji mapping for attribute types
 */
const ATTRIBUTE_EMOJIS: Record<string, string> = {
  spice: "🌶️",
  time: "🕑",
  fizz: "🍾",
  zest: "✨",
  bane: "☠️",
  fantasy: "☁️",
  chaos: "🌪️",
  darkness: "🔮",
} as const;

/**
 * Discord embed field value limit is 1024 characters.
 * We use 1000 to leave a small buffer.
 */
const MAX_FIELD_LENGTH = 1000;

/**
 * Formats an item name with markdown based on its rarity tier.
 * Tier progression: italic -> underline -> bold -> italic underline -> italic bold underline
 *
 * @param name - The item name to format
 * @param tier - The rarity tier (optional)
 * @param emoji - The emoji to display before the name (optional)
 * @returns The formatted name with markdown and emoji
 */
export function formatItemNameByTier(
  name: string,
  tier?: RarityTier | string | null,
  emoji?: string | null,
): string {
  // Handle emoji: check for truthy value and non-empty string
  // Safely handle null/undefined/empty string
  const emojiPrefix =
    emoji && typeof emoji === "string" && emoji.trim().length > 0
      ? `${emoji.trim()} `
      : "";
  
  if (!tier) {
    return `${emojiPrefix}${name}`;
  }

  const normalizedTier = tier.toLowerCase();

  switch (normalizedTier) {
    case "basic":
      return `${emojiPrefix}*${name}*`; // italic
    case "uncommon":
      return `${emojiPrefix}__${name}__`; // underline
    case "rare":
      return `${emojiPrefix}**${name}**`; // bold
    case "epic":
      return `${emojiPrefix}*__${name}__*`; // italic underline
    case "legendary":
    case "mythic":
      return `${emojiPrefix}***__${name}__***`; // italic bold underline
    default:
      return `${emojiPrefix}${name}`;
  }
}

/**
 * Composes an item display name with optional formatting, emoji, and quantity.
 * This is the main function to use for displaying items consistently.
 *
 * @param itemDetails - The item details (can be null for unknown items)
 * @param quantity - The quantity of the item (used if showAmount is true)
 * @param showAmount - Whether to append quantity in parentheses
 * @param formatRarity - Whether to apply tier-based markdown formatting
 * @param showEmoji - Whether to display emoji before the name
 * @returns The formatted display string for the item
 */
export function getItemDisplayName(
  itemDetails: ItemDetails | null,
  quantity: number = 1,
  showAmount: boolean = true,
  formatRarity: boolean = true,
  showEmoji: boolean = true,
): string {
  // Handle unknown items
  if (!itemDetails) {
    return `Unknown Item (x${quantity})`;
  }

  const name = itemDetails.name;
  const emoji = showEmoji ? itemDetails.emoji : null;
  const tier = formatRarity ? itemDetails.rarity : null;

  // Debug logging for emoji issues
  if (showEmoji && !emoji) {
    console.log(`[EmbedHelpers] Item "${name}" (type: ${itemDetails.type}) has no emoji:`, {
      emojiValue: itemDetails.emoji,
      emojiType: typeof itemDetails.emoji,
      itemId: itemDetails.id,
    });
  }

  // Format the name with tier and emoji
  const formattedName = formatItemNameByTier(name, tier, emoji);

  // Append quantity if requested
  if (showAmount && quantity > 0) {
    return `${formattedName} (x${quantity})`;
  }

  return formattedName;
}

/**
 * Formats attributes object into a string with emoji prefixes.
 * Example: { spice: 5, time: -3 } -> "🌶️5, 🕑-3"
 *
 * @param attributes - The attributes object with numeric values
 * @returns Formatted string with emoji prefixes
 */
export function formatAttributes(
  attributes: Record<string, number>,
): string {
  return Object.entries(attributes)
    .map(([key, value]) => {
      const emoji = ATTRIBUTE_EMOJIS[key.toLowerCase()] || key;
      return `${emoji}${value}`;
    })
    .join(", ");
}

/**
 * Formats attributes object into a string with emoji prefixes, showing only non-zero attributes.
 * Example: { spice: 5, time: 0, fizz: -3 } -> "🌶️5, 🍾-3"
 *
 * @param attributes - The attributes object with numeric values
 * @returns Formatted string with emoji prefixes for non-zero attributes only
 */
export function formatNonZeroAttributes(
  attributes: Record<string, number>,
): string {
  const nonZeroEntries = Object.entries(attributes).filter(
    ([, value]) => value !== 0,
  );
  if (nonZeroEntries.length === 0) {
    return "No attributes";
  }
  return nonZeroEntries
    .map(([key, value]) => {
      const emoji = ATTRIBUTE_EMOJIS[key.toLowerCase()] || key;
      return `${emoji}${value}`;
    })
    .join(", ");
}

/**
 * Formats attributes as emojis only, grouped by positive/negative with prefixes.
 * Example: { spice: 5, bane: 3, chaos: -2, fizz: -1 } -> "+🌶️☠️ -🌪️🍾"
 *
 * @param attributes - The attributes object with numeric values
 * @returns Formatted string with emojis grouped by sign (+ for positive, - for negative)
 */
export function formatAttributeEmojis(
  attributes: Record<string, number>,
): string {
  const nonZeroEntries = Object.entries(attributes).filter(
    ([, value]) => value !== 0,
  );
  if (nonZeroEntries.length === 0) {
    return "";
  }

  const positive: string[] = [];
  const negative: string[] = [];

  for (const [key, value] of nonZeroEntries) {
    const emoji = ATTRIBUTE_EMOJIS[key.toLowerCase()] || key;
    if (value > 0) {
      positive.push(emoji);
    } else {
      negative.push(emoji);
    }
  }

  const parts: string[] = [];
  if (positive.length > 0) {
    parts.push(`+${positive.join("")}`);
  }
  if (negative.length > 0) {
    parts.push(`-${negative.join("")}`);
  }

  return parts.join(" | ");
}

/**
 * Formats the field value for an inventory item based on its type.
 * Used when displaying items as individual fields in embeds.
 *
 * @param itemDetails - The item details (can be null for unknown items)
 * @returns Formatted string for the field value
 */
export function formatItemFieldValue(
  itemDetails: ItemDetails | null,
): string {
  if (!itemDetails) {
    return "";
  }

  const parts: string[] = [];

  // For ingredients, show attribute emojis
  if (itemDetails.type === "ingredient" && itemDetails.attributes) {
    const attributeStr = formatAttributeEmojis(itemDetails.attributes);
    if (attributeStr) {
      parts.push(attributeStr);
    }
  }

  // For potions, show quality if available
  if (itemDetails.type === "potion" && itemDetails.quality !== undefined) {
    parts.push(`Quality: ${itemDetails.quality}`);
  }

  return parts.join("\n") || "\u200b"; // Zero-width space if empty
}

/**
 * Adds a potentially long text value to an embed, splitting it across
 * multiple fields if it exceeds Discord's 1024 character limit per field.
 *
 * @param embed - The embed builder to add fields to
 * @param name - The name for the first field (subsequent fields use zero-width space)
 * @param value - The text value to add (will be split by newlines if needed)
 * @param inline - Whether fields should be inline (default: false)
 */
export function addLongField(
  embed: EmbedBuilder,
  name: string,
  value: string,
  inline = false,
): void {
  if (value.length <= MAX_FIELD_LENGTH) {
    // Simple case: fits in one field
    embed.addFields({ name, value, inline });
    return;
  }

  // Split by lines and distribute across multiple fields
  const lines = value.split("\n");
  let currentField = "";
  let fieldCount = 0;

  for (const line of lines) {
    const lineWithNewline = currentField.length > 0 ? `\n${line}` : line;
    
    if (
      currentField.length + lineWithNewline.length > MAX_FIELD_LENGTH &&
      currentField.length > 0
    ) {
      // Current field is full, add it and start a new one
      embed.addFields({
        name: fieldCount === 0 ? name : "\u200b", // Zero-width space for continuation
        value: currentField.trim(),
        inline,
      });
      currentField = line;
      fieldCount++;
    } else {
      currentField += lineWithNewline;
    }
  }

  // Add the last field if there's remaining content
  if (currentField.length > 0) {
    embed.addFields({
      name: fieldCount === 0 ? name : "\u200b",
      value: currentField.trim(),
      inline,
    });
  }
}
