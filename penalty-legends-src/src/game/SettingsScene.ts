import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, COLORS } from '../config/GameConfig';
import { drawSkewedPanel } from '../ui/UiStyle';
import { AudioManager } from '../audio/AudioManager';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('Settings');
  }

  create() {
    this.cameras.main.setBackgroundColor(COLORS.ink);

    this.add
      .text(GAME_WIDTH / 2, 160, 'SETTINGS', { fontFamily: FONT_FAMILY, fontSize: '56px', color: '#ffffff' })
      .setOrigin(0.5);

    const muted = AudioManager.instance.isMuted();
    const toggle = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40);
    const panel = drawSkewedPanel(this, 420, 90, { fill: COLORS.ink, alpha: 0.85, stroke: 0xffcb05, strokeWidth: 3 });
    panel.setPosition(-210, -45);
    const label = this.add
      .text(0, 0, muted ? 'SOUND: OFF' : 'SOUND: ON', { fontFamily: FONT_FAMILY, fontSize: '30px', color: '#ffffff' })
      .setOrigin(0.5);
    toggle.add([panel, label]);

    const hit = this.add.zone(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 40, 420, 90).setInteractive({ useHandCursor: true });
    hit.on('pointerdown', () => {
      AudioManager.instance.ensureContext();
      const nowMuted = !AudioManager.instance.isMuted();
      AudioManager.instance.setMuted(nowMuted);
      label.setText(nowMuted ? 'SOUND: OFF' : 'SOUND: ON');
      if (!nowMuted) AudioManager.instance.playUiBlip();
    });

    const back = this.add.container(GAME_WIDTH / 2, GAME_HEIGHT - 90);
    const backPanel = drawSkewedPanel(this, 300, 68, { fill: COLORS.red, alpha: 0.95, stroke: 0xffffff, strokeWidth: 2 });
    backPanel.setPosition(-150, -34);
    const backText = this.add.text(0, 0, 'BACK', { fontFamily: FONT_FAMILY, fontSize: '30px', color: '#ffffff' }).setOrigin(0.5);
    back.add([backPanel, backText]);
    const backHit = this.add.zone(GAME_WIDTH / 2, GAME_HEIGHT - 90, 300, 68).setInteractive({ useHandCursor: true });
    backHit.on('pointerdown', () => {
      AudioManager.instance.playUiBlip();
      this.scene.start('Home');
    });
  }
}
