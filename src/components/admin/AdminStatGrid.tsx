import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Icon, type IconName } from '../ui/Icon';
import type { PlatformStats } from '../../services/admin.service';
import { colors, spacing, radius } from '../../theme/designTokens';

interface AdminStatGridProps {
  stats: PlatformStats;
}

const ITEMS: {
  key: keyof PlatformStats | 'pending';
  label: string;
  icon: IconName;
  getValue: (s: PlatformStats) => number;
  alert?: boolean;
}[] = [
  { key: 'users', label: 'Utilisateurs', icon: 'people', getValue: (s) => s.users },
  { key: 'players', label: 'Joueurs', icon: 'football', getValue: (s) => s.players },
  { key: 'coaches', label: 'Coachs', icon: 'school', getValue: (s) => s.coaches },
  { key: 'agents', label: 'Agents', icon: 'briefcase', getValue: (s) => s.agents },
  { key: 'teamEvents', label: 'Événements', icon: 'calendar', getValue: (s) => s.teamEvents },
  { key: 'friendlyMatches', label: 'Matchs', icon: 'handshake', getValue: (s) => s.friendlyMatches },
  { key: 'recruitmentPosts', label: 'Annonces', icon: 'search', getValue: (s) => s.recruitmentPosts },
  { key: 'clubs', label: 'Clubs', icon: 'business', getValue: (s) => s.clubs },
  { key: 'tournaments', label: 'Tournois', icon: 'trophy', getValue: (s) => s.tournaments },
  { key: 'paymentRequests', label: 'Cotisations', icon: 'calendar', getValue: (s) => s.paymentRequests },
  { key: 'applications', label: 'Candidatures', icon: 'document', getValue: (s) => s.applications },
  {
    key: 'pending',
    label: 'Vérif. attente',
    icon: 'shield',
    getValue: (s) => s.pendingVerifications,
    alert: true,
  },
];

export const AdminStatGrid: React.FC<AdminStatGridProps> = ({ stats }) => (
  <View style={styles.wrap}>
    <Text style={styles.eyebrow}>APERÇU PLATEFORME</Text>
    <View style={styles.grid}>
      {ITEMS.map((item) => {
        const value = item.getValue(stats);
        const isAlert = item.alert && value > 0;
        return (
          <View
            key={item.key}
            style={[styles.card, isAlert && styles.cardAlert]}
          >
            <View style={[styles.iconBox, isAlert && styles.iconBoxAlert]}>
              <Icon name={item.icon} size={18} color={isAlert ? colors.brandInverse : colors.accent} />
            </View>
            <Text style={styles.value}>{value}</Text>
            <Text style={styles.label}>{item.label}</Text>
          </View>
        );
      })}
    </View>
  </View>
);

const styles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: colors.accent,
    letterSpacing: 1.2,
    marginBottom: spacing.md,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: {
    width: '47%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardAlert: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  iconBoxAlert: { backgroundColor: colors.accent },
  value: { fontSize: 28, fontWeight: '900', color: colors.text, letterSpacing: -1 },
  label: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginTop: 2 },
});
