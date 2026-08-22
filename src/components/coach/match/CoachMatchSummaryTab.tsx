import React from 'react';
import { Pressable, Share, StyleSheet, View } from 'react-native';
import type { TeamEvent } from '../../../models/TeamEvent';
import type { User } from '../../../models/User';
import {
  EVENT_TYPE_LABELS,
  countRsvpYes,
  getPendingInviteeUids,
} from '../../../models/TeamEvent';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import { resolveLiveState } from '../../../utils/matchLive';
import { CoachSectionCard, CoachSettingsGroup, CoachSettingsRow, CoachText } from '../coachPortalUi';
import { Icon } from '../../ui/Icon';
import type { MatchHubChapterId } from '../../../content/matchHubChapters';
import { spacing } from '../../../theme/designTokens';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { OpponentMatchDaySheet } from '../../matchs/OpponentMatchDaySheet';
import { MatchTalkPanel } from '../MatchTalkPanel';

type Props = {
  event: TeamEvent;
  profile: User;
  members?: User[];
  onOpenChapter: (chapter: MatchHubChapterId) => void;
  onOpenCarpool?: () => void;
};

export function CoachMatchSummaryTab({
  event,
  profile,
  members = [],
  onOpenChapter,
  onOpenCarpool,
}: Props) {
  const { tokens } = useCoachTheme();
  const live = resolveLiveState(event);
  const yesCount = countRsvpYes(event);
  const pendingCount = getPendingInviteeUids(event).length;

  const shareConvocation = async () => {
    const msg = `Convocation ProDay\n${event.title}\n${formatCalendarDate(event.starts_at)}\n${live.home_label} vs ${live.opponent_name}\n${event.city}`;
    await Share.share({ message: msg });
  };

  return (
    <View style={styles.wrap}>
      <CoachSectionCard
        kicker={EVENT_TYPE_LABELS[event.event_type]}
        title={event.title}
        body={`${formatCalendarDate(event.starts_at)}${event.location_label ? `\n${event.location_label}` : ''}\n${event.city}`}
      >
        {event.description ? (
          <CoachText variant="body" muted style={styles.desc}>
            {event.description}
          </CoachText>
        ) : null}
        {event.organizer_name ? (
          <CoachText variant="caption" muted>
            Organisateur · {event.organizer_name}
            {event.club_name ? ` · ${event.club_name}` : ''}
          </CoachText>
        ) : null}
      </CoachSectionCard>

      <OpponentMatchDaySheet event={event} />

      <MatchTalkPanel event={event} profile={profile} members={members} />

      <CoachSectionCard
        kicker="Convocation"
        title={`${yesCount} confirmés · ${pendingCount} en attente`}
        body="Partagez la convocation ou ouvrez le pointage effectif."
      >
        <Pressable
          onPress={() => void shareConvocation()}
          style={({ pressed }) => [styles.shareBtn, pressed && { opacity: 0.7 }]}
        >
          <Icon name="share" size={18} color={tokens.accent} />
          <CoachText variant="section" accent style={styles.shareLabel}>
            Partager la convocation
          </CoachText>
        </Pressable>
      </CoachSectionCard>

      {event.lineup ? (
        <CoachSectionCard
          kicker="Composition"
          title={`${event.lineup.formation} publiée`}
          body={`${event.lineup.slots.filter((s) => s.role === 'starter').length} titulaires · ${event.lineup.slots.filter((s) => s.role === 'sub').length} remplaçants`}
        >
          <Pressable
            onPress={() => onOpenChapter('composition')}
            style={({ pressed }) => [styles.linkRow, pressed && { opacity: 0.7 }]}
          >
            <CoachText variant="caption" accent style={styles.link}>
              Voir la compo →
            </CoachText>
          </Pressable>
        </CoachSectionCard>
      ) : null}

      <CoachSettingsGroup>
        <CoachSettingsRow
          icon="people"
          label="Pointage effectif"
          onPress={() => onOpenChapter('effectif')}
        />
        <CoachSettingsRow
          icon="football"
          label="Composition"
          onPress={() => onOpenChapter('composition')}
        />
        <CoachSettingsRow
          icon="time"
          label="Direct & score"
          onPress={() => onOpenChapter('live')}
        />
        <CoachSettingsRow
          icon="stats-chart"
          label="Stats & rapport"
          onPress={() => onOpenChapter('stats')}
        />
        {onOpenCarpool ? (
          <CoachSettingsRow icon="car" label="Covoiturage" onPress={onOpenCarpool} last />
        ) : null}
      </CoachSettingsGroup>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  desc: { marginTop: spacing.xs, lineHeight: 22 },
  shareBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
  },
  shareLabel: { fontWeight: '700' },
  linkRow: { marginTop: spacing.xs },
  link: { fontWeight: '700' },
});
