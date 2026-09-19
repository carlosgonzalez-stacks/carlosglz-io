import Phaser from 'phaser';
import { COLORS, FONT_FAMILY, FONT_FAMILY_BODY } from '../config/GameConfig';

export const SKEW = 14;

/** Draws a diagonal-cut anime UI panel (a parallelogram, not a rounded SaaS rect). */
export function drawSkewedPanel(
  scene: Phaser.Scene,
  w: number,
  h: number,
  opts: { fill?: number; alpha?: number; stroke?: number; strokeWidth?: number; skew?: number } = {},
): Phaser.GameObjects.Graphics {
  const skew = opts.skew ?? SKEW;
  const g = scene.add.graphics();
  const fill = opts.fill ?? COLORS.ink;
  g.fillStyle(fill, opts.alpha ?? 0.88);
  g.beginPath();
  g.moveTo(skew, 0);
  g.lineTo(w, 0);
  g.lineTo(w - skew, h);
  g.lineTo(0, h);
  g.closePath();
  g.fillPath();
  if (opts.stroke !== undefined) {
    g.lineStyle(opts.strokeWidth ?? 3, opts.stroke, 1);
    g.strokePath();
  }
  return g;
}

export function titleText(scene: Phaser.Scene, x: number, y: number, text: string, size = 64, color = '#ffffff') {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT_FAMILY,
      fontSize: `${size}px`,
      color,
      stroke: '#0b0f14',
      strokeThickness: Math.max(4, size * 0.09),
    })
    .setOrigin(0.5);
}

export function bodyText(scene: Phaser.Scene, x: number, y: number, text: string, size = 24, color = '#e8eef2') {
  return scene.add
    .text(x, y, text, {
      fontFamily: FONT_FAMILY_BODY,
      fontSize: `${size}px`,
      color,
      fontStyle: '600',
    })
    .setOrigin(0.5);
}

export function speedLine(scene: Phaser.Scene, x: number, y: number, length: number, angle: number, color = 0xffffff) {
  const g = scene.add.graphics();
  g.lineStyle(3, color, 0.7);
  g.beginPath();
  g.moveTo(0, 0);
  g.lineTo(length, 0);
  g.strokePath();
  g.setPosition(x, y);
  g.setRotation(angle);
  return g;
}
