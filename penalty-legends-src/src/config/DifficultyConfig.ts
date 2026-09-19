import type { Difficulty } from './GameConfig';

export interface DifficultyParams {
  label: string;
  tagline: string;
  /** ms before the keeper commits to a dive direction, after the shot starts */
  goalkeeperReactionMin: number;
  goalkeeperReactionMax: number;
  /** 0..1 chance the keeper reads the true target zone instead of guessing */
  predictionAccuracy: number;
  /** multiplier on keeper dive travel speed */
  goalkeeperSpeed: number;
  /** multiplier on keeper's reach radius when diving */
  goalkeeperReach: number;
  /** how much shot power degrades the keeper's chance to get there in time */
  powerPenaltyFactor: number;
}

export const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyParams> = {
  easy: {
    label: 'EASY',
    tagline: 'Learn the shot',
    goalkeeperReactionMin: 450,
    goalkeeperReactionMax: 650,
    predictionAccuracy: 0.35,
    goalkeeperSpeed: 0.7,
    goalkeeperReach: 0.8,
    powerPenaltyFactor: 0.35,
  },
  medium: {
    label: 'MEDIUM',
    tagline: 'Read the keeper',
    goalkeeperReactionMin: 250,
    goalkeeperReactionMax: 400,
    predictionAccuracy: 0.6,
    goalkeeperSpeed: 0.9,
    goalkeeperReach: 0.95,
    powerPenaltyFactor: 0.22,
  },
  hard: {
    label: 'HARD',
    tagline: 'Become a legend',
    goalkeeperReactionMin: 100,
    goalkeeperReactionMax: 250,
    predictionAccuracy: 0.82,
    goalkeeperSpeed: 1.1,
    goalkeeperReach: 1.05,
    powerPenaltyFactor: 0.12,
  },
};
