import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import type { LoadAlert, LoadAlertKind, LoadAlertLevel } from '../../utils/playerLoadAlerts';
import { spacing } from '../../theme/designTokens';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { proSemantic } from '../../theme/professionalDesign';
import { CoachSectionCard } from './coachPortalUi';

/** Alertes charge & disponibilité — jamais un % de risque médical. */
export const CoachLoadAlertsPanel: React.FC<{ alerts: LoadAlert[] }> = ({ alerts }) => {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const levelMeta = useMemo(
    (): Record<LoadAlertLevel, { label: string; color: string }> => ({
      high: { label: 'Prioritaire', color: proSemantic.danger },
      caution: { label: 'À surveiller', color: proSemantic.warning },
      info: { label: 'Info', color: tokens.accent },
    }),
    [tokens.accent],
  );
  /**
   * Libellé de niveau : une disponibilité déclarée se lit « Statut », pas
   * « Info » — l'information est exploitable, seule sa gravité est nulle.
   */
  const kindLabel = (level: LoadAlertLevel, kind: LoadAlertKind): string =>
    kind === 'availability' ? 'Statut' : levelMeta[level].label;
  /**
   * Seules les alertes d'absence de donnée sont écartées : les statuts de
   * disponibilité déclarés restent visibles (ils étaient auparavant masqués).
   */
  const actionable = alerts.filter((a) => a.kind !== 'missing');

  return (
    <CoachSectionCard
      kicker="Vigilance"
      title="Alertes charge & disponibilité"
      body="Points à surveiller dans l’analyse de forme. Pas de diagnostic médical, pas de prédiction de blessure."
    >
      {actionable.length === 0 ? (
        <ProDayText variant="caption" style={styles.muted}>
          Donnée indisponible — ajoutez présences, minutes ou fatigue déclarée.
        </ProDayText>
      ) : (
        actionable.slice(0, 8).map((a) => {
          const meta = levelMeta[a.level];
          return (
            <View key={`${a.uid}_${a.level}_${a.kind}`} style={styles.row}>
              <View style={[styles.bar, { backgroundColor: meta.color }]} />
              <View style={styles.body}>
                <View style={styles.top}>
                  <ProDayText variant="caption" style={styles.name} numberOfLines={1}>
                    {a.displayName}
                  </ProDayText>
                  <ProDayText
                    variant="caption"
                    style={[styles.level, { color: meta.color }]}
                  >
                    {kindLabel(a.level, a.kind)}
                  </ProDayText>
                </View>
                <ProDayText variant="caption" style={styles.message}>
                  {a.message}
                  {a.missingData.length ? ` (manque : ${a.missingData.join(', ')})` : ''}
                </ProDayText>
              </View>
            </View>
          );
        })
      )}
    </CoachSectionCard>
  );
};

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    muted: { color: tokens.muted, lineHeight: 18 },
    row: {
      flexDirection: 'row',
      gap: 10,
      paddingVertical: 10,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    bar: { width: 3, borderRadius: 1 },
    body: { flex: 1, gap: 4, minWidth: 0 },
    top: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    name: { color: tokens.foreground, fontWeight: '700', flex: 1 },
    level: {
      fontWeight: '800',
      fontSize: 10,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
    },
    message: { color: tokens.muted, lineHeight: 18 },
  });
}
