export const XP_PER_LEVEL = 200;
export const MAX_PROMPT_LENGTH = 4000;
export const MIN_PROMPT_LENGTH = 1;
export const SYNC_INTERVAL_MS = 30000;
export const SIGN_OUT_DEBOUNCE_MS = 5000;
export const AI_RATE_LIMITS = {
  textGeneration: { maxRequests: 10, windowMs: 60000 },
  imageGeneration: { maxRequests: 5, windowMs: 60000 },
} as const;
