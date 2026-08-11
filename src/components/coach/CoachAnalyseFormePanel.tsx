import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { spacing } from '../../theme/designTokens';
import type { WellnessSignals } from '../../models/SmartTactics';
import type { PlayerLoadSignals } from '../../utils/playerLoadAlerts';
import {
  FORM_BAND_LABELS,
  buildPlayerFormAnalysis,
  buildPreMatchFormInsights,
  formatFormScore,
  summarizeSquadForm,
  type FormBand,
  type PlayerFormRow,
} from '../../utils/formAnalysis';
import { CoachLoadAlertsPanel } from './CoachLoadAlertsPanel';
import { buildLoadAlerts } from '../../utils/playerLoadAlerts';
import {
  CoachActionRow,
  CoachKpiRow,
  CoachLightPanel,
  CoachSectionCard,
} from './coachPortalUi';

type Props = {
  loadSignals: PlayerLoadSignals[];
  wellnessByUid: Record<string, WellnessSignals>;
  onOpenPlayer?: (uid: string) => void;
  onOpenTraining?: () => void;
};

type ViewMode = 'effectif' | 'match';

const BAND_COLOR: Record<FormBand, string> = {
  optimal: '#34d399',
  watch: '#fbbf24',
  low: '#fb7185',
  unknown: 'rgba(245,245,240,0.35)',
};

/** Section principale coach — Analyse de forme (effectif + avant match). */
export const CoachAnalyseFormePanel: React.FC<Props> = ({
  loadSignals,
  wellnessByUid,
  onOpenPlayer,
  onOpenTraining,
}) => {
  const [view, setView] = useState<ViewMode>('effectif');
  const [selectedUid, setSelectedUid] = useState<string | null>(null);

  const rows: PlayerFormRow[] = useMemo(
    () => loadSignals.map((s) => buildPlayerFormAnalysis(s, wellnessByUid[s.uid])),
    [loadSignals, wellnessByUid],
  );
  const summary = useMemo(() => summarizeSquadForm(rows), [rows]);
  const insights = useMemo(() => buildPreMatchFormInsights(rows), [rows]);
  const alerts = useMemo(() => buildLoadAlerts(loadSignals), [loadSignals]);

  const selected =
    rows.find((r) => r.uid === selectedUid) ??
    rows.find((r) => r.band === 'low' || r.band === 'watch') ??
    rows[0] ??
    null;

  return (
    <View style={styles.wrap}>
      <CoachSectionCard
        kicker="Banc de touche"
        title="État de forme de l’effectif"
        body="Charge, récupération déclarée et disponibilité. Pas de diagnostic médical."
      >
        <CoachKpiRow
          items={[
            {
              label: 'Optimale',
              value: String(summary.optimal),
              tone: BAND_COLOR.optimal,
            },
            {
              label: 'Surveillance',
              value: String(summary.watch),
              tone: BAND_COLOR.watch,
            },
            {
              label: 'Faible',
              value: String(summary.low),
              tone: BAND_COLOR.low,
            },
          ]}
        />

        <View style={styles.tabs}>
          {(
            [
              { id: 'effectif' as const, label: 'Effectif' },
              { id: 'match' as const, label: 'Avant match' },
            ] as const
          ).map((tab) => {
            const on = view === tab.id;
            return (
              <PressableSpring
                key={tab.id}
                onPress={() => setView(tab.id)}
                scaleTo={0.97}
                haptic
                style={[styles.tab, on && styles.tabOn]}
              >
                <ProDayText
                  variant="caption"
                  style={[styles.tabText, on ? styles.tabTextOn : styles.tabTextOff]}
                >
                  {tab.label}
                </ProDayText>
              </PressableSpring>
            );
          })}
        </View>
      </CoachSectionCard>

      {view === 'effectif' ? (
        <CoachLightPanel>
          <ProDayText variant="caption" style={styles.tableKicker}>
            Joueur · Forme · Charge · Récup. · Dispo.
          </ProDayText>

          {rows.length === 0 ? (
            <ProDayText variant="caption" style={styles.muted}>
              Aucun joueur dans l’effectif.
            </ProDayText>
          ) : (
            rows.slice(0, 16).map((r) => {
              const on = selected?.uid === r.uid;
              return (
                <PressableSpring
                  key={r.uid}
                  onPress={() => {
                    setSelectedUid(r.uid);
                    onOpenPlayer?.(r.uid);
                  }}
                  scaleTo={0.98}
                  style={[styles.row, on && styles.rowOn]}
                >
                  <View
                    style={[styles.bandBar, { backgroundColor: BAND_COLOR[r.band] }]}
                  />
                  <View style={styles.rowBody}>
                    <View style={styles.rowTop}>
                      <ProDayText
                        variant="caption"
                        style={styles.playerName}
                        numberOfLines={1}
                      >
                        {r.displayName}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.score}>
                        {formatFormScore(r.formScore)}
                      </ProDayText>
                    </View>
                    <View style={styles.metaRow}>
                      <ProDayText
                        variant="caption"
                        style={[styles.bandLabel, { color: BAND_COLOR[r.band] }]}
                        numberOfLines={1}
                      >
                        {FORM_BAND_LABELS[r.band]}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.meta} numberOfLines={1}>
                        Charge {r.chargeLabel}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.meta} numberOfLines={1}>
                        Récup. {r.recoveryLabel}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.meta} numberOfLines={1}>
                        {r.availabilityLabel}
                      </ProDayText>
                    </View>
                  </View>
                </PressableSpring>
              );
            })
          )}

          {selected ? (
            <View style={styles.detail}>
              <ProDayText variant="caption" style={styles.tableKicker}>
                Détail · {selected.displayName}
              </ProDayText>
              {(selected.watchPoints[0] || selected.trainingHints[0]) && (
                <ProDayText variant="caption" style={styles.detailBody}>
                  {selected.watchPoints[0] ?? selected.trainingHints[0]}
                </ProDayText>
              )}
              {selected.trainingHints[0] && selected.watchPoints[0] ? (
                <ProDayText variant="caption" style={styles.detailHint}>
                  {selected.trainingHints[0]}
                </ProDayText>
              ) : null}
            </View>
          ) : null}
        </CoachLightPanel>
      ) : (
        <CoachSectionCard
          kicker="Préparation"
          title="Insights avant match"
          body="Croisement présences, minutes, charge récente et récupération déclarée. Prudence uniquement."
        >
          {insights.length === 0 ? (
            <ProDayText variant="caption" style={styles.muted}>
              Donnée indisponible pour une analyse avant match.
            </ProDayText>
          ) : (
            insights.map((i) => (
              <View key={i.uid} style={styles.insightRow}>
                <View
                  style={[styles.bandBar, { backgroundColor: BAND_COLOR[i.band] }]}
                />
                <View style={styles.insightBody}>
                  <View style={styles.rowTop}>
                    <ProDayText variant="caption" style={styles.playerName}>
                      {i.displayName}
                    </ProDayText>
                    <ProDayText
                      variant="caption"
                      style={[styles.bandLabel, { color: BAND_COLOR[i.band] }]}
                    >
                      {FORM_BAND_LABELS[i.band]}
                    </ProDayText>
                  </View>
                  <ProDayText variant="caption" style={styles.detailBody}>
                    {i.message}
                  </ProDayText>
                </View>
              </View>
            ))
          )}

          {onOpenTraining ? (
            <CoachActionRow
              primary="Adapter les entraînements"
              onPrimary={onOpenTraining}
            />
          ) : null}
        </CoachSectionCard>
      )}

      <CoachLoadAlertsPanel alerts={alerts} />
    </View>
  );
};

