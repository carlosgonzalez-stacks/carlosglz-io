import Phaser from 'phaser';
import { GAME_WIDTH, GAME_HEIGHT, FONT_FAMILY, TOTAL_PENALTIES, SPECIAL_SHOT_STREAK } from '../config/GameConfig';
import type { GoalRect } from '../config/GoalConfig';
import { addStadiumBackground } from './backgroundUtil';
import { Eugenio } from '../characters/Eugenio';
import { Pablo } from '../characters/Pablo';
import { PowerMeter } from '../ui/PowerMeter';
import { AimReticle } from '../ui/AimReticle';
import { ScoreHUD } from '../ui/ScoreHUD';
import { DifficultyManager } from '../gameplay/DifficultyManager';
import { planShot, type ShotPlan } from '../gameplay/ShotController';
import type { ShotOutcome } from '../gameplay/GoalkeeperAI';
import { ensureBallTexture } from '../gameplay/BallSprite';
import { speedLineBurst, goalBurst, shakeCamera, flashScreen, freezeFrame } from '../fx/ParticleFX';
import { CrowdFX } from '../fx/CrowdFX';
import { addVignette } from '../fx/Vignette';
import { AudioManager } from '../audio/AudioManager';
import type { MatchStats } from './ResultsScene';

const CHARGE_DURATION_MS = 1150;

type Phase = 'intro' | 'ready' | 'aiming' | 'shooting' | 'resolved' | 'transition';

export class PenaltyScene extends Phaser.Scene {
  private goal!: GoalRect;
  private eugenio!: Eugenio;
  private pablo!: Pablo;
  private powerMeter!: PowerMeter;
  private aimReticle!: AimReticle;
  private hud!: ScoreHUD;
  private ball!: Phaser.GameObjects.Image;
  private ballShadow!: Phaser.GameObjects.Ellipse;
  private trailGfx!: Phaser.GameObjects.Graphics;
  private trailPoints: { x: number; y: number }[] = [];
  private crowdFx?: CrowdFX;

  private spot = { x: 0, y: 0 };
  private phase: Phase = 'intro';
  private charging = false;
  private chargeStartTime = 0;
  private lastTick = 0;
  private canShoot = false;

  private shotIndex = 0;
  private outcomes: ShotOutcome[] = [];
  private streak = 0;
  private specialReady = false;
  private specialBanner?: Phaser.GameObjects.Text;

  private totalPower = 0;
  private perfectCount = 0;
  private goalsCount = 0;
  private savesCount = 0;

  constructor() {
    super('Penalty');
  }

  create() {
    this.phase = 'intro';
    this.shotIndex = 0;
    this.outcomes = [];
    this.streak = 0;
    this.specialReady = false;
    this.totalPower = 0;
    this.perfectCount = 0;
    this.goalsCount = 0;
    this.savesCount = 0;

    const { goal } = addStadiumBackground(this);
    this.goal = goal;
    addVignette(this, GAME_WIDTH, GAME_HEIGHT, 0.45);

    this.crowdFx = new CrowdFX(this, 0, goal.top, GAME_WIDTH, 0);

    ensureBallTexture(this);

    this.pablo = new Pablo(this, goal.centerX, goal.bottom + 4, Math.max(230, goal.height * 0.66));

    this.spot = { x: GAME_WIDTH / 2, y: GAME_HEIGHT - 26 };
    this.eugenio = new Eugenio(this, this.spot.x - 70, this.spot.y, 470);
    this.eugenio.setPose('readyStance');

    this.trailGfx = this.add.graphics();
    this.trailGfx.setDepth(90);

    this.ballShadow = this.add.ellipse(this.spot.x, this.spot.y + 4, 46, 16, 0x000000, 0.4);
    this.ballShadow.setDepth(91);

    this.ball = this.add.image(this.spot.x, this.spot.y - 14, 'ball_tex');
    this.ball.setDisplaySize(34, 34);
    this.ball.setDepth(92);

    this.powerMeter = new PowerMeter(this, GAME_WIDTH - 110, GAME_HEIGHT - 80);
    this.powerMeter.setVisible(false);

    this.aimReticle = new AimReticle(this, goal);
    this.aimReticle.setLocked(true);

    this.hud = new ScoreHUD(this, GAME_WIDTH / 2, 60);
    this.hud.setPenaltyIndex(1, TOTAL_PENALTIES);

    this.specialBanner = this.add
      .text(GAME_WIDTH / 2, 110, 'SPECIAL READY!', {
        fontFamily: FONT_FAMILY,
        fontSize: '30px',
        color: '#ffcb05',
        stroke: '#0b0f14',
        strokeThickness: 6,
      })
      .setOrigin(0.5)
      .setVisible(false);
    this.specialBanner.setDepth(50);

    this.input.keyboard?.addCapture('SPACE');
    this.input.keyboard?.on('keydown-SPACE', () => this.startCharge());
    this.input.keyboard?.on('keyup-SPACE', () => this.releaseCharge());
    this.input.on('pointerdown', () => this.startCharge());
    this.input.on('pointerup', () => this.releaseCharge());

    AudioManager.instance.startCrowdAmbience();

    this.events.once('shutdown', () => {
      AudioManager.instance.stopCrowdAmbience();
      this.crowdFx?.destroy();
    });

    this.time.delayedCall(400, () => this.startRound());
  }

