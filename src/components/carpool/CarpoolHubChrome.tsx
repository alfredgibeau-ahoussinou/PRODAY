import React, { useMemo } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { AnimatedEntrance } from '../motion';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { CarpoolModeSwitcher } from './CarpoolModeSwitcher';
import type { CarpoolHubMode } from '../../content/carpoolChapters';
import { CARPOOL_SITE } from '../../content/carpoolSite';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';

type Props = {
  subtitle: string;
  mode: CarpoolHubMode;
  onModeChange: (mode: CarpoolHubMode) => void;
  liveActive?: boolean;
  badges?: Partial<Record<CarpoolHubMode, number>>;
  reminderCount?: number;
  onReminderPress?: () => void;
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
}: Props) {
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.root}>
      <AnimatedEntrance kind="fadeUp">
        <View style={styles.copy}>
          <View style={styles.brandRow}>
            <View style={styles.brandOrb}>
              <Icon name="car" size={16} color={CARPOOL_SITE.asphalt} variant="filled" />
            </View>
            <Text style={styles.kicker}>{t('carpool.caption').toUpperCase()}</Text>
          </View>
          <Text style={styles.title} accessibilityRole="header">
            {t('carpool.title')}
          </Text>
          <Text style={styles.support}>{subtitle}</Text>
        </View>
      </AnimatedEntrance>

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
            <Icon name="warning" size={16} color={CARPOOL_SITE.signalDeep} />
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

function createStyles() {
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
      backgroundColor: CARPOOL_SITE.signal,
    },
    kicker: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 11,
      letterSpacing: 2,
      color: CARPOOL_SITE.signalDeep,
      fontWeight: '800',
    },
    title: {
      fontFamily: CARPOOL_SITE.display,
      fontSize: 34,
      lineHeight: 36,
      color: CARPOOL_SITE.ink,
      fontWeight: '800',
      letterSpacing: -0.8,
    },
    support: {
      fontSize: 14,
      lineHeight: 20,
      color: CARPOOL_SITE.inkMuted,
      maxWidth: 340,
    },
    reminder: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 14,
      backgroundColor: CARPOOL_SITE.surface,
      borderWidth: 1,
      borderColor: CARPOOL_SITE.signal,
    },
    reminderText: {
      flex: 1,
      fontSize: 13,
      fontWeight: '700',
      color: CARPOOL_SITE.ink,
    },
    reminderCta: {
      fontSize: 12,
      fontWeight: '800',
      color: CARPOOL_SITE.signalDeep,
    },
  });
}
