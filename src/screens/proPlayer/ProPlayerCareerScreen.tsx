import React, { useCallback, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useUnreadMessageCount } from '../../hooks/useUnreadMessages';
import { useCareerProgression, usePlayerActivities } from '../../hooks/useCareerProgression';
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

/** Onglet Carrière — cockpit joueur pro (doc §4.3). */
export const ProPlayerCareerScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
  const nav = useTabNavigationActions();
  const { count: unreadMessages } = useUnreadMessageCount();
  const { activities, loading: activitiesLoading, refresh: refreshActivities } = usePlayerActivities(
    profile?.uid,
  );
  const career = useCareerProgression(profile, { activities });
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshActivities();
    } finally {
      setRefreshing(false);
    }
  }, [refreshActivities]);

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
            Messages
          </ProDayText>
          <ProDayText variant="section">{unreadMessages}</ProDayText>
        </View>
        <View style={styles.metric}>
          <ProDayText variant="eyebrow" muted>
            Profil
          </ProDayText>
          <ProDayText variant="section">{completion}%</ProDayText>
        </View>
      </ProDaySurface>

      {career ? <CareerScoreCard career={career} /> : null}
      <CareerTimelineCard activities={activities} loading={activitiesLoading} />

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
    gap: spacing.lg,
    padding: spacing.lg,
  },
  metric: { flex: 1, gap: spacing.xs },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
});
