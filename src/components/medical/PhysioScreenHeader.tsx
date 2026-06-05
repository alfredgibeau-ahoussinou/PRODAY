import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { MEDICAL_THEME } from '../../content/medicalExperience';
import { spacing, radius } from '../../theme/designTokens';
import { useMedicalStyles } from './medicalStyles';
import type { AppColors } from '../../theme/universeTheme';

interface PhysioScreenHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
}

export const PhysioScreenHeader: React.FC<PhysioScreenHeaderProps> = ({
  label = 'Pôle santé ProDay',
  title,
  subtitle,
}) => {
  const { colors: c } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.wrap}>
      <View style={styles.badge}>
        <Icon name="heart" size={14} color={MEDICAL_THEME.primary} variant="filled" />
        <Text style={styles.badgeText}>{label}</Text>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: MEDICAL_THEME.primaryBg,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: MEDICAL_THEME.primaryBorder,
      marginBottom: spacing.lg,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      backgroundColor: MEDICAL_THEME.primarySoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      marginBottom: spacing.sm,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '900',
      color: MEDICAL_THEME.primary,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    title: {
      fontSize: 24,
      fontWeight: '900',
      color: c.text,
    },
    sub: {
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 20,
      marginTop: spacing.sm,
    },
  });
}
