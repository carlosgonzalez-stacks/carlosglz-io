/**
 * Goal-mouth anchor rectangle expressed as fractions (0..1) of the stadium
 * background image (1672x941). Measured by hand against the source photo so
 * gameplay geometry always lines up with the goalposts in the art, no matter
 * what resolution the canvas renders at.
 */
export const GOAL_RELATIVE = {
  left: 0.239,
  right: 0.84,
  top: 0.271,
  bottom: 0.653,
};

export interface GoalRect {
  left: number;
  right: number;
  top: number;
  bottom: number;
  centerX: number;
  centerY: number;
  width: number;
  height: number;
}

/**
 * Resolves the goal rectangle in scene-pixel space given the on-screen
 * position/size of the background image (after Phaser's scaling/letterboxing).
 */
export function resolveGoalRect(bg: { x: number; y: number; displayWidth: number; displayHeight: number }): GoalRect {
  const originX = bg.x - bg.displayWidth / 2;
  const originY = bg.y - bg.displayHeight / 2;
  const left = originX + GOAL_RELATIVE.left * bg.displayWidth;
  const right = originX + GOAL_RELATIVE.right * bg.displayWidth;
  const top = originY + GOAL_RELATIVE.top * bg.displayHeight;
  const bottom = originY + GOAL_RELATIVE.bottom * bg.displayHeight;
  return {
    left,
    right,
    top,
    bottom,
    centerX: (left + right) / 2,
    centerY: (top + bottom) / 2,
    width: right - left,
    height: bottom - top,
  };
}

/** 3x3 reference grid used internally for AI targeting language, never a hard shot limiter. */
export type GoalZoneX = 'left' | 'center' | 'right';
export type GoalZoneY = 'top' | 'middle' | 'bottom';

export function zoneToPoint(goal: GoalRect, x: GoalZoneX, y: GoalZoneY) {
  const xf = x === 'left' ? 0.17 : x === 'center' ? 0.5 : 0.83;
  const yf = y === 'top' ? 0.18 : y === 'middle' ? 0.5 : 0.85;
  return {
    x: goal.left + xf * goal.width,
    y: goal.top + yf * goal.height,
  };
}
