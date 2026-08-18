import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon, type IconName } from '../ui/Icon';
import { useAdminStyles, adminChrome, ADMIN_ON_ACCENT } from './adminStyles';
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
          <PressableSpring style={styles.primaryBtn} onPress={onPrimary} scaleTo={0.96} haptic>
            <Text style={styles.primaryText}>{primaryLabel}</Text>
          </PressableSpring>
        ) : null}
        {onSecondary && secondaryLabel ? (
          <PressableSpring style={styles.secondaryBtn} onPress={onSecondary} scaleTo={0.96} haptic>
            <Text style={styles.secondaryText}>{secondaryLabel}</Text>
          </PressableSpring>
        ) : null}
        {onDelete ? (
          <PressableSpring style={styles.deleteBtn} onPress={onDelete} scaleTo={0.94} haptic>
            <Icon name="close" size={16} color={c.error} />
          </PressableSpring>
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
    primaryBtn: {
      backgroundColor: adminChrome.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: 9,
      borderRadius: radius.md,
    },
    primaryText: { color: ADMIN_ON_ACCENT, fontSize: 11, fontWeight: '800' },
    secondaryBtn: {
      backgroundColor: c.surfaceMuted,
      borderWidth: 1,
      borderColor: c.border,
      paddingHorizontal: spacing.md,
      paddingVertical: 9,
      borderRadius: radius.md,
    },
    secondaryText: { color: c.text, fontSize: 11, fontWeight: '700' },
    deleteBtn: {
      width: 34,
      height: 34,
      borderRadius: radius.md,
      backgroundColor: c.errorBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });
}
