import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import type { User } from '../../../models/User';
import type { TeamEvent, RsvpStatus } from '../../../models/TeamEvent';
import { MatchChapterIntro } from '../MatchChapterIntro';
import { ProDayText } from '../../ui/ProDayText';
import { MatchConvocationCard } from '../MatchConvocationCard';
import { SkeletonList, InteractiveListItem } from '../../motion';
import { ListEmptyPanel } from '../../ui/ListEmptyPanel';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing } from '../../../theme/designTokens';
import { MATCH_CHAPTER_PAD } from './matchChapterLayout';

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
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <ScrollView
      contentContainerStyle={MATCH_CHAPTER_PAD}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      {...scrollProps}
    >
      <MatchChapterIntro
        title={t('matchs.chapter.convocations')}
        subtitle={t('matchs.convocations.intro.subtitle')}
      />

      {pendingConvocations.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <ProDayText variant="eyebrow" accent>
              {t('matchs.convocations.pending')}
            </ProDayText>
            <View style={[styles.countPill, { backgroundColor: colors.accent }]}>
              <ProDayText variant="caption" inverse style={styles.countText}>
                {pendingConvocations.length}
              </ProDayText>
            </View>
          </View>
          {pendingConvocations.map((event, index) => (
            <InteractiveListItem key={event.id} index={index}>
              <MatchConvocationCard
                event={event}
                profileUid={profile?.uid ?? ''}
                playerName={profile?.display_name}
                pending
                onOpen={() => onOpenEvent(event.id)}
                onRsvp={(status) => onRsvp(event.id, status)}
                rsvpBusy={rsvpBusy}
                onLateReported={onRefresh}
                onOpenCarpool={
                  onOpenCarpoolForEvent ? () => onOpenCarpoolForEvent(event.id) : undefined
                }
              />
            </InteractiveListItem>
          ))}
        </View>
      ) : null}

      <View style={styles.section}>
        <ProDayText variant="eyebrow" accent style={styles.sectionTitle}>
          Mes prochains événements
        </ProDayText>
        {loadingCalendar ? (
          <SkeletonList count={3} variant="card" />
        ) : myUpcomingEvents.length === 0 ? (
          <ListEmptyPanel
            icon={profile ? 'checkmark-circle' : 'mail'}
            title={profile ? t('matchs.convocations.empty.upToDate') : t('matchs.chapter.convocations')}
            subtitle={
              profile
                ? t('match.convocations.empty.auth')
                : t('match.convocations.empty.guest')
            }
            primaryCta={!profile ? { label: t('common.login'), onPress: onLogin } : undefined}
          />
        ) : (
          myUpcomingEvents.map((event, index) => (
            <InteractiveListItem key={event.id} index={index}>
              <MatchConvocationCard
                event={event}
                profileUid={profile?.uid ?? ''}
                playerName={profile?.display_name}
                onOpen={() => onOpenEvent(event.id)}
                onLateReported={onRefresh}
                onOpenCarpool={
                  onOpenCarpoolForEvent ? () => onOpenCarpoolForEvent(event.id) : undefined
                }
              />
            </InteractiveListItem>
          ))
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  section: { marginBottom: spacing.lg },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  sectionTitle: { marginBottom: spacing.sm },
  countPill: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: { fontWeight: '900', fontSize: 11 },
});