  update() {
    if (this.charging && this.phase === 'aiming') {
      const elapsed = this.time.now - this.chargeStartTime;
      const power = Phaser.Math.Clamp(elapsed / CHARGE_DURATION_MS, 0, 1);
      this.powerMeter.setValue(power);
      this.aimReticle.flashCharge(power);
      if (this.time.now - this.lastTick > 90) {
        this.lastTick = this.time.now;
        AudioManager.instance.playPowerTick(power);
      }
    }

    if (this.ball.visible && this.phase === 'shooting') {
      this.trailPoints.push({ x: this.ball.x, y: this.ball.y });
      if (this.trailPoints.length > 10) this.trailPoints.shift();
      this.drawTrail();
    }
  }

  private drawTrail() {
    this.trailGfx.clear();
    for (let i = 1; i < this.trailPoints.length; i++) {
      const a = this.trailPoints[i - 1];
      const b = this.trailPoints[i];
      const alpha = (i / this.trailPoints.length) * 0.5;
      this.trailGfx.lineStyle(6 * (i / this.trailPoints.length), 0xffffff, alpha);
      this.trailGfx.lineBetween(a.x, a.y, b.x, b.y);
    }
  }

  // ------------------------------------------------------------- ROUND FLOW

  private resetForRound() {
    this.phase = 'intro';
    this.canShoot = false;
    this.charging = false;
    this.eugenio.setPose('readyStance');
    this.pablo.resetToGoal();
    this.ball.setPosition(this.spot.x, this.spot.y - 14);
    this.ball.setDisplaySize(34, 34);
    this.ball.setAlpha(1);
    this.ball.setVisible(true);
    this.ballShadow.setPosition(this.spot.x, this.spot.y + 4);
    this.ballShadow.setAlpha(0.4);
    this.trailPoints = [];
    this.trailGfx.clear();
    this.powerMeter.setValue(0);
    this.powerMeter.setVisible(false);
    this.aimReticle.updateBounds(this.goal);
    this.aimReticle.setLocked(true);
    this.cameras.main.zoomTo(1, 260);
    this.cameras.main.pan(GAME_WIDTH / 2, GAME_HEIGHT / 2, 260, 'Sine.easeInOut', true);
    this.hud.setPenaltyIndex(this.shotIndex + 1, TOTAL_PENALTIES);
    this.specialBanner?.setVisible(this.specialReady);
  }

  private startRound() {
    this.resetForRound();
    this.playReadySequence();
  }

  private announce(text: string, size = 100, color = '#ffffff', hold = 500) {
    const t = this.add
      .text(GAME_WIDTH / 2, GAME_HEIGHT / 2 - 60, text, {
        fontFamily: FONT_FAMILY,
        fontSize: `${size}px`,
        color,
        stroke: '#0b0f14',
        strokeThickness: 10,
      })
      .setOrigin(0.5)
      .setScale(0.6)
      .setAlpha(0)
      .setDepth(200);
    this.tweens.add({
      targets: t,
      alpha: 1,
      scale: 1,
      duration: 180,
      ease: 'Back.easeOut',
      onComplete: () => {
        this.time.delayedCall(hold, () => {
          this.tweens.add({
            targets: t,
            alpha: 0,
            duration: 220,
            onComplete: () => t.destroy(),
          });
        });
      },
    });
    return t;
  }

  private playReadySequence() {
    this.phase = 'ready';
    AudioManager.instance.crowdTensionSwell();
    this.announce('READY', 84, '#e8eef2', 420);

    this.time.delayedCall(600, () => {
      this.announce('3', 130, '#ffcb05', 320);
      AudioManager.instance.playUiBlip();
    });
    this.time.delayedCall(1000, () => {
      this.announce('2', 130, '#ffcb05', 320);
      AudioManager.instance.playUiBlip();
    });
    this.time.delayedCall(1400, () => {
      this.announce('1', 130, '#ffcb05', 320);
      AudioManager.instance.playUiBlip();
    });
    this.time.delayedCall(1850, () => {
      AudioManager.instance.playWhistle();
      this.announce('SHOOT!', 110, '#35d16b', 500);
      this.enableAiming();
    });
  }

