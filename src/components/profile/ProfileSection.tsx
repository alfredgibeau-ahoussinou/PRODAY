import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { spacing } from '../../theme/designTokens';

interface ProfileSectionProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  /** Réduit l’espace au-dessus (première section d’un onglet). */
  first?: boolean;
}

export const ProfileSection: React.FC<ProfileSectionProps> = ({
  title,
  subtitle,
  children,
  first,
}) => {
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={[styles.wrap, first && styles.wrapFirst]}>
      <View style={styles.head}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginTop: spacing.lg,
      gap: spacing.sm,
    },
    wrapFirst: {
      marginTop: spacing.md,
    },
    head: {
      gap: 2,
      paddingHorizontal: spacing.xs,
    },
    title: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.4,
      textTransform: 'uppercase',
      color: c.textMuted,
    },
    sub: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '500',
      color: c.textSecondary,
    },
  });
}
