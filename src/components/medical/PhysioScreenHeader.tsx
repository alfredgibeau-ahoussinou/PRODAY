import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useMedicalStyles } from './medicalStyles';
import type { AppColors } from '../../theme/universeTheme';

interface PhysioScreenHeaderProps {
  label?: string;
  title: string;
  subtitle?: string;
}

/**
 * En-tête praticien — couleurs du thème pôle (FLASH sombre Santé),
 * pas le mint clair MEDICAL_THEME (police claire illisible dessus).
 */
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
        <Icon name="heart" size={14} color={c.accent} variant="filled" />
        <Text style={styles.badgeText}>{label}</Text>
      </View>
      <Text
        style={styles.title}
        numberOfLines={2}
        adjustsFontSizeToFit
        minimumFontScale={0.75}
      >
        {title}
      </Text>
      {subtitle ? (
        <Text style={styles.sub} numberOfLines={3}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.borderMedium,
      marginBottom: spacing.lg,
    },
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      alignSelf: 'flex-start',
      backgroundColor: c.brandSoft,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      marginBottom: spacing.sm,
    },
    badgeText: {
      fontSize: 10,
      fontWeight: '900',
      color: c.accent,
      letterSpacing: 0.6,
      textTransform: 'uppercase',
    },
    title: {
      fontSize: 20,
      lineHeight: 24,
      fontWeight: '800',
      color: c.text,
      flexShrink: 1,
    },
    sub: {
      fontSize: 14,
      color: c.textSecondary,
      lineHeight: 20,
      marginTop: spacing.sm,
    },
  });
}
