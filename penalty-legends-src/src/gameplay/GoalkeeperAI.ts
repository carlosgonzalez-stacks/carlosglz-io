import type { GoalRect } from '../config/GoalConfig';
import type { DifficultyParams } from '../config/DifficultyConfig';
import { type ShotTrajectory, type Vec2, postProximity } from './BallPhysics';

export type DiveDir = 'left' | 'center' | 'right';
export type DiveHt = 'low' | 'mid' | 'high';

export interface KeeperDecision {
  reactionDelayMs: number;
  direction: DiveDir;
  height: DiveHt;
  targetPoint: Vec2;
  correctRead: boolean;
}

export type ShotOutcome = 'goal' | 'save' | 'punch' | 'post' | 'miss';

export interface ShotResolution {
  outcome: ShotOutcome;
  decision: KeeperDecision;
  distanceToBall: number;
  effectiveReach: number;
}

const DIVE_SPEED_GOAL_WIDTHS_PER_SEC = 2.5;
const POST_THRESHOLD_FACTOR = 0.028; // fraction of goal width counted as "clipped the post"

function zoneX(dir: DiveDir, goal: GoalRect): number {
  const f = dir === 'left' ? 0.14 : dir === 'right' ? 0.86 : 0.5;
  return goal.left + f * goal.width;
}

function zoneY(ht: DiveHt, goal: GoalRect): number {
  const f = ht === 'high' ? 0.16 : ht === 'low' ? 0.88 : 0.52;
  return goal.top + f * goal.height;
}

function classifyLanding(landing: Vec2, goal: GoalRect): { dir: DiveDir; ht: DiveHt } {
  const relX = (landing.x - goal.left) / goal.width;
  const relY = (landing.y - goal.top) / goal.height;
  const dir: DiveDir = relX < 0.4 ? 'left' : relX > 0.6 ? 'right' : 'center';
  const ht: DiveHt = relY < 0.36 ? 'high' : relY > 0.7 ? 'low' : 'mid';
  return { dir, ht };
}

function randomOf<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function decideKeeper(
  landing: Vec2,
  goal: GoalRect,
  config: DifficultyParams,
): KeeperDecision {
  const reactionDelayMs =
    config.goalkeeperReactionMin +
    Math.random() * (config.goalkeeperReactionMax - config.goalkeeperReactionMin);

  const correctRead = Math.random() < config.predictionAccuracy;
  let direction: DiveDir;
  let height: DiveHt;

  if (correctRead) {
    const real = classifyLanding(landing, goal);
    direction = real.dir;
    height = real.ht;
  } else {
    direction = randomOf<DiveDir>(['left', 'center', 'right']);
    height = randomOf<DiveHt>(['low', 'mid', 'high']);
  }

  return {
    reactionDelayMs,
    direction,
    height,
    targetPoint: { x: zoneX(direction, goal), y: zoneY(height, goal) },
    correctRead,
  };
}

export function resolveShot(
  trajectory: ShotTrajectory,
  decision: KeeperDecision,
  goal: GoalRect,
  keeperHome: Vec2,
  config: DifficultyParams,
): ShotResolution {
  if (trajectory.missType !== 'none') {
    return { outcome: 'miss', decision, distanceToBall: Infinity, effectiveReach: 0 };
  }

  const postGap = postProximity(trajectory.landing, goal);
  if (postGap < goal.width * POST_THRESHOLD_FACTOR) {
    return { outcome: 'post', decision, distanceToBall: postGap, effectiveReach: 0 };
  }

  const diveDist = Math.hypot(
    decision.targetPoint.x - keeperHome.x,
    decision.targetPoint.y - keeperHome.y,
  );
  const diveTravelMs =
    ((diveDist / goal.width) / (DIVE_SPEED_GOAL_WIDTHS_PER_SEC * config.goalkeeperSpeed)) * 1000;

  const totalKeeperMs = decision.reactionDelayMs + diveTravelMs;
  const marginMs = trajectory.flightDurationMs - totalKeeperMs;
  const lateFactor = marginMs >= 0 ? 1 : Math.max(0, 1 + marginMs / 220);

  const reachBase = goal.height * 0.36 * config.goalkeeperReach;
  const powerPenalty = 1 - trajectory.power * config.powerPenaltyFactor;
  const effectiveReach = reachBase * powerPenalty * lateFactor;

  const distanceToBall = Math.hypot(
    decision.targetPoint.x - trajectory.landing.x,
    decision.targetPoint.y - trajectory.landing.y,
  );

  let outcome: ShotOutcome;
  if (distanceToBall <= effectiveReach * 0.52) outcome = 'save';
  else if (distanceToBall <= effectiveReach) outcome = 'punch';
  else outcome = 'goal';

  return { outcome, decision, distanceToBall, effectiveReach };
}
