import Phaser from 'phaser';
import { BACKGROUND_KEY } from '../config/AssetManifest';
import { GAME_WIDTH, GAME_HEIGHT } from '../config/GameConfig';
import { resolveGoalRect, type GoalRect } from '../config/GoalConfig';

/** Adds the stadium photo scaled/cropped to cover the canvas, like CSS background-size:cover. */
export function addStadiumBackground(scene: Phaser.Scene): { image: Phaser.GameObjects.Image; goal: GoalRect } {
  const image = scene.add.image(GAME_WIDTH / 2, GAME_HEIGHT / 2, BACKGROUND_KEY);
  const tex = image.width;
  const texH = image.height;
  const scale = Math.max(GAME_WIDTH / tex, GAME_HEIGHT / texH);
  image.setScale(scale);
  image.setDepth(-10);

  const goal = resolveGoalRect({
    x: image.x,
    y: image.y,
    displayWidth: image.displayWidth,
    displayHeight: image.displayHeight,
  });

  return { image, goal };
}
