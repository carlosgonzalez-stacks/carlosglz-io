import Phaser from 'phaser';
import { FONT_FAMILY, FONT_FAMILY_BODY, TOTAL_PENALTIES } from '../config/GameConfig';
import type { ShotOutcome } from '../gameplay/GoalkeeperAI';
import { drawSkewedPanel } from './UiStyle';

export class ScoreHUD {
  readonly container: Phaser.GameObjects.Container;
  private penaltyLabel: Phaser.GameObjects.Text;
  private eugenioRow: Phaser.GameObjects.Text[] = [];
  private pabloRow: Phaser.GameObjects.Text[] = [];
  private eugenioIcons: Phaser.GameObjects.Container;
  private pabloIcons: Phaser.GameObjects.Container;

  constructor(scene: Phaser.Scene, x: number, y: number) {
    this.container = scene.add.container(x, y);

    const panel = drawSkewedPanel(scene, 340, 72, { fill: 0x0b0f14, alpha: 0.72, skew: 18 });
    panel.setPosition(-170, -36);
    this.container.add(panel);

    this.penaltyLabel = scene.add
      .text(0, -22, 'PENALTY 1 / 5', { fontFamily: FONT_FAMILY, fontSize: '30px', color: '#ffffff' })
      .setOrigin(0.5);
    this.container.add(this.penaltyLabel);

    const eLabel = scene.add
      .text(-150, 20, 'EUGENIO', { fontFamily: FONT_FAMILY_BODY, fontSize: '16px', color: '#35d16b', fontStyle: '700' })
      .setOrigin(0, 0.5);
    const pLabel = scene.add
      .text(-150, 48, 'PABLO', { fontFamily: FONT_FAMILY_BODY, fontSize: '16px', color: '#ffcb05', fontStyle: '700' })
      .setOrigin(0, 0.5);
    this.container.add([eLabel, pLabel]);

    this.eugenioIcons = scene.add.container(-70, 20);
    this.pabloIcons = scene.add.container(-70, 48);
    this.container.add([this.eugenioIcons, this.pabloIcons]);

    for (let i = 0; i < TOTAL_PENALTIES; i++) {
      const e = scene.add.text(i * 26, 0, '·', { fontFamily: FONT_FAMILY, fontSize: '22px', color: '#5b6673' }).setOrigin(0.5);
      const p = scene.add.text(i * 26, 0, '·', { fontFamily: FONT_FAMILY, fontSize: '22px', color: '#5b6673' }).setOrigin(0.5);
      this.eugenioRow.push(e);
      this.pabloRow.push(p);
      this.eugenioIcons.add(e);
      this.pabloIcons.add(p);
    }
  }

  setPenaltyIndex(current: number, total: number) {
    this.penaltyLabel.setText(`PENALTY ${current} / ${total}`);
  }

  update(outcomes: ShotOutcome[]) {
    outcomes.forEach((outcome, i) => {
      if (i >= this.eugenioRow.length) return;
      const scored = outcome === 'goal';
      const saved = outcome === 'save' || outcome === 'punch';
      this.eugenioRow[i].setText(scored ? '⚽' : '✕').setColor(scored ? '#35d16b' : '#c8102e');
      this.pabloRow[i].setText(saved ? '🧤' : '✕').setColor(saved ? '#ffcb05' : '#c8102e');
    });
  }

  destroy() {
    this.container.destroy();
  }
}
