import React from 'react';
import { View, ScrollView, StyleSheet, RefreshControl } from 'react-native';
import type { User } from '../../../models/User';
import type { TeamEvent, RsvpStatus } from '../../../models/TeamEvent';
import { MATCH_SITE } from '../../../content/matchPageIdentity';
import { MatchChapterIntro } from '../MatchChapterIntro';
import { ProDayText } from '../../ui/ProDayText';
import { MatchConvocationCard } from '../MatchConvocationCard';
import { SkeletonList, InteractiveListItem } from '../../motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing } from '../../../theme/designTokens';
import { MATCH_CHAPTER_PAD } from './matchChapterLayout';
import { MatchEmptyState, MatchKpiRow } from '../matchCenterUi';

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
      contentContainerStyle={[MATCH_CHAPTER_PAD, styles.stack]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
      }
      {...scrollProps}
    >
      <MatchChapterIntro
        kicker="Convocations"
        title={t('matchs.chapter.convocations')}
        subtitle={t('matchs.convocations.intro.subtitle')}
      />

      <MatchKpiRow
        items={[
          {
            label: t('matchs.convocations.pending'),
            value: String(pendingConvocations.length),
            tone: pendingConvocations.length > 0 ? MATCH_SITE.warn : MATCH_SITE.muted,
          },
          {
            label: 'À venir',
            value: String(myUpcomingEvents.length),
            tone: colors.accent,
          },
        ]}
      />

      {pendingConvocations.length > 0 ? (
        <View style={styles.section}>
          <ProDayText variant="caption" style={[styles.sectionKicker, { color: MATCH_SITE.warn }]}>
            {t('matchs.convocations.pending')} · {pendingConvocations.length}
          </ProDayText>
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
        <ProDayText variant="caption" style={[styles.sectionKicker, { color: colors.accent }]}>
          Mes prochains événements
        </ProDayText>
        {loadingCalendar ? (
          <SkeletonList count={3} variant="card" />
        ) : myUpcomingEvents.length === 0 ? (
          <MatchEmptyState
            title={
              profile ? t('matchs.convocations.empty.upToDate') : t('matchs.chapter.convocations')
            }
            body={
              profile ? t('match.convocations.empty.auth') : t('match.convocations.empty.guest')
            }
            cta={!profile ? t('common.login') : undefined}
            onPress={!profile ? onLogin : undefined}
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
  stack: { gap: spacing.md, paddingTop: spacing.sm },
  section: { gap: spacing.xs },
  sectionKicker: {
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontSize: 10,
    fontWeight: '800',
    marginBottom: 4,
  },
});