  private enableAiming() {
    this.phase = 'aiming';
    this.canShoot = true;
    this.aimReticle.setLocked(false);
    this.powerMeter.setVisible(true);
  }

  private startCharge() {
    if (this.phase !== 'aiming' || !this.canShoot || this.charging) return;
    this.charging = true;
    this.chargeStartTime = this.time.now;
    this.lastTick = 0;
  }

  private releaseCharge() {
    if (this.phase !== 'aiming' || !this.charging) return;
    this.charging = false;
    this.canShoot = false;
    const power = this.powerMeter.powerValue;
    this.aimReticle.setLocked(true);
    this.fireShot(power);
  }

  // ------------------------------------------------------------------ SHOT

  private fireShot(power: number) {
    this.phase = 'shooting';
    const aim = this.aimReticle.getAim();
    const config = DifficultyManager.params();
    const special = this.specialReady;
    if (special) {
      this.specialReady = false;
      this.specialBanner?.setVisible(false);
      this.streak = 0;
    }

    const start = { x: this.ball.x, y: this.ball.y };
    const plan = planShot(start, aim, power, this.goal, { x: this.pablo.homeX, y: this.pablo.homeY }, config, special);

    this.totalPower += power;

    this.eugenio.setPose('strikePrep');
    this.time.delayedCall(90, () => this.eugenio.setPose('kickImpact'));
    this.time.delayedCall(220, () => this.eugenio.setPose('followThroughSide'));

    AudioManager.instance.playKick(power);
    AudioManager.instance.playWhoosh(plan.trajectory.flightDurationMs / 1000);
    shakeCamera(this, 0.006, 140);
    this.cameras.main.zoomTo(1.1, 160, 'Sine.easeOut', true);

    if (special) {
      speedLineBurst(this, this.eugenio.sprite.x, this.eugenio.sprite.y - 200, 20, 0xffcb05, 90);
      AudioManager.instance.playSpecialStinger();
    }

    // Keeper reacts after the configured delay.
    this.time.delayedCall(plan.resolution.decision.reactionDelayMs, () => {
      if (plan.resolution.outcome === 'miss') {
        this.pablo.playCrouchAnticipation();
        return;
      }
      const dist = plan.resolution.decision;
      const remaining = Math.max(140, plan.trajectory.flightDurationMs - plan.resolution.decision.reactionDelayMs);
      this.pablo.animateDive(dist.direction, dist.height, dist.targetPoint.x, dist.targetPoint.y, remaining);
    });

    this.animateBall(plan);
  }

  private animateBall(plan: ShotPlan) {
    const { trajectory } = plan;
    const proxy = { t: 0 };
    const arcHeight = 50 + trajectory.power * 90;

    this.tweens.add({
      targets: proxy,
      t: 1,
      duration: trajectory.flightDurationMs,
      ease: 'Sine.easeIn',
      onUpdate: () => {
        const p = proxy.t;
        const x = Phaser.Math.Linear(trajectory.start.x, trajectory.landing.x, p);
        const yBase = Phaser.Math.Linear(trajectory.start.y, trajectory.landing.y, p);
        const arc = -Math.sin(p * Math.PI) * arcHeight;
        const scale = Phaser.Math.Linear(trajectory.startScale, trajectory.endScale, p);
        this.ball.setPosition(x, yBase + arc);
        this.ball.setDisplaySize(34 * scale, 34 * scale);

        this.ballShadow.setPosition(x, Phaser.Math.Linear(this.spot.y + 4, trajectory.landing.y + 10, p));
        this.ballShadow.setScale(Phaser.Math.Linear(1, 0.35, p));
        this.ballShadow.setAlpha(0.4 * (1 - p * 0.6));
      },
      onComplete: () => this.resolveOutcome(plan),
    });
  }

  // -------------------------------------------------------------- OUTCOME

