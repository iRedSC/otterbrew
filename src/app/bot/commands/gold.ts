import {
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
  EmbedBuilder,
  PermissionFlagsBits,
} from "discord.js";
import {
  getOrCreateUser,
  updateUserGold,
} from "../../services/user-service.js";
import {
  getActiveEffects,
  formatEffectsList,
  groupEffectsByStat,
} from "../../services/effects/index.js";

export const command = {
  data: new SlashCommandBuilder()
    .setName("gold")
    .setDescription("View your current gold balance")
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setDescription("View your current gold balance"),
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("add")
        .setDescription("Add gold (dev/testing only)")
        .addIntegerOption((option) =>
          option
            .setName("amount")
            .setDescription("Amount of gold to add")
            .setRequired(true)
            .setMinValue(1),
        )
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    ),
  execute: async (interaction: ChatInputCommandInteraction): Promise<void> => {
    console.log(`[Gold] Command started for user ${interaction.user.id}`);

    try {
      console.log(`[Gold] Deferring reply...`);
      await interaction.deferReply();
      console.log(`[Gold] Reply deferred, fetching user data...`);

      const subcommand = interaction.options.getSubcommand();

      if (subcommand === "add") {
        // Dev/testing subcommand
        const amount = interaction.options.getInteger("amount", true);
        const user = await getOrCreateUser(interaction.user.id);
        const newGold = user.gold + amount;

        await updateUserGold(interaction.user.id, newGold);

        const updatedUser = await getOrCreateUser(interaction.user.id);
        const embed = new EmbedBuilder()
          .setTitle("💰 Gold Added")
          .setDescription(
            `Added **${amount.toLocaleString()}** gold\nNew balance: **${updatedUser.gold.toLocaleString()}** gold`,
          )
          .setColor(0xffd700)
          .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
        return;
      }

      // Default: view gold balance
      const user = await getOrCreateUser(interaction.user.id);
      console.log(`[Gold] User data retrieved:`, {
        discordId: user.discordId,
        gold: user.gold,
      });

      // Get active gold effects
      const goldEffects = await getActiveEffects(
        interaction.user.id,
        "gold",
        "value",
      );
      const changeGoodEffects = await getActiveEffects(
        interaction.user.id,
        "gold",
        "change_good",
      );
      const changeBadEffects = await getActiveEffects(
        interaction.user.id,
        "gold",
        "change_bad",
      );
      const adventureEffects = await getActiveEffects(
        interaction.user.id,
        "gold",
        "adventure",
      );
      const bazaarEffects = await getActiveEffects(
        interaction.user.id,
        "gold",
        "bazaar",
      );

      const allGoldEffects = [
        ...goldEffects,
        ...changeGoodEffects,
        ...changeBadEffects,
        ...adventureEffects,
        ...bazaarEffects,
      ];

      console.log(`[Gold] Building embed...`);
      const embed = new EmbedBuilder()
        .setTitle("💰 Gold Balance")
        .setDescription(`You have **${user.gold.toLocaleString()}** gold`)
        .setColor(0xffd700)
        .setTimestamp();

      // Add active effects if any
      if (allGoldEffects.length > 0) {
        const effectsText = formatEffectsList(allGoldEffects);
        embed.addFields({
          name: "✨ Active Gold Effects",
          value: effectsText,
        });
      }

      console.log(`[Gold] Sending editReply...`);
      await interaction.editReply({ embeds: [embed] });
      console.log(`[Gold] Reply sent successfully`);
    } catch (error) {
      console.error("[Gold] Error in /gold command:", error);
      if (error instanceof Error) {
        console.error("[Gold] Error message:", error.message);
        console.error("[Gold] Error stack:", error.stack);
      }
      try {
        await interaction.editReply({
          content: "❌ An error occurred while fetching your gold balance.",
        });
      } catch (replyError) {
        console.error("[Gold] Failed to send error reply:", replyError);
      }
    }
  },
};
