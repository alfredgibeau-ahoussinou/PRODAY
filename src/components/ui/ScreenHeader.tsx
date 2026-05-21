import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing } from '../../theme/designTokens';
import { Icon } from './Icon';
import { Logo } from '../Logo';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
  onMenu?: () => void;
  rightAction?: React.ReactNode;
  /** Barre centrée type maquette profil / vérification */
  centered?: boolean;
  /** Petit logo ProDay au-dessus du titre (onglets principaux) */
  showBrandLogo?: boolean;
}

export const ScreenHeader: React.FC<ScreenHeaderProps> = ({
  title,
  subtitle,
  onBack,
  onMenu,
  rightAction,
  centered = false,
  showBrandLogo = false,
}) => {
  if (centered || onBack) {
    return (
      <View style={styles.wrap}>
        <View style={styles.bar}>
          {onBack ? (
            <TouchableOpacity onPress={onBack} style={styles.side} hitSlop={12}>
              <Ionicons name="chevron-back" size={24} color={colors.brand} />
            </TouchableOpacity>
          ) : (
            <View style={styles.side} />
          )}
          <Text style={styles.barTitle} numberOfLines={1}>
            {title}
          </Text>
          {rightAction ?? (
            onMenu ? (
              <TouchableOpacity onPress={onMenu} style={styles.side} hitSlop={12}>
                <Icon name="menu" size={20} color={colors.text} />
              </TouchableOpacity>
            ) : (
              <View style={styles.side} />
            )
          )}
        </View>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      {showBrandLogo && (
        <View style={styles.brandRow}>
          <Logo variant="light" width={88} />
        </View>
      )}
      <View style={styles.row}>
        <View style={styles.titles}>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitleInline}>{subtitle}</Text> : null}
        </View>
        {rightAction}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  side: { width: 40, alignItems: 'center', justifyContent: 'center' },
  barTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  brandRow: {
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
  },
  titles: { flex: 1 },
  title: { fontSize: 26, fontWeight: '800', color: colors.text },
  subtitleInline: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  subtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginTop: 4,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
  },
});
