import React, { useMemo } from 'react';
import { PRO_DATA_VIOLET, proSemantic } from '../../theme/professionalDesign';
import { withAlpha } from '../../utils/coachTeamTheme';
import { COACH_SITE } from '../../content/coachPageIdentity';

const tokens = COACH_SITE;
import { StyleSheet, View } from 'react-native';
import { CoachSectionCard, CoachText } from './coachPortalUi';
import { useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { spacing } from '../../theme/designTokens';
import {
  buildCoachPlayerAiInsights,
  type CoachPlayerAiInsightsInput,
} from '../../utils/coachAiInsights';

import { Icon } from '../ui/Icon';

type Props = Omit<CoachPlayerAiInsightsInput, 'playerName'> & {
  playerName?: string;
  /** Une ligne dans la liste joueurs. */
  compact?: boolean;
};

/** Analyse IA joueur — bullets honnêtes depuis données réelles + suivi de charge + notes coach. */
export function CoachPlayerAiPanel(props: Props) {
  const styles = useCoachThemedStyles(createStyles);
  const insight = buildCoachPlayerAiInsights({
    ...props,
    playerName: props.playerName ?? 'Joueur',
  });
  const { wellness } = props;

  const loadStatus = useMemo(() => {
    if (!wellness) return null;
    if (wellness.injured) return { label: 'Blessé', color: proSemantic.danger, icon: 'medkit' as const };
    if (wellness.suspended) return { label: 'Suspendu', color: tokens.muted, icon: 'close-circle' as const };
    if ((wellness.fatigue ?? 0) >= 7 || (wellness.pain ?? 0) >= 5) {
      return { label: 'Vigilance charge', color: withAlpha('FFFFFF', 0.7), icon: 'warning' as const };
    }
    if ((wellness.recovery ?? 10) >= 7 && (wellness.fatigue ?? 0) <= 4) {
      return { label: 'Pleine forme', color: proSemantic.success, icon: 'checkmark-circle' as const };
    }
    return { label: 'Disponible', color: proSemantic.info, icon: 'fitness' as const };
  }, [wellness]);

  if (props.compact) {
    const line =
      insight.bullets[0] ??
      (insight.level === 'none' ? insight.emptyHint : 'Analyse en cours…');
    return (
      <View style={styles.compactWrap}>
        {loadStatus ? (
          <View style={[styles.compactLoadPill, { borderColor: loadStatus.color }]}>
            <View style={[styles.compactLoadDot, { backgroundColor: loadStatus.color }]} />
            <CoachText variant="caption" style={[styles.compactLoadText, { color: loadStatus.color }]}>
              {loadStatus.label}
              {typeof wellness?.fatigue === 'number' ? ` · Fat. ${wellness.fatigue}/10` : ''}
            </CoachText>
          </View>
        ) : null}
        <CoachText variant="caption" muted numberOfLines={2} style={styles.compactLine}>
          {line}
        </CoachText>
      </View>
    );
  }

  if (insight.level === 'none' && !wellness) {
    return (
      <CoachSectionCard
        kicker="Analyse IA & Charge"
        title="Données insuffisantes"
        body={insight.emptyHint}
      />
    );
  }

  return (
    <CoachSectionCard kicker="Analyse IA & Suivi" title="Synthèse joueur">
      {wellness ? (
        <View style={styles.chargePanel}>
          <CoachText variant="caption" style={styles.chargeHeader}>
            Suivi de charge & Disponibilité
          </CoachText>
          <View style={styles.chargeRow}>
            {loadStatus ? (
              <View style={[styles.chargeBadge, { backgroundColor: `${loadStatus.color}20`, borderColor: loadStatus.color }]}>
                <CoachText variant="caption" style={{ color: loadStatus.color, fontWeight: '800' }}>
                  {loadStatus.label}
                </CoachText>
              </View>
            ) : null}
            {typeof wellness.fatigue === 'number' ? (
              <View style={styles.chargeMetric}>
                <CoachText variant="caption" muted>Fatigue</CoachText>
                <CoachText variant="caption" style={{ fontWeight: '700' }}>{wellness.fatigue}/10</CoachText>
              </View>
            ) : null}
            {typeof wellness.recovery === 'number' ? (
              <View style={styles.chargeMetric}>
                <CoachText variant="caption" muted>Récupération</CoachText>
                <CoachText variant="caption" style={{ fontWeight: '700' }}>{wellness.recovery}/10</CoachText>
              </View>
            ) : null}
            {typeof wellness.pain === 'number' && wellness.pain > 0 ? (
              <View style={styles.chargeMetric}>
                <CoachText variant="caption" muted>Douleur</CoachText>
                <CoachText variant="caption" style={{ fontWeight: '700', color: wellness.pain >= 5 ? proSemantic.danger : undefined }}>
                  {wellness.pain}/10
                </CoachText>
              </View>
            ) : null}
          </View>
        </View>
      ) : null}

      <View style={styles.list}>
        {insight.bullets.map((b, i) => (
          <View key={i} style={styles.bulletRow}>
            <View style={styles.dot} />
            <CoachText variant="caption" style={styles.bulletText}>
              {b}
            </CoachText>
          </View>
        ))}
      </View>
    </CoachSectionCard>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    compactWrap: { gap: 3 },
    compactLoadPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderRadius: 10,
      paddingHorizontal: 6,
      paddingVertical: 1,
      alignSelf: 'flex-start',
    },
    compactLoadDot: { width: 5, height: 5, borderRadius: 2.5 },
    compactLoadText: { fontSize: 10, fontWeight: '700' },
    chargePanel: {
      backgroundColor: tokens.elevated,
      borderRadius: 10,
      padding: spacing.sm,
      gap: 6,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    chargeHeader: { fontWeight: '700', color: tokens.foreground, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.4 },
    chargeRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing.sm },
    chargeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
    chargeMetric: { alignItems: 'center', gap: 1 },
    list: { marginTop: spacing.sm, gap: spacing.xs },
    bulletRow: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
    dot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: tokens.accent,
      marginTop: 6,
    },
    bulletText: { flex: 1, lineHeight: 18 },
    compactLine: { fontSize: 11, lineHeight: 15 },
  });
}
