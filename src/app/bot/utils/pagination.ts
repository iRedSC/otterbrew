import {
  type ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
  type EmbedBuilder,
} from "discord.js";

/**
 * Configuration for a pagination system.
 * 
 * @template TPage - The type of page identifiers (e.g., "ingredients" | "potions")
 */
export interface PaginationConfig<TPage extends string> {
  /** Unique identifier for this pagination instance (used in button customIds) */
  handlerId: string;
  /** Map of page identifiers to their display labels */
  pageLabels: Record<TPage, string>;
  /** Function to build the embed for a specific page */
  buildPageEmbed: (page: TPage) => Promise<EmbedBuilder> | EmbedBuilder;
  /** Function to determine which pages are available (for filtering) */
  getAvailablePages: () => Promise<TPage[]> | TPage[];
  /** Optional function to get the default page (defaults to first available) */
  getDefaultPage?: (availablePages: TPage[]) => TPage;
  /** Optional function to validate if a page is valid */
  isValidPage?: (page: string) => page is TPage;
}

/**
 * Creates pagination buttons for switching between pages.
 * 
 * @template TPage - The type of page identifiers
 * @param userId - The Discord user ID (for button ownership validation)
 * @param currentPage - The currently active page
 * @param availablePages - List of pages that should be shown as buttons
 * @param config - Pagination configuration
 * @returns Action row with pagination buttons
 */
export function buildPaginationButtons<TPage extends string>(
  userId: string,
  currentPage: TPage,
  availablePages: TPage[],
  config: PaginationConfig<TPage>,
): ActionRowBuilder<ButtonBuilder> {
  const row = new ActionRowBuilder<ButtonBuilder>();

  for (const page of availablePages) {
    const isActive = page === currentPage;
    const button = new ButtonBuilder()
      .setCustomId(`${config.handlerId}:${userId}:${page}`)
      .setLabel(config.pageLabels[page])
      .setStyle(isActive ? ButtonStyle.Primary : ButtonStyle.Secondary)
      .setDisabled(isActive);
    row.addComponents(button);
  }

  return row;
}

/**
 * Handles pagination button interactions.
 * This function extracts the page from the button customId, validates it,
 * and updates the message with the new page content.
 * 
 * @template TPage - The type of page identifiers
 * @param interaction - The button interaction
 * @param config - Pagination configuration
 */
export async function handlePaginationButton<TPage extends string>(
  interaction: ButtonInteraction,
  config: PaginationConfig<TPage>,
): Promise<void> {
  const customIdParts = interaction.customId.split(":");
  const userId = customIdParts[1];
  const pageId = customIdParts[2];

  // Validate customId format
  if (!userId || !pageId) {
    await interaction.reply({
      content: "❌ Invalid button format.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Verify the button belongs to the user who clicked it
  if (interaction.user.id !== userId) {
    await interaction.reply({
      content: "❌ This button is not for you.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  // Validate page
  const isValidPage = config.isValidPage || ((p: string): p is TPage => {
    return Object.keys(config.pageLabels).includes(p);
  });

  if (!isValidPage(pageId)) {
    await interaction.reply({
      content: "❌ Invalid page.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  try {
    await interaction.deferUpdate();

    const availablePages = await Promise.resolve(config.getAvailablePages());
    
    // Ensure the requested page is available
    if (!availablePages.includes(pageId)) {
      // Fallback to default or first available page
      const defaultPage = config.getDefaultPage
        ? config.getDefaultPage(availablePages)
        : availablePages[0] || pageId;
      
      const embed = await Promise.resolve(config.buildPageEmbed(defaultPage));
      const buttons = buildPaginationButtons(
        userId,
        defaultPage,
        availablePages,
        config,
      );

      await interaction.editReply({
        embeds: [embed],
        components: availablePages.length > 1 ? [buttons] : [],
      });
      return;
    }

    const embed = await Promise.resolve(config.buildPageEmbed(pageId));
    const buttons = buildPaginationButtons(
      userId,
      pageId,
      availablePages,
      config,
    );

    await interaction.editReply({
      embeds: [embed],
      components: availablePages.length > 1 ? [buttons] : [],
    });
  } catch (error) {
    console.error(`[Pagination] Error handling button for ${config.handlerId}:`, error);
    if (error instanceof Error) {
      console.error(`[Pagination] Error message:`, error.message);
      console.error(`[Pagination] Error stack:`, error.stack);
    }
    try {
      await interaction.editReply({
        content: "❌ An error occurred while updating the page.",
      });
    } catch (replyError) {
      console.error(`[Pagination] Failed to send error reply:`, replyError);
    }
  }
}

/**
 * Creates and sends an initial paginated message.
 * 
 * @template TPage - The type of page identifiers
 * @param userId - The Discord user ID
 * @param config - Pagination configuration
 * @returns Object containing the embed and optional button components
 */
export async function createPaginationMessage<TPage extends string>(
  userId: string,
  config: PaginationConfig<TPage>,
): Promise<{
  embed: EmbedBuilder;
  components: ActionRowBuilder<ButtonBuilder>[];
}> {
  const availablePages = await Promise.resolve(config.getAvailablePages());
  
  if (availablePages.length === 0) {
    throw new Error("No pages available for pagination");
  }
  
  // Determine default page
  const defaultPage = config.getDefaultPage
    ? config.getDefaultPage(availablePages)
    : availablePages[0]!;

  const embed = await Promise.resolve(config.buildPageEmbed(defaultPage));
  const buttons = buildPaginationButtons(
    userId,
    defaultPage,
    availablePages,
    config,
  );

  return {
    embed,
    components: availablePages.length > 1 ? [buttons] : [],
  };
}
