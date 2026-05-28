import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { RecruitmentStats } from '../../services/stats.service';
import { PressableSpring } from './PressableSpring';
import { colors, spacing, radius } from '../../theme/designTokens';

export interface DiscoverHighlightItem {
  label: string;
  value: string;
  detail: string;
}

interface DiscoverHighlightStripProps {
  highlights: DiscoverHighlightItem[];
}

export const DiscoverHighlightStrip: React.FC<DiscoverHighlightStripProps> = ({
  highlights,
}) => {
  const [active, setActive] = React.useState<string | null>(null);

  if (highlights.length === 0) return null;

  return (
    <View style={styles.wrap}>
      {highlights.map((item) => {
        const on = active === item.label;
        return (
          <PressableSpring
            key={item.label}
            style={[styles.chip, on && styles.chipOn]}
            onPress={() => setActive(on ? null : item.label)}
            scaleTo={0.95}
          >
            <Text style={[styles.value, on && styles.valueOn]}>{item.value}</Text>
            <Text style={[styles.label, on && styles.labelOn]}>{item.label}</Text>
            {on ? <Text style={styles.detail}>{item.detail}</Text> : null}
          </PressableSpring>
        );
      })}
    </View>
  );
};

/** Construit les highlights depuis les stats Firestore réelles. */
export function buildDiscoverHighlights(
  stats: RecruitmentStats | null,
  tournamentCount: number
): DiscoverHighlightItem[] {
  if (!stats) return [];

  const staff = stats.coaches + stats.agents;

  return [
    {
      label: 'Joueurs',
      value: String(stats.players),
      detail: 'Profils joueurs actifs sur ProDay.',
    },
    {
      label: 'Clubs',
      value: String(stats.clubs),
      detail: 'Structures inscrites sur la plateforme.',
    },
    {
      label: 'Annonces',
      value: String(stats.recruitment_posts_open),
      detail: 'Offres Mercato ouvertes en ce moment.',
    },
    {
      label: 'Tournois',
      value: String(tournamentCount),
      detail: 'Tournois Arena publiés (à venir ou en cours).',
    },
    ...(staff > 0
      ? [
          {
            label: 'Staff',
            value: String(staff),
            detail: 'Coachs et agents actifs sur ProDay.',
          },
        ]
      : []),
  ];
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginTop: spacing.md,
  },
  chip: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipOn: {
    borderColor: colors.accent,
    backgroundColor: colors.accentSoft,
    minWidth: '45%',
  },
  value: { fontSize: 16, fontWeight: '900', color: colors.brand },
  valueOn: { color: colors.accent },
  label: { fontSize: 9, fontWeight: '800', color: colors.textMuted, marginTop: 2 },
  labelOn: { color: colors.accent },
  detail: {
    fontSize: 10,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    textAlign: 'center',
    lineHeight: 14,
  },
});
