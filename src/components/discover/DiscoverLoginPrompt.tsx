import React, { useEffect } from 'react';
import { Text, StyleSheet, View } from 'react-native';
import Animated, {
  FadeInDown,
  FadeOutDown,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { PressableSpring } from './PressableSpring';
import { Icon } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

interface DiscoverLoginPromptProps {
  visible: boolean;
  message?: string;
  onLogin: () => void;
  onDismiss: () => void;
}

export const DiscoverLoginPrompt: React.FC<DiscoverLoginPromptProps> = ({
  visible,
  message = 'Créez un compte gratuit pour accéder à tout ProDay.',
  onLogin,
  onDismiss,
}) => {
  const pulse = useSharedValue(1);

  useEffect(() => {
    if (!visible) return;
    pulse.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 800 }),
        withTiming(1, { duration: 800 })
      ),
      -1,
      false
    );
  }, [visible, pulse]);

  const cardAnim = useAnimatedStyle(() => ({
    transform: [{ scale: pulse.value }],
  }));

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeInDown.springify().damping(18)}
      exiting={FadeOutDown.duration(200)}
      style={styles.wrap}
    >
      <Animated.View style={[styles.card, cardAnim]}>
        <View style={styles.accentBar} />
        <View style={styles.row}>
          <View style={styles.iconWrap}>
            <Icon name="lock" size={22} color={colors.accent} variant="filled" />
          </View>
          <View style={styles.body}>
            <Text style={styles.title}>Connexion requise</Text>
            <Text style={styles.msg}>{message}</Text>
          </View>
        </View>
        <View style={styles.actions}>
          <PressableSpring style={styles.btnPrimary} onPress={onLogin}>
            <Text style={styles.btnPrimaryText}>Créer mon compte</Text>
          </PressableSpring>
          <PressableSpring style={styles.btnGhost} onPress={onDismiss}>
            <Text style={styles.btnGhostText}>Plus tard</Text>
          </PressableSpring>
        </View>
      </Animated.View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: spacing.lg,
    right: spacing.lg,
    bottom: 96,
    zIndex: 50,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  accentBar: {
    height: 4,
    backgroundColor: colors.accent,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 16, fontWeight: '900', color: colors.text },
  msg: { fontSize: 13, color: colors.textSecondary, marginTop: 4, lineHeight: 18 },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  btnPrimary: {
    flex: 1,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnPrimaryText: { color: colors.brandInverse, fontWeight: '900', fontSize: 14 },
  btnGhost: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
  },
  btnGhostText: { color: colors.textMuted, fontWeight: '700', fontSize: 13 },
});
