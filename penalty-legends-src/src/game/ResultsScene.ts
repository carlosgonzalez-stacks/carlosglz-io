import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, FONT_FAMILY_BODY, COLORS, type Difficulty } from '../config/GameConfig';
import { addStadiumBackground } from './backgroundUtil';
import { drawSkewedPanel } from '../ui/UiStyle';
import { addVignette } from '../fx/Vignette';
import { AudioManager } from '../audio/AudioManager';

export interface MatchStats {
  goals: number;
  saves: number;
  total: number;
  accuracy: number;
  averagePower: number;
  perfectShots: number;
  difficulty: Difficulty;
}

function gradeFor(goals: number): { title: string; color: string } {
  if (goals >= 5) return { title: 'PENALTY LEGEND', color: '#ffcb05' };
  if (goals === 4) return { title: 'SUPER STRIKER', color: '#35d16b' };
  if (goals >= 2) return { title: 'GREAT SHOOTER', color: '#5bc8ff' };
  return { title: 'KEEP TRAINING', color: '#c8102e' };
}

export class ResultsScene extends Phaser.Scene {
  private stats!: MatchStats;

  constructor() {
    super('Results');
  }

  init(data: MatchStats) {
    this.stats = data;
  }

  create() {
    addStadiumBackground(this);
    addVignette(this, GAME_WIDTH, GAME_HEIGHT, 0.62);
    this.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x000000, 0.55);

    const grade = gradeFor(this.stats.goals);

    this.add
      .text(GAME_WIDTH / 2, 110, 'FINAL SCORE', {
        fontFamily: FONT_FAMILY,
        fontSize: '40px',
        color: '#9fb0bd',
      })
      .setOrigin(0.5);

    this.add
      .text(GAME_WIDTH / 2, 190, `${this.stats.goals} / ${this.stats.total}`, {
        fontFamily: FONT_FAMILY,
        fontSize: '110px',
        color: '#ffffff',
        stroke: '#0b0f14',
        strokeThickness: 12,
      })
      .setOrigin(0.5);

    const gradeText = this.add
      .text(GAME_WIDTH / 2, 300, grade.title, {
        fontFamily: FONT_FAMILY,
        fontSize: '58px',
        color: grade.color,
        stroke: '#0b0f14',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setScale(0.7);
    this.tweens.add({ targets: gradeText, scale: 1, duration: 380, ease: 'Back.easeOut' });

    const statsPanel = drawSkewedPanel(this, 760, 220, { fill: COLORS.ink, alpha: 0.78, skew: 20 });
    statsPanel.setPosition(GAME_WIDTH / 2 - 380, 380);

    const rows = [
      ['Shot accuracy', `${Math.round(this.stats.accuracy * 100)}%`],
      ['Average power', `${Math.round(this.stats.averagePower * 100)}%`],
      ['Perfect shots', `${this.stats.perfectShots}`],
      ['Saves against you', `${this.stats.saves}`],
    ];
    rows.forEach((row, i) => {
      const y = 420 + i * 46;
      this.add
        .text(GAME_WIDTH / 2 - 340, y, row[0], { fontFamily: FONT_FAMILY_BODY, fontSize: '24px', color: '#e8eef2' })
        .setOrigin(0, 0.5);
      this.add
        .text(GAME_WIDTH / 2 + 340, y, row[1], { fontFamily: FONT_FAMILY, fontSize: '26px', color: '#ffcb05' })
        .setOrigin(1, 0.5);
    });

    const buttons: { label: string; action: () => void }[] = [
      { label: 'PLAY AGAIN', action: () => this.playAgain() },
      { label: 'CHANGE DIFFICULTY', action: () => this.changeDifficulty() },
      { label: 'HOME', action: () => this.goHome() },
    ];

    const w = 340;
    const gap = 30;
    const totalW = buttons.length * w + (buttons.length - 1) * gap;
    const startX = GAME_WIDTH / 2 - totalW / 2 + w / 2;
    const y = GAME_HEIGHT - 100;

    buttons.forEach((b, i) => this.buildButton(startX + i * (w + gap), y, w, 76, b.label, b.action));
  }

  private buildButton(x: number, y: number, w: number, h: number, label: string, action: () => void) {
    const container = this.add.container(x, y);
    const panel = drawSkewedPanel(this, w, h, { fill: COLORS.red, alpha: 0.9, stroke: 0xffffff, strokeWidth: 2 });
    panel.setPosition(-w / 2, -h / 2);
    const text = this.add.text(0, 0, label, { fontFamily: FONT_FAMILY, fontSize: '22px', color: '#ffffff' }).setOrigin(0.5);
    container.add([panel, text]);

    const hit = this.add.zone(x, y, w, h).setInteractive({ useHandCursor: true });
    hit.on('pointerover', () => this.tweens.add({ targets: container, scale: 1.05, duration: 120 }));
    hit.on('pointerout', () => this.tweens.add({ targets: container, scale: 1, duration: 120 }));
    hit.on('pointerdown', () => {
      AudioManager.instance.playUiConfirm();
      action();
    });
  }

  private playAgain() {
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Penalty'));
  }

  private changeDifficulty() {
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Difficulty'));
  }

  private goHome() {
    this.cameras.main.fadeOut(260, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Home'));
  }
}
