import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

type ImpactStyle = 'light' | 'medium' | 'heavy';
type NotifyStyle = 'success' | 'warning' | 'error';

const canHaptic = Platform.OS === 'ios' || Platform.OS === 'android';

function impact(style: ImpactStyle) {
  if (!canHaptic) return;
  const map = {
    light: Haptics.ImpactFeedbackStyle.Light,
    medium: Haptics.ImpactFeedbackStyle.Medium,
    heavy: Haptics.ImpactFeedbackStyle.Heavy,
  } as const;
  void Haptics.impactAsync(map[style]).catch(() => undefined);
}

function notify(style: NotifyStyle) {
  if (!canHaptic) return;
  const map = {
    success: Haptics.NotificationFeedbackType.Success,
    warning: Haptics.NotificationFeedbackType.Warning,
    error: Haptics.NotificationFeedbackType.Error,
  } as const;
  void Haptics.notificationAsync(map[style]).catch(() => undefined);
}

/** Retours haptiques ProDay — no-op sur web. */
export const prodayHaptics = {
  tabSwitch: () => impact('light'),
  press: () => impact('light'),
  confirm: () => notify('success'),
  warning: () => notify('warning'),
  error: () => notify('error'),
  like: () => impact('medium'),
  cartAdd: () => notify('success'),
  rsvpConfirm: () => notify('success'),
  carpoolBook: () => notify('success'),
  matchGoal: () => impact('heavy'),
  impactLight: () => impact('light'),
  impactMedium: () => impact('medium'),
  impactHeavy: () => impact('heavy'),
  selection: () => impact('light'),
  light: () => impact('light'),
};

