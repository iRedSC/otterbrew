import { eq } from "drizzle-orm";
import { db } from "@db";
import { users } from "../../db/schema/users.js";
import type {
  ActiveEffect,
  AffectedStat,
  EffectOperation,
  EffectTrigger,
} from "./types.js";
import { getStatConfig, isTriggerSupported } from "./config.js";
import { isStatTrigger } from "./types.js";

// Get active effects for a user, filtered by stat and trigger
export async function getActiveEffects(
  userId: string,
  stat: AffectedStat,
  trigger: EffectTrigger,
  context?: string,
): Promise<ActiveEffect[]> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.discordId, userId))
    .limit(1);

  if (!user[0] || !user[0].activeEffects) {
    return [];
  }

  const allEffects: ActiveEffect[] = user[0].activeEffects as ActiveEffect[];
  const now = Date.now();

  // Filter effects
  return allEffects.filter((effect) => {
    // Check if expired
    if (effect.expiresAt !== null && effect.expiresAt < now) {
      return false;
    }

    // Must match stat
    if (effect.stat !== stat) {
      return false;
    }

    // Must match trigger
    if (effect.trigger !== trigger) {
      return false;
    }

    // For context triggers, also check if context matches
    if (
      (trigger === "brewing" ||
        trigger === "adventure" ||
        trigger === "bazaar" ||
        trigger === "combat" ||
        trigger === "harvesting" ||
        trigger === "shopping") &&
      context !== trigger
    ) {
      return false;
    }

    return true;
  });
}

// Determine trigger type based on stat's goodDirection and change amount
export function determineTrigger(
  stat: AffectedStat,
  changeAmount: number,
): EffectTrigger {
  if (changeAmount === 0) {
    return "value";
  }

  const config = getStatConfig(stat);
  const isGoodDirection =
    (changeAmount > 0 && config.goodDirection === "increase") ||
    (changeAmount < 0 && config.goodDirection === "decrease");

  return isGoodDirection ? "change_good" : "change_bad";
}

// Apply effects to a base value
export function applyEffects(
  baseValue: number,
  effects: ActiveEffect[],
): number {
  if (effects.length === 0) {
    return baseValue;
  }

  let result = baseValue;

  // Group effects by operation type
  const multiplyEffects = effects.filter((e) => e.operation === "multiply");
  const addEffects = effects.filter((e) => e.operation === "add");
  const subtractEffects = effects.filter((e) => e.operation === "subtract");
  const setEffects = effects.filter((e) => e.operation === "set");

  // Apply in order: multiply → add → subtract → set

  // 1. Multiply (chained)
  for (const effect of multiplyEffects) {
    result *= effect.value;
  }

  // 2. Add (summed)
  const addSum = addEffects.reduce((sum, effect) => sum + effect.value, 0);
  result += addSum;

  // 3. Subtract (summed)
  const subtractSum = subtractEffects.reduce(
    (sum, effect) => sum + effect.value,
    0,
  );
  result -= subtractSum;

  // 4. Set (overrides all previous)
  if (setEffects.length > 0) {
    result = setEffects[0]!.value; // Use first set effect
  }

  return result;
}

// Calculate over-time effects for a stat
export async function calculateOverTimeEffects(
  userId: string,
  stat: AffectedStat,
): Promise<number> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.discordId, userId))
    .limit(1);

  if (!user[0] || !user[0].activeEffects) {
    return 0;
  }

  const allEffects: ActiveEffect[] = user[0].activeEffects as ActiveEffect[];
  const now = Date.now();
  let totalChange = 0;

  for (const effect of allEffects) {
    // Check if expired
    if (effect.expiresAt !== null && effect.expiresAt < now) {
      continue;
    }

    // Must match stat
    if (effect.stat !== stat) {
      continue;
    }

    // Must be over_time operation
    if (
      effect.operation !== "add_over_time" &&
      effect.operation !== "subtract_over_time"
    ) {
      continue;
    }

    // Must have tickInterval
    if (!effect.tickInterval) {
      continue;
    }

    // Calculate elapsed ticks
    const lastTickAt = effect.lastTickAt ?? effect.appliedAt;
    const elapsedSeconds = (now - lastTickAt) / 1000;
    const ticks = Math.floor(elapsedSeconds / effect.tickInterval);

    if (ticks > 0) {
      const changePerTick =
        effect.operation === "add_over_time"
          ? effect.value
          : -effect.value;
      totalChange += changePerTick * ticks;

      // Update lastTickAt (will be saved later)
      effect.lastTickAt = now - (elapsedSeconds % effect.tickInterval) * 1000;
    }
  }

  return totalChange;
}

// Calculate periodic effects (not tied to a specific stat)
export async function calculatePeriodicEffects(
  userId: string,
): Promise<Record<AffectedStat, number>> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.discordId, userId))
    .limit(1);

  if (!user[0] || !user[0].activeEffects) {
    return {} as Record<AffectedStat, number>;
  }

  const allEffects: ActiveEffect[] = user[0].activeEffects as ActiveEffect[];
  const now = Date.now();
  const changes: Record<string, number> = {};

  for (const effect of allEffects) {
    // Check if expired
    if (effect.expiresAt !== null && effect.expiresAt < now) {
      continue;
    }

    // Must be periodic trigger
    if (effect.trigger !== "periodic") {
      continue;
    }

    // Must have tickInterval
    if (!effect.tickInterval) {
      continue;
    }

    // Calculate elapsed ticks
    const lastTickAt = effect.lastTickAt ?? effect.appliedAt;
    const elapsedSeconds = (now - lastTickAt) / 1000;
    const ticks = Math.floor(elapsedSeconds / effect.tickInterval);

    if (ticks > 0) {
      const stat = effect.stat;
      if (!changes[stat]) {
        changes[stat] = 0;
      }

      const changePerTick =
        effect.operation === "add_over_time"
          ? effect.value
          : -effect.value;
      changes[stat] += changePerTick * ticks;

      // Update lastTickAt
      effect.lastTickAt = now - (elapsedSeconds % effect.tickInterval) * 1000;
    }
  }

  return changes as Record<AffectedStat, number>;
}

