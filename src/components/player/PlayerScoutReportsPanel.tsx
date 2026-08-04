import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import type { User } from '../../models/User';
import type { ScoutReport } from '../../models/ScoutReport';
import { SCOUT_REPORT_RECOMMENDATION_LABELS } from '../../models/ScoutReport';
import { scoutReportsService } from '../../services/scoutReports.service';
import { ScoutReportSheet } from './ScoutReportSheet';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';

interface PlayerScoutReportsPanelProps {
  staff: User;
  player: User;
}

export const PlayerScoutReportsPanel: React.FC<PlayerScoutReportsPanelProps> = ({
  staff,
  player,
}) => {
  const clubId = staff.profile.club_id;
  const { colors: c } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [reports, setReports] = useState<ScoutReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [sheetOpen, setSheetOpen] = useState(false);

  const load = useCallback(async () => {
    if (!clubId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const list = await scoutReportsService.listForPlayer(clubId, player.uid);
    setReports(list);
    setLoading(false);
  }, [clubId, player.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  if (!clubId) return null;

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <ProDayText variant="section">Rapports scout</ProDayText>
          <ProDayText variant="caption" muted>
            Évaluations structurées du club
          </ProDayText>
        </View>
        <PressableSpring
          style={[styles.cta, { backgroundColor: c.brand }]}
          onPress={() => setSheetOpen(true)}
          scaleTo={0.96}
          haptic
        >
          <ProDayText variant="caption" inverse style={{ fontWeight: '800' }}>
            Créer
          </ProDayText>
        </PressableSpring>
      </View>

      {loading ? (
        <ActivityIndicator color={c.brand} style={{ marginVertical: spacing.sm }} />
      ) : reports.length === 0 ? (
        <ProDayText variant="caption" muted>
          Aucun rapport pour ce joueur. Créez la première évaluation.
        </ProDayText>
      ) : (
        reports.slice(0, 5).map((report) => (
          <View
            key={report.id}
            style={[styles.row, { borderColor: c.border, backgroundColor: c.surfaceMuted }]}
          >
            <View style={{ flex: 1, gap: 2 }}>
              <ProDayText variant="body" numberOfLines={1} style={{ fontWeight: '700' }}>
                {report.title}
              </ProDayText>
              <ProDayText variant="caption" muted numberOfLines={1}>
                {SCOUT_REPORT_RECOMMENDATION_LABELS[report.recommendation]}
                {' · '}
                {report.overall_rating.toFixed(1)}/5
                {report.opportunity_score_snapshot != null
                  ? ` · Opp. ${report.opportunity_score_snapshot}%`
                  : ''}
              </ProDayText>
            </View>
          </View>
        ))
      )}

      <ScoutReportSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        staff={staff}
        player={player}
        onSaved={() => void load()}
      />
    </View>
  );
};

function createStyles(_c: { border: string }) {
  return StyleSheet.create({
    card: {
      borderRadius: radius.lg,
      borderWidth: 1,
      padding: spacing.md,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    cta: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    row: {
      borderWidth: 1,
      borderRadius: radius.md,
      padding: spacing.sm,
    },
  });
}
