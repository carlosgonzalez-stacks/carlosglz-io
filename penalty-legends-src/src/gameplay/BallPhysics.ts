import type { GoalRect } from '../config/GoalConfig';

export interface Vec2 {
  x: number;
  y: number;
}

export type MissType = 'none' | 'high' | 'wide';

export interface ShotTrajectory {
  start: Vec2;
  aim: Vec2;
  landing: Vec2;
  power: number;
  precision: number;
  flightDurationMs: number;
  startScale: number;
  endScale: number;
  missType: MissType;
}

/** Rough gaussian-ish random in [-1, 1] using the irwin-hall trick. */
function jitter(): number {
  return (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
}

/**
 * Precision peaks around a "sweet spot" power (~0.72). Too little power is
 * lazy and inaccurate; too much power sacrifices control.
 */
export function precisionForPower(power: number): number {
  const sweetSpot = 0.72;
  const dist = Math.abs(power - sweetSpot);
  const spread = power > sweetSpot ? 0.42 : 0.68;
  const p = 1 - dist / spread;
  return Phaser_clamp(p, 0.18, 1);
}

function Phaser_clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

export function computeTrajectory(start: Vec2, aim: Vec2, power: number, goal: GoalRect): ShotTrajectory {
  const precision = precisionForPower(power);
  const offsetMax = goal.width * (0.045 + (1 - precision) * 0.42);
  const offsetX = jitter() * offsetMax;
  let offsetY = jitter() * offsetMax * 0.65;

  // Excess power drags the shot upward (classic "skied it" miss).
  if (power > 0.9) {
    offsetY -= (power - 0.9) * goal.height * 2.2;
  }

  const landingRaw: Vec2 = { x: aim.x + offsetX, y: aim.y + offsetY };

  let missType: MissType = 'none';
  if (landingRaw.y < goal.top - goal.height * 0.06) {
    missType = 'high';
  } else if (
    landingRaw.x < goal.left - goal.width * 0.14 ||
    landingRaw.x > goal.right + goal.width * 0.14
  ) {
    missType = 'wide';
  }

  const landing: Vec2 = {
    x: Phaser_clamp(landingRaw.x, goal.left - goal.width * 0.16, goal.right + goal.width * 0.16),
    y: Phaser_clamp(landingRaw.y, goal.top - goal.height * 0.22, goal.bottom + goal.height * 0.1),
  };

  const flightDurationMs = 900 - power * 480;

  return {
    start,
    aim,
    landing,
    power,
    precision,
    flightDurationMs,
    startScale: 1,
    endScale: 0.4,
    missType,
  };
}

/** Distance in px from the nearest goalpost line — used for the "off the post" check. */
export function postProximity(landing: Vec2, goal: GoalRect): number {
  const distLeft = Math.abs(landing.x - goal.left);
  const distRight = Math.abs(landing.x - goal.right);
  const distTop = Math.abs(landing.y - goal.top);
  const withinVertical = landing.y >= goal.top - 4 && landing.y <= goal.bottom + 4;
  const withinHorizontal = landing.x >= goal.left - 4 && landing.x <= goal.right + 4;
  let min = Infinity;
  if (withinVertical) min = Math.min(min, distLeft, distRight);
  if (withinHorizontal) min = Math.min(min, distTop);
  return min;
}
