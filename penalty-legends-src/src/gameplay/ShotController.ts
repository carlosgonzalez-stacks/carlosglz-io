import type { GoalRect } from '../config/GoalConfig';
import type { DifficultyParams } from '../config/DifficultyConfig';
import { computeTrajectory, type ShotTrajectory, type Vec2 } from './BallPhysics';
import { decideKeeper, resolveShot, type ShotResolution } from './GoalkeeperAI';
import { isPerfectShot } from './GoalCollision';

export interface ShotPlan {
  trajectory: ShotTrajectory;
  resolution: ShotResolution;
  perfect: boolean;
  special: boolean;
}

export function planShot(
  start: Vec2,
  aim: Vec2,
  power: number,
  goal: GoalRect,
  keeperHome: Vec2,
  config: DifficultyParams,
  special: boolean,
): ShotPlan {
  const trajectory = computeTrajectory(start, aim, power, goal);
  const decision = decideKeeper(trajectory.landing, goal, config);
  const resolution = resolveShot(trajectory, decision, goal, keeperHome, config);
  const perfect = isPerfectShot(trajectory, goal) && resolution.outcome === 'goal';

  return { trajectory, resolution, perfect, special };
}
