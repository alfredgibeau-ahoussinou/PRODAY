import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { useAdminStyles, adminChrome } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminHeroProps {
  email?: string;
  onBack: () => void;
  backLabel?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const AdminHero: React.FC<AdminHeroProps> = ({
  email,
  onBack,
  backLabel,
  onRefresh,
  refreshing,
}) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <View style={styles.topRow}>
        <PressableSpring style={styles.backBtn} onPress={onBack} scaleTo={0.96} haptic>
          <Icon name="arrow-back" size={20} color="#FFFFFF" />
          {backLabel ? <Text style={styles.backLabel}>{backLabel}</Text> : null}
        </PressableSpring>
        {onRefresh ? (
          <PressableSpring
            style={styles.refreshBtn}
            onPress={onRefresh}
            disabled={refreshing}
            scaleTo={0.94}
            haptic
          >
            <Icon name="time" size={18} color={adminChrome.accent} />
          </PressableSpring>
        ) : null}
      </View>

      <Text style={styles.brand}>ProDay</Text>
      <Text style={styles.title}>Admin</Text>
      <Text style={styles.subtitle}>Utilisateurs · contenus · ops</Text>
      {email ? <Text style={styles.email}>{email}</Text> : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: '#0F172A',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.xl,
    },
    topRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    backBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      height: 40,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    backLabel: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
    refreshBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.2)',
      backgroundColor: 'rgba(255,255,255,0.08)',
      alignItems: 'center',
      justifyContent: 'center',
    },
    brand: {
      color: adminChrome.accent,
      fontSize: 12,
      fontWeight: '900',
      letterSpacing: 1.6,
      marginBottom: 4,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    subtitle: {
      color: 'rgba(255,255,255,0.55)',
      fontSize: 13,
      marginTop: 6,
    },
    email: {
      color: 'rgba(255,255,255,0.45)',
      fontSize: 12,
      marginTop: spacing.sm,
      fontWeight: '600',
    },
  });
}
