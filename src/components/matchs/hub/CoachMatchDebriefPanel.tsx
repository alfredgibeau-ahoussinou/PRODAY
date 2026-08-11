import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import type { TeamEvent } from '../../../models/TeamEvent';
import type { User } from '../../../models/User';
import type { MatchTacticalReport } from '../../../models/SmartTactics';
import { smartTacticsService } from '../../../services/smartTactics.service';
import { teamEventsService } from '../../../services/teamEvents.service';
import { ProDaySurface } from '../../ui/ProDaySurface';
import { ProDayText } from '../../ui/ProDayText';
import { PressableSpring } from '../../motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { radius, spacing } from '../../../theme/designTokens';

interface Props {
  event: TeamEvent;
  profile: User;
  onUpdated?: () => void;
}

/** Compte rendu coach post-match — résumé IA + validation rapport. */
export const CoachMatchDebriefPanel: React.FC<Props> = ({ event, profile, onUpdated }) => {
  const { colors } = useAppTheme();
  const canManage =
    profile.role === 'coach' ||
    profile.role === 'club' ||
    profile.role === 'organizer';
  const [report, setReport] = useState<MatchTacticalReport | null>(null);
  const [busy, setBusy] = useState(false);

  const locked = Boolean(event.match_report_finalized_at);

  const generate = () => {
    const next = smartTacticsService.generateReport(event, 'debrief', profile.uid, []);
    setReport(next);
  };

  const finalize = async () => {
    if (locked) return;
    setBusy(true);
    try {
      await teamEventsService.setMatchReportFinalized(event.id, true, { user: profile });
      Alert.alert('OK', 'Compte rendu validé — stats saison verrouillées.');
      onUpdated?.();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible de valider');
    } finally {
      setBusy(false);
    }
  };

  const bullets = useMemo(() => {
    if (!report) return [] as string[];
    return [
      ...report.strengths.map((s) => `+ ${s}`),
      ...report.weaknesses.map((w) => `− ${w}`),
      ...report.adjustments.map((a) => `→ ${a}`),
    ].slice(0, 8);
  }, [report]);

  if (!canManage) return null;

  return (
    <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
      <ProDayText variant="section">Compte rendu coach</ProDayText>
      <ProDayText variant="caption" muted>
        Debrief post-match pour le staff et la prochaine séance.
      </ProDayText>

      {!report ? (
        <PressableSpring onPress={generate} scaleTo={0.96} haptic>
          <ProDayText variant="caption" accent style={styles.link}>
            Générer le compte rendu
          </ProDayText>
        </PressableSpring>
      ) : (
        <View style={styles.body}>
          <ProDayText variant="caption" style={styles.title}>
            {report.title}
          </ProDayText>
          <ProDayText variant="caption" muted>
            {report.summary}
          </ProDayText>
          {bullets.map((line) => (
            <ProDayText key={line} variant="caption">
              {line}
            </ProDayText>
          ))}
          <PressableSpring onPress={generate} scaleTo={0.96} haptic>
            <ProDayText variant="caption" muted style={styles.link}>
              Régénérer
            </ProDayText>
          </PressableSpring>
        </View>
      )}

      {locked ? (
        <ProDayText variant="caption" accent>
          Rapport validé
          {event.match_report_finalized_at
            ? ` · ${event.match_report_finalized_at.toLocaleDateString('fr-FR')}`
            : ''}
        </ProDayText>
      ) : (
        <PressableSpring onPress={() => void finalize()} disabled={busy} scaleTo={0.96} haptic>
          <ProDayText variant="caption" accent style={styles.link}>
            Valider le rapport d’après-match
          </ProDayText>
        </PressableSpring>
      )}
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  body: { gap: 4, marginTop: spacing.xs },
  title: { fontWeight: '800' },
  link: { fontWeight: '800', marginTop: spacing.xs },
});
