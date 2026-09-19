import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, COLORS, FONT_FAMILY, FONT_FAMILY_BODY } from '../config/GameConfig';
import { addStadiumBackground } from './backgroundUtil';
import { drawSkewedPanel } from '../ui/UiStyle';
import { CrowdFX } from '../fx/CrowdFX';
import { addVignette } from '../fx/Vignette';
import { AudioManager } from '../audio/AudioManager';

export class HomeScene extends Phaser.Scene {
  private crowdFx?: CrowdFX;

  constructor() {
    super('Home');
  }

  create() {
    const { goal } = addStadiumBackground(this);
    addVignette(this, GAME_WIDTH, GAME_HEIGHT, 0.62);

    const dark = this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.38);
    dark.setDepth(0);

    this.crowdFx = new CrowdFX(this, 0, goal.top, GAME_WIDTH, 0);

    // Floating light flares for atmosphere.
    for (let i = 0; i < 10; i++) {
      const x = Phaser.Math.Between(60, GAME_WIDTH - 60);
      const y = Phaser.Math.Between(40, GAME_HEIGHT * 0.35);
      const flare = this.add.circle(x, y, Phaser.Math.Between(2, 4), 0xffe9a8, 0.7);
      flare.setBlendMode(Phaser.BlendModes.ADD);
      flare.setDepth(2);
      this.tweens.add({
        targets: flare,
        alpha: { from: 0.15, to: 0.85 },
        duration: Phaser.Math.Between(900, 1800),
        yoyo: true,
        repeat: -1,
        delay: Phaser.Math.Between(0, 800),
      });
    }

    const titlePanel = this.add.container(GAME_WIDTH / 2, 190);
    const bigTitle = this.add
      .text(0, -34, 'AZTECA', {
        fontFamily: FONT_FAMILY,
        fontSize: '58px',
        color: '#ffcb05',
        stroke: '#0b0f14',
        strokeThickness: 8,
      })
      .setOrigin(0.5);
    const bigTitle2 = this.add
      .text(0, 42, 'PENALTY LEGENDS', {
        fontFamily: FONT_FAMILY,
        fontSize: '96px',
        color: '#ffffff',
        stroke: '#0b0f14',
        strokeThickness: 12,
      })
      .setOrigin(0.5);
    const subtitle = this.add
      .text(0, 108, '— THE FINAL SHOT —', {
        fontFamily: FONT_FAMILY_BODY,
        fontSize: '28px',
        color: '#e8eef2',
        fontStyle: '600',
      })
      .setOrigin(0.5);
    titlePanel.add([bigTitle, bigTitle2, subtitle]);
    titlePanel.setDepth(10);

    this.tweens.add({
      targets: bigTitle2,
      scale: { from: 0.94, to: 1 },
      duration: 700,
      ease: 'Back.easeOut',
    });

    const buttons: { label: string; y: number; action: () => void }[] = [
      { label: 'PLAY', y: 0, action: () => this.goPlay() },
      { label: 'HOW TO PLAY', y: 100, action: () => this.goHowTo() },
      { label: 'SETTINGS', y: 200, action: () => this.goSettings() },
    ];

    const startY = GAME_HEIGHT - 320;
    buttons.forEach((b, i) => {
      this.makeMenuButton(GAME_WIDTH / 2, startY + b.y, b.label, b.action, i === 0);
    });

    const hint = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT - 34, 'MOUSE TO AIM  •  HOLD SPACE TO CHARGE  •  RELEASE TO SHOOT', {
        fontFamily: FONT_FAMILY_BODY,
        fontSize: '18px',
        color: '#9fb0bd',
      })
      .setOrigin(0.5);
    hint.setDepth(10);

    this.input.once('pointerdown', () => AudioManager.instance.ensureContext());
    this.events.once('shutdown', () => this.crowdFx?.destroy());
  }

  private makeMenuButton(x: number, y: number, label: string, onClick: () => void, primary: boolean) {
    const w = 380;
    const h = 70;
    const container = this.add.container(x, y);
    container.setDepth(10);
    const fillColor = primary ? COLORS.red : COLORS.ink;
    const panel = drawSkewedPanel(this, w, h, { fill: fillColor, alpha: primary ? 0.92 : 0.75, stroke: 0xffffff, strokeWidth: 2 });
    panel.setPosition(-w / 2, -h / 2);
    const text = this.add
      .text(0, 0, label, { fontFamily: FONT_FAMILY, fontSize: primary ? '34px' : '26px', color: '#ffffff' })
      .setOrigin(0.5);
    container.add([panel, text]);

    const hitZone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => {
      AudioManager.instance.ensureContext();
      this.tweens.add({ targets: container, scale: 1.05, duration: 120 });
    });
    hitZone.on('pointerout', () => {
      this.tweens.add({ targets: container, scale: 1, duration: 120 });
    });
    hitZone.on('pointerdown', () => {
      AudioManager.instance.ensureContext();
      AudioManager.instance.playUiConfirm();
      this.tweens.add({
        targets: container,
        scale: 0.94,
        duration: 70,
        yoyo: true,
        onComplete: onClick,
      });
    });
  }

  private goPlay() {
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Difficulty'));
  }

  private goHowTo() {
    this.scene.start('HowToPlay');
  }

  private goSettings() {
    this.scene.start('Settings');
  }
}
