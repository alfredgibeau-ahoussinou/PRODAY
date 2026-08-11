import React from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator, Platform } from 'react-native';
import type { HealthSnapshot } from '../../../core/types/health';
import type { WearableDailySnapshot, WearableHealthMetrics, WearableRecoverySuggestion } from '../../../services/wearableHealth/types';
import {
  formatHeartRateValue,
  formatSleepValue,
  formatStepsValue,
  formatWearableSyncedAt,
  hasWearableData,
  wearableDataDisclaimer,
  wearableSourceLabel,
} from '../../../services/wearableHealth/formatWearableMetrics';
import { isWearableHealthSupported } from '../../../services/wearableHealth/types';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing, radius } from '../../../theme/designTokens';

interface HealthSummaryCardProps {
  health: HealthSnapshot;
  onExplainPress?: () => void;
  wearableConnected?: boolean;
  wearableMetrics?: WearableHealthMetrics | null;
  wearablePlatformLabel?: string;
  wearableSyncing?: boolean;
  wearableError?: string | null;
  onWearableConnect?: () => void;
  onWearableRefresh?: () => void;
  wearableHistory?: WearableDailySnapshot[];
  recoverySuggestions?: WearableRecoverySuggestion[];
  onExportHealthReport?: () => void;
}

const STATE_LABELS: Record<HealthSnapshot['state'], string> = {
  OPTIMAL: 'Optimal',
  ACTIVE: 'Actif',
  FATIGUED: 'Fatigué',
  OVERLOADED: 'Charge élevée',
  INJURY_RISK: 'Charge à surveiller',
  RECOVERY: 'Récupération',
};

