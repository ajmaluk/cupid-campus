export const vibrate = (pattern: number | number[] = 10) => {
  if (typeof navigator !== 'undefined' && navigator.vibrate) {
    navigator.vibrate(pattern);
  }
};

export const HAPTIC_PATTERNS = {
  SOFT: 10,
  MEDIUM: 40,
  HEAVY: [50, 50, 50],
  SUCCESS: [10, 30, 10],
  ERROR: [50, 100, 50]
};
