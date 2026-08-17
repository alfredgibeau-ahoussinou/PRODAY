import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { PressableSpring, LivePulseDot } from '../motion';
import { CoachText } from '../coach/coachPortalUi';
import type { CarpoolHubMode } from '../../content/carpoolChapters';
import { COACH_CARPOOL_MODE_KEYS, COACH_CARPOOL_MODES } from '../../content/coachCarpoolModes';
import { useTranslation } from '../../context/LocaleContext';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { radius, spacing } from '../../theme/designTokens';

type Props = {
  mode: CarpoolHubMode;
  onChange: (mode: CarpoolHubMode) => void;
  liveActive?: boolean;
  badges?: Partial<Record<CarpoolHubMode, number>>;
};

/** Pill segment bar — coach shell covoiturage (Places · Proposer · Trajets). */
export function CoachCarpoolModeBar({ mode, onChange, liveActive, badges }: Props) {
  const { t } = useTranslation();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);

  return (
    <View style={styles.row}>
      {COACH_CARPOOL_MODES.map((id) => {
        const on = mode === id;
        const badge = badges?.[id];
        const live = id === 'trips' && liveActive;

        return (
          <PressableSpring
            key={id}
            onPress={() => {
              prodayHaptics.tabSwitch();
              onChange(id);
            }}
            scaleTo={0.97}
            haptic
            style={[styles.segment, on && styles.segmentOn]}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            accessibilityLabel={t(COACH_CARPOOL_MODE_KEYS[id])}
          >
            <View style={styles.segmentInner}>
              {live ? <LivePulseDot active size={6} color={tokens.accent} /> : null}
              <CoachText
                variant="caption"
                accent={on}
                muted={!on}
                style={on ? styles.labelOn : styles.labelOff}
                numberOfLines={1}
              >
                {t(COACH_CARPOOL_MODE_KEYS[id])}
              </CoachText>
              {badge != null && badge > 0 ? (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{badge > 9 ? '9+' : String(badge)}</Text>
                </View>
              ) : null}
            </View>
          </PressableSpring>
        );
      })}
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    segment: {
      flex: 1,
      minHeight: 40,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    segmentOn: {
      borderColor: tokens.accent,
      backgroundColor: tokens.soft,
    },
    segmentInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingHorizontal: spacing.xs,
    },
    labelOn: { fontWeight: '800', fontSize: 12 },
    labelOff: { fontWeight: '600', fontSize: 12 },
    badge: {
      minWidth: 16,
      height: 16,
      borderRadius: 8,
      paddingHorizontal: 4,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accent,
    },
    badgeText: { fontSize: 9, fontWeight: '900', color: tokens.onAccent },
  });
}
