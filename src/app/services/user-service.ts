import { eq } from "drizzle-orm";
import { db } from "@db";
import { users, type User } from "../db/schema/users.js";

export async function getOrCreateUser(
  discordId: string,
): Promise<User> {
  console.log(`[UserService] getOrCreateUser called for discordId: ${discordId}`);
  try {
    console.log(`[UserService] Querying database for existing user...`);
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.discordId, discordId))
      .limit(1);
    console.log(`[UserService] Query completed, found ${existingUser.length} user(s)`);

    if (existingUser[0]) {
      console.log(`[UserService] Returning existing user:`, {
        discordId: existingUser[0].discordId,
        gold: existingUser[0].gold,
      });
      return existingUser[0];
    }

    console.log(`[UserService] User not found, creating new user...`);
    const newUser = await db
      .insert(users)
      .values({ discordId })
      .returning();
    console.log(`[UserService] Insert completed, returned ${newUser.length} user(s)`);

    if (!newUser[0]) {
      console.error(`[UserService] Failed to create user - no user returned`);
      throw new Error("Failed to create user - no user returned");
    }

    console.log(`[UserService] Returning new user:`, {
      discordId: newUser[0].discordId,
      gold: newUser[0].gold,
    });
    return newUser[0];
  } catch (error) {
    console.error("[UserService] Error in getOrCreateUser:", error);
    if (error instanceof Error) {
      console.error("[UserService] Error message:", error.message);
      console.error("[UserService] Error stack:", error.stack);
    }
    throw error;
  }
}

export async function updateUserGold(
  discordId: string,
  amount: number,
): Promise<User> {
  const updated = await db
    .update(users)
    .set({
      gold: amount,
      updatedAt: new Date(),
    })
    .where(eq(users.discordId, discordId))
    .returning();

  return updated[0]!;
}

export async function getUserStats(discordId: string): Promise<User | null> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  return user[0] ?? null;
}
