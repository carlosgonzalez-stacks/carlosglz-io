import Phaser from 'phaser';

const KEY = 'vignette_tex';

/**
 * A cheap, GPU-safe vignette drawn once onto a cached canvas texture.
 *
 * We deliberately avoid Phaser's WebGL postFX pipeline (postFX.addVignette /
 * addBlur) here: combined with a camera fade tween it reliably hangs the
 * render loop on software/constrained WebGL renderers (reproduced in this
 * project's own CI sandbox — the whole game froze mid fade-to-black with no
 * error). A single pre-rendered radial-gradient image costs one draw call
 * and carries none of that risk.
 */
export function addVignette(
  scene: Phaser.Scene,
  width: number,
  height: number,
  strength = 0.6,
): Phaser.GameObjects.Image {
  if (!scene.textures.exists(KEY)) {
    const tex = scene.textures.createCanvas(KEY, width, height);
    if (tex) {
      const ctx = tex.getContext();
      const cx = width / 2;
      const cy = height / 2;
      const outerR = Math.sqrt(cx * cx + cy * cy);
      const grad = ctx.createRadialGradient(cx, cy, outerR * 0.32, cx, cy, outerR * 0.98);
      grad.addColorStop(0, 'rgba(0,0,0,0)');
      grad.addColorStop(1, `rgba(0,0,0,${strength})`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);
      tex.refresh();
    }
  }
  const img = scene.add.image(width / 2, height / 2, KEY);
  img.setDepth(1);
  return img;
}
