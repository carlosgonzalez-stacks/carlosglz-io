export const GAME_WIDTH = 1920;
export const GAME_HEIGHT = 1080;

export const RESOLUTIONS = [
  { width: 1920, height: 1080 },
  { width: 1440, height: 900 },
  { width: 1280, height: 720 },
] as const;

export const COLORS = {
  green: 0x0a7a3d,
  greenDark: 0x054d26,
  red: 0xc8102e,
  white: 0xffffff,
  gold: 0xffcb05,
  ink: 0x0b0f14,
  sky: 0x0e1c2b,
} as const;

export const FONT_FAMILY = "'Anton', 'Arial Narrow', 'Arial', sans-serif";
export const FONT_FAMILY_BODY = "'Rajdhani', 'Arial', sans-serif";

export type Difficulty = 'easy' | 'medium' | 'hard';

export const TOTAL_PENALTIES = 5;
export const SPECIAL_SHOT_STREAK = 3;
