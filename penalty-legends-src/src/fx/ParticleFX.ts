import Phaser from 'phaser';

/** Short radial speed lines that burst outward and fade — the anime "impact" cue. */
export function speedLineBurst(
  scene: Phaser.Scene,
  x: number,
  y: number,
  count = 14,
  color = 0xffffff,
  radius = 60,
) {
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.3;
    const len = 30 + Math.random() * 40;
    const g = scene.add.graphics();
    g.lineStyle(3, color, 0.9);
    g.lineBetween(0, 0, len, 0);
    g.setPosition(x + Math.cos(angle) * radius * 0.3, y + Math.sin(angle) * radius * 0.3);
    g.setRotation(angle);
    g.setDepth(500);
    scene.tweens.add({
      targets: g,
      x: x + Math.cos(angle) * (radius + len),
      y: y + Math.sin(angle) * (radius + len),
      alpha: 0,
      duration: 260 + Math.random() * 120,
      ease: 'Cubic.easeOut',
      onComplete: () => g.destroy(),
    });
  }
}

/** Cheap particle burst for goals — small colored squares/circles, capped count. */
export function goalBurst(scene: Phaser.Scene, x: number, y: number) {
  const colors = [0x0a7a3d, 0xffffff, 0xc8102e, 0xffcb05];
  for (let i = 0; i < 40; i++) {
    const g = scene.add.graphics();
    const c = colors[i % colors.length];
    g.fillStyle(c, 1);
    if (i % 2 === 0) g.fillRect(-5, -5, 10, 10);
    else g.fillCircle(0, 0, 5);
    g.setPosition(x, y);
    g.setDepth(600);
    const angle = Math.random() * Math.PI * 2;
    const dist = 150 + Math.random() * 260;
    const targetX = x + Math.cos(angle) * dist;
    const targetY = y + Math.sin(angle) * dist - 60;
    scene.tweens.add({
      targets: g,
      x: targetX,
      y: targetY + 220,
      angle: Math.random() * 360,
      alpha: 0,
      duration: 900 + Math.random() * 500,
      ease: 'Cubic.easeOut',
      onComplete: () => g.destroy(),
    });
  }
}

export function shakeCamera(scene: Phaser.Scene, intensity = 0.012, duration = 260) {
  scene.cameras.main.shake(duration, intensity);
}

export function flashScreen(scene: Phaser.Scene, color = 0xffffff, duration = 180) {
  scene.cameras.main.flash(duration, (color >> 16) & 0xff, (color >> 8) & 0xff, color & 0xff);
}

/**
 * Very brief hitch on the timescale to sell an anime "impact frame" without
 * actually freezing input handling for long.
 */
export function freezeFrame(scene: Phaser.Scene, ms = 70) {
  scene.tweens.timeScale = 0.02;
  scene.time.timeScale = 0.02;
  // Real-time timeout: scene.time is itself slowed by the timeScale above,
  // so a delayedCall would take 50x longer than intended.
  window.setTimeout(() => {
    scene.tweens.timeScale = 1;
    scene.time.timeScale = 1;
  }, ms);
}
