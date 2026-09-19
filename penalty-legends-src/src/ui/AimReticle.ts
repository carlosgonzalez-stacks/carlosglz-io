import Phaser from 'phaser';
import type { GoalRect } from '../config/GoalConfig';

export class AimReticle {
  readonly container: Phaser.GameObjects.Container;
  private ring: Phaser.GameObjects.Graphics;
  private cross: Phaser.GameObjects.Graphics;
  private bounds: GoalRect;
  private point: { x: number; y: number };
  private locked = false;

  constructor(scene: Phaser.Scene, bounds: GoalRect) {
    this.bounds = bounds;
    this.point = { x: bounds.centerX, y: bounds.centerY };

    this.container = scene.add.container(this.point.x, this.point.y);

    this.ring = scene.add.graphics();
    this.ring.lineStyle(3, 0xffcb05, 0.95);
    this.ring.strokeCircle(0, 0, 30);
    this.ring.lineStyle(2, 0xffffff, 0.6);
    this.ring.strokeCircle(0, 0, 42);
    this.container.add(this.ring);

    this.cross = scene.add.graphics();
    this.cross.lineStyle(3, 0xffffff, 0.9);
    this.cross.lineBetween(-16, 0, -6, 0);
    this.cross.lineBetween(6, 0, 16, 0);
    this.cross.lineBetween(0, -16, 0, -6);
    this.cross.lineBetween(0, 6, 0, 16);
    this.container.add(this.cross);

    scene.tweens.add({
      targets: this.ring,
      angle: 360,
      duration: 4000,
      repeat: -1,
      ease: 'Linear',
    });
    scene.tweens.add({
      targets: this.container,
      scale: 1.12,
      duration: 420,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });

    scene.input.on('pointermove', this.onPointerMove, this);
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (this.locked) return;
    const marginX = this.bounds.width * 0.12;
    const marginTop = this.bounds.height * 0.2;
    const marginBottom = this.bounds.height * 0.08;
    const x = Phaser.Math.Clamp(pointer.x, this.bounds.left - marginX, this.bounds.right + marginX);
    const y = Phaser.Math.Clamp(pointer.y, this.bounds.top - marginTop, this.bounds.bottom + marginBottom);
    this.point = { x, y };
    this.container.setPosition(x, y);
  }

  updateBounds(bounds: GoalRect) {
    this.bounds = bounds;
  }

  getAim() {
    return { ...this.point };
  }

  setLocked(locked: boolean) {
    this.locked = locked;
  }

  flashCharge(power: number) {
    const scale = 1 + power * 0.5;
    this.ring.setScale(scale);
  }

  destroy(scene: Phaser.Scene) {
    scene.input.off('pointermove', this.onPointerMove, this);
    this.container.destroy();
  }
}
