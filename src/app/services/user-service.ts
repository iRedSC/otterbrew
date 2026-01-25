import { eq } from "drizzle-orm";
import { db } from "@db";
import { users, type User } from "../db/schema/users.js";

export async function getOrCreateUser(
  discordId: string,
): Promise<User> {
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.discordId, discordId))
    .limit(1);

  if (existingUser[0]) {
    return existingUser[0];
  }

  const newUser = await db
    .insert(users)
    .values({ discordId })
    .returning();

  return newUser[0]!;
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
