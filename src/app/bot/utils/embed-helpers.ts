import type { EmbedBuilder } from "discord.js";
import type { RarityTier } from "../../db/schema/seeds.js";

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
 * @returns The formatted name with markdown
 */
export function formatItemNameByTier(
  name: string,
  tier?: RarityTier | string | null,
): string {
  if (!tier) {
    return name;
  }

  const normalizedTier = tier.toLowerCase();

  switch (normalizedTier) {
    case "basic":
      return `*${name}*`; // italic
    case "uncommon":
      return `__${name}__`; // underline
    case "rare":
      return `**${name}**`; // bold
    case "epic":
      return `*__${name}__*`; // italic underline
    case "legendary":
    case "mythic":
      return `***__${name}__***`; // italic bold underline
    default:
      return name;
  }
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
