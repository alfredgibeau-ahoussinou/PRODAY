import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '../ui/Icon';
import { colors, spacing } from '../../theme/designTokens';

interface AdminHeroProps {
  email?: string;
  onBack: () => void;
  backLabel?: string;
  onRefresh?: () => void;
  refreshing?: boolean;
}

export const AdminHero: React.FC<AdminHeroProps> = ({
  email,
  onBack,
  backLabel,
  onRefresh,
  refreshing,
}) => (
  <View style={styles.wrap}>
    <View style={styles.topRow}>
      <TouchableOpacity style={styles.backBtn} onPress={onBack} accessibilityLabel={backLabel ?? 'Retour'}>
        <Icon name="arrow-back" size={22} color={colors.brandInverse} />
        {backLabel ? <Text style={styles.backLabel}>{backLabel}</Text> : null}
      </TouchableOpacity>
      {onRefresh ? (
        <TouchableOpacity style={styles.refreshBtn} onPress={onRefresh} disabled={refreshing}>
          <Icon name="time" size={20} color={colors.brandInverse} />
        </TouchableOpacity>
      ) : null}
    </View>

    <View style={styles.brandRow}>
      <View style={styles.brandMark}>
        <Text style={styles.brandText}>PRODAY</Text>
      </View>
      <View style={styles.adminPill}>
        <Icon name="shield" size={12} color={colors.brandInverse} />
        <Text style={styles.adminPillText}>ADMIN</Text>
      </View>
    </View>

    <Text style={styles.title}>Console de pilotage</Text>
    <Text style={styles.subtitle}>Gestion plateforme · utilisateurs · contenus</Text>
    {email ? <Text style={styles.email}>{email}</Text> : null}
    <View style={styles.accentLine} />
  </View>
);

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.surfaceInverse,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
    borderBottomWidth: 3,
    borderBottomColor: colors.accent,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  backLabel: { color: colors.brandInverse, fontWeight: '800', fontSize: 13 },
  refreshBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: 'rgba(0,51,153,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  brandMark: {
    borderWidth: 1,
    borderColor: colors.brandInverse,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  brandText: {
    color: colors.brandInverse,
    fontWeight: '900',
    fontSize: 11,
    letterSpacing: 3,
  },
  adminPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accent,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  adminPillText: {
    color: colors.brandInverse,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  title: {
    color: colors.brandInverse,
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  subtitle: {
    color: colors.heroMuted,
    fontSize: 13,
    marginTop: 6,
    lineHeight: 18,
  },
  email: {
    color: colors.heroMuted,
    fontSize: 12,
    marginTop: spacing.sm,
    fontWeight: '600',
  },
  accentLine: {
    height: 4,
    width: 48,
    backgroundColor: colors.accent,
    marginTop: spacing.lg,
  },
});
