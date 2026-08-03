import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, type LayoutChangeEvent } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { motion } from '../../theme/motion';
import { spacing } from '../../theme/designTokens';
import { prodayHaptics } from '../../utils/prodayHaptics';

export type CarpoolHubMode = 'ride' | 'drive' | 'live';

interface CarpoolModeSwitcherProps {
  mode: CarpoolHubMode;
  onChange: (mode: CarpoolHubMode) => void;
  liveActive?: boolean;
}

const MODES: { id: CarpoolHubMode; labelKey: string }[] = [
  { id: 'ride', labelKey: 'carpool.chapter.reserve' },
  { id: 'drive', labelKey: 'carpool.chapter.propose' },
  { id: 'live', labelKey: 'carpool.chapter.trips' },
];

/**
 * Ruban de navigation unique — trois voies, un repère souligné qui glisse.
 * Pas de boîte, pas de pilule, pas d'icône : une seule surface de contrôle calme.
 */
export const CarpoolModeSwitcher: React.FC<CarpoolModeSwitcherProps> = ({
  mode,
  onChange,
  liveActive,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [trackW, setTrackW] = useState(0);
  const tabW = trackW > 0 ? trackW / MODES.length : 0;
  const activeIndex = Math.max(0, MODES.findIndex((m) => m.id === mode));
  const x = useSharedValue(0);

  useEffect(() => {
    if (tabW > 0) x.value = withSpring(activeIndex * tabW, motion.spring.snappy);
  }, [activeIndex, tabW, x]);

  const markerStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: x.value }],
    width: tabW,
  }));

  const onTrackLayout = (e: LayoutChangeEvent) => {
    const w = Math.round(e.nativeEvent.layout.width);
    setTrackW((prev) => (prev !== w ? w : prev));
  };

  return (
    <View style={[styles.wrap, { borderBottomColor: colors.border }]} onLayout={onTrackLayout}>
      {tabW > 0 ? (
        <Animated.View style={[styles.markerTrack, markerStyle]} pointerEvents="none">
          <View style={[styles.marker, { backgroundColor: colors.accent }]} />
        </Animated.View>
      ) : null}

      {MODES.map((item) => {
        const active = mode === item.id;
        return (
          <PressableSpring
            key={item.id}
            onPress={() => {
              prodayHaptics.tabSwitch();
              onChange(item.id);
            }}
            scaleTo={0.98}
            style={styles.tab}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
          >
            <View style={styles.labelRow}>
              <ProDayText
                variant="caption"
                style={[styles.label, { color: active ? colors.text : colors.textMuted }]}
              >
                {t(item.labelKey)}
              </ProDayText>
              {item.id === 'live' && liveActive ? (
                <View style={[styles.liveDot, { backgroundColor: colors.accent }]} />
              ) : null}
            </View>
          </PressableSpring>
        );
      })}
    </View>
  );
};

function createStyles(_colors: ReturnType<typeof useAppTheme>['colors']) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      borderBottomWidth: StyleSheet.hairlineWidth,
      paddingHorizontal: spacing.md,
    },
    markerTrack: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      height: 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    marker: { height: 2, width: 26, borderRadius: 1 },
    tab: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 14,
    },
    labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
    label: {
      fontWeight: '700',
      fontSize: 13,
      letterSpacing: 0.2,
    },
    liveDot: { width: 6, height: 6, borderRadius: 3 },
  });
}
