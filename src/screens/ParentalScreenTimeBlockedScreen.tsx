import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/ui/Icon';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDayGradient } from '../components/ui/ProDayGradient';
import { PressableSpring } from '../components/motion';
import type { ScreenTimeBlockReason } from '../utils/parentalScreenTime';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';

interface ParentalScreenTimeBlockedScreenProps {
  minutesUsed: number;
  limitMinutes: number;
  reason?: ScreenTimeBlockReason;
  onSignOut: () => void;
}

export const ParentalScreenTimeBlockedScreen: React.FC<ParentalScreenTimeBlockedScreenProps> = ({
  minutesUsed,
  limitMinutes,
  reason,
  onSignOut,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();

  const title =
    reason === 'off_day'
      ? 'Pause du jour'
      : 'Limite de temps atteinte';

  const body =
    reason === 'off_day'
      ? 'ProDay n’est pas disponible aujourd’hui selon le contrôle parental configuré sur ce compte.'
      : `Vous avez utilisé ${minutesUsed} min sur ${limitMinutes} min autorisées aujourd’hui. Revenez demain ou demandez à votre tuteur.`;

  return (
    <SafeAreaView style={[styles.root, rootStyle]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <Icon name="time" size={40} color={c.textMuted} />
        <ProDayText variant="title" style={styles.title}>
          {title}
        </ProDayText>
        <ProDayText variant="body" muted style={styles.body}>
          {body}
        </ProDayText>
        <PressableSpring onPress={onSignOut} scaleTo={0.97} haptic>
          <ProDayGradient kind="cta" style={styles.cta}>
            <ProDayText variant="section" inverse style={styles.ctaText}>
              Se déconnecter
            </ProDayText>
          </ProDayGradient>
        </PressableSpring>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  title: { textAlign: 'center' },
  body: { textAlign: 'center', lineHeight: 22 },
  cta: {
    marginTop: spacing.lg,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  ctaText: { fontWeight: '800' },
});
