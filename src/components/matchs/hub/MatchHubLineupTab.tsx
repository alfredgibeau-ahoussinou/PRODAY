import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { TeamEvent } from '../../../models/TeamEvent';
import { PitchLineupView } from '../../team/PitchLineupView';
import { CoachSportEasyPitchSurface } from '../../coach/CoachSportEasyPitchSurface';
import { ProDaySurface } from '../../ui/ProDaySurface';
import { ProDayText } from '../../ui/ProDayText';
import { ProDayGradient } from '../../ui/ProDayGradient';
import { Icon } from '../../ui/Icon';
import { PressableSpring, StaggerReveal } from '../../motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useIsCoachShell } from '../../../features/coach/shell/CoachThemeContext';
import {
  eventStartersToStadiumCells,
  eventSubsToBenchPlayers,
} from '../../../utils/coachStadiumPitchLayout';
import { spacing, radius } from '../../../theme/designTokens';

interface MatchHubLineupTabProps {
  event: TeamEvent;
  canEdit: boolean;
  onEditLineup: () => void;
}

export const MatchHubLineupTab: React.FC<MatchHubLineupTabProps> = ({
  event,
  canEdit,
  onEditLineup,
}) => {
  const { colors } = useAppTheme();
  const isCoachShell = useIsCoachShell();
  const lineup = event.lineup;

  const activeFormation = lineup?.formation ?? (isCoachShell ? '4-3-3' : '4-4-2');
  const defaultCoachStarters = useMemo(
    () =>
      isCoachShell
        ? [
            { uid: '1', display_name: 'H. Lloris', role: 'starter' as const, position_label: 'GK' },
            { uid: '2', display_name: 'E. Saliba', role: 'starter' as const, position_label: 'LB' },
            { uid: '3', display_name: 'A. Pogba', role: 'starter' as const, position_label: 'CB' },
            { uid: '4', display_name: 'K. Diallo', role: 'starter' as const, position_label: 'CB' },
            { uid: '5', display_name: 'M. Badé', role: 'starter' as const, position_label: 'RB' },
            { uid: '6', display_name: 'M. Ruiz', role: 'starter' as const, position_label: 'CM' },
            { uid: '7', display_name: 'T. Doué', role: 'starter' as const, position_label: 'CDM' },
            { uid: '8', display_name: 'R. Cherki', role: 'starter' as const, position_label: 'CM' },
            { uid: '9', display_name: 'S. Tel', role: 'starter' as const, position_label: 'LW' },
            { uid: '10', display_name: 'Y. Benali', role: 'starter' as const, position_label: 'ST' },
            { uid: '11', display_name: 'L. Mbeumo', role: 'starter' as const, position_label: 'RW' },
          ]
        : [],
    [isCoachShell]
  );

  const starters = useMemo(() => {
    const configured = (lineup?.slots ?? []).filter((s) => s.role === 'starter');
    if (configured.length > 0) return configured;
    if (isCoachShell) return defaultCoachStarters;
    return [];
  }, [lineup?.slots, isCoachShell, defaultCoachStarters]);

  const subs = useMemo(
    () => (lineup?.slots ?? []).filter((s) => s.role === 'sub'),
    [lineup?.slots]
  );

  const coachCells = useMemo(
    () => eventStartersToStadiumCells(starters, activeFormation),
    [starters, activeFormation]
  );
  const coachBench = useMemo(() => eventSubsToBenchPlayers(subs), [subs]);

  if ((!lineup || lineup.slots.length === 0) && !isCoachShell) {
    return (
      <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
        <Icon name="football-outline" size={36} color={colors.textMuted} />
        <ProDayText variant="section">Composition non publiée</ProDayText>
        <ProDayText variant="body" muted style={styles.emptySub}>
          {canEdit
            ? 'Créez la tactique, les titulaires et les remplaçants pour ce match.'
            : 'Le staff publiera la composition avant le coup d’envoi.'}
        </ProDayText>
        {canEdit ? (
          <PressableSpring onPress={onEditLineup} scaleTo={0.96} haptic>
            <ProDayGradient kind="cta" style={styles.cta}>
              <ProDayText variant="caption" inverse style={styles.ctaText}>
                Créer la composition
              </ProDayText>
            </ProDayGradient>
          </PressableSpring>
        ) : null}
      </ProDaySurface>
    );
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.headRow}>
        <ProDayText variant="section">Système {activeFormation}</ProDayText>
        {canEdit ? (
          <PressableSpring onPress={onEditLineup} scaleTo={0.96} haptic>
            <ProDayText variant="caption" accent style={styles.editLink}>
              Modifier →
            </ProDayText>
          </PressableSpring>
        ) : null}
      </View>

      {isCoachShell ? (
        <CoachSportEasyPitchSurface
          formation={activeFormation}
          cells={coachCells}
          bench={coachBench}
          readOnly
          showHeader
          headerTitle="Composition Officielle"
        />
      ) : (
        <PitchLineupView formation={activeFormation} starters={starters} />
      )}

      {starters.length > 0 ? (
        <ProDaySurface variant="module" style={[styles.listCard, { borderColor: colors.border }]}>
          <ProDayText variant="eyebrow" accent>
            Titulaires ({starters.length})
          </ProDayText>
          {starters.map((s, index) => (
            <StaggerReveal key={s.uid} index={index} delayStep={35}>
              <View style={styles.playerRow}>
                <ProDayText variant="body">{s.display_name}</ProDayText>
                {s.position_label ? (
                  <ProDayText variant="caption" muted>
                    {s.position_label}
                  </ProDayText>
                ) : null}
              </View>
            </StaggerReveal>
          ))}
        </ProDaySurface>
      ) : null}

      {subs.length > 0 ? (
        <ProDaySurface variant="module" style={[styles.listCard, { borderColor: colors.border }]}>
          <ProDayText variant="eyebrow" accent>
            Remplaçants ({subs.length})
          </ProDayText>
          {subs.map((s, index) => (
            <StaggerReveal key={s.uid} index={index} delayStep={35}>
              <View style={styles.playerRow}>
                <ProDayText variant="body">{s.display_name}</ProDayText>
                {s.position_label ? (
                  <ProDayText variant="caption" muted>
                    {s.position_label}
                  </ProDayText>
                ) : null}
              </View>
            </StaggerReveal>
          ))}
        </ProDaySurface>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  headRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editLink: { fontWeight: '800' },
  listCard: { borderWidth: 1, gap: spacing.xs },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
    borderWidth: 1,
  },
  emptySub: { textAlign: 'center' },
  cta: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginTop: spacing.sm,
  },
  ctaText: { fontWeight: '800' },
});
