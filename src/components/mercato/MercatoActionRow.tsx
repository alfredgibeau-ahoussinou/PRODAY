import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import type { AppColors } from '../../theme/universeTheme';
import { spacing, radius, shadows } from '../../theme/designTokens';

interface MercatoActionRowProps {
  colors: AppColors;
  showFavorites: boolean;
  staffLabel: string;
  staffCount?: string;
  onFavorites: () => void;
  onStaff: () => void;
}

export const MercatoActionRow: React.FC<MercatoActionRowProps> = ({
  colors,
  showFavorites,
  staffLabel,
  staffCount,
  onFavorites,
  onStaff,
}) => (
  <View style={styles.row}>
    {showFavorites ? (
      <PressableSpring
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
          shadows.soft,
        ]}
        onPress={onFavorites}
        scaleTo={0.96}
        haptic
      >
        <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
          <Icon name="bookmark" size={18} color={colors.brand} variant="filled" />
        </View>
        <Text style={[styles.label, { color: colors.text }]}>Mes favoris</Text>
      </PressableSpring>
    ) : null}
    <PressableSpring
      style={[
        styles.card,
        styles.cardFlex,
        { backgroundColor: colors.surface, borderColor: colors.border },
        shadows.soft,
      ]}
      onPress={onStaff}
      scaleTo={0.96}
      haptic
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
        <Icon name="people" size={18} color={colors.brand} variant="filled" />
      </View>
      <View style={styles.copy}>
        <Text style={[styles.label, { color: colors.text }]}>{staffLabel}</Text>
        {staffCount ? (
          <Text style={[styles.meta, { color: colors.textMuted }]}>{staffCount}</Text>
        ) : null}
      </View>
      <Icon name="chevron-forward" size={18} color={colors.brand} />
    </PressableSpring>
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 56,
  },
  cardFlex: {
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1 },
  label: { fontSize: 14, fontWeight: '800' },
  meta: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
