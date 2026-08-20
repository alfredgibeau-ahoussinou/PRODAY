import React, { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { SupporterPageFrame } from '../../components/supporter/SupporterPageFrame';
import { getSupporterPageIdentity, SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { SupporterHeroLiveCard } from '../../features/supporter/components/SupporterHeroLiveCard';
import { SupporterMatchCard } from '../../components/supporter/SupporterMatchCard';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring, PushScreenTransition } from '../../components/motion';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { useSupporterMatchHub } from '../../hooks/useSupporterMatchHub';
import { followsService } from '../../services/follows.service';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing } from '../../theme/designTokens';
import type { Follow } from '../../models/Follow';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { SupporterMatchDetailScreen } from './SupporterMatchDetailScreen';

type Props = {
  onBack?: () => void;
};

/** Scores live — toujours le chapitre direct, indépendant du dock Matchs. */
export const SupporterLiveNowScreen: React.FC<Props> = ({ onBack }) => {
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const [follows, setFollows] = useState<Follow[]>([]);
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    void followsService.listByFollower(profile.uid).then(setFollows).catch(() => setFollows([]));
  }, [profile?.uid]);

  const hub = useSupporterMatchHub({
    calendarEvents: events,
    tournaments,
    follows,
    filters: { gender: 'all', source: 'all', scope: 'all', competition: 'all' },
    pollLive: true,
  });

  const live = hub.sections.live;
  const recent = hub.sections.recent;

  const openMatch = useCallback((item: SupporterMatchViewItem) => {
    setSelected(item);
  }, []);

  if (selected) {
    return (
      <PushScreenTransition active>
        <SupporterMatchDetailScreen item={selected} onBack={() => setSelected(null)} />
      </PushScreenTransition>
    );
  }

  return (
    <SupporterPageFrame
      identity={{
        ...getSupporterPageIdentity('matchs'),
        eyebrow: 'En direct',
        title: 'Live',
        support: 'Scores du moment — tape un match pour le centre.',
      }}
    >
      {onBack ? (
        <PressableSpring style={styles.back} onPress={onBack} haptic>
          <ProDayText variant="caption" style={styles.backText}>
            ← Retour
          </ProDayText>
        </PressableSpring>
      ) : null}
      {hub.loading && live.length === 0 ? (
        <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginTop: spacing.lg }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {live.length === 0 ? (
            <View style={styles.empty}>
              <ProDayText variant="body" style={styles.emptyText}>
                Aucun match en direct pour le moment. Reviens au coup d’envoi — les scores
                apparaissent ici.
              </ProDayText>
            </View>
          ) : (
            live.map((item) =>
              live.length === 1 ? (
                <SupporterHeroLiveCard
                  key={item.id}
                  item={item}
                  onPress={() => openMatch(item)}
                />
              ) : (
                <SupporterMatchCard
                  key={item.id}
                  item={item}
                  onPress={() => openMatch(item)}
                />
              ),
            )
          )}
          {recent.length > 0 ? (
            <View style={styles.recent}>
              <ProDayText variant="caption" style={styles.recentTitle}>
                Terminés récemment
              </ProDayText>
              {recent.map((item) => (
                <SupporterMatchCard
                  key={item.id}
                  item={item}
                  compact
                  onPress={() => openMatch(item)}
                />
              ))}
            </View>
          ) : null}
        </ScrollView>
      )}
    </SupporterPageFrame>
  );
};

const styles = StyleSheet.create({
  back: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.sm,
    alignSelf: 'flex-start',
  },
  backText: { color: SUPPORTER_SITE.accent },
  scroll: { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl, gap: spacing.sm },
  empty: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  emptyText: { color: SUPPORTER_SITE.muted, lineHeight: 22 },
  recent: { paddingTop: spacing.lg, gap: spacing.sm },
  recentTitle: {
    paddingHorizontal: spacing.lg,
    color: SUPPORTER_SITE.muted,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    fontSize: 10,
  },
});
