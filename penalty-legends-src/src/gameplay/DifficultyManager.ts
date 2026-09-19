import type { Difficulty } from '../config/GameConfig';
import { DIFFICULTY_CONFIG, type DifficultyParams } from '../config/DifficultyConfig';

class DifficultyManagerImpl {
  private current: Difficulty = 'medium';

  set(difficulty: Difficulty) {
    this.current = difficulty;
  }

  get(): Difficulty {
    return this.current;
  }

  params(): DifficultyParams {
    return DIFFICULTY_CONFIG[this.current];
  }
}

export const DifficultyManager = new DifficultyManagerImpl();
