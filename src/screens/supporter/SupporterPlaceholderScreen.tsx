import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ProductLineContext';
import { useLaunchIntro } from '../../context/LaunchIntroContext';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { PressableSpring } from '../../components/motion';
import { spacing, radius } from '../../theme/designTokens';

type Props = {
  title: string;
  subtitle?: string;
};

/** Écran vide — terrain pour le rebuild supporter + sortie claire. */
export const SupporterPlaceholderScreen: React.FC<Props> = ({
  title,
  subtitle = 'Espace en préparation. Contenu à venir.',
}) => {
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const { openSpacePicker } = useLaunchIntro();
  const { setActiveTab } = useTabNavigation();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: 24,
          paddingTop: Math.max(insets.top, 24) + 24,
          paddingBottom: Math.max(insets.bottom, 16) + 24,
          justifyContent: 'center',
          gap: spacing.md,
        },
        title: {
          color: colors.text,
          fontSize: 22,
          fontWeight: '700',
        },
        subtitle: {
          color: colors.textMuted,
          fontSize: 15,
          lineHeight: 22,
        },
        actions: {
          marginTop: spacing.md,
          gap: spacing.sm,
          alignSelf: 'stretch',
        },
        cta: {
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm + 2,
          borderRadius: radius.md,
          backgroundColor: colors.brand,
          minHeight: 44,
        },
        ctaSecondary: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
        },
        ctaLabel: {
          color: colors.brandInverse ?? '#fff',
          fontWeight: '700',
          fontSize: 14,
        },
        ctaLabelSecondary: {
          color: colors.text,
        },
      }),
    [colors, insets.top, insets.bottom],
  );

  return (
    <View style={styles.root} accessibilityRole="summary">
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={styles.actions}>
        <PressableSpring
          onPress={() => setActiveTab('home')}
          scaleTo={0.97}
          haptic
          hitSlop={12}
          style={styles.cta}
          accessibilityRole="button"
          accessibilityLabel="Retour à l'accueil"
        >
          <Text style={styles.ctaLabel}>Retour à l’accueil</Text>
        </PressableSpring>
        <PressableSpring
          onPress={openSpacePicker}
          scaleTo={0.97}
          hitSlop={12}
          style={[styles.cta, styles.ctaSecondary]}
          accessibilityRole="button"
          accessibilityLabel="Changer d'univers"
        >
          <Text style={[styles.ctaLabel, styles.ctaLabelSecondary]}>Changer d’univers</Text>
        </PressableSpring>
      </View>
    </View>
  );
};
