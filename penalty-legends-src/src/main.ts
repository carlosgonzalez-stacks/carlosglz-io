import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS } from './config/GameConfig';
import { BootScene } from './game/BootScene';
import { HomeScene } from './game/HomeScene';
import { DifficultyScene } from './game/DifficultyScene';
import { HowToPlayScene } from './game/HowToPlayScene';
import { SettingsScene } from './game/SettingsScene';
import { PenaltyScene } from './game/PenaltyScene';
import { ResultsScene } from './game/ResultsScene';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'app',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.ink,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: { width: 640, height: 360 },
    max: { width: GAME_WIDTH, height: GAME_HEIGHT },
  },
  input: {
    keyboard: true,
    mouse: true,
  },
  scene: [BootScene, HomeScene, DifficultyScene, HowToPlayScene, SettingsScene, PenaltyScene, ResultsScene],
});
