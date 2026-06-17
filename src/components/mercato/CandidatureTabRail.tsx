import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  type CandidatureChapterId,
} from '../../content/candidatureChapters';
import { getCandidatureChapters } from '../../i18n/localizedChapters';
import { PressableSpring } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

interface CandidatureTabRailProps {
  active: CandidatureChapterId;
  onSelect: (id: CandidatureChapterId) => void;
  suiviBadge?: number;
}

/** Segments Annonces / Suivi — style pilules natives. */
export const CandidatureTabRail: React.FC<CandidatureTabRailProps> = ({
  active,
  onSelect,
  suiviBadge,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const chapters = useMemo(() => getCandidatureChapters(t), [t]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.track, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
        {chapters.map((ch) => {
          const on = ch.id === active;
          const badge = ch.id === 'suivi' && suiviBadge && suiviBadge > 0 ? suiviBadge : null;
          return (
            <PressableSpring
              key={ch.id}
              style={[
                styles.segment,
                on && { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={() => {
                prodayHaptics.tabSwitch();
                onSelect(ch.id);
              }}
              scaleTo={0.98}
            >
              <View style={styles.segmentInner}>
                <Text
                  style={[
                    styles.label,
                    { color: on ? colors.text : colors.textMuted },
                  ]}
                >
                  {ch.label}
                </Text>
                {badge ? (
                  <View style={[styles.badge, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.badgeText, { color: colors.brandInverse }]}>
                      {badge > 9 ? '9+' : badge}
                    </Text>
                  </View>
                ) : null}
              </View>
            </PressableSpring>
          );
        })}
      </View>
    </View>
  );
};

function createStyles(c: { surface: string }) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      backgroundColor: c.surface,
    },
    track: {
      flexDirection: 'row',
      padding: 4,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      gap: 4,
    },
    segment: {
      flex: 1,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'transparent',
      minHeight: 40,
      justifyContent: 'center',
    },
    segmentInner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
    },
    label: {
      fontFamily: fontFamily.extrabold,
      fontSize: 14,
      fontWeight: '800',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    badge: {
      minWidth: 18,
      height: 18,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 4,
    },
    badgeText: {
      fontFamily: fontFamily.extrabold,
      fontSize: 10,
      fontWeight: '900',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
