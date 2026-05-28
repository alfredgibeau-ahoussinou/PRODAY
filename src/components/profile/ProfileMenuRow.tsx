import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import { colors, spacing, radius } from '../../theme/designTokens';

interface ProfileMenuRowProps {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
  badge?: string;
}

export const ProfileMenuRow: React.FC<ProfileMenuRowProps> = ({
  icon,
  title,
  subtitle,
  onPress,
  danger,
  badge,
}) => (
  <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
    <View style={[styles.iconBox, danger && styles.iconBoxDanger]}>
      <Icon name={icon} size={20} color={danger ? colors.brandInverse : colors.text} />
    </View>
    <View style={styles.body}>
      <Text style={[styles.title, danger && styles.titleDanger]}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
    </View>
    {badge ? (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    ) : null}
    <Icon name="chevron-forward" size={18} color={colors.textMuted} />
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.surfaceMuted,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBoxDanger: { backgroundColor: colors.ink, borderColor: colors.ink },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '800', color: colors.text },
  titleDanger: { color: colors.text },
  sub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badge: {
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  badgeText: { fontSize: 10, fontWeight: '800', color: colors.accent },
});
