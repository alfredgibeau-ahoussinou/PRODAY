import React, { useEffect, useMemo } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Animated, {
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ProDayText } from '../ui/ProDayText';
import { AuthGreetingVideoBackdrop } from './AuthGreetingVideoBackdrop';
import { FootballScoreboardBanner } from './FootballScoreboardBanner';
import { useTranslation } from '../../context/LocaleContext';
import { firstNameFromDisplayName } from '../../utils/displayName';
import type { AuthGreetingPayload } from '../../services/authGreeting.controller';
import { resolveAuthGreetingClip } from '../../content/authGreetingVideos';
import { motion } from '../../theme/motion';
import { spacing } from '../../theme/designTokens';
import { prodayHaptics } from '../../utils/prodayHaptics';

const WELCOME_HOLD_MS = 2600;
const GOODBYE_HOLD_MS = 2200;
const ENTER_MS = 480;
const EXIT_MS = 360;

interface AuthGreetingOverlayProps {
  greeting: AuthGreetingPayload;
  onDone: () => void;
}

const GreetingScene: React.FC<{
  greeting: AuthGreetingPayload;
  name: string;
  eyebrow: string;
  subtitle: string;
  onDone: () => void;
}> = ({ greeting, name, eyebrow, subtitle, onDone }) => {
  const insets = useSafeAreaInsets();
  const clip = useMemo(() => resolveAuthGreetingClip(greeting.kind), [greeting.kind]);
  const holdMs = greeting.kind === 'welcome' ? WELCOME_HOLD_MS : GOODBYE_HOLD_MS;

  const backdrop = useSharedValue(0);
  const card = useSharedValue(0);

  useEffect(() => {
    if (greeting.kind === 'welcome') prodayHaptics.confirm();
    else prodayHaptics.tabSwitch();

    backdrop.value = withTiming(1, { duration: ENTER_MS, easing: motion.easing.out });
    card.value = withDelay(
      100,
      withTiming(1, { duration: ENTER_MS, easing: motion.easing.out }),
    );

    const exitTimer = setTimeout(() => {
      card.value = withTiming(0, { duration: EXIT_MS, easing: motion.easing.in });
      backdrop.value = withTiming(0, { duration: EXIT_MS, easing: motion.easing.in }, (done) => {
        if (done) runOnJS(onDone)();
      });
    }, holdMs);

    return () => clearTimeout(exitTimer);
  }, [backdrop, card, greeting.kind, holdMs, onDone]);

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: backdrop.value,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    opacity: card.value,
    transform: [
      { translateY: interpolate(card.value, [0, 1], [28, 0]) },
    ],
  }));

  return (
    <View style={styles.root}>
      <Animated.View style={[StyleSheet.absoluteFill, backdropStyle]}>
        <AuthGreetingVideoBackdrop clip={clip} active />
      </Animated.View>

      <View
        style={[
          styles.content,
          { paddingTop: insets.top + spacing.lg, paddingBottom: insets.bottom + spacing.xl },
        ]}
      >
        <Animated.View style={cardStyle}>
          <FootballScoreboardBanner
            eyebrow={eyebrow}
            name={name}
            subtitle={subtitle}
            variant={greeting.kind}
          />
        </Animated.View>
      </View>

      <View style={[styles.creditWrap, { bottom: insets.bottom + spacing.sm }]}>
        <ProDayText variant="caption" inverse muted style={styles.credit}>
          {clip.credit}
        </ProDayText>
      </View>
    </View>
  );
};

export const AuthGreetingOverlay: React.FC<AuthGreetingOverlayProps> = ({ greeting, onDone }) => {
  const { t } = useTranslation();

  const firstName = firstNameFromDisplayName(greeting.displayName);
  const name = firstName || greeting.displayName.trim() || t('auth.greeting.fallbackName');
  const isWelcome = greeting.kind === 'welcome';

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={onDone}>
      <GreetingScene
        greeting={greeting}
        name={name}
        eyebrow={isWelcome ? t('auth.greeting.welcomeEyebrow') : t('auth.greeting.goodbyeEyebrow')}
        subtitle={isWelcome ? t('auth.greeting.welcomeSub') : t('auth.greeting.goodbyeSub')}
        onDone={onDone}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.md,
  },
  creditWrap: {
    position: 'absolute',
    right: spacing.md,
    opacity: 0.55,
  },
  credit: {
    fontSize: 9,
    letterSpacing: 0.4,
  },
});
