import AsyncStorage from '@react-native-async-storage/async-storage';

const BUBBLE_DISMISSED_KEY = 'pole_help_bubble_dismissed';

export async function isPoleHelpBubbleDismissed(): Promise<boolean> {
  try {
    const raw = await AsyncStorage.getItem(BUBBLE_DISMISSED_KEY);
    return raw === '1';
  } catch {
    return false;
  }
}

export async function dismissPoleHelpBubble(): Promise<void> {
  await AsyncStorage.setItem(BUBBLE_DISMISSED_KEY, '1');
}
