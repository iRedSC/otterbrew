import { type ChatInputCommandInteraction, EmbedBuilder } from "discord.js";
import { getOrCreateUser } from "../../../services/user-service.js";
import {
  addItemToInventory,
  parseInventory,
} from "../../../services/item-service.js";
import { db } from "@db";
import { seeds } from "../../../db/schema/seeds.js";
import { ingredients } from "../../../db/schema/ingredients.js";
import { specialIngredients } from "../../../db/schema/special-ingredients.js";
import {
  addLongField,
  getItemDisplayName,
} from "../../utils/embed-helpers.js";
import {
  getItemDetails,
  type ItemDetails,
} from "../../../services/item-service.js";

// Removed hardcoded names - giverandom now only uses items from database

export async function handleGiverandom(
  interaction: ChatInputCommandInteraction,
): Promise<void> {
  console.log(`[Invtools:GiveRandom] Command started for user ${interaction.user.id}`);

  try {
    await interaction.deferReply();

    const user = await getOrCreateUser(interaction.user.id);
    const itemType = interaction.options.getString("type") || "all";
    const quantity = interaction.options.getInteger("quantity") || 1;

    const givenItems: Array<{
      type: string;
      details: ItemDetails | null;
    }> = [];
    
    // Track if inventory is full
    let inventoryFull = false;
    let itemsAvailable = false;

    // Give seeds - only from existing items in database
    if (itemType === "seed" || itemType === "all") {
      const allSeeds = await db.select().from(seeds);
      
      if (allSeeds.length > 0) {
        itemsAvailable = true;
        for (let i = 0; i < quantity; i++) {
          // Randomly select an existing seed
          const randomSeed = allSeeds[Math.floor(Math.random() * allSeeds.length)];
          
          if (randomSeed) {
            const added = await addItemToInventory(
              user.discordId,
              "seed",
              randomSeed.id,
              1,
            );
            if (added) {
              // Retrieve item details to ensure emoji from /gen is reused
              const details = await getItemDetails("seed", randomSeed.id);
              givenItems.push({
                type: "Seed",
                details,
              });
            } else {
              // Check if inventory is full by checking current user state
              const currentUser = await getOrCreateUser(user.discordId);
              const currentInventory = parseInventory(currentUser.inventory);
              if (currentInventory.length >= currentUser.maxInventorySlots) {
                inventoryFull = true;
              }
            }
          }
        }
      }
    }

    // Give ingredients - only from existing items in database
    if (itemType === "ingredient" || itemType === "all") {
      const allIngredients = await db.select().from(ingredients);
      console.log(`[Invtools:GiveRandom] Found ${allIngredients.length} ingredients in database`);
      
      if (allIngredients.length > 0) {
        itemsAvailable = true;
        for (let i = 0; i < quantity; i++) {
          // Randomly select an existing ingredient
          const randomIngredient = allIngredients[Math.floor(Math.random() * allIngredients.length)];
          
          if (randomIngredient) {
            console.log(`[Invtools:GiveRandom] Attempting to add ingredient: ${randomIngredient.name} (${randomIngredient.id})`);
            const added = await addItemToInventory(
              user.discordId,
              "ingredient",
              randomIngredient.id,
              1,
            );
            console.log(`[Invtools:GiveRandom] addItemToInventory returned: ${added} for ingredient ${randomIngredient.id}`);
            if (added) {
              // Retrieve item details to ensure emoji from /gen is reused
              const details = await getItemDetails("ingredient", randomIngredient.id);
              console.log(`[Invtools:GiveRandom] Retrieved details for ingredient: ${details?.name || 'null'}`);
              givenItems.push({
                type: "Ingredient",
                details,
              });
            } else {
              console.error(`[Invtools:GiveRandom] Failed to add ingredient ${randomIngredient.id} to inventory`);
              // Check if inventory is full by checking current user state
              const currentUser = await getOrCreateUser(user.discordId);
              const currentInventory = parseInventory(currentUser.inventory);
              if (currentInventory.length >= currentUser.maxInventorySlots) {
                inventoryFull = true;
              }
            }
          }
        }
      } else {
        console.log(`[Invtools:GiveRandom] No ingredients found in database`);
      }
    }

    // Give special ingredients - only from existing items in database
    if (itemType === "modifier" || itemType === "all") {
      const allSpecialIngredients = await db.select().from(specialIngredients);
      
      if (allSpecialIngredients.length > 0) {
        itemsAvailable = true;
        for (let i = 0; i < quantity; i++) {
          // Randomly select an existing special ingredient
          const randomSpecialIngredient = allSpecialIngredients[Math.floor(Math.random() * allSpecialIngredients.length)];
          
          if (randomSpecialIngredient) {
            // Special ingredients are stored as ingredients in inventory
            console.log(`[Invtools:GiveRandom] Adding special ingredient to inventory:`, {
              specialIngredientId: randomSpecialIngredient.id,
              specialIngredientName: randomSpecialIngredient.name,
              stringId: randomSpecialIngredient.stringId,
            });
            const added = await addItemToInventory(
              user.discordId,
              "ingredient",
              randomSpecialIngredient.id,
              1,
            );
            if (added) {
              // Retrieve item details to ensure emoji from /gen is reused
              // Note: Special ingredients are stored as "ingredient" type in inventory
              // but we need to get details from specialIngredients table
              const details = await getItemDetails("ingredient", randomSpecialIngredient.id);
              console.log(`[Invtools:GiveRandom] Retrieved details for special ingredient:`, {
                specialIngredientId: randomSpecialIngredient.id,
                detailsFound: !!details,
                detailsName: details?.name,
              });
              if (!details) {
                console.error(`[Invtools:GiveRandom] WARNING: Special ingredient ${randomSpecialIngredient.id} was added to inventory but getItemDetails returned null!`);
              }
              givenItems.push({
                type: "Special Ingredient",
                details,
              });
            } else {
              // Check if inventory is full by checking current user state
              const currentUser = await getOrCreateUser(user.discordId);
              const currentInventory = parseInventory(currentUser.inventory);
              if (currentInventory.length >= currentUser.maxInventorySlots) {
                inventoryFull = true;
              }
            }
          }
        }
      }
    }

    console.log(`[Invtools:GiveRandom] Final givenItems count: ${givenItems.length}`);
    console.log(`[Invtools:GiveRandom] givenItems:`, givenItems.map(item => ({
      type: item.type,
      name: item.details?.name || 'null',
      id: item.details?.id || 'null',
    })));

    // Get current user state to show inventory status
    const currentUser = await getOrCreateUser(user.discordId);
    const currentInventory = parseInventory(currentUser.inventory);
    const inventoryUsage = `${currentInventory.length}/${currentUser.maxInventorySlots}`;

    const embed = new EmbedBuilder()
      .setTitle("🎁 Random Items Given")
      .setColor(givenItems.length > 0 ? 0x00ff00 : 0xff0000)
      .setTimestamp();

    // Determine the appropriate message based on the situation
    if (givenItems.length > 0) {
      embed.setDescription(`Successfully added ${givenItems.length} item(s) to your inventory!`);
      if (inventoryFull && currentInventory.length >= currentUser.maxInventorySlots) {
        embed.addFields({
          name: "⚠️ Inventory Full",
          value: `Your inventory is full (${inventoryUsage} slots). Some items could not be added. Use \`/inventory\` to manage your items.`,
          inline: false,
        });
      }
    } else if (inventoryFull) {
      embed.setDescription(
        `❌ Your inventory is full (${inventoryUsage} slots). Cannot add any more items.\n\nUse \`/inventory\` to view and manage your items, or \`/invtools clear\` to clear your inventory.`,
      );
    } else if (!itemsAvailable) {
      embed.setDescription(
        "❌ No items available. Use `/gen` to create items first, then use this command to randomly give them.",
      );
    } else {
      embed.setDescription(
        "❌ Failed to add items to your inventory. Please try again.",
      );
    }

    if (givenItems.length > 0) {
      const itemList = givenItems
        .map((item) => {
          const displayName = getItemDisplayName(
            item.details,
            1,
            false, // Don't show amount (we show type instead)
            true, // Format rarity
            true, // Show emoji
          );
          return `• ${displayName} (${item.type})`;
        })
        .join("\n");

      addLongField(embed, "📦 Items Added", itemList);
    }

    await interaction.editReply({ embeds: [embed] });
  } catch (error) {
    console.error("[Invtools:GiveRandom] Error:", error);
    if (error instanceof Error) {
      console.error("[Invtools:GiveRandom] Error message:", error.message);
      console.error("[Invtools:GiveRandom] Error stack:", error.stack);
    }
    try {
      await interaction.editReply({
        content: "❌ An error occurred while giving random items.",
      });
    } catch (replyError) {
      console.error("[Invtools:GiveRandom] Failed to send error reply:", replyError);
    }
  }
}