// Expire old effects (lazy cleanup)
export async function expireOldEffects(userId: string): Promise<void> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.discordId, userId))
    .limit(1);

  if (!user[0] || !user[0].activeEffects) {
    return;
  }

  const allEffects: ActiveEffect[] = user[0].activeEffects as ActiveEffect[];
  const now = Date.now();

  const activeEffects = allEffects.filter(
    (effect) => effect.expiresAt === null || effect.expiresAt >= now,
  );

  // Only update if effects were removed
  if (activeEffects.length !== allEffects.length) {
    await db
      .update(users)
      .set({
        activeEffects: activeEffects,
        updatedAt: new Date(),
      })
      .where(eq(users.discordId, userId));
  }
}

// Add an effect to a user
export async function addEffect(
  userId: string,
  effect: ActiveEffect,
): Promise<void> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.discordId, userId))
    .limit(1);

  if (!user[0]) {
    throw new Error(`User ${userId} not found`);
  }

  const existingEffects: ActiveEffect[] =
    (user[0].activeEffects as ActiveEffect[]) ?? [];
  const updatedEffects = [...existingEffects, effect];

  await db
    .update(users)
    .set({
      activeEffects: updatedEffects,
      updatedAt: new Date(),
    })
    .where(eq(users.discordId, userId));
}

// Remove an effect from a user
export async function removeEffect(
  userId: string,
  effectId: string,
): Promise<void> {
  const user = await db
    .select()
    .from(users)
    .where(eq(users.discordId, userId))
    .limit(1);

  if (!user[0] || !user[0].activeEffects) {
    return;
  }

  const existingEffects: ActiveEffect[] =
    user[0].activeEffects as ActiveEffect[];
  const updatedEffects = existingEffects.filter(
    (effect) => effect.effectId !== effectId,
  );

  await db
    .update(users)
    .set({
      activeEffects: updatedEffects,
      updatedAt: new Date(),
    })
    .where(eq(users.discordId, userId));
}

// Trigger event-based effects
// Returns a map of stat changes that should be applied
export async function triggerEventEffects(
  userId: string,
  event: "consume" | "craft",
): Promise<Record<AffectedStat, number>> {
  const trigger: EffectTrigger = event === "consume" ? "on_consume" : "on_craft";

  const user = await db
    .select()
    .from(users)
    .where(eq(users.discordId, userId))
    .limit(1);

  if (!user[0] || !user[0].activeEffects) {
    return {} as Record<AffectedStat, number>;
  }

  const allEffects: ActiveEffect[] = user[0].activeEffects as ActiveEffect[];
  const now = Date.now();
  const changes: Record<string, number> = {};

  // Find all matching event effects
  const eventEffects = allEffects.filter(
    (effect) =>
      effect.trigger === trigger &&
      (effect.expiresAt === null || effect.expiresAt >= now),
  );

  // Collect stat changes from event effects
  for (const effect of eventEffects) {
    const stat = effect.stat;
    if (!changes[stat]) {
      changes[stat] = 0;
    }

    // Event effects apply their value directly
    if (effect.operation === "add") {
      changes[stat] += effect.value;
    } else if (effect.operation === "subtract") {
      changes[stat] -= effect.value;
    } else if (effect.operation === "multiply") {
      // For multiply, we need the current value - this is a limitation
      // In practice, event effects should use add/subtract
      changes[stat] = changes[stat] * effect.value;
    } else if (effect.operation === "set") {
      changes[stat] = effect.value;
    }
  }

  return changes as Record<AffectedStat, number>;
}

// Main function to modify a user stat with effects applied
export async function modifyUserStat(
  userId: string,
  stat: AffectedStat,
  baseValue: number,
  changeAmount: number,
  context?: string,
): Promise<number> {
  // Determine trigger based on change amount
  const statTrigger = determineTrigger(stat, changeAmount);

  // Get active effects for stat trigger
  const statEffects = await getActiveEffects(userId, stat, statTrigger, context);

  // Get active effects for context trigger (if context provided)
  let contextEffects: ActiveEffect[] = [];
  if (context && isTriggerSupported(stat, context as EffectTrigger)) {
    contextEffects = await getActiveEffects(
      userId,
      stat,
      context as EffectTrigger,
      context,
    );
  }

  // Combine all effects
  const allEffects = [...statEffects, ...contextEffects];

  // Apply effects to the change amount
  const modifiedChange = applyEffects(changeAmount, allEffects);

  // Calculate final value
  const finalValue = baseValue + modifiedChange;

  // Calculate and apply over-time effects
  const overTimeChange = await calculateOverTimeEffects(userId, stat);
  const finalValueWithOverTime = finalValue + overTimeChange;

  // Expire old effects
  await expireOldEffects(userId);

  return finalValueWithOverTime;
}
