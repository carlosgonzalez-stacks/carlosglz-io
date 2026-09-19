import Phaser from 'phaser';
import { eugenioAssets, pabloAssets, BACKGROUND_KEY, BACKGROUND_URL } from '../config/AssetManifest';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY } from '../config/GameConfig';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('Boot');
  }

  preload() {
    const cx = GAME_WIDTH / 2;
    const cy = GAME_HEIGHT / 2;

    this.cameras.main.setBackgroundColor(COLORS.ink);

    this.add
      .text(cx, cy - 90, 'PENALTY LEGENDS', {
        fontFamily: FONT_FAMILY,
        fontSize: '52px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const barW = 520;
    const barH = 22;
    const barX = cx - barW / 2;
    const barY = cy;

    const track = this.add.graphics();
    track.lineStyle(3, 0xffffff, 0.6);
    track.strokeRect(barX, barY, barW, barH);

    const fill = this.add.graphics();

    const pctText = this.add
      .text(cx, barY + 46, '0%', { fontFamily: FONT_FAMILY, fontSize: '22px', color: '#ffcb05' })
      .setOrigin(0.5);

    this.load.on('progress', (value: number) => {
      fill.clear();
      fill.fillStyle(0xffcb05, 1);
      fill.fillRect(barX + 3, barY + 3, (barW - 6) * value, barH - 6);
      pctText.setText(`${Math.round(value * 100)}%`);
    });

    this.load.image(BACKGROUND_KEY, BACKGROUND_URL);
    eugenioAssets().forEach((a) => this.load.image(a.key, a.url));
    pabloAssets().forEach((a) => this.load.image(a.key, a.url));
  }

  create() {
    this.scene.start('Home');
  }
}
