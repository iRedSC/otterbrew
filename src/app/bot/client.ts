import { Client, GatewayIntentBits, Events } from "discord.js";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
});
