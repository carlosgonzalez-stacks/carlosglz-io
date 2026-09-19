/**
 * Every sound in the game is synthesized at runtime with the Web Audio API.
 * No external audio files are shipped — this keeps the game self-contained
 * and avoids licensing an actual stadium/crowd recording.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private crowdGain: GainNode | null = null;
  private noiseBuffer: AudioBuffer | null = null;
  private crowdSource: AudioBufferSourceNode | null = null;
  private crowdFilter: BiquadFilterNode | null = null;
  private muted = false;

  private static _instance: AudioManager | null = null;
  static get instance(): AudioManager {
    if (!this._instance) this._instance = new AudioManager();
    return this._instance;
  }

  /** Must be called from a user-gesture handler (click/keydown) to unlock audio. */
  ensureContext() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') void this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.85;
    this.master.connect(this.ctx.destination);

    this.sfxGain = this.ctx.createGain();
    this.sfxGain.gain.value = 1;
    this.sfxGain.connect(this.master);

    this.crowdGain = this.ctx.createGain();
    this.crowdGain.gain.value = 0.35;
    this.crowdGain.connect(this.master);

    this.noiseBuffer = this.buildNoiseBuffer(2);
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    if (this.master) this.master.gain.value = muted ? 0 : 0.85;
  }

  isMuted() {
    return this.muted;
  }

  setVolume(v: number) {
    if (this.master && !this.muted) this.master.gain.value = v;
  }

  private buildNoiseBuffer(seconds: number): AudioBuffer {
    const ctx = this.ctx!;
    const buffer = ctx.createBuffer(1, ctx.sampleRate * seconds, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    return buffer;
  }

  private now() {
    return this.ctx!.currentTime;
  }

  private noiseSource(): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noiseBuffer;
    src.loop = true;
    return src;
  }

  // ---------------------------------------------------------------- WHISTLE
  playWhistle() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = this.now();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(2200, t0);
    osc.frequency.linearRampToValueAtTime(2600, t0 + 0.08);
    osc.frequency.linearRampToValueAtTime(2450, t0 + 0.55);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.28, t0 + 0.03);
    gain.gain.setValueAtTime(0.28, t0 + 0.45);
    gain.gain.linearRampToValueAtTime(0, t0 + 0.58);
    osc.connect(gain).connect(this.sfxGain!);
    osc.start(t0);
    osc.stop(t0 + 0.6);
  }

  // ------------------------------------------------------------- POWER TICK
  playPowerTick(level: number) {
    if (!this.ctx) return;
    const t0 = this.now();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const freq = 260 + level * 420;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
    osc.connect(gain).connect(this.sfxGain!);
    osc.start(t0);
    osc.stop(t0 + 0.09);
  }

  // ------------------------------------------------------------------ KICK
  playKick(power: number) {
    if (!this.ctx) return;
    const t0 = this.now();
    const ctx = this.ctx;

    const thump = ctx.createOscillator();
    const thumpGain = ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(150, t0);
    thump.frequency.exponentialRampToValueAtTime(40, t0 + 0.18);
    thumpGain.gain.setValueAtTime(0.6 + power * 0.4, t0);
    thumpGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.22);
    thump.connect(thumpGain).connect(this.sfxGain!);
    thump.start(t0);
    thump.stop(t0 + 0.24);

    const noise = this.noiseSource();
    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.value = 900;
    noiseFilter.Q.value = 0.7;
    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5 + power * 0.5, t0);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.08);
    noise.connect(noiseFilter).connect(noiseGain).connect(this.sfxGain!);
    noise.start(t0);
    noise.stop(t0 + 0.1);
  }

  // ---------------------------------------------------------------- WHOOSH
  playWhoosh(duration = 0.6) {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = this.now();
    const noise = this.noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(500, t0);
    filter.frequency.linearRampToValueAtTime(2200, t0 + duration);
    filter.Q.value = 0.9;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.22, t0 + duration * 0.3);
    gain.gain.linearRampToValueAtTime(0, t0 + duration);
    noise.connect(filter).connect(gain).connect(this.sfxGain!);
    noise.start(t0);
    noise.stop(t0 + duration + 0.05);
  }

  // ------------------------------------------------------------------ POST
  playPost() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = this.now();
    const partials = [1, 2.4, 3.9, 5.3];
    partials.forEach((mult, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = 900 * mult;
      gain.gain.setValueAtTime(0.22 / (i + 1), t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.5 + i * 0.05);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(t0);
      osc.stop(t0 + 0.6);
    });
  }

  // ----------------------------------------------------------------- CATCH
  playCatch() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = this.now();
    const noise = this.noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.5, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.18);
    noise.connect(filter).connect(gain).connect(this.sfxGain!);
    noise.start(t0);
    noise.stop(t0 + 0.2);
  }

  // ------------------------------------------------------------- PUNCH/DEFLECT
  playPunch() {
    this.playCatch();
    this.playWhoosh(0.25);
  }

  // ---------------------------------------------------------- CROWD AMBIENCE
  startCrowdAmbience() {
    if (!this.ctx || this.crowdSource) return;
    const ctx = this.ctx;
    const src = this.noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = 500;
    filter.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.value = 1;
    src.connect(filter).connect(g).connect(this.crowdGain!);
    src.start();
    this.crowdSource = src;
    this.crowdFilter = filter;
    this.modulateCrowd();
  }

  private modulateCrowd = () => {
    if (!this.crowdFilter || !this.ctx) return;
    const t = this.now();
    const f = 380 + Math.random() * 260;
    this.crowdFilter.frequency.linearRampToValueAtTime(f, t + 1.5);
    if (this.crowdSource) {
      window.setTimeout(this.modulateCrowd, 1500);
    }
  };

  stopCrowdAmbience() {
    if (this.crowdSource) {
      try {
        this.crowdSource.stop();
      } catch {
        /* already stopped */
      }
      this.crowdSource = null;
    }
  }

  crowdTensionSwell() {
    if (!this.crowdGain || !this.ctx) return;
    const t0 = this.now();
    this.crowdGain.gain.cancelScheduledValues(t0);
    this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, t0);
    this.crowdGain.gain.linearRampToValueAtTime(0.7, t0 + 2.2);
  }

  crowdSettle() {
    if (!this.crowdGain || !this.ctx) return;
    const t0 = this.now();
    this.crowdGain.gain.cancelScheduledValues(t0);
    this.crowdGain.gain.setValueAtTime(this.crowdGain.gain.value, t0);
    this.crowdGain.gain.linearRampToValueAtTime(0.35, t0 + 1.5);
  }

  // ------------------------------------------------------------- EXPLOSIONS
  playGoalExplosion() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = this.now();
    const noise = this.noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(200, t0);
    filter.frequency.linearRampToValueAtTime(3500, t0 + 0.4);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.75, t0 + 0.15);
    gain.gain.linearRampToValueAtTime(0.4, t0 + 1.2);
    gain.gain.linearRampToValueAtTime(0, t0 + 2.6);
    noise.connect(filter).connect(gain).connect(this.sfxGain!);
    noise.start(t0);
    noise.stop(t0 + 2.7);

    [220, 330, 440].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sawtooth';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.001, t0);
      g.gain.linearRampToValueAtTime(0.18 - i * 0.04, t0 + 0.1);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + 0.9);
      o.connect(g).connect(this.sfxGain!);
      o.start(t0);
      o.stop(t0 + 1);
    });
  }

  playSaveReaction() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = this.now();
    const noise = this.noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(700, t0);
    filter.frequency.linearRampToValueAtTime(1400, t0 + 0.5);
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(0.45, t0 + 0.1);
    gain.gain.linearRampToValueAtTime(0, t0 + 1.1);
    noise.connect(filter).connect(gain).connect(this.sfxGain!);
    noise.start(t0);
    noise.stop(t0 + 1.2);
  }

  // ------------------------------------------------------------- SPECIAL FX
  playSpecialStinger() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = this.now();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, t0);
    osc.frequency.exponentialRampToValueAtTime(980, t0 + 0.5);
    gain.gain.setValueAtTime(0.0001, t0);
    gain.gain.exponentialRampToValueAtTime(0.3, t0 + 0.45);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7);
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 2200;
    osc.connect(filter).connect(gain).connect(this.sfxGain!);
    osc.start(t0);
    osc.stop(t0 + 0.75);
  }

  playPerfectChime() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const t0 = this.now();
    [880, 1320, 1760].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0 + i * 0.03);
      g.gain.linearRampToValueAtTime(0.18, t0 + i * 0.03 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.03 + 0.35);
      o.connect(g).connect(this.sfxGain!);
      o.start(t0 + i * 0.03);
      o.stop(t0 + i * 0.03 + 0.4);
    });
  }

  // ----------------------------------------------------------------- UI
  playUiBlip() {
    if (!this.ctx) return;
    const t0 = this.now();
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'square';
    osc.frequency.setValueAtTime(520, t0);
    osc.frequency.exponentialRampToValueAtTime(760, t0 + 0.06);
    gain.gain.setValueAtTime(0.12, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.09);
    osc.connect(gain).connect(this.sfxGain!);
    osc.start(t0);
    osc.stop(t0 + 0.1);
  }

  playUiConfirm() {
    if (!this.ctx) return;
    const t0 = this.now();
    [440, 660].forEach((f, i) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'square';
      osc.frequency.value = f;
      gain.gain.setValueAtTime(0.12, t0 + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + i * 0.06 + 0.12);
      osc.connect(gain).connect(this.sfxGain!);
      osc.start(t0 + i * 0.06);
      osc.stop(t0 + i * 0.06 + 0.13);
    });
  }
}
