import type { Command } from "@definitions/command";

import { SlashCommandBuilder } from "discord.js";

export const command: Command = {
  data: new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register into the game!"),

  async execute(interaction) {
    await interaction.reply("Your user has been registered!");
  },
};