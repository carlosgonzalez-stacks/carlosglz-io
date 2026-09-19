import Phaser from 'phaser';
import { EUGENIO_POSES, type EugenioPoseKey, eugenioTextureKey } from '../config/AssetManifest';

export class Eugenio {
  readonly sprite: Phaser.GameObjects.Image;
  private scene: Phaser.Scene;
  private currentPose: EugenioPoseKey = 'idleFront';
  private targetHeight: number;

  constructor(scene: Phaser.Scene, x: number, y: number, targetHeight = 430) {
    this.scene = scene;
    this.targetHeight = targetHeight;
    this.sprite = scene.add.image(x, y, eugenioTextureKey('idleFront'));
    this.sprite.setOrigin(0.5, 1);
    this.normalizeScale();
  }

  private normalizeScale() {
    const s = this.targetHeight / this.sprite.height;
    this.sprite.setScale(s);
  }

  setPose(pose: EugenioPoseKey) {
    if (!EUGENIO_POSES[pose]) return;
    this.currentPose = pose;
    this.sprite.setTexture(eugenioTextureKey(pose));
    this.normalizeScale();
  }

  get pose() {
    return this.currentPose;
  }

  playIdleBreath() {
    this.scene.tweens.add({
      targets: this.sprite,
      scaleY: this.sprite.scaleY * 1.012,
      scaleX: this.sprite.scaleX * 0.995,
      duration: 900,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut',
    });
  }

  celebrate(kind: 'goal' | 'big' = 'goal') {
    const poses: EugenioPoseKey[] = kind === 'big'
      ? ['celebrateJump', 'celebrateArmsUp', 'celebratePoint']
      : ['celebrateArmsUp', 'fistPump'];
    const chosen = poses[Math.floor(Math.random() * poses.length)];
    this.setPose(chosen);
    this.scene.tweens.add({
      targets: this.sprite,
      y: this.sprite.y - 18,
      duration: 220,
      yoyo: true,
      ease: 'Quad.easeOut',
    });
  }

  react(kind: 'miss') {
    if (kind === 'miss') this.setPose('watchBall');
  }

  destroy() {
    this.sprite.destroy();
  }
}
