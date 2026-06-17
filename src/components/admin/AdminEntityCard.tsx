import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import { useAdminStyles } from './adminStyles';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface AdminEntityCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  meta?: string;
  onDelete: () => void;
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
        <Icon name={icon} size={20} color={c.brand} />
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
          <TouchableOpacity style={styles.primaryBtn} onPress={onPrimary} activeOpacity={0.85}>
            <Text style={styles.primaryText}>{primaryLabel}</Text>
          </TouchableOpacity>
        ) : null}
        {onSecondary && secondaryLabel ? (
          <TouchableOpacity style={styles.secondaryBtn} onPress={onSecondary} activeOpacity={0.85}>
            <Text style={styles.secondaryText}>{secondaryLabel}</Text>
          </TouchableOpacity>
        ) : null}
        <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.85}>
          <Icon name="close" size={18} color={c.brandInverse} />
        </TouchableOpacity>
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
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.sm,
      backgroundColor: c.accentSoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    copy: { flex: 1, minWidth: 0 },
    title: { fontSize: 15, fontWeight: '900', color: c.text, lineHeight: 20 },
    subtitle: { fontSize: 12, color: c.textSecondary, marginTop: 4, lineHeight: 17 },
    meta: { fontSize: 11, color: c.textMuted, marginTop: 4, fontWeight: '600' },
    actionsCol: { alignItems: 'flex-end', gap: spacing.xs },
    primaryBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.sm,
      backgroundColor: c.brand,
    },
    primaryText: { fontSize: 10, fontWeight: '900', color: c.brandInverse },
    secondaryBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.sm,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.background,
    },
    secondaryText: { fontSize: 10, fontWeight: '800', color: c.text },
    deleteBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: c.ink,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.brand,
    },
  });
}
