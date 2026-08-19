import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { AnimatedEntrance } from '../motion';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { CarpoolModeSwitcher } from './CarpoolModeSwitcher';
import type { CarpoolHubMode } from '../../content/carpoolChapters';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';

type Props = {
  subtitle: string;
  mode: CarpoolHubMode;
  onModeChange: (mode: CarpoolHubMode) => void;
  liveActive?: boolean;
  badges?: Partial<Record<CarpoolHubMode, number>>;
  reminderCount?: number;
  onReminderPress?: () => void;
  hideHero?: boolean;
};

/** Hero interactif — titre + 3 cartes mode. */
export function CarpoolHubChrome({
  subtitle,
  mode,
  onModeChange,
  liveActive,
  badges,
  reminderCount = 0,
  onReminderPress,
  hideHero = false,
}: Props) {
  const { t } = useTranslation();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);

  return (
    <View style={styles.root}>
      {hideHero ? null : (
        <AnimatedEntrance kind="fadeUp">
          <View style={styles.copy}>
            <View style={styles.brandRow}>
              <View style={styles.brandOrb}>
                <Icon name="car" size={16} color={palette.onSignal} variant="filled" />
              </View>
              <Text style={styles.kicker}>{t('carpool.caption').toUpperCase()}</Text>
            </View>
            <Text style={styles.title} accessibilityRole="header">
              {t('carpool.title')}
            </Text>
            <Text style={styles.support}>{subtitle}</Text>
          </View>
        </AnimatedEntrance>
      )}

      <AnimatedEntrance kind="fadeUp" index={1}>
        <CarpoolModeSwitcher
          mode={mode}
          onChange={onModeChange}
          liveActive={liveActive}
          badges={badges}
        />
      </AnimatedEntrance>

      {reminderCount > 0 && onReminderPress ? (
        <AnimatedEntrance kind="fadeUp" index={2}>
          <PressableSpring onPress={onReminderPress} scaleTo={0.98} haptic style={styles.reminder}>
            <Icon name="warning" size={16} color={palette.signalDeep} />
            <Text style={styles.reminderText}>
              {t('carpool.reminder.compact', { n: reminderCount })}
            </Text>
            <Text style={styles.reminderCta}>{t('carpool.reminder.compactCta')}</Text>
          </PressableSpring>
        </AnimatedEntrance>
      ) : null}
    </View>
  );
}

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    root: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: spacing.md,
    },
    copy: { gap: 6, marginBottom: 4 },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    brandOrb: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.signal,
    },
    kicker: {
      fontSize: 11,
      letterSpacing: 2,
      color: palette.signalDeep,
      fontWeight: '800',
    },
    title: {
      fontSize: 34,
      lineHeight: 36,
      color: palette.ink,
      fontWeight: '800',
      letterSpacing: -0.8,
    },
    support: {
      fontSize: 14,
      lineHeight: 20,
      color: palette.inkMuted,
      maxWidth: 340,
    },
    reminder: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: palette.surface,
      borderWidth: 1,
      borderColor: palette.signal,
    },
    reminderText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: palette.ink,
    },
    reminderCta: {
      fontSize: 12,
      fontWeight: '800',
      color: palette.signalDeep,
    },
  });
}
