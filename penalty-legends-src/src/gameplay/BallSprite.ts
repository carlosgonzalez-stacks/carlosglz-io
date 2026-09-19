import Phaser from 'phaser';

const KEY = 'ball_tex';
const SIZE = 128;

export function ensureBallTexture(scene: Phaser.Scene) {
  if (scene.textures.exists(KEY)) return KEY;
  const g = scene.make.graphics({ x: 0, y: 0 });
  const r = SIZE / 2;
  g.fillStyle(0xffffff, 1);
  g.fillCircle(r, r, r - 3);
  g.lineStyle(3, 0x1a1a1a, 1);
  g.strokeCircle(r, r, r - 3);

  // Simplified pentagon pattern.
  const cx = r;
  const cy = r;
  const pentR = r * 0.34;
  const pts: Phaser.Math.Vector2[] = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 5;
    pts.push(new Phaser.Math.Vector2(cx + Math.cos(a) * pentR, cy + Math.sin(a) * pentR));
  }
  g.fillStyle(0x1a1a1a, 1);
  g.beginPath();
  g.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
  g.closePath();
  g.fillPath();

  pts.forEach((p) => {
    g.lineStyle(3, 0x1a1a1a, 1);
    const dir = new Phaser.Math.Vector2(p.x - cx, p.y - cy).normalize();
    g.lineBetween(p.x, p.y, p.x + dir.x * r * 0.5, p.y + dir.y * r * 0.5);
  });

  g.generateTexture(KEY, SIZE, SIZE);
  g.destroy();
  return KEY;
}
