import type {
  AffectedStat,
  EffectOperation,
  EffectTrigger,
} from "./types.js";
import {
  allowsOverTime,
  isOperationSupported,
  isTriggerSupported,
} from "./config.js";

// Validation result
export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Validate an effect operation for a stat
export function validateOperation(
  operation: EffectOperation,
  stat: AffectedStat,
): ValidationResult {
  const errors: string[] = [];

  if (!isOperationSupported(stat, operation)) {
    errors.push(
      `Operation '${operation}' is not supported for stat '${stat}'`,
    );
  }

  // Check if over_time operations require tickInterval
  if (
    (operation === "add_over_time" || operation === "subtract_over_time") &&
    !allowsOverTime(stat)
  ) {
    errors.push(
      `Stat '${stat}' does not support over_time operations`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate a trigger for a stat
export function validateTrigger(
  trigger: EffectTrigger,
  stat: AffectedStat,
): ValidationResult {
  const errors: string[] = [];

  if (!isTriggerSupported(stat, trigger)) {
    errors.push(
      `Trigger '${trigger}' is not supported for stat '${stat}'`,
    );
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate effect value based on operation type
export function validateEffectValue(
  operation: EffectOperation,
  value: number,
): ValidationResult {
  const errors: string[] = [];

  switch (operation) {
    case "multiply":
      if (value <= 0) {
        errors.push("Multiply operation requires value > 0");
      }
      if (value > 10) {
        errors.push("Multiply operation value should be <= 10 (sanity check)");
      }
      break;
    case "add":
    case "subtract":
      // No specific limits, but warn on extreme values
      if (Math.abs(value) > 1000000) {
        errors.push("Add/subtract value seems unreasonably large");
      }
      break;
    case "set":
      if (value < 0) {
        errors.push("Set operation value should be >= 0");
      }
      break;
    case "add_over_time":
    case "subtract_over_time":
      if (value <= 0) {
        errors.push("Over_time operations require value > 0");
      }
      break;
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate tickInterval for over_time and periodic effects
export function validateTickInterval(
  operation: EffectOperation,
  trigger: EffectTrigger,
  tickInterval?: number,
): ValidationResult {
  const errors: string[] = [];

  const needsTickInterval =
    operation === "add_over_time" ||
    operation === "subtract_over_time" ||
    trigger === "periodic";

  if (needsTickInterval) {
    if (!tickInterval || tickInterval <= 0) {
      errors.push(
        `Operation '${operation}' with trigger '${trigger}' requires tickInterval > 0`,
      );
    } else if (tickInterval < 1) {
      errors.push("tickInterval must be at least 1 second");
    } else if (tickInterval > 86400) {
      errors.push("tickInterval should not exceed 24 hours (86400 seconds)");
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Validate duration
export function validateDuration(
  duration: number,
  operation: EffectOperation,
): ValidationResult {
  const errors: string[] = [];

  if (duration < 0) {
    errors.push("Duration cannot be negative");
  }

  // Permanent effects (duration = 0) should be rare
  if (duration === 0 && operation !== "set") {
    // Allow permanent effects but warn
    // In practice, only ultra-rare effects should be permanent
  }

  // Maximum duration: 7 days
  if (duration > 604800) {
    errors.push("Duration should not exceed 7 days (604800 seconds)");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Comprehensive effect validation
export interface EffectValidationInput {
  stat: AffectedStat;
  operation: EffectOperation;
  trigger: EffectTrigger;
  value: number;
  duration: number;
  tickInterval?: number;
}

export function validateEffect(
  effect: EffectValidationInput,
): ValidationResult {
  const errors: string[] = [];

  // Validate operation
  const opResult = validateOperation(effect.operation, effect.stat);
  if (!opResult.valid) {
    errors.push(...opResult.errors);
  }

  // Validate trigger
  const triggerResult = validateTrigger(effect.trigger, effect.stat);
  if (!triggerResult.valid) {
    errors.push(...triggerResult.errors);
  }

  // Validate value
  const valueResult = validateEffectValue(effect.operation, effect.value);
  if (!valueResult.valid) {
    errors.push(...valueResult.errors);
  }

  // Validate tickInterval
  const tickResult = validateTickInterval(
    effect.operation,
    effect.trigger,
    effect.tickInterval,
  );
  if (!tickResult.valid) {
    errors.push(...tickResult.errors);
  }

  // Validate duration
  const durationResult = validateDuration(effect.duration, effect.operation);
  if (!durationResult.valid) {
    errors.push(...durationResult.errors);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// Check if effect modifies slot limits (should be prevented)
export function modifiesSlotLimits(
  stat: AffectedStat,
): boolean {
  const slotStats: AffectedStat[] = [
    // These should be grimoire-only
    // Note: These aren't in AffectedStat type, but check anyway
  ];

  return slotStats.includes(stat);
}
