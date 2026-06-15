import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import { buildPlayerCvFromUser } from '../../utils/pdfGenerator';
import { spacing, radius } from '../../theme/designTokens';
import type { AppColors } from '../../theme/prodayWomanTheme';

interface PlayerCvLivePreviewProps {
  user: User;
  colors: AppColors;
}

/** Aperçu CV intégré — même données que l’export, sans PDF. */
export const PlayerCvLivePreview: React.FC<PlayerCvLivePreviewProps> = ({ user, colors }) => {
  const cv = buildPlayerCvFromUser(user);
  const p = user.profile;
  const stats = cv.season_stats;
  const hasStats = stats && (stats.matches > 0 || stats.goals > 0 || stats.assists > 0);

  return (
    <View style={[styles.card, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
      <Text style={[styles.brand, { color: colors.textMuted }]}>PRODAY · CV EN LIGNE</Text>
      <Text style={[styles.name, { color: colors.text }]}>{cv.display_name}</Text>
      <Text style={[styles.role, { color: colors.textSecondary }]}>
        {[p.position, p.category, p.level].filter(Boolean).join(' · ') || 'Complétez votre fiche'}
      </Text>
      {(p.cv_headline || cv.bio) && (
        <Text style={[styles.headline, { color: colors.text }]} numberOfLines={3}>
          {p.cv_headline || cv.bio}
        </Text>
      )}
      {p.cv_objectives ? (
        <Text style={[styles.objectives, { color: colors.textSecondary }]} numberOfLines={2}>
          {p.cv_objectives}
        </Text>
      ) : null}
      {hasStats ? (
        <View style={styles.statsRow}>
          <MiniStat label="Matchs" value={String(stats!.matches)} colors={colors} />
          <MiniStat label="Buts" value={String(stats!.goals)} colors={colors} />
          <MiniStat label="Passes" value={String(stats!.assists)} colors={colors} />
        </View>
      ) : null}
      {(cv.achievements?.length ?? 0) > 0 && (
        <View style={styles.achievements}>
          {cv.achievements!.slice(0, 3).map((a) => (
            <Text key={a} style={[styles.achievement, { color: colors.textSecondary }]}>
              • {a}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};

const MiniStat: React.FC<{ label: string; value: string; colors: AppColors }> = ({
  label,
  value,
  colors,
}) => (
  <View style={[styles.stat, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm + 2,
  },
  brand: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: spacing.xs,
  },
  name: { fontSize: 16, fontWeight: '900', letterSpacing: -0.3 },
  role: { fontSize: 12, fontWeight: '600', marginTop: 2 },
  headline: { fontSize: 13, lineHeight: 18, marginTop: spacing.xs, fontWeight: '600' },
  objectives: { fontSize: 11, lineHeight: 16, marginTop: 2 },
  statsRow: { flexDirection: 'row', gap: spacing.xs, marginTop: spacing.sm },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  statValue: { fontSize: 16, fontWeight: '900' },
  statLabel: { fontSize: 9, fontWeight: '700', marginTop: 2, textTransform: 'uppercase' },
  achievements: { marginTop: spacing.sm, gap: 2 },
  achievement: { fontSize: 12, lineHeight: 17 },
});
