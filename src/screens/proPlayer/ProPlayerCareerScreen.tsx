import React, { useCallback, useMemo, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import { useCareerProgression, usePlayerActivities } from '../../hooks/useCareerProgression';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { ProPlayerShell } from './proPlayerShell';
import { ProDaySurface } from '../../components/ui/ProDaySurface';
import { ProDayText } from '../../components/ui/ProDayText';
import { CareerScoreCard } from '../../components/player/CareerScoreCard';
import { CareerTimelineCard } from '../../components/player/CareerTimelineCard';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { getProfileCompletion } from '../../utils/profileCompletion';
import {
  estimateProfileViews7d,
  getContractDaysRemaining,
  getUpcomingTrials,
} from '../../utils/proPlayerCareerMetrics';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { EVENT_TYPE_LABELS } from '../../models/TeamEvent';

/** Onglet Carrière — cockpit joueur pro (doc §4.3). */
export const ProPlayerCareerScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
  const nav = useTabNavigationActions();
  const { count: unreadMessages } = useUnreadMessageCount();
  const { data, refresh: refreshDashboard } = useDashboardData(profile);
  const { activities, loading: activitiesLoading, refresh: refreshActivities } = usePlayerActivities(
    profile?.uid,
  );
  const career = useCareerProgression(profile, { activities });
  const [refreshing, setRefreshing] = useState(false);

  const contract = useMemo(
    () => (profile ? getContractDaysRemaining(profile) : { kind: 'unknown' as const }),
    [profile],
  );
  const profileViews7d = useMemo(
    () => (profile ? estimateProfileViews7d(profile) : 0),
    [profile],
  );
  const upcomingTrials = useMemo(
    () => (profile ? getUpcomingTrials(data.detections, profile.uid) : []),
    [profile, data.detections],
  );

  const contractLabel = useMemo(() => {
    if (contract.kind === 'free') return 'Libre';
    if (contract.kind === 'negotiating') return 'En négociation';
    if (contract.kind === 'days') return `${contract.value} j`;
    return 'Non renseigné';
  }, [contract]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all([refreshActivities(), refreshDashboard()]);
    } finally {
      setRefreshing(false);
    }
  }, [refreshActivities, refreshDashboard]);

  if (!profile) return null;

  const completion = getProfileCompletion(profile).percent;

  return (
    <ProPlayerShell
      caption="Carrière"
      title="Votre trajectoire"
      subtitle="Contrat, consultations profil et timeline"
      profile={profile}
      refreshing={refreshing}
      onRefresh={handleRefresh}
    >
      <ProDaySurface style={styles.metricRow}>
        <View style={styles.metric}>
          <ProDayText variant="eyebrow" muted>
            Fin de contrat
          </ProDayText>
          <ProDayText variant="section">{contractLabel}</ProDayText>
        </View>
        <View style={styles.metric}>
          <ProDayText variant="eyebrow" muted>
            Consultations (7j)
          </ProDayText>
          <ProDayText variant="section">{profileViews7d}</ProDayText>
        </View>
        <View style={styles.metric}>
          <ProDayText variant="eyebrow" muted>
            Messages
          </ProDayText>
          <ProDayText variant="section">{unreadMessages}</ProDayText>
        </View>
      </ProDaySurface>

      <ProDaySurface style={styles.womensFootballSection}>
        <View style={styles.womensFootballHeader}>
          <Icon name="football" size={24} color={colors.accent} />
          <ProDayText variant="section" style={styles.womensFootballTitle}>
            Foot féminin
          </ProDayText>
        </View>
        <ProDayText variant="body" muted style={styles.womensFootballSub}>
          Opportunités et clubs dédiés au football féminin
        </ProDayText>
        <PressableSpring
          onPress={() => nav.openMercato('home')}
          style={styles.womensFootballButton}
          scaleTo={0.98}
        >
          <ProDayText variant="caption" accent style={styles.womensFootballButtonText}>
            Voir les opportunités
          </ProDayText>
          <Icon name="chevron-forward" size={16} color={colors.accent} />
        </PressableSpring>
      </ProDaySurface>

      <ProDaySurface style={styles.metricRow}>
        <View style={styles.metric}>
          <ProDayText variant="eyebrow" muted>
            Profil
          </ProDayText>
          <ProDayText variant="section">{completion}%</ProDayText>
        </View>
      </ProDaySurface>

      {upcomingTrials.length > 0 ? (
        <ProDaySurface style={styles.trials}>
          <ProDayText variant="section">Essais à venir</ProDayText>
          {upcomingTrials.map((trial) => (
            <View key={trial.id} style={styles.trialRow}>
              <ProDayText variant="body">{trial.title}</ProDayText>
              <ProDayText variant="caption" muted>
                {EVENT_TYPE_LABELS[trial.event_type]} · {formatCalendarDate(trial.starts_at)}
              </ProDayText>
            </View>
          ))}
        </ProDaySurface>
      ) : (
        <ProDaySurface style={styles.trials}>
          <ProDayText variant="caption" muted>
            Aucun essai planifié. Consultez l’onglet Opportunités.
          </ProDayText>
        </ProDaySurface>
      )}

      {career ? <CareerScoreCard career={career} /> : null}
      <CareerTimelineCard activities={activities} loading={activitiesLoading} />

      <PressableSpring
        style={[styles.link, { borderColor: colors.border }]}
        onPress={() => nav.openCarpool()}
        haptic
      >
        <Icon name="car" size={18} color={colors.accent} />
        <ProDayText variant="caption">Covoiturage</ProDayText>
      </PressableSpring>

      <PressableSpring
        style={[styles.link, { borderColor: colors.border }]}
        onPress={() => nav.setActiveTab('recrutement')}
        haptic
      >
        <Icon name="briefcase" size={18} color={colors.accent} />
        <ProDayText variant="caption">Voir les opportunités</ProDayText>
      </PressableSpring>
    </ProPlayerShell>
  );
};

const styles = StyleSheet.create({
  metricRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.lg,
    padding: spacing.lg,
    marginBottom: spacing.sm,
  },
  metric: { flex: 1, minWidth: 90, gap: spacing.xs },
  womensFootballSection: {
    padding: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  womensFootballHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  womensFootballTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  womensFootballSub: {
    fontSize: 14,
    lineHeight: 20,
  },
  womensFootballButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  womensFootballButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  trials: {
    padding: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  trialRow: { gap: 2 },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
