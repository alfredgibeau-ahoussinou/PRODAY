import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { User } from '../../models/User';
import {
  buildCareerPathwayPlan,
  type CareerPathwayStep,
} from '../../core/recruitment/careerPathway.engine';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { spacing, radius } from '../../theme/designTokens';

interface CareerPathwayPanelProps {
  player: User;
  pulseScore?: number;
  openTournamentCount?: number;
  pendingApplications?: number;
}

export const CareerPathwayPanel: React.FC<CareerPathwayPanelProps> = ({
  player,
  pulseScore,
  openTournamentCount,
  pendingApplications,
}) => {
  const { colors } = useAppTheme();
  const nav = useTabNavigationActions();
  const plan = useMemo(
    () =>
      buildCareerPathwayPlan({
        player,
        pulseScore,
        openTournamentCount,
        pendingApplications,
      }),
    [player, pulseScore, openTournamentCount, pendingApplications]
  );

  const onStep = (step: CareerPathwayStep) => {
    if (step.tab === 'recrutement' && step.mercatoView) {
      nav.openMercato(step.mercatoView);
      return;
    }
    if (step.tab === 'matchs') {
      nav.openMatchs({ homeTab: 'tournois' });
      return;
    }
    if (step.tab === 'profil') {
      nav.openProfile();
      return;
    }
    nav.setActiveTab('home');
  };

  return (
    <ProDaySurface variant="module" style={styles.block}>
      <ProDayText variant="eyebrow" accent>
        Assistant carrière
      </ProDayText>
      <ProDayText variant="section">{plan.headline}</ProDayText>
      <ProDayText variant="caption" muted style={styles.sub}>
        {plan.levelLabel} · Préparation Mercato {plan.readinessScore}%
      </ProDayText>

      {plan.steps.map((step) => (
        <PressableSpring
          key={step.id}
          onPress={() => onStep(step)}
          scaleTo={0.98}
          style={[
            styles.row,
            { borderColor: colors.border, backgroundColor: colors.surfaceMuted },
          ]}
        >
          <View style={{ flex: 1, gap: 2 }}>
            <ProDayText variant="body" style={{ fontWeight: '800' }}>
              {step.title}
            </ProDayText>
            <ProDayText variant="caption" muted numberOfLines={2}>
              {step.reason}
            </ProDayText>
          </View>
          <ProDayText variant="caption" accent style={{ fontWeight: '800' }}>
            Go
          </ProDayText>
        </PressableSpring>
      ))}
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  block: { padding: spacing.lg, marginBottom: spacing.md, gap: spacing.xs },
  sub: { marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
});
