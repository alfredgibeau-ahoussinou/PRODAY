import React from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { useMemo } from 'react';
import { useAppTheme, useProductLine } from '../../context/ProductLineContext';
import { useAuth } from '../../context/AuthContext';
import { PressableSpring } from '../../components/motion';
import { spacing, radius } from '../../theme/designTokens';

/** Profil scaffold + retour Parent si visite invitée. */
export const SupporterProfileScreen: React.FC = () => {
  const { colors } = useAppTheme();
  const { profile } = useAuth();
  const { parentGuestSupporter, returnParentFromSupporterGuest } = useProductLine();
  const showReturn = profile?.role === 'parent' && parentGuestSupporter;

  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: 24,
          paddingTop: 48,
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
        cta: {
          marginTop: spacing.md,
          alignSelf: 'flex-start',
          paddingHorizontal: spacing.lg,
          paddingVertical: spacing.sm,
          borderRadius: radius.md,
          backgroundColor: colors.brand,
        },
        ctaLabel: {
          color: colors.brandInverse ?? '#fff',
          fontWeight: '700',
          fontSize: 14,
        },
      }),
    [colors],
  );

  return (
    <View style={styles.root} accessibilityRole="summary">
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.subtitle}>
        Espace en préparation. Contenu à venir.
      </Text>
      {showReturn ? (
        <PressableSpring
          onPress={() => {
            void returnParentFromSupporterGuest().catch((e) =>
              Alert.alert(
                'Retour impossible',
                e instanceof Error ? e.message : 'Réessayez plus tard.',
              ),
            );
          }}
          scaleTo={0.97}
          haptic
          style={styles.cta}
          accessibilityRole="button"
          accessibilityLabel="Retour au pôle Parent"
        >
          <Text style={styles.ctaLabel}>Retour au pôle Parent</Text>
        </PressableSpring>
      ) : null}
    </View>
  );
};