  private resolveOutcome(plan: ShotPlan) {
    this.phase = 'resolved';
    const outcome = plan.resolution.outcome;
    this.outcomes[this.shotIndex] = outcome;

    if (outcome === 'goal') {
      this.streak += 1;
      this.goalsCount += 1;
      if (this.streak >= SPECIAL_SHOT_STREAK) {
        this.specialReady = true;
      }
      this.handleGoal(plan);
    } else if (outcome === 'save' || outcome === 'punch') {
      this.streak = 0;
      this.savesCount += 1;
      this.handleSave(plan, outcome);
    } else if (outcome === 'post') {
      this.streak = 0;
      this.handlePost(plan);
    } else {
      this.streak = 0;
      this.handleMiss(plan);
    }

    this.hud.update(this.outcomes);

    this.time.delayedCall(1650, () => this.advance());
  }

  private handleGoal(plan: ShotPlan) {
    AudioManager.instance.playGoalExplosion();
    AudioManager.instance.crowdSettle();
    shakeCamera(this, 0.02, 420);
    flashScreen(this, 0xffe066, 220);
    this.cameras.main.zoomTo(1.3, 260, 'Sine.easeOut', true);
    this.cameras.main.pan(this.goal.centerX, this.goal.centerY, 260, 'Sine.easeOut', true);

    this.pablo.showDisappointed();
    this.eugenio.celebrate(plan.perfect ? 'big' : 'goal');

    goalBurst(this, this.goal.centerX, this.goal.centerY);

    if (plan.perfect) {
      this.perfectCount += 1;
      freezeFrame(this, 80);
      speedLineBurst(this, this.ball.x, this.ball.y, 18, 0xffffff, 70);
      AudioManager.instance.playPerfectChime();
      this.announce('PERFECT SHOT!', 64, '#ffcb05', 700);
      this.time.delayedCall(500, () => this.announce('GOOOOOAL!', 120, '#35d16b', 700));
    } else {
      this.announce('GOOOOOAL!', 120, '#35d16b', 900);
    }
  }

  private handleSave(plan: ShotPlan, outcome: 'save' | 'punch') {
    AudioManager.instance.playSaveReaction();
    shakeCamera(this, 0.01, 200);
    this.cameras.main.zoomTo(1.35, 220, 'Sine.easeOut', true);
    this.cameras.main.pan(this.pablo.sprite.x, this.pablo.sprite.y - 120, 220, 'Sine.easeOut', true);

    this.ball.setVisible(false);
    this.ballShadow.setAlpha(0);

    if (outcome === 'save') {
      AudioManager.instance.playCatch();
      const high = plan.resolution.decision.height === 'high';
      this.pablo.showSave(high ? 'catchHigh' : 'catch');
    } else {
      AudioManager.instance.playPunch();
      this.pablo.showSave('punch');
    }

    this.time.delayedCall(420, () => this.pablo.celebrateSave());
    this.announce(outcome === 'save' ? 'WHAT A SAVE!' : 'DEFLECTED!', 78, '#ffcb05', 800);
  }

  private handlePost(plan: ShotPlan) {
    AudioManager.instance.playPost();
    shakeCamera(this, 0.012, 200);
    this.announce('OFF THE POST!', 68, '#ff8a1e', 800);

    this.tweens.add({
      targets: this.ball,
      x: plan.trajectory.landing.x + (Math.random() > 0.5 ? 70 : -70),
      y: plan.trajectory.landing.y + 40,
      alpha: 0,
      duration: 450,
      ease: 'Cubic.easeOut',
    });
    this.pablo.playCrouchAnticipation();
  }

  private handleMiss(plan: ShotPlan) {
    const label = plan.trajectory.missType === 'high' ? 'OVER THE BAR!' : 'WIDE!';
    this.announce(label, 68, '#c8102e', 800);
    this.eugenio.react('miss');

    this.tweens.add({
      targets: this.ball,
      alpha: 0,
      duration: 400,
      delay: 150,
    });
  }

  // --------------------------------------------------------------- ADVANCE

  private advance() {
    this.phase = 'transition';
    this.shotIndex += 1;
    if (this.shotIndex >= TOTAL_PENALTIES) {
      this.finishMatch();
      return;
    }
    this.cameras.main.zoomTo(1, 300, 'Sine.easeInOut', true);
    this.time.delayedCall(200, () => this.startRound());
  }

  private finishMatch() {
    const stats: MatchStats = {
      goals: this.goalsCount,
      saves: this.savesCount,
      total: TOTAL_PENALTIES,
      accuracy: this.outcomes.filter((o) => o === 'goal' || o === 'save' || o === 'punch').length / TOTAL_PENALTIES,
      averagePower: this.totalPower / TOTAL_PENALTIES,
      perfectShots: this.perfectCount,
      difficulty: DifficultyManager.get(),
    };
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.start('Results', stats);
    });
  }
}
