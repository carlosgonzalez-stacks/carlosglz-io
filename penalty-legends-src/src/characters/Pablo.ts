import Phaser from 'phaser';
import { PABLO_POSES, type PabloPoseKey, pabloTextureKey } from '../config/AssetManifest';

export type DiveDirection = 'left' | 'right' | 'center';
export type DiveHeight = 'low' | 'high' | 'mid';

export class Pablo {
  readonly sprite: Phaser.GameObjects.Image;
  private scene: Phaser.Scene;
  private currentPose: PabloPoseKey = 'idle';
  readonly homeX: number;
  readonly homeY: number;
  private targetHeight: number;

  constructor(scene: Phaser.Scene, x: number, y: number, targetHeight = 300) {
    this.scene = scene;
    this.homeX = x;
    this.homeY = y;
    this.targetHeight = targetHeight;
    this.sprite = scene.add.image(x, y, pabloTextureKey('idle'));
    this.sprite.setOrigin(0.5, 1);
    this.normalizeScale();
  }

  private normalizeScale() {
    const s = this.targetHeight / this.sprite.height;
    this.sprite.setScale(s);
  }

  setPose(pose: PabloPoseKey) {
    if (!PABLO_POSES[pose]) return;
    this.currentPose = pose;
    this.sprite.setTexture(pabloTextureKey(pose));
    this.normalizeScale();
  }

  get pose() {
    return this.currentPose;
  }

  resetToGoal() {
    this.scene.tweens.killTweensOf(this.sprite);
    this.sprite.setPosition(this.homeX, this.homeY);
    this.sprite.setRotation(0);
    this.sprite.setFlipX(false);
    this.setPose('idle');
  }

  playCrouchAnticipation() {
    this.setPose('crouch');
  }

  divePose(direction: DiveDirection, height: DiveHeight): PabloPoseKey {
    if (direction === 'center') return height === 'high' ? 'jumpCenter' : 'handsUp';
    if (direction === 'left') return height === 'high' ? 'diveLeftHigh' : 'diveLeftLow';
    return height === 'high' ? 'diveRightHigh' : 'diveRightLow';
  }

  /** Animate the dive lunge toward a target point in scene space. */
  animateDive(direction: DiveDirection, height: DiveHeight, targetX: number, targetY: number, duration: number) {
    const pose = this.divePose(direction, height);
    this.setPose(pose);
    if (direction === 'left') this.sprite.setFlipX(true);
    else if (direction === 'right') this.sprite.setFlipX(false);

    const rot = direction === 'center' ? 0 : direction === 'left' ? -0.35 : 0.35;
    this.scene.tweens.add({
      targets: this.sprite,
      x: targetX,
      y: targetY,
      rotation: rot,
      duration,
      ease: 'Quad.easeOut',
    });
  }

  showSave(kind: 'catch' | 'catchHigh' | 'punch' | 'kneel') {
    const map: Record<typeof kind, PabloPoseKey> = {
      catch: 'catchChest',
      catchHigh: 'catchAboveHead',
      punch: 'punchAway',
      kneel: 'kneelingSave',
    } as const;
    this.setPose(map[kind]);
  }

  celebrateSave() {
    this.setPose('celebrateSave');
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 14,
      duration: 200,
      yoyo: true,
      repeat: 1,
      ease: 'Quad.easeOut',
    });
  }

  celebrateVictory() {
    this.setPose('victory');
  }

  showDisappointed() {
    this.setPose('disappointedGoal');
  }

  pointDirect() {
    this.setPose('pointDirect');
  }

  destroy() {
    this.sprite.destroy();
  }
}
