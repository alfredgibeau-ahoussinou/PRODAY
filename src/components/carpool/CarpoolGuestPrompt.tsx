import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface CarpoolGuestPromptProps {
  onLogin: () => void;
  onSignup: () => void;
}

export const CarpoolGuestPrompt: React.FC<CarpoolGuestPromptProps> = ({ onLogin, onSignup }) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.wrap}>
      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <Icon name="car" size={36} color={colors.accent} variant="filled" />
        <ProDayText variant="section" style={styles.title}>
          Covoiturage équipe
        </ProDayText>
        <ProDayText variant="body" muted style={styles.body}>
          Connectez-vous pour voir vos convocations, réserver une place ou proposer un trajet.
        </ProDayText>
        <PressableSpring onPress={onLogin} scaleTo={0.97} haptic>
          <ProDayGradient kind="cta" style={styles.primary}>
            <ProDayText variant="caption" inverse style={styles.btnText}>
              Se connecter
            </ProDayText>
          </ProDayGradient>
        </PressableSpring>
        <PressableSpring
          onPress={onSignup}
          scaleTo={0.98}
          haptic
          style={[
            styles.secondary,
            { borderColor: colors.borderStrong, backgroundColor: colors.surfaceMuted },
          ]}
        >
          <ProDayText variant="caption" accent style={styles.link}>
            Créer un compte
          </ProDayText>
        </PressableSpring>
      </ProDaySurface>
    </View>
  );
};

function createStyles() {
  return StyleSheet.create({
    wrap: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xl,
    },
    card: {
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.xl,
      borderWidth: 1,
    },
    title: { textAlign: 'center' },
    body: { textAlign: 'center', lineHeight: 21 },
    primary: {
      marginTop: spacing.md,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      minWidth: 220,
      alignItems: 'center',
    },
    btnText: { fontWeight: '800' },
    secondary: {
      marginTop: spacing.sm,
      paddingHorizontal: spacing.xl,
      paddingVertical: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      minWidth: 220,
      alignItems: 'center',
    },
    link: { fontWeight: '800' },
  });
}
