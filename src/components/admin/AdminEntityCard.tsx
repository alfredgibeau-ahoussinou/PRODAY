import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import { AdminButton } from './AdminButton';
import { useAdminStyles, adminChrome } from './adminStyles';
import { spacing, radius, shadows } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminEntityCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  meta?: string;
  onDelete?: () => void;
  onSecondary?: () => void;
  secondaryLabel?: string;
  onPrimary?: () => void;
  primaryLabel?: string;
}

export const AdminEntityCard: React.FC<AdminEntityCardProps> = ({
  icon,
  title,
  subtitle,
  meta,
  onDelete,
  onSecondary,
  secondaryLabel,
  onPrimary,
  primaryLabel,
}) => {
  const { colors: c } = useAdminStyles();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={styles.card}>
      <View style={styles.iconWrap}>
        <Icon name={icon} size={20} color={adminChrome.accentHot} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Text style={styles.subtitle} numberOfLines={2}>
          {subtitle}
        </Text>
        {meta ? <Text style={styles.meta}>{meta}</Text> : null}
      </View>
      <View style={styles.actionsCol}>
        {onPrimary && primaryLabel ? (
          <AdminButton label={primaryLabel} variant="primary" size="sm" onPress={onPrimary} />
        ) : null}
        {onSecondary && secondaryLabel ? (
          <AdminButton label={secondaryLabel} variant="secondary" size="sm" onPress={onSecondary} />
        ) : null}
        {onDelete ? (
          <AdminButton variant="icon" icon="close" onPress={onDelete} accessibilityLabel="Supprimer" />
        ) : null}
      </View>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      ...shadows.card,
    },
    iconWrap: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: c.brandSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, gap: 3 },
    title: { fontSize: 14, fontWeight: '800', color: c.text, letterSpacing: -0.2 },
    subtitle: { fontSize: 12, color: c.textSecondary, lineHeight: 17 },
    meta: { fontSize: 10, fontWeight: '700', color: c.textMuted, marginTop: 2 },
    actionsCol: { gap: spacing.xs, alignItems: 'flex-end' },
  });
}