/** Résumé santé — scores ProDay + données Apple Santé / Google Health si connectées. */
export const HealthSummaryCard: React.FC<HealthSummaryCardProps> = ({
  health,
  onExplainPress,
  wearableConnected = false,
  wearableMetrics,
  wearablePlatformLabel = 'Santé connectée',
  wearableSyncing = false,
  wearableError,
  onWearableConnect,
  onWearableRefresh,
  wearableHistory = [],
  recoverySuggestions = [],
  onExportHealthReport,
}) => {
  const { colors } = useAppTheme();
  const supported = isWearableHealthSupported();
  const sourceLabel = wearableMetrics
    ? wearableSourceLabel(wearableMetrics.source, wearablePlatformLabel as 'Apple Santé' | 'Google Health' | 'Santé connectée')
    : wearablePlatformLabel;
  const disclaimer =
    wearableConnected && wearableMetrics
      ? wearableDataDisclaimer(wearableMetrics, wearablePlatformLabel as 'Apple Santé' | 'Google Health' | 'Santé connectée')
      : null;
  const scoresFromWearable = wearableConnected && wearableMetrics && hasWearableData(wearableMetrics);

  return (
    <GlassCard variant="default" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
          <Icon name="heart" size={18} color={colors.accent} />
        </View>
        <View style={styles.copy}>
          <ProDayText variant="section">Analyse de forme</ProDayText>
          <ProDayText variant="caption" muted>
            {STATE_LABELS[health.state]}
            {scoresFromWearable ? ` · ajusté avec ${sourceLabel}` : ' · estimé ProDay'}
          </ProDayText>
        </View>
        {onExplainPress ? (
          <Pressable onPress={onExplainPress} style={styles.explainBtn} hitSlop={8}>
            <Icon name="alert-circle" size={18} color={colors.accent} />
            <ProDayText variant="caption" accent style={styles.explainText}>
              Pourquoi ?
            </ProDayText>
          </Pressable>
        ) : null}
      </View>

      {wearableConnected && wearableMetrics ? (
        <View style={[styles.wearableBlock, { backgroundColor: colors.surfaceMuted, borderColor: colors.border }]}>
          <View style={styles.wearableHeader}>
            <ProDayText variant="caption" style={styles.wearableEyebrow}>
              Données {sourceLabel}
            </ProDayText>
            {onWearableRefresh ? (
              <Pressable onPress={onWearableRefresh} disabled={wearableSyncing} hitSlop={8}>
                {wearableSyncing ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <ProDayText variant="caption" accent style={styles.refreshLink}>
                    Actualiser
                  </ProDayText>
                )}
              </Pressable>
            ) : null}
          </View>
          <View style={styles.wearableMetrics}>
            <WearableStat
              label="Pas (jour)"
              value={formatStepsValue(wearableMetrics.stepsToday)}
              missing={wearableMetrics.stepsToday == null}
              colors={colors}
            />
            <WearableStat
              label="Sommeil"
              value={formatSleepValue(wearableMetrics.sleepHoursLastNight)}
              missing={wearableMetrics.sleepHoursLastNight == null}
              colors={colors}
            />
            <WearableStat
              label="FC repos"
              value={formatHeartRateValue(wearableMetrics.restingHeartRate)}
              missing={wearableMetrics.restingHeartRate == null}
              colors={colors}
            />
            <WearableStat
              label="FC effort"
              value={formatHeartRateValue(wearableMetrics.exerciseHeartRateAvg)}
              missing={wearableMetrics.exerciseHeartRateAvg == null}
              colors={colors}
            />
            <WearableStat
              label="Calories"
              value={wearableMetrics.activeCaloriesToday != null ? `${wearableMetrics.activeCaloriesToday} kcal` : 'Non dispo.'}
              missing={wearableMetrics.activeCaloriesToday == null}
              colors={colors}
            />
            <WearableStat
              label="Distance"
              value={wearableMetrics.distanceKmToday != null ? `${wearableMetrics.distanceKmToday} km` : 'Non dispo.'}
              missing={wearableMetrics.distanceKmToday == null}
              colors={colors}
            />
          </View>
          {wearableHistory.length > 0 ? (
            <View style={styles.historyBlock}>
              <ProDayText variant="caption" muted>
                Historique {wearableHistory.length >= 7 ? '7 j' : `${wearableHistory.length} j`}
              </ProDayText>
              {wearableHistory.slice(0, 7).map((day) => (
                <View key={day.date} style={styles.historyRow}>
                  <ProDayText variant="caption" muted style={styles.historyDate}>
                    {day.date.slice(5)}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.historyValue}>
                    {formatStepsValue(day.steps)} · {formatSleepValue(day.sleepHours)}
                  </ProDayText>
                </View>
              ))}
            </View>
          ) : null}
          {scoresFromWearable ? (
            <ProDayText variant="caption" muted style={styles.correlation}>
              Sommeil / pas / FC alimentent les scores fatigue et récup. ProDay ci-dessous.
            </ProDayText>
          ) : null}
          <ProDayText variant="caption" muted style={styles.syncLine}>
            Synchronisé le {formatWearableSyncedAt(wearableMetrics.syncedAt)}
          </ProDayText>
          {disclaimer ? (
            <ProDayText variant="caption" style={[styles.disclaimer, { color: colors.warning }]}>
              {disclaimer}
            </ProDayText>
          ) : null}
        </View>
      ) : supported && onWearableConnect ? (
        <Pressable
          onPress={onWearableConnect}
          disabled={wearableSyncing}
          style={[styles.connectRow, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
        >
          {wearableSyncing ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <>
              <Icon name={Platform.OS === 'ios' ? 'heart' : 'shield'} size={16} color={colors.accent} />
              <ProDayText variant="caption" accent style={styles.connectText}>
                Connecter {wearablePlatformLabel} pour afficher vos vraies stats
              </ProDayText>
            </>
          )}
        </Pressable>
      ) : null}

      {recoverySuggestions.length > 0 ? (
        <View style={[styles.suggestionsBlock, { borderColor: colors.border }]}>
          <ProDayText variant="caption" style={styles.suggestionsTitle}>
            Suggestions ProDay
          </ProDayText>
          {recoverySuggestions.slice(0, 2).map((s) => (
            <View key={s.id} style={styles.suggestionRow}>
              <ProDayText variant="caption" style={styles.suggestionTitle}>
                {s.title}
              </ProDayText>
              <ProDayText variant="caption" muted>
                {s.body}
              </ProDayText>
            </View>
          ))}
        </View>
      ) : null}

      {onExportHealthReport ? (
        <Pressable onPress={onExportHealthReport} style={styles.exportBtn} hitSlop={8}>
          <ProDayText variant="caption" accent style={styles.exportText}>
            Exporter le rapport santé (PDF)
          </ProDayText>
        </Pressable>
      ) : null}

      {wearableError ? (
        <ProDayText variant="caption" style={{ color: colors.error }}>
          {wearableError}
        </ProDayText>
      ) : null}

      <ProDayText variant="caption" muted style={styles.scoresLegend}>
        Scores ProDay (fatigue, récup., charge)
      </ProDayText>
      <View style={styles.metrics}>
        <Metric label="Fatigue" value={health.fatigueScore} colors={colors} />
        <Metric label="Récup." value={health.recoveryScore} colors={colors} accent />
        <Metric label="Charge" value={health.trainingLoad} colors={colors} />
      </View>

      <ProDayText variant="body" muted style={styles.hint}>
        {health.dailyPlanHint}
      </ProDayText>
      <ProDayText variant="caption" style={styles.message}>
        {health.coachMessage}
      </ProDayText>
    </GlassCard>
  );
};

