import type { ActiveEffect } from "./types.js";

// Format duration for display
export function formatDuration(expiresAt: number | null): string {
  if (expiresAt === null) {
    return ""; // Permanent effect, no duration shown
  }

  const now = Date.now();
  const remainingSeconds = Math.max(0, Math.floor((expiresAt - now) / 1000));

  if (remainingSeconds === 0) {
    return ""; // Expired
  }

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;

  return `(${minutes}:${seconds.toString().padStart(2, "0")})`;
}

// Format effect for display
export function formatEffect(effect: ActiveEffect): string {
  const duration = formatDuration(effect.expiresAt);
  const durationStr = duration ? ` ${duration}` : "";

  return `${effect.displayName}${durationStr}`;
}

// Get effect description based on operation and trigger
export function getEffectDescription(effect: ActiveEffect): string {
  const { operation, trigger, value, stat } = effect;

  // Build operation description
  let opDesc = "";
  switch (operation) {
    case "multiply":
      opDesc = `${value}x`;
      break;
    case "add":
      opDesc = `+${value}`;
      break;
    case "subtract":
      opDesc = `-${value}`;
      break;
    case "set":
      opDesc = `=${value}`;
      break;
    case "add_over_time":
      opDesc = `+${value}/${formatTickInterval(effect.tickInterval)}`;
      break;
    case "subtract_over_time":
      opDesc = `-${value}/${formatTickInterval(effect.tickInterval)}`;
      break;
  }

  // Build trigger description
  let triggerDesc = "";
  switch (trigger) {
    case "value":
      triggerDesc = "";
      break;
    case "change_good":
      triggerDesc = " gain";
      break;
    case "change_bad":
      triggerDesc = " loss";
      break;
    case "brewing":
      triggerDesc = " while brewing";
      break;
    case "adventure":
      triggerDesc = " from adventures";
      break;
    case "bazaar":
      triggerDesc = " in bazaar";
      break;
    case "combat":
      triggerDesc = " in combat";
      break;
    case "harvesting":
      triggerDesc = " when harvesting";
      break;
    case "shopping":
      triggerDesc = " when shopping";
      break;
    case "on_consume":
      triggerDesc = " on consume";
      break;
    case "on_craft":
      triggerDesc = " on craft";
      break;
    case "periodic":
      triggerDesc = ` every ${formatTickInterval(effect.tickInterval)}`;
      break;
  }

  // Build stat description
  const statDesc = formatStatName(stat);

  return `${opDesc} ${statDesc}${triggerDesc}`;
}

// Format stat name for display
function formatStatName(stat: string): string {
  // Convert snake_case to Title Case
  return stat
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

// Format tick interval for display
function formatTickInterval(tickInterval?: number): string {
  if (!tickInterval) {
    return "tick";
  }

  if (tickInterval < 60) {
    return `${tickInterval}s`;
  } else if (tickInterval < 3600) {
    const minutes = Math.floor(tickInterval / 60);
    return `${minutes}min`;
  } else {
    const hours = Math.floor(tickInterval / 3600);
    return `${hours}h`;
  }
}

// Format a list of effects for display
export function formatEffectsList(effects: ActiveEffect[]): string {
  if (effects.length === 0) {
    return "No active effects";
  }

  return effects.map((effect) => formatEffect(effect)).join("\n");
}

// Group effects by stat for display
export function groupEffectsByStat(
  effects: ActiveEffect[],
): Record<string, ActiveEffect[]> {
  const grouped: Record<string, ActiveEffect[]> = {};

  for (const effect of effects) {
    if (!grouped[effect.stat]) {
      grouped[effect.stat] = [];
    }
    grouped[effect.stat].push(effect);
  }

  return grouped;
}
