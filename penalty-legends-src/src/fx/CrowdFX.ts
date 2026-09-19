import Phaser from 'phaser';

/**
 * Cheap "stadium is alive" layer: a handful of camera-flash pops and waving
 * flag wedges over the crowd area of the background photo. Deliberately
 * capped in count — no per-fan sprites, just a few looping tweened shapes.
 */
export class CrowdFX {
  private scene: Phaser.Scene;
  private layer: Phaser.GameObjects.Container;
  private flashTimer?: Phaser.Time.TimerEvent;

  constructor(scene: Phaser.Scene, standsTopY: number, standsBottomY: number, width: number, originX: number) {
    this.scene = scene;
    this.layer = scene.add.container(0, 0);
    this.layer.setDepth(5);

    // Waving flag wedges along the top of the stands.
    const flagCount = 8;
    for (let i = 0; i < flagCount; i++) {
      const fx = originX + (width / flagCount) * i + width * 0.06 + (Math.random() - 0.5) * 40;
      const fy = standsTopY + 10 + Math.random() * (standsBottomY - standsTopY) * 0.5;
      const g = scene.add.graphics();
      const color = Math.random() > 0.5 ? 0x0a7a3d : 0xc8102e;
      g.fillStyle(color, 0.85);
      g.fillTriangle(0, 0, 22, -6, 0, -14);
      g.setPosition(fx, fy);
      this.layer.add(g);
      scene.tweens.add({
        targets: g,
        angle: { from: -8, to: 10 },
        duration: 700 + Math.random() * 500,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut',
        delay: Math.random() * 400,
      });
    }

    this.flashTimer = scene.time.addEvent({
      delay: 260,
      loop: true,
      callback: () => this.popFlash(standsTopY, standsBottomY, width, originX),
    });
  }

  private popFlash(topY: number, bottomY: number, width: number, originX: number) {
    if (Math.random() > 0.5) return;
    const x = originX + Math.random() * width;
    const y = topY + Math.random() * (bottomY - topY);
    const dot = this.scene.add.circle(x, y, 3 + Math.random() * 2, 0xffffff, 0.9);
    dot.setDepth(6);
    this.scene.tweens.add({
      targets: dot,
      alpha: 0,
      scale: 2.4,
      duration: 220,
      onComplete: () => dot.destroy(),
    });
  }

  destroy() {
    this.flashTimer?.remove();
    this.layer.destroy();
  }
}
