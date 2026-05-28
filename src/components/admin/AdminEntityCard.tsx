import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

interface AdminEntityCardProps {
  icon: IconName;
  title: string;
  subtitle: string;
  meta?: string;
  onDelete: () => void;
  onSecondary?: () => void;
  secondaryLabel?: string;
}

export const AdminEntityCard: React.FC<AdminEntityCardProps> = ({
  icon,
  title,
  subtitle,
  meta,
  onDelete,
  onSecondary,
  secondaryLabel,
}) => (
  <View style={styles.card}>
    <View style={styles.iconWrap}>
      <Icon name={icon} size={20} color={colors.accent} />
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
      {onSecondary && secondaryLabel ? (
        <TouchableOpacity style={styles.secondaryBtn} onPress={onSecondary} activeOpacity={0.85}>
          <Text style={styles.secondaryText}>{secondaryLabel}</Text>
        </TouchableOpacity>
      ) : null}
      <TouchableOpacity style={styles.deleteBtn} onPress={onDelete} activeOpacity={0.85}>
        <Icon name="close" size={18} color={colors.brandInverse} />
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '900', color: colors.text, lineHeight: 20 },
  subtitle: { fontSize: 12, color: colors.textSecondary, marginTop: 4, lineHeight: 17 },
  meta: { fontSize: 11, color: colors.textMuted, marginTop: 4, fontWeight: '600' },
  actionsCol: { alignItems: 'flex-end', gap: spacing.xs },
  secondaryBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.background,
  },
  secondaryText: { fontSize: 10, fontWeight: '800', color: colors.text },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.accent,
  },
});
