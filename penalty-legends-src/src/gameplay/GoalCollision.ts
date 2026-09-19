import type { GoalRect } from '../config/GoalConfig';
import type { ShotTrajectory } from './BallPhysics';

/**
 * A shot qualifies as a cinematic "PERFECT SHOT" when the player found the
 * sweet spot on power, kept precision high, and picked a hard-to-reach
 * corner of the goal — the anime "everything clicked" moment.
 */
export function isPerfectShot(trajectory: ShotTrajectory, goal: GoalRect): boolean {
  if (trajectory.missType !== 'none') return false;
  const inSweetSpot = trajectory.power >= 0.62 && trajectory.power <= 0.9;
  const highPrecision = trajectory.precision >= 0.78;
  const relX = (trajectory.landing.x - goal.left) / goal.width;
  const relY = (trajectory.landing.y - goal.top) / goal.height;
  const cornerness = Math.max(Math.abs(relX - 0.5) * 2, relY < 0.4 ? (0.4 - relY) / 0.4 : 0);
  const isCorner = cornerness > 0.55;
  return inSweetSpot && highPrecision && isCorner;
}

export function isWithinFrame(point: { x: number; y: number }, goal: GoalRect, margin = 0): boolean {
  return (
    point.x >= goal.left - margin &&
    point.x <= goal.right + margin &&
    point.y >= goal.top - margin &&
    point.y <= goal.bottom + margin
  );
}
