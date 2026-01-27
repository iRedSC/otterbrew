// Types
export type {
  ActiveEffect,
  AffectedStat,
  EffectConfig,
  EffectOperation,
  EffectTrigger,
  StatDirection,
  TriggerCategory,
} from "./types.js";

export {
  getTriggerCategory,
  isContextTrigger,
  isEventTrigger,
  isStatTrigger,
} from "./types.js";

// Configuration
export {
  allowsOverTime,
  getStatConfig,
  isOperationSupported,
  isTriggerSupported,
  statEffectConfigs,
} from "./config.js";

// Validation
export type { EffectValidationInput, ValidationResult } from "./validation.js";

export {
  modifiesSlotLimits,
  validateDuration,
  validateEffect,
  validateEffectValue,
  validateOperation,
  validateTickInterval,
  validateTrigger,
} from "./validation.js";

// Application
export {
  addEffect,
  applyEffects,
  calculateOverTimeEffects,
  calculatePeriodicEffects,
  determineTrigger,
  expireOldEffects,
  getActiveEffects,
  modifyUserStat,
  removeEffect,
  triggerEventEffects,
} from "./application.js";

// Display
export {
  formatDuration,
  formatEffect,
  formatEffectsList,
  getEffectDescription,
  groupEffectsByStat,
} from "./display.js";
