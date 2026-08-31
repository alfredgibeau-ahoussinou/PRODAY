import React, { useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { PressableSpring, LivePulseDot } from '../motion';
import { Icon } from '../ui/Icon';
import { useTranslation } from '../../context/LocaleContext';
import { motion } from '../../theme/motion';
import { prodayHaptics } from '../../utils/prodayHaptics';
import type { CarpoolHubMode } from '../../content/carpoolChapters';
import {
  type CarpoolUiPalette,
  useCarpoolThemedStyles,
  useCarpoolUi,
} from './CarpoolUiContext';

export type { CarpoolHubMode };

interface CarpoolModeSwitcherProps {
  mode: CarpoolHubMode;
  onChange: (mode: CarpoolHubMode) => void;
  liveActive?: boolean;
  badges?: Partial<Record<CarpoolHubMode, number>>;
}

const MODES: { id: CarpoolHubMode; icon: 'walk' | 'car' | 'time' }[] = [
  { id: 'ride', icon: 'walk' },
  { id: 'drive', icon: 'car' },
  { id: 'trips', icon: 'time' },
];

function ModeCard({
  active,
  icon,
  label,
  badge,
  live,
  onPress,
  styles,
  palette,
}: {
  active: boolean;
  icon: 'walk' | 'car' | 'time';
  label: string;
  badge?: number;
  live?: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  palette: CarpoolUiPalette;
}) {
  const lift = useSharedValue(active ? 1 : 0);

  useEffect(() => {
    lift.value = withSpring(active ? 1 : 0, motion.spring.bouncy);
  }, [active, lift]);

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ translateY: -3 * lift.value }, { scale: 1 + 0.015 * lift.value }],
  }));

  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.96}
      haptic
      style={styles.press}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      <Animated.View style={[styles.card, active && styles.cardOn, cardAnim]}>
        <View style={styles.topRow}>
          {live ? <LivePulseDot active size={8} color={palette.signal} /> : <View style={styles.pulseSpacer} />}
          {badge != null && badge > 0 ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{badge > 9 ? '9+' : String(badge)}</Text>
            </View>
          ) : (
            <View style={styles.pulseSpacer} />
          )}
        </View>
        <View style={[styles.iconOrb, active && styles.iconOrbOn]}>
          <Icon
            name={icon}
            size={22}
            color={active ? palette.onSignal : palette.signalDeep}
            variant="filled"
          />
        </View>
        <Text
          style={[styles.label, active && styles.labelOn]}
          numberOfLines={2}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {label}
        </Text>
        {active ? <View style={styles.activeBar} /> : null}
      </Animated.View>
    </PressableSpring>
  );
}

/** Passager / Conducteur / Trajets — libellés complets, jamais coupés. */
export const CarpoolModeSwitcher: React.FC<CarpoolModeSwitcherProps> = ({
  mode,
  onChange,
  liveActive,
  badges,
}) => {
  const { t } = useTranslation();
  const palette = useCarpoolUi();
  const styles = useCarpoolThemedStyles(createStyles);

  return (
    <View style={styles.wrap}>
      {MODES.map((item) => (
        <ModeCard
          key={item.id}
          active={mode === item.id}
          icon={item.icon}
          label={t(`carpool.hub.mode.${item.id}`)}
          badge={badges?.[item.id]}
          live={item.id === 'trips' && liveActive}
          onPress={() => {
            prodayHaptics.tabSwitch();
            onChange(item.id);
          }}
          styles={styles}
          palette={palette}
        />
      ))}
    </View>
  );
};

function createStyles(palette: CarpoolUiPalette) {
  return StyleSheet.create({
    wrap: {
      flexDirection: 'row',
      gap: 8,
    },
    press: { flex: 1, minWidth: 0 },
    card: {
      minHeight: 112,
      paddingTop: 8,
      paddingBottom: 14,
      paddingHorizontal: 6,
      gap: 8,
      alignItems: 'center',
      backgroundColor: palette.surface,
      borderWidth: 1.5,
      borderColor: palette.fog,
      borderRadius: 18,
      overflow: 'hidden',
    },
    cardOn: {
      borderColor: palette.signal,
      backgroundColor: palette.surfaceMuted,
    },
    topRow: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 6,
      minHeight: 18,
    },
    pulseSpacer: { width: 18, height: 8 },
    iconOrb: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.signalSoft,
    },
    iconOrbOn: {
      backgroundColor: palette.signal,
    },
    badge: {
      minWidth: 20,
      height: 20,
      borderRadius: 10,
      paddingHorizontal: 5,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: palette.ink,
    },
    badgeText: { fontSize: 10, fontWeight: '900', color: palette.bg },
    label: {
      fontSize: 13,
      lineHeight: 16,
      fontWeight: '800',
      color: palette.ink,
      textAlign: 'center',
      width: '100%',
      paddingHorizontal: 2,
    },
    labelOn: { color: palette.signalDeep },
    activeBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      height: 4,
      backgroundColor: palette.signal,
    },
  });
}
