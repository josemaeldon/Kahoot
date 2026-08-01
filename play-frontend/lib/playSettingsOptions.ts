export const PLAY_TIME_OPTIONS = [
  5, 10, 15, 20, 30, 45, 60, 90, 120, 180, 300,
] as const;

export type PlayTime = (typeof PLAY_TIME_OPTIONS)[number];
