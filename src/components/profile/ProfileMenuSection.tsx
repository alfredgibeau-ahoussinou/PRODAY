import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import type { AppColors } from '../../theme/prodayWomanTheme';
import { spacing, radius } from '../../theme/designTokens';

export interface ProfileMenuItem {
  icon: IconName;
  title: string;
  subtitle?: string;
  onPress: () => void;
  accent?: boolean;
}

interface ProfileMenuSectionProps {
  title: string;
  items: ProfileMenuItem[];
  colors: AppColors;
}

export const ProfileMenuSection: React.FC<ProfileMenuSectionProps> = ({
  title,
  items,
  colors,
}) => (
  <View style={[styles.wrap, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <Text style={[styles.sectionTitle, { color: colors.textMuted }]}>{title}</Text>
    {items.map((item, index) => (
      <TouchableOpacity
        key={item.title}
        style={[
          styles.row,
          index < items.length - 1 && {
            borderBottomWidth: StyleSheet.hairlineWidth,
            borderBottomColor: colors.border,
          },
        ]}
        onPress={item.onPress}
        activeOpacity={0.85}
      >
        <View
          style={[
            styles.iconWrap,
            {
              backgroundColor: item.accent ? colors.accentSoft : colors.surfaceMuted,
            },
          ]}
        >
          <Icon name={item.icon} size={20} color={item.accent ? colors.accent : colors.ink} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>
          {item.subtitle ? (
            <Text style={[styles.sub, { color: colors.textSecondary }]}>{item.subtitle}</Text>
          ) : null}
        </View>
        <Icon name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    borderRadius: radius.xl,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '800' },
  sub: { fontSize: 12, marginTop: 2, lineHeight: 17 },
});
