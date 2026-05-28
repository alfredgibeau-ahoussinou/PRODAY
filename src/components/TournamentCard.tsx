import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import type { Tournament, TournamentStatus } from '../models/Tournament';
import { Icon } from './ui/Icon';
import { colors, spacing, radius } from '../theme/designTokens';

interface TournamentCardProps {
  tournament: Tournament;
  onPress?: (t: Tournament) => void;
  onRegister?: (t: Tournament) => void;
}

const STATUS: Record<TournamentStatus, { label: string; color: string }> = {
  OPEN: { label: 'Ouvert', color: colors.success },
  IN_PROGRESS: { label: 'En cours', color: colors.brand },
  FINISHED: { label: 'Terminé', color: colors.textMuted },
};

export const TournamentCard: React.FC<TournamentCardProps> = ({
  tournament,
  onPress,
  onRegister,
}) => {
  const status = STATUS[tournament.status];
  const count = tournament.subscriber_uids?.length ?? 0;

  return (
    <View style={styles.card}>
      <TouchableOpacity
        style={styles.main}
        onPress={() => onPress?.(tournament)}
        activeOpacity={0.9}
      >
        <View style={styles.topRow}>
          <Text style={styles.name} numberOfLines={2}>
            {tournament.name}
          </Text>
          <View style={[styles.statusPill, { borderColor: status.color }]}>
            <Text style={[styles.statusText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>
        <Text style={styles.meta}>
          {tournament.city} · {formatDate(tournament.date_start)}
        </Text>
        <Text style={styles.categories}>{tournament.categories.join(' · ')}</Text>
        <View style={styles.footer}>
          <Icon name="people" size={14} color={colors.textMuted} />
          <Text style={styles.footerText}>
            {count} club{count !== 1 ? 's' : ''} inscrit{count !== 1 ? 's' : ''}
          </Text>
          <Icon name="chevron-forward" size={16} color={colors.textMuted} />
        </View>
      </TouchableOpacity>
      {tournament.status === 'OPEN' && onRegister ? (
        <TouchableOpacity style={styles.btn} onPress={() => onRegister(tournament)}>
          <Text style={styles.btnText}>Inscrire mon club</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

function formatDate(d: Date): string {
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    marginVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  main: { padding: spacing.lg },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: { flex: 1, color: colors.text, fontSize: 17, fontWeight: '900' },
  statusPill: {
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusText: { fontSize: 10, fontWeight: '800' },
  meta: { color: colors.textSecondary, fontSize: 13, marginTop: 4 },
  categories: { color: colors.brand, fontSize: 12, marginTop: spacing.sm, fontWeight: '700' },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: spacing.md,
  },
  footerText: { flex: 1, fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  btn: {
    backgroundColor: colors.brand,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  btnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 14 },
});
