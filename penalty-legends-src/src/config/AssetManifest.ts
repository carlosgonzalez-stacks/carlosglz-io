const EUGENIO_BASE = 'assets/images/eugenio';
const PABLO_BASE = 'assets/images/pablo';

export const EUGENIO_POSES = {
  idleFront: 'idle_front',
  readyStance: 'ready_stance',
  ballReady: 'ball_ready',
  jog1: 'jog_1',
  jog2: 'jog_2',
  dribble: 'dribble',
  windup: 'windup',
  strikePrep: 'strike_prep',
  strikeContact: 'strike_contact',
  kickImpact: 'kick_impact',
  followThroughSide: 'follow_through_side',
  followThroughBack: 'follow_through_back',
  watchBall: 'watch_ball',
  fistPump: 'fist_pump',
  celebrateArmsUp: 'celebrate_arms_up',
  celebrateSlide: 'celebrate_slide',
  celebratePoint: 'celebrate_point',
  confidentHandsHips: 'confident_hands_hips',
  celebrateJump: 'celebrate_jump',
  celebrateBack: 'celebrate_back',
} as const;

export const PABLO_POSES = {
  idle: 'idle',
  crouch: 'crouch',
  armsWide: 'arms_wide',
  handsUp: 'hands_up',
  diveLeftLow: 'dive_left_low',
  diveLeftHigh: 'dive_left_high',
  diveRightLow: 'dive_right_low',
  diveRightHigh: 'dive_right_high',
  jumpCenter: 'jump_center',
  catchChest: 'catch_chest',
  catchAboveHead: 'catch_above_head',
  punchAway: 'punch_away',
  kneelingSave: 'kneeling_save',
  oneKneeReady: 'one_knee_ready',
  quickStepLeft: 'quick_step_left',
  quickStepRight: 'quick_step_right',
  celebrateSave: 'celebrate_save',
  disappointedGoal: 'disappointed_goal',
  pointDirect: 'point_direct',
  victory: 'victory',
} as const;

export type EugenioPoseKey = keyof typeof EUGENIO_POSES;
export type PabloPoseKey = keyof typeof PABLO_POSES;

const EUGENIO_INDEX: Record<EugenioPoseKey, number> = {
  idleFront: 1, readyStance: 2, ballReady: 3, jog1: 4, jog2: 5,
  dribble: 6, windup: 7, strikePrep: 8, strikeContact: 9, kickImpact: 10,
  followThroughSide: 11, followThroughBack: 12, watchBall: 13, fistPump: 14,
  celebrateArmsUp: 15, celebrateSlide: 16, celebratePoint: 17,
  confidentHandsHips: 18, celebrateJump: 19, celebrateBack: 20,
};

const PABLO_INDEX: Record<PabloPoseKey, number> = {
  idle: 1, crouch: 2, armsWide: 3, handsUp: 4, diveLeftLow: 5,
  diveLeftHigh: 6, diveRightLow: 7, diveRightHigh: 8, jumpCenter: 9,
  catchChest: 10, catchAboveHead: 11, punchAway: 12, kneelingSave: 13,
  oneKneeReady: 14, quickStepLeft: 15, quickStepRight: 16,
  celebrateSave: 17, disappointedGoal: 18, pointDirect: 19, victory: 20,
};

export function eugenioTextureKey(pose: EugenioPoseKey): string {
  return `eugenio_${pose}`;
}

export function pabloTextureKey(pose: PabloPoseKey): string {
  return `pablo_${pose}`;
}

export function eugenioAssets(): { key: string; url: string }[] {
  return (Object.keys(EUGENIO_POSES) as EugenioPoseKey[]).map((pose) => {
    const idx = String(EUGENIO_INDEX[pose]).padStart(2, '0');
    return {
      key: eugenioTextureKey(pose),
      url: `${EUGENIO_BASE}/eugenio_${idx}_${EUGENIO_POSES[pose]}.png`,
    };
  });
}

export function pabloAssets(): { key: string; url: string }[] {
  return (Object.keys(PABLO_POSES) as PabloPoseKey[]).map((pose) => {
    const idx = String(PABLO_INDEX[pose]).padStart(2, '0');
    return {
      key: pabloTextureKey(pose),
      url: `${PABLO_BASE}/pablo_${idx}_${PABLO_POSES[pose]}.png`,
    };
  });
}

export const BACKGROUND_KEY = 'stadium_bg';
export const BACKGROUND_URL = 'assets/images/background/stadium.jpg';