const WearableStat: React.FC<{
  label: string;
  value: string;
  missing: boolean;
  colors: ReturnType<typeof useAppTheme>['colors'];
}> = ({ label, value, missing, colors }) => (
  <View style={styles.wearableStat}>
    <ProDayText variant="caption" muted style={styles.metricLabel}>
      {label}
    </ProDayText>
    <ProDayText
      variant="section"
      accent={!missing}
      muted={missing}
      style={missing ? styles.missingValue : undefined}
    >
      {value}
    </ProDayText>
  </View>
);

const Metric: React.FC<{
  label: string;
  value: number;
  colors: ReturnType<typeof useAppTheme>['colors'];
  accent?: boolean;
}> = ({ label, value, colors, accent }) => (
  <View style={styles.metric}>
    <ProDayText variant="caption" muted style={styles.metricLabel}>
      {label}
    </ProDayText>
    <ProDayText variant="section" accent={accent}>
      {value}
    </ProDayText>
    <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
      <View
        style={[
          styles.fill,
          {
            width: `${Math.min(100, value)}%`,
            backgroundColor: accent ? colors.accent : colors.accentLight,
          },
        ]}
      />
    </View>
  </View>
);

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  explainBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  explainText: { fontWeight: '700' },
  wearableBlock: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    gap: spacing.xs,
  },
  wearableHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wearableEyebrow: { fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4, fontSize: 10 },
  refreshLink: { fontWeight: '700' },
  wearableMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.xs },
  wearableStat: { minWidth: '30%', flexGrow: 1, gap: 2 },
  historyBlock: { gap: 4, marginTop: spacing.xs },
  historyRow: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  historyDate: { width: 48 },
  historyValue: { flex: 1, textAlign: 'right' },
  correlation: { marginTop: spacing.xs, lineHeight: 16 },
  suggestionsBlock: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.sm,
    gap: spacing.xs,
  },
  suggestionsTitle: { fontWeight: '800' },
  suggestionRow: { gap: 2 },
  suggestionTitle: { fontWeight: '700' },
  exportBtn: { alignSelf: 'flex-start' },
  exportText: { fontWeight: '700' },
  missingValue: { fontStyle: 'italic' },
  syncLine: { fontSize: 11, marginTop: 2 },
  disclaimer: { lineHeight: 16, marginTop: 2 },
  connectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  connectText: { fontWeight: '700', flex: 1 },
  scoresLegend: { marginTop: spacing.xs, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 },
  metrics: { flexDirection: 'row', gap: spacing.sm },
  metric: { flex: 1, gap: 2 },
  metricLabel: { fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5 },
  track: { height: 3, borderRadius: 2, overflow: 'hidden', marginTop: 2 },
  fill: { height: '100%', borderRadius: 2 },
  hint: { marginTop: spacing.xs, fontWeight: '600' },
  message: { lineHeight: 18, color: undefined },
});
