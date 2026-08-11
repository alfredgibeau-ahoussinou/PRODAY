import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import type { HealthSnapshot } from '../../core/types/health';
import {
  FORM_BAND_LABELS,
  formatFormScore,
  playerFormFromHealthSnapshot,
  type FormBand,
} from '../../utils/formAnalysis';
import type { JoueurAgeGroup } from '../../utils/joueurExperienceTheme';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import {
  JoueurHudCorners,
  JoueurXpBar,
  useJoueurPageIdentity,
} from './joueurPortalUi';
import { spacing } from '../../theme/designTokens';

type Props = {
  uid: string;
  displayName: string;
  health: HealthSnapshot;
  ageGroup?: JoueurAgeGroup;
  accent?: string;
  onExplainPress?: () => void;
  onOpenTraining?: () => void;
};

const BAND_TONE: Record<FormBand, string> = {
  optimal: JOUEUR_SITE.ok,
  watch: JOUEUR_SITE.warn,
  low: JOUEUR_SITE.live,
  unknown: JOUEUR_SITE.muted,
};

/** Ma forme — HUD jeu (pas un diagnostic). */
export const PlayerMaFormeCard: React.FC<Props> = ({
  uid,
  displayName,
  health,
  ageGroup: ageGroupProp,
  accent: accentProp,
  onExplainPress,
  onOpenTraining,
}) => {
  const identity = useJoueurPageIdentity();
  const accent = accentProp ?? identity?.accent ?? '#2F7BFF';
  const ageGroup = ageGroupProp ?? identity?.ageGroup ?? 'adult';

  const form = useMemo(
    () => playerFormFromHealthSnapshot(uid, displayName, health),
    [uid, displayName, health],
  );

  const recoveryPct = Math.round(health.recoveryScore);
  const chargePct = Math.round(health.trainingLoad);
  const attendancePct = Math.round(
    Math.max(40, Math.min(98, 100 - health.fatigueScore * 0.3)),
  );

  const copy =
    ageGroup === 'youth'
      ? {
          kicker: 'JAUGE ÉNERGIE',
          title: 'Ma forme',
          goal: 'Objectif semaine',
          improve: 'Pour gagner plus',
          why: 'Pourquoi ce score ?',
          train: 'Séance adaptée',
        }
      : ageGroup === 'teen'
        ? {
            kicker: 'HUD FORME',
            title: 'Analyse de forme',
            goal: 'Objectif semaine',
            improve: 'Leviers',
            why: 'Détail du score',
            train: 'Session adaptée',
          }
        : {
            kicker: 'DISPONIBILITÉ',
            title: 'Ma forme',
            goal: 'Objectif de la semaine',
            improve: 'Axes d’amélioration',
            why: 'Pourquoi ce score ?',
            train: 'Séance adaptée',
          };

  const goalBody =
    form.band === 'low'
      ? 'Consolider la récupération et limiter la charge.'
      : form.band === 'watch'
        ? 'Stabiliser la forme : qualité avant volume.'
        : 'Maintenir la dynamique et viser la régularité.';

  return (
    <View style={[styles.card, { borderColor: JOUEUR_SITE.borderStrong }]}>
      <JoueurHudCorners color={accent} size={12} thickness={2} />
      <ProDayText variant="caption" style={[styles.kicker, { color: accent }]}>
        {copy.kicker}
      </ProDayText>
      <View style={styles.scoreRow}>
        <View style={{ flex: 1 }}>
          <ProDayText variant="section" style={styles.title}>
            {copy.title.toUpperCase()}
          </ProDayText>
          <ProDayText variant="caption" style={styles.band}>
            {FORM_BAND_LABELS[form.band]}
            {form.trendWeekPct != null
              ? ` · ${form.trendWeekPct >= 0 ? '↑' : '↓'} ${
                  form.trendWeekPct >= 0 ? '+' : ''
                }${form.trendWeekPct}%`
              : ''}
          </ProDayText>
        </View>
        <ProDayText variant="hero" style={[styles.score, { color: BAND_TONE[form.band] }]}>
          {formatFormScore(form.formScore)}
        </ProDayText>
      </View>

      <JoueurXpBar label="RÉCUPÉRATION" value={recoveryPct} color={accent} />
      <JoueurXpBar label="CHARGE" value={chargePct} color={JOUEUR_SITE.warn} />
      <JoueurXpBar label="ASSIDUITÉ" value={attendancePct} color={JOUEUR_SITE.ok} />

      <View style={styles.box}>
        <ProDayText variant="caption" style={styles.boxTitle}>
          {copy.goal.toUpperCase()}
        </ProDayText>
        <ProDayText variant="caption" style={styles.boxBody}>
          {goalBody}
        </ProDayText>
      </View>

      <View style={styles.box}>
        <ProDayText variant="caption" style={styles.boxTitle}>
          {copy.improve.toUpperCase()}
        </ProDayText>
        {(form.watchPoints.length ? form.watchPoints : form.trainingHints)
          .slice(0, 3)
          .map((line) => (
            <ProDayText key={line} variant="caption" style={styles.boxBody}>
              ▸ {line}
            </ProDayText>
          ))}
      </View>

      <ProDayText variant="caption" style={styles.disclaimer}>
        Indicateurs de charge déclarée — pas un diagnostic médical.
      </ProDayText>

      <View style={styles.actions}>
        {onExplainPress ? (
          <PressableSpring onPress={onExplainPress} scaleTo={0.97}>
            <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
              {copy.why.toUpperCase()}
            </ProDayText>
          </PressableSpring>
        ) : null}
        {onOpenTraining ? (
          <PressableSpring onPress={onOpenTraining} scaleTo={0.97}>
            <ProDayText variant="caption" style={{ color: accent, fontWeight: '800' }}>
              ▶ {copy.train.toUpperCase()}
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1.5,
    borderRadius: 24,
    padding: spacing.md,
    gap: spacing.sm,
    backgroundColor: 'rgba(10,16,28,0.92)',
    overflow: 'hidden',
  },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 2.2,
    fontSize: 9,
    fontWeight: '900',
  },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  title: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  score: { fontSize: 42, fontWeight: '900', letterSpacing: -1.5 },
  band: { color: JOUEUR_SITE.muted },
  box: {
    padding: spacing.sm,
    gap: 4,
    backgroundColor: 'rgba(6,12,22,0.8)',
    borderWidth: 1,
    borderColor: JOUEUR_SITE.border,
    borderRadius: 16,
  },
  boxTitle: { color: JOUEUR_SITE.foreground, fontWeight: '900', letterSpacing: 1, fontSize: 10 },
  boxBody: { color: JOUEUR_SITE.muted, lineHeight: 18 },
  disclaimer: { color: JOUEUR_SITE.dim, fontSize: 11 },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md },
});
