import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import { prodayHaptics } from '../../utils/prodayHaptics';

export type JoueurSfxId =
  | 'tap'
  | 'whoosh'
  | 'star'
  | 'xp'
  | 'mission'
  | 'enter'
  | 'levelup'
  | 'ambient';

const SOURCES: Record<JoueurSfxId, number> = {
  tap: require('../../../assets/joueur/sfx/tap.wav'),
  whoosh: require('../../../assets/joueur/sfx/whoosh.wav'),
  star: require('../../../assets/joueur/sfx/star.wav'),
  xp: require('../../../assets/joueur/sfx/xp.wav'),
  mission: require('../../../assets/joueur/sfx/mission.wav'),
  enter: require('../../../assets/joueur/sfx/enter.wav'),
  levelup: require('../../../assets/joueur/sfx/levelup.wav'),
  ambient: require('../../../assets/joueur/sfx/ambient.wav'),
};

const VOLUME: Partial<Record<JoueurSfxId, number>> = {
  tap: 0.35,
  whoosh: 0.28,
  star: 0.55,
  xp: 0.5,
  mission: 0.55,
  enter: 0.45,
  levelup: 0.6,
  ambient: 0.12,
};

let ready = false;
let muted = true;
const players = new Map<JoueurSfxId, AudioPlayer>();
let ambientPlayer: AudioPlayer | null = null;

async function ensureMode() {
  if (ready) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      interruptionMode: 'mixWithOthers',
      shouldPlayInBackground: false,
      shouldRouteThroughEarpiece: false,
    });
  } catch {
    // mode optionnel
  }
  ready = true;
}

function getPlayer(id: JoueurSfxId): AudioPlayer | null {
  try {
    let p = players.get(id);
    if (!p) {
      p = createAudioPlayer(SOURCES[id], { updateInterval: 500 });
      p.volume = VOLUME[id] ?? 0.4;
      players.set(id, p);
    }
    return p;
  } catch {
    return null;
  }
}

/** Joue un SFX jeu (one-shot). */
export async function playJoueurSfx(id: JoueurSfxId): Promise<void> {
  if (muted || id === 'ambient') return;
  await ensureMode();
  const p = getPlayer(id);
  if (!p) return;
  try {
    p.volume = VOLUME[id] ?? 0.4;
    if (typeof p.seekTo === 'function') {
      await p.seekTo(0);
    }
    p.play();
  } catch {
    // ignore
  }
}

export function playJoueurSfxFireAndForget(id: JoueurSfxId): void {
  void playJoueurSfx(id);
}

/** Ambient pad soft en boucle (home univers). */
export async function startJoueurAmbient(): Promise<void> {
  if (muted) return;
  await ensureMode();
  try {
    if (!ambientPlayer) {
      ambientPlayer = createAudioPlayer(SOURCES.ambient, { updateInterval: 1000 });
      ambientPlayer.volume = VOLUME.ambient ?? 0.12;
      ambientPlayer.loop = true;
    }
    if (!ambientPlayer.playing) ambientPlayer.play();
  } catch {
    // ignore
  }
}

export function stopJoueurAmbient(): void {
  try {
    ambientPlayer?.pause();
  } catch {
    // ignore
  }
}

export function setJoueurSfxMuted(next: boolean): void {
  muted = next;
  if (next) stopJoueurAmbient();
}

export function isJoueurSfxMuted(): boolean {
  return muted;
}

/** Tap UI + haptic (SFX désactivés par défaut — voir muted / prefs). */
export function joueurGamePress(): void {
  prodayHaptics.press();
}

export function joueurGameConfirm(): void {
  prodayHaptics.confirm();
}

export function joueurGameReward(_kind: 'star' | 'xp' | 'mission' | 'levelup' = 'xp'): void {
  prodayHaptics.confirm();
}
