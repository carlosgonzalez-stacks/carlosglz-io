import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, type Difficulty, FONT_FAMILY, FONT_FAMILY_BODY, COLORS } from '../config/GameConfig';
import { DIFFICULTY_CONFIG } from '../config/DifficultyConfig';
import { addStadiumBackground } from './backgroundUtil';
import { drawSkewedPanel } from '../ui/UiStyle';
import { addVignette } from '../fx/Vignette';
import { DifficultyManager } from '../gameplay/DifficultyManager';
import { AudioManager } from '../audio/AudioManager';

const ORDER: Difficulty[] = ['easy', 'medium', 'hard'];

export class DifficultyScene extends Phaser.Scene {
  private selected: Difficulty = 'medium';
  private cardContainers: Partial<Record<Difficulty, Phaser.GameObjects.Container>> = {};

  constructor() {
    super('Difficulty');
  }

  create() {
    addStadiumBackground(this);
    addVignette(this, GAME_WIDTH, GAME_HEIGHT, 0.6);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.5);

    this.add
      .text(GAME_WIDTH / 2, 130, 'CHOOSE YOUR CHALLENGE', {
        fontFamily: FONT_FAMILY,
        fontSize: '54px',
        color: '#ffffff',
        stroke: '#0b0f14',
        strokeThickness: 10,
      })
      .setOrigin(0.5);

    const cardW = 400;
    const cardH = 460;
    const gap = 60;
    const totalW = cardW * 3 + gap * 2;
    const startX = GAME_WIDTH / 2 - totalW / 2 + cardW / 2;
    const y = GAME_HEIGHT / 2 - 20;

    ORDER.forEach((diff, i) => {
      const x = startX + i * (cardW + gap);
      const card = this.buildCard(x, y, cardW, cardH, diff);
      this.cardContainers[diff] = card;
    });

    this.highlightSelection();

    this.buildStartButton(GAME_WIDTH / 2, GAME_HEIGHT - 110);

    const backHit = this.add
      .text(70, 60, '< HOME', { fontFamily: FONT_FAMILY, fontSize: '24px', color: '#e8eef2' })
      .setInteractive({ useHandCursor: true });
    backHit.on('pointerdown', () => {
      AudioManager.instance.playUiBlip();
      this.scene.start('Home');
    });
  }

  private buildCard(x: number, y: number, w: number, h: number, diff: Difficulty) {
    const cfg = DIFFICULTY_CONFIG[diff];
    const container = this.add.container(x, y);

    const panel = drawSkewedPanel(this, w, h, { fill: COLORS.ink, alpha: 0.8, stroke: 0x3a4552, strokeWidth: 3, skew: 20 });
    panel.setPosition(-w / 2, -h / 2);
    container.add(panel);

    const accent = diff === 'easy' ? 0x35d16b : diff === 'medium' ? 0xffcb05 : 0xc8102e;
    const stripe = this.add.rectangle(-w / 2 + 10, -h / 2, 8, h, accent).setOrigin(0, 0);
    container.add(stripe);

    const label = this.add
      .text(0, -h / 2 + 70, cfg.label, { fontFamily: FONT_FAMILY, fontSize: '44px', color: '#ffffff' })
      .setOrigin(0.5);
    const tagline = this.add
      .text(0, -h / 2 + 130, `"${cfg.tagline}"`, {
        fontFamily: FONT_FAMILY_BODY,
        fontSize: '22px',
        color: '#e8eef2',
        fontStyle: 'italic',
      })
      .setOrigin(0.5);

    const stats = [
      `Keeper reads shot: ${Math.round(cfg.predictionAccuracy * 100)}%`,
      `Reaction time: ${cfg.goalkeeperReactionMin}-${cfg.goalkeeperReactionMax}ms`,
      `Dive reach: ${Math.round(cfg.goalkeeperReach * 100)}%`,
    ];
    const statTexts = stats.map((s, i) =>
      this.add
        .text(0, -h / 2 + 210 + i * 40, s, { fontFamily: FONT_FAMILY_BODY, fontSize: '19px', color: '#9fb0bd' })
        .setOrigin(0.5),
    );

    container.add([label, tagline, ...statTexts]);

    const hitZone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.04, duration: 120 }));
    hitZone.on('pointerout', () => {
      if (this.selected !== diff) this.tweens.add({ targets: container, scale: 1, duration: 120 });
    });
    hitZone.on('pointerdown', () => {
      AudioManager.instance.ensureContext();
      AudioManager.instance.playUiBlip();
      this.selected = diff;
      this.highlightSelection();
    });

    return container;
  }

  private highlightSelection() {
    ORDER.forEach((diff) => {
      const c = this.cardContainers[diff];
      if (!c) return;
      const isSel = diff === this.selected;
      this.tweens.add({ targets: c, scale: isSel ? 1.06 : 1, duration: 150 });
      c.setAlpha(isSel ? 1 : 0.75);
    });
  }

  private buildStartButton(x: number, y: number) {
    const w = 420;
    const h = 78;
    const container = this.add.container(x, y);
    const panel = drawSkewedPanel(this, w, h, { fill: COLORS.red, alpha: 0.95, stroke: 0xffffff, strokeWidth: 3 });
    panel.setPosition(-w / 2, -h / 2);
    const text = this.add
      .text(0, 0, 'START MATCH', { fontFamily: FONT_FAMILY, fontSize: '36px', color: '#ffffff' })
      .setOrigin(0.5);
    container.add([panel, text]);

    const hitZone = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    hitZone.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.05, duration: 120 }));
    hitZone.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 120 }));
    hitZone.on('pointerdown', () => {
      AudioManager.instance.playUiConfirm();
      DifficultyManager.set(this.selected);
      this.cameras.main.fadeOut(300, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Penalty'));
    });

    return container;
  }
}
