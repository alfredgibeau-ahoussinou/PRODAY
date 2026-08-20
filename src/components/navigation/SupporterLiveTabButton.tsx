import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Icon } from '../ui/Icon';
import { SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { shadows, spacing } from '../../theme/designTokens';

type Props = {
  active?: boolean;
  onPress: () => void;
};

/** FAB LIVE centre — accent électrique, distinct du dock joueur. */
export const SupporterLiveTabButton: React.FC<Props> = ({ active, onPress }) => {
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 0.85, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel="Live"
      testID="main-tab-live"
    >
      <Animated.View
        style={[
          styles.btn,
          active && styles.btnActive,
          { transform: [{ scale: pulse }] },
          shadows.interactive,
        ]}
      >
        <Icon name="volume-high" size={26} color="#000" variant="filled" />
      </Animated.View>
      <Text style={[styles.label, active && styles.labelActive]}>LIVE</Text>
    </Pressable>
  );
};

const BTN = 56;

const styles = StyleSheet.create({
  wrap: {
    width: 72,
    alignItems: 'center',
    marginTop: -12,
    gap: 3,
    zIndex: 2,
  },
  btn: {
    width: BTN,
    height: BTN,
    borderRadius: BTN / 2,
    backgroundColor: SUPPORTER_SITE.live,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.35)',
  },
  btnActive: {
    backgroundColor: '#00E5A0',
    borderColor: SUPPORTER_SITE.accent,
  },
  label: {
    fontSize: 10,
    fontWeight: '800',
    color: SUPPORTER_SITE.muted,
    letterSpacing: 0.8,
  },
  labelActive: { color: SUPPORTER_SITE.live },
});
