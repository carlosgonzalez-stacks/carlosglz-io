import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, FONT_FAMILY_BODY, COLORS } from '../config/GameConfig';
import { drawSkewedPanel } from '../ui/UiStyle';
import { AudioManager } from '../audio/AudioManager';

const STEPS = [
  ['1. AIM', 'Move the mouse to place the reticle anywhere inside the goal.'],
  ['2. CHARGE', 'Hold SPACE (or click and hold) to build up the power meter.'],
  ['3. RELEASE', 'Let go to strike. The sweet spot on the meter gives the cleanest shot.'],
  ['4. READ PABLO', 'Too much power sacrifices accuracy — balance power and placement.'],
  ['5. STREAK', '3 goals in a row charges a SPECIAL SHOT with extra flair.'],
];

export class HowToPlayScene extends Phaser.Scene {
  constructor() {
    super('HowToPlay');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.ink);

    this.add
      .text(GAME_WIDTH / 2, 110, 'HOW TO PLAY', {
        fontFamily: FONT_FAMILY,
        fontSize: '56px',
        color: '#ffffff',
      })
      .setOrigin(0.5);

    const startY = 240;
    STEPS.forEach(([title, body], i) => {
      const y = startY + i * 130;
      const panel = drawSkewedPanel(this, 1200, 100, { fill: 0x14202b, alpha: 0.85, skew: 16 });
      panel.setPosition(GAME_WIDTH / 2 - 600, y - 50);
      this.add
        .text(GAME_WIDTH / 2 - 540, y - 18, title, { fontFamily: FONT_FAMILY, fontSize: '28px', color: '#ffcb05' })
        .setOrigin(0, 0.5);
      this.add
        .text(GAME_WIDTH / 2 - 540, y + 20, body, {
          fontFamily: FONT_FAMILY_BODY,
          fontSize: '20px',
          color: '#e8eef2',
          wordWrap: { width: 1080 },
        })
        .setOrigin(0, 0.5);
    });

    const back = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 90);
    const panel = drawSkewedPanel(this, 300, 68, { fill: COLORS.red, alpha: 0.95, stroke: 0xffffff, strokeWidth: 2 });
    panel.setPosition(-150, -34);
    const text = this.add.text(0, 0, 'BACK', { fontFamily: FONT_FAMILY, fontSize: '30px', color: '#ffffff' }).setOrigin(0.5);
    back.add([panel, text]);
    const hit = this.add.zone(GAME_WIDTH / 2, GAME_HEIGHT - 90, 300, 68).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      AudioManager.instance.playUiBlip();
      this.scene.start('Home');
    });
  }
}
