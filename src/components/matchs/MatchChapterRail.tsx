import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Platform, View } from 'react-native';
import type { MatchChapterId } from '../../content/matchChapters';
import { useTranslation } from '../../context/LocaleContext';
import { getMatchChapters } from '../../i18n/localizedChapters';
import { PressableSpring } from '../motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';

interface MatchChapterRailProps {
  active: MatchChapterId;
  onSelect: (id: MatchChapterId) => void;
  amicauxBadge?: number;
  convocationsBadge?: number;
  centreBadge?: number | string;
}

/** Navigation Matchs — pilules horizontales avec icônes. */
export const MatchChapterRail: React.FC<MatchChapterRailProps> = ({
  active,
  onSelect,
  amicauxBadge,
  convocationsBadge,
  centreBadge,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const chapters = useMemo(() => getMatchChapters(t), [t]);
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.scroll}
      style={styles.wrap}
    >
      {chapters.map((ch) => {
        const on = ch.id === active;
        const badge =
          ch.id === 'amicaux' && amicauxBadge && amicauxBadge > 0
            ? amicauxBadge
            : ch.id === 'convocations' && convocationsBadge && convocationsBadge > 0
              ? convocationsBadge
              : ch.id === 'centre' && centreBadge
                ? centreBadge
                : null;

        return (
          <PressableSpring
            key={ch.id}
            style={[
              styles.pill,
              {
                backgroundColor: on ? colors.accent : colors.surface,
                borderColor: on ? colors.accent : colors.border,
              },
            ]}
            onPress={() => {
              if (!on) {
                prodayHaptics.tabSwitch();
                onSelect(ch.id);
              }
            }}
            scaleTo={0.96}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: on ? 'rgba(255,255,255,0.16)' : colors.accentSoft },
              ]}
            >
              <Icon
                name={ch.icon}
                size={15}
                color={on ? colors.brandInverse : colors.accent}
                variant={on ? 'filled' : 'outline'}
              />
            </View>
            <ProDayText
              variant="caption"
              inverse={on}
              style={[styles.label, !on && { color: colors.text }]}
            >
              {ch.shortLabel}
            </ProDayText>
            {badge ? (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: on ? colors.brandInverse : colors.accent },
                ]}
              >
                <ProDayText
                  variant="caption"
                  style={{
                    color: on ? colors.accent : colors.brandInverse,
                    fontWeight: '900',
                    fontSize: 10,
                  }}
                >
                  {typeof badge === 'number' && badge > 9 ? '9+' : badge}
                </ProDayText>
              </View>
            ) : null}
          </PressableSpring>
        );
      })}
    </ScrollView>
  );
};

function createStyles(c: { surface: string }) {
  return StyleSheet.create({
    wrap: {
      flexGrow: 0,
      backgroundColor: c.surface,
    },
    scroll: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    iconWrap: {
      width: 28,
      height: 28,
      borderRadius: 14,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      fontFamily: fontFamily.extrabold,
      fontWeight: '800',
      fontSize: 13,
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
  });
}
