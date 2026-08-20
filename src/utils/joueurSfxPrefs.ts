import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  isJoueurSfxMuted,
  setJoueurSfxMuted as setMutedMemory,
} from '../features/joueur/joueurSfx';

const MUTE_KEY = 'proday_joueur_sfx_muted_v1';

export async function hydrateJoueurSfxMute(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(MUTE_KEY);
    const muted = raw === null ? true : raw === '1';
    setMutedMemory(muted);
    return muted;
  } catch {
    return isJoueurSfxMuted();
  }
}

export async function persistJoueurSfxMuted(muted: boolean): Promise<void> {
  setMutedMemory(muted);
  try {
    await AsyncStorage.setItem(MUTE_KEY, muted ? '1' : '0');
  } catch {
    // ignore
  }
}
