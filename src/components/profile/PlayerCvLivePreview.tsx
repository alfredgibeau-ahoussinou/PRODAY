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

  const tags = [p.position, p.category, p.level].filter(Boolean) as string[];

  return (
    <View style={[styles.card, { borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
      <View style={styles.topRow}>
        <View style={styles.passportBadge}>
          <View style={[styles.statusDot, { backgroundColor: colors.accent }]} />
          <Text style={[styles.brand, { color: colors.accent }]}>PASSEPORT PRODAY</Text>
        </View>
        <Text style={styles.verifiedText}>Fiche Publique</Text>
      </View>

      <Text style={styles.name}>{cv.display_name}</Text>

      {tags.length > 0 ? (
        <View style={styles.tagsRow}>
          {tags.map((tag) => (
            <View key={tag} style={styles.tagPill}>
              <Text style={styles.tagText}>{tag}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.emptyRole}>Complétez votre poste et catégorie</Text>
      )}

      {(p.cv_headline || cv.bio) && (
        <View style={styles.headlineBox}>
          <Text style={styles.headline} numberOfLines={3}>
            « {p.cv_headline || cv.bio} »
          </Text>
        </View>
      )}

      {p.cv_objectives ? (
        <Text style={styles.objectives} numberOfLines={2}>
          Objectif : {p.cv_objectives}
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
            <Text key={a} style={styles.achievement}>
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
  <View style={styles.stat}>
    <Text style={[styles.statValue, { color: colors.accent }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  passportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  brand: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  verifiedText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '600',
  },
  name: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.4,
    color: '#FFFFFF',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tagPill: {
    backgroundColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  tagText: {
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  emptyRole: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
  },
  headlineBox: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 2,
    borderLeftColor: 'rgba(255, 255, 255, 0.25)',
  },
  headline: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '600',
    fontStyle: 'italic',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  objectives: {
    fontSize: 11,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '900',
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '700',
    marginTop: 2,
    color: 'rgba(255, 255, 255, 0.5)',
    textTransform: 'uppercase',
  },
  achievements: {
    marginTop: 2,
    gap: 3,
  },
  achievement: {
    fontSize: 12,
    lineHeight: 17,
    color: 'rgba(255, 255, 255, 0.65)',
  },
});