/** Carte dashboard coach — résumé effectif. */
export const CoachFormeDashboardCard: React.FC<{
  rows: PlayerFormRow[];
  onOpenFull: () => void;
}> = ({ rows, onOpenFull }) => {
  const summary = summarizeSquadForm(rows);
  return (
    <PressableSpring onPress={onOpenFull} scaleTo={0.97} haptic>
      <CoachSectionCard
        kicker="Analyse de forme"
        title="État de forme de l’effectif"
        body={`${summary.optimal} optimale · ${summary.watch} à surveiller · ${summary.low} forme faible`}
      >
        <CoachKpiRow
          items={[
            {
              label: 'Optimale',
              value: String(summary.optimal),
              tone: BAND_COLOR.optimal,
            },
            {
              label: 'Surveillance',
              value: String(summary.watch),
              tone: BAND_COLOR.watch,
            },
            {
              label: 'Faible',
              value: String(summary.low),
              tone: BAND_COLOR.low,
            },
          ]}
        />
        <ProDayText variant="caption" style={styles.ctaLink}>
          Voir l’analyse complète →
        </ProDayText>
      </CoachSectionCard>
    </PressableSpring>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  tabs: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.sm,
  },
  tab: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: COACH_SITE.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tabOn: {
    borderColor: COACH_SITE.accent,
    backgroundColor: COACH_SITE.soft,
  },
  tabText: { fontWeight: '800', fontSize: 12 },
  tabTextOn: { color: COACH_SITE.accent },
  tabTextOff: { color: COACH_SITE.muted },
  tableKicker: {
    color: COACH_SITE.muted,
    textTransform: 'uppercase',
    letterSpacing: 1.6,
    fontSize: 10,
    fontWeight: '700',
    marginBottom: 4,
  },
  muted: { color: COACH_SITE.muted, lineHeight: 18 },
  row: {
    flexDirection: 'row',
    alignItems: 'stretch',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  rowOn: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    marginHorizontal: -4,
    paddingHorizontal: 4,
  },
  bandBar: { width: 3, borderRadius: 1 },
  rowBody: { flex: 1, gap: 4, minWidth: 0 },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  playerName: {
    color: COACH_SITE.foreground,
    fontWeight: '700',
    flex: 1,
  },
  score: {
    color: COACH_SITE.foreground,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bandLabel: { fontWeight: '700', fontSize: 11 },
  meta: { color: COACH_SITE.muted, fontSize: 11 },
  detail: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: COACH_SITE.border,
    gap: 4,
  },
  detailBody: { color: COACH_SITE.foreground, lineHeight: 18, opacity: 0.85 },
  detailHint: { color: COACH_SITE.accent, lineHeight: 18, fontWeight: '600' },
  insightRow: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COACH_SITE.border,
  },
  insightBody: { flex: 1, gap: 4, minWidth: 0 },
  ctaLink: {
    color: COACH_SITE.accent,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
});
