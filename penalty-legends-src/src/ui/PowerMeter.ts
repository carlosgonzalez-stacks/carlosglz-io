import Phaser from 'phaser';
import { FONT_FAMILY } from '../config/GameConfig';

const W = 56;
const H = 420;

export class PowerMeter {
  readonly container: Phaser.GameObjects.Container;
  private fillGfx: Phaser.GameObjects.Graphics;
  private frameGfx: Phaser.GameObjects.Graphics;
  private label: Phaser.GameObjects.Text;
  private value = 0;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);

    const frame = scene.add.graphics();
    frame.fillStyle(0x0b0f14, 0.55);
    frame.fillRoundedRect(-W / 2 - 8, -H - 8, W + 16, H + 16, 10);
    this.container.add(frame);

    // Sweet-spot band marker (where precision peaks).
    const sweetTop = H * (1 - 0.9);
    const sweetBottom = H * (1 - 0.55);
    const sweet = scene.add.graphics();
    sweet.fillStyle(0xffcb05, 0.22);
    sweet.fillRect(-W / 2, -H + sweetTop, W, sweetBottom - sweetTop);
    this.container.add(sweet);

    this.frameGfx = scene.add.graphics();
    this.frameGfx.lineStyle(4, 0xffffff, 0.9);
    this.frameGfx.strokeRect(-W / 2, -H, W, H);
    this.container.add(this.frameGfx);

    this.fillGfx = scene.add.graphics();
    this.container.add(this.fillGfx);

    const tickStyle = { fontFamily: FONT_FAMILY, fontSize: '14px', color: '#ffffff' };
    ['MAX', 'HIGH', 'MED', 'LOW'].forEach((t, i) => {
      const ty = -H + (H / 4) * i + 14;
      const txt = scene.add.text(W / 2 + 10, ty, t, tickStyle).setOrigin(0, 0.5);
      this.container.add(txt);
    });

    this.label = scene.add
      .text(0, 24, 'HOLD SPACE', { fontFamily: FONT_FAMILY, fontSize: '20px', color: '#ffcb05' })
      .setOrigin(0.5, 0);
    this.container.add(this.label);

    this.render();
  }

  setValue(v: number) {
    this.value = Phaser.Math.Clamp(v, 0, 1);
    this.render();
  }

  get powerValue() {
    return this.value;
  }

  private render() {
    this.fillGfx.clear();
    const fillH = H * this.value;
    const color =
      this.value < 0.35 ? 0x35d16b : this.value < 0.65 ? 0xffcb05 : this.value < 0.9 ? 0xff8a1e : 0xe0202e;
    this.fillGfx.fillStyle(color, 0.95);
    this.fillGfx.fillRect(-W / 2 + 4, -fillH, W - 8, fillH);

    if (this.value > 0.9) {
      this.fillGfx.fillStyle(0xffffff, 0.5 + Math.random() * 0.3);
      this.fillGfx.fillRect(-W / 2 + 4, -fillH, W - 8, 6);
    }

    this.label.setText(
      this.value === 0 ? 'HOLD SPACE' : this.value < 0.35 ? 'LOW POWER' : this.value < 0.65 ? 'MEDIUM POWER' : this.value < 0.9 ? 'HIGH POWER' : 'MAX POWER!',
    );
  }

  setVisible(v: boolean) {
    this.container.setVisible(v);
  }

  destroy() {
    this.container.destroy();
  }
}
