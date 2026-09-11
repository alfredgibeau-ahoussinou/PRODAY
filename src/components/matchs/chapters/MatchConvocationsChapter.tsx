import React, { useMemo, useState } from 'react';
import { View, ScrollView, StyleSheet, RefreshControl, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { User } from '../../../models/User';
import type { TeamEvent, RsvpStatus } from '../../../models/TeamEvent';
import { userRsvp } from '../../../models/TeamEvent';
import { ProDayText } from '../../ui/ProDayText';
import { MatchConvocationCard } from '../MatchConvocationCard';
import { SkeletonList, InteractiveListItem } from '../../motion';
import { useTranslation } from '../../../context/LocaleContext';
import { useMatchSkinTokens } from '../matchCenterUi';
import { usePlayerTheme, usePlayerThemeColors } from '../../../context/PlayerThemeContext';
import { MATCH_CHAPTER_PAD } from './matchChapterLayout';
import { MatchEmptyState } from '../matchCenterUi';
import { prodayHaptics } from '../../../utils/prodayHaptics';

const scrollProps = {
  showsVerticalScrollIndicator: false,
  nestedScrollEnabled: true,
  keyboardShouldPersistTaps: 'handled' as const,
};

export interface MatchConvocationsChapterProps {
  profile: User | null;
  pendingConvocations: TeamEvent[];
  myUpcomingEvents: TeamEvent[];
  loadingCalendar: boolean;
  rsvpBusy?: boolean;
  refreshing: boolean;
  onRefresh: () => void;
  onOpenEvent: (eventId: string) => void;
  onRsvp: (eventId: string, status: RsvpStatus) => void;
  onOpenCarpoolForEvent?: (eventId: string) => void;
  onLogin: () => void;
}

/**
 * Chapitre Convocations Épuré & Direct (Inspiré de SportEasy)
 * Filtres simples en tête, cartes d'action directes sans boîtes superflues.
 */
export const MatchConvocationsChapter: React.FC<MatchConvocationsChapterProps> = ({
  profile,
  pendingConvocations,
  myUpcomingEvents,
  loadingCalendar,
  rsvpBusy,
  refreshing,
  onRefresh,
  onOpenEvent,
  onRsvp,
  onOpenCarpoolForEvent,
  onLogin,
}) => {
  const skin = useMatchSkinTokens();
  const playerThemeCtx = usePlayerTheme();
  const playerTheme = usePlayerThemeColors();
  const teamPrimary = playerThemeCtx.clubColors?.primary ?? playerTheme.accent ?? skin.accent;
  const { t } = useTranslation();

  const [tab, setTab] = useState<'all' | 'pending' | 'confirmed'>(() =>
    pendingConvocations.length > 0 ? 'pending' : 'all',
  );

  const allUniqueEvents = useMemo(() => {
    const map = new Map<string, TeamEvent>();
    pendingConvocations.forEach((e) => map.set(e.id, e));
    myUpcomingEvents.forEach((e) => map.set(e.id, e));
    return Array.from(map.values()).sort(
      (a, b) => a.starts_at.getTime() - b.starts_at.getTime(),
    );
  }, [pendingConvocations, myUpcomingEvents]);

  const confirmedEvents = useMemo(() => {
    if (!profile) return myUpcomingEvents;
    return allUniqueEvents.filter((e) => userRsvp(e, profile.uid) === 'yes');
  }, [allUniqueEvents, profile, myUpcomingEvents]);

  const displayedEvents = useMemo(() => {
    if (tab === 'pending') return pendingConvocations;
    if (tab === 'confirmed') return confirmedEvents;
    return allUniqueEvents;
  }, [tab, pendingConvocations, confirmedEvents, allUniqueEvents]);

  const allCount = allUniqueEvents.length;
  const pendingCount = pendingConvocations.length;
  const confirmedCount = confirmedEvents.length;

  return (
    <ScrollView
      contentContainerStyle={[MATCH_CHAPTER_PAD, styles.stack]}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={teamPrimary}
        />
      }
      {...scrollProps}
    >
      {/* 3 Filtres Simples en Puces */}
      <View style={styles.filterRow}>
        {[
          { id: 'all' as const, label: 'Toutes', count: allCount, icon: 'list-outline' as const },
          { id: 'pending' as const, label: 'À confirmer', count: pendingCount, icon: 'mail-unread-outline' as const },
          { id: 'confirmed' as const, label: 'Confirmées', count: confirmedCount, icon: 'checkmark-circle-outline' as const },
        ].map((seg) => {
          const isSelected = tab === seg.id;
          const isPendingTab = seg.id === 'pending' && seg.count > 0;

          return (
            <TouchableOpacity
              key={seg.id}
              onPress={() => {
                prodayHaptics.press();
                setTab(seg.id);
              }}
              style={[
                styles.filterChip,
                isSelected && {
                  backgroundColor: isPendingTab ? `${skin.warn}1E` : `${teamPrimary}1E`,
                  borderColor: isPendingTab ? `${skin.warn}60` : `${teamPrimary}60`,
                },
              ]}
              activeOpacity={0.75}
            >
              <Ionicons
                name={seg.icon}
                size={13}
                color={
                  isSelected
                    ? isPendingTab ? skin.warn : teamPrimary
                    : isPendingTab ? skin.warn : '#9CA3AF'
                }
              />
              <ProDayText
                style={[
                  styles.filterChipText,
                  isSelected && {
                    color: isPendingTab ? skin.warn : '#FFFFFF',
                    fontWeight: '800',
                  },
                ]}
              >
                {seg.label}
              </ProDayText>

              {seg.count > 0 ? (
                <View
                  style={[
                    styles.countBadge,
                    {
                      backgroundColor: isPendingTab
                        ? skin.warn
                        : isSelected
                          ? teamPrimary
                          : 'rgba(255, 255, 255, 0.08)',
                    },
                  ]}
                >
                  <ProDayText
                    style={[
                      styles.countBadgeText,
                      { color: isPendingTab || isSelected ? '#000000' : '#9CA3AF' },
                    ]}
                  >
                    {seg.count}
                  </ProDayText>
                </View>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Liste des convocations */}
      {loadingCalendar ? (
        <SkeletonList count={3} variant="card" />
      ) : displayedEvents.length === 0 ? (
        <MatchEmptyState
          title={
            tab === 'pending'
              ? 'Aucune convocation en attente'
              : tab === 'confirmed'
                ? 'Aucune convocation confirmée'
                : 'Aucune convocation'
          }
          body={
            !profile
              ? t('matchs.calendar.empty.guest')
              : tab === 'pending'
                ? 'Toutes vos réponses sont à jour.'
                : 'Vous serez notifié dès que le coach publiera une feuille de match.'
          }
          cta={!profile ? t('matchs.calendar.cta.login') : undefined}
          onPress={!profile ? onLogin : undefined}
        />
      ) : (
        displayedEvents.map((ev, i) => (
          <InteractiveListItem key={ev.id} index={i}>
            <MatchConvocationCard
              event={ev}
              profileUid={profile?.uid || ''}
              playerName={profile?.display_name}
              pending={pendingConvocations.some((p) => p.id === ev.id)}
              onOpen={() => onOpenEvent(ev.id)}
              onRsvp={(status) => onRsvp(ev.id, status)}
              rsvpBusy={rsvpBusy}
              onOpenCarpool={
                onOpenCarpoolForEvent
                  ? () => onOpenCarpoolForEvent(ev.id)
                  : undefined
              }
            />
          </InteractiveListItem>
        ))
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  stack: {
    gap: 12,
    paddingTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    paddingBottom: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#111116',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },
  filterChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  countBadge: {
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  countBadgeText: {
    fontSize: 9.5,
    fontWeight: '900',
  },
});
