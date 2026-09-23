import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useAuth } from '../../context/AuthContext';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { supporterProfileService } from '../../services/supporterProfile.service';
import { teamEventsService } from '../../services/teamEvents.service';
import { isCoachMatchEvent, type TeamEvent } from '../../models/TeamEvent';
import { CalendarMonthGrid } from '../../features/calendar/CalendarMonthGrid';
import { Icon } from '../../components/ui/Icon';
import { AnimatedEntrance, PressableSpring } from '../../components/motion';
import { colors, radius, spacing } from '../../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';

type MatchTimeFilter = 'all' | 'upcoming' | 'past';

export const SupporterMatchsScreen: React.FC = () => {
  const { colors: themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const { firebaseUser } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const currentUid = profile?.uid || firebaseUser?.uid || '';

  const [events, setEvents] = useState<TeamEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeFilter, setTimeFilter] = useState<MatchTimeFilter>('all');
  const [followedClubsCount, setFollowedClubsCount] = useState(0);

  const loadEvents = useCallback(async () => {
    if (!currentUid) {
      setEvents([]);
      setFollowedClubsCount(0);
      setLoading(false);
      return;
    }

    try {
      const clubs = await supporterProfileService.getFollowedClubs(currentUid);
      setFollowedClubsCount(clubs.length);

      if (clubs.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const allMatches: TeamEvent[] = [];
      await Promise.all(
        clubs.map(async (c) => {
          try {
            const clubEvents = await teamEventsService.listForClub(c.clubId, 50);
            const matchesOnly = clubEvents.filter(isCoachMatchEvent);
            allMatches.push(...matchesOnly);
          } catch {
            // Ignorer l'erreur d'un club
          }
        }),
      );

      // Trier par ordre chronologique
      allMatches.sort(
        (a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime(),
      );

      setEvents(allMatches);
    } catch {
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [currentUid]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const filteredEvents = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (timeFilter === 'upcoming') {
      return events.filter((e) => new Date(e.starts_at) >= startOfToday);
    }
    if (timeFilter === 'past') {
      return events.filter((e) => new Date(e.starts_at) < startOfToday);
    }
    return events;
  }, [events, timeFilter]);

  const calendarTokens = useMemo(
    () => ({
      bg: themeColors.background,
      surface: colors.surface,
      card: colors.surface,
      border: colors.border,
      text: colors.text,
      muted: colors.textMuted,
      accent: colors.brand,
      onAccent: '#000000',
    }),
    [themeColors.background],
  );

  const handleSelectEvent = (event: any) => {
    const title = event.title || 'Match';
    const dateStr = event.starts_at
      ? new Date(event.starts_at).toLocaleDateString('fr-FR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          hour: '2-digit',
          minute: '2-digit',
        })
      : '';
    const location = event.location_label || event.city || 'Lieu à confirmer';

    Alert.alert(
      title,
      `${dateStr}\nLieu : ${location}\n${event.description || ''}`.trim(),
      [{ text: 'Fermer', style: 'cancel' }],
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.brand}
          />
        }
      >
        {/* En-tête */}
        <AnimatedEntrance kind="fadeUp" index={0}>
          <View style={styles.header}>
            <Text style={styles.title}>Matchs</Text>
            <Text style={styles.subtitle}>
              Calendrier des rencontres et résultats de vos clubs suivis
            </Text>
          </View>
        </AnimatedEntrance>

        {/* Filtres Temporels */}
        <AnimatedEntrance kind="fadeUp" index={1}>
          <View style={styles.filterRow}>
            {(
              [
                { id: 'all', label: 'Tous les matchs' },
                { id: 'upcoming', label: 'À venir' },
                { id: 'past', label: 'Passés' },
              ] as const
            ).map((filter) => {
              const active = timeFilter === filter.id;
              return (
                <PressableSpring
                  key={filter.id}
                  onPress={() => setTimeFilter(filter.id)}
                  scaleTo={0.96}
                  haptic
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                >
                  <Text style={[styles.filterLabel, active && styles.filterLabelActive]}>
                    {filter.label}
                  </Text>
                </PressableSpring>
              );
            })}
          </View>
        </AnimatedEntrance>

        {/* Contenu Calendrier ou État vide */}
        {loading ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={colors.brand} />
          </View>
        ) : followedClubsCount === 0 ? (
          <AnimatedEntrance kind="fadeUp" index={2}>
            <View style={styles.emptyCard}>
              <Icon name="shield" size={36} color={colors.textMuted} />
              <Text style={styles.emptyTitle}>Aucun club suivi</Text>
              <Text style={styles.emptySubtitle}>
                Suivez des clubs dans l’onglet Mes clubs pour afficher automatiquement leur calendrier de matchs.
              </Text>
              <PressableSpring
                onPress={() => setActiveTab('plus')}
                scaleTo={0.95}
                haptic
                style={styles.ctaBtn}
              >
                <Icon name="search" size={14} color="#000" />
                <Text style={styles.ctaBtnText}>Découvrir des clubs</Text>
              </PressableSpring>
            </View>
          </AnimatedEntrance>
        ) : (
          <AnimatedEntrance kind="fadeUp" index={2}>
            <CalendarMonthGrid
              events={filteredEvents}
              onSelectEvent={handleSelectEvent}
              defaultViewMode="month"
              tokens={calendarTokens}
              emptyMessage="Aucun match programmé sur cette période"
            />
          </AnimatedEntrance>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  filterChip: {
    paddingVertical: 7,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: colors.brand,
    borderColor: colors.brand,
  },
  filterLabel: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  filterLabelActive: {
    color: '#000',
    fontWeight: '800',
  },
  loaderBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
    minHeight: 44,
  },
  ctaBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
});
