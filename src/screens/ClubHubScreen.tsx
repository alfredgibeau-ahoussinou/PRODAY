import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import type { User } from '../models/User';
import type { TeamEvent } from '../models/TeamEvent';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ScreenBackButton } from '../components/ui/ScreenBackButton';
import { ProDayText } from '../components/ui/ProDayText';
import { ListEmptyPanel } from '../components/ui/ListEmptyPanel';
import { Icon } from '../components/ui/Icon';
import { PressableSpring } from '../components/motion';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing, radius } from '../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';
import { teamThreadId } from '../utils/teamChatIds';
import {
  CLUB_COMMUNITY_CHANNELS,
  type ClubChannelId,
} from '../content/clubCommunityChannels';
import { useClubCommunityChannelNav } from '../utils/clubCommunityNav';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useCoachShellNav } from '../features/coach/shell/CoachShellNavContext';

export type { ClubChannelId };

type ClubHubScreenProps = {
  profile: User;
  events: TeamEvent[];
  onBack: () => void;
  onChannel: (channel: ClubChannelId) => void;
  onOpenEvent?: (eventId: string) => void;
  onOpenTeamChat?: (threadId: string, title: string) => void;
  /** Nom club affiché — fallback display_name */
  clubName?: string;
};

/** Hub club type Discord — salons thématiques. */
export const ClubHubScreen: React.FC<ClubHubScreenProps> = ({
  profile,
  events,
  onBack,
  onChannel,
  onOpenEvent,
  onOpenTeamChat,
  clubName: clubNameProp,
}) => {
  const { colors } = useAppTheme();
  const tabNav = useTabNavigation();
  const shellNav = useCoachShellNav();
  const clubName = clubNameProp?.trim() || events[0]?.club_name?.trim() || 'Communauté';
  const openCoachChannel = useClubCommunityChannelNav();

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => e.starts_at.getTime() > Date.now())
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
        .slice(0, 5),
    [events],
  );

  const handleChannel = (channel: ClubChannelId) => {
    if (openCoachChannel(channel)) return;
    onChannel(channel);
  };

  const handleOpenEvent = (eventId: string) => {
    if (shellNav) {
      tabNav.openMatchs({ eventId });
      return;
    }
    if (onOpenTeamChat) {
      const event = events.find((e) => e.id === eventId);
      if (event) {
        onOpenTeamChat(teamThreadId(event.id), `Équipe · ${event.title}`);
        return;
      }
    }
    onOpenEvent?.(eventId);
  };

  return (
    <TabScreenShell
      caption="Communauté"
      title={clubName}
      subtitle="Salons équipe · Messagerie, mercato, trajets"
      left={<ScreenBackButton onPress={onBack} />}
      flat
    >
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: TAB_BAR_CONTENT_INSET }]}
        showsVerticalScrollIndicator={false}
      >
        <ProDayText variant="eyebrow" muted style={styles.section}>
          Salons
        </ProDayText>
        <View style={styles.channelGrid}>
          {CLUB_COMMUNITY_CHANNELS.map((ch) => (
            <PressableSpring
              key={ch.id}
              style={[styles.channel, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => handleChannel(ch.id)}
              scaleTo={0.97}
              haptic
            >
              <View style={[styles.channelIcon, { backgroundColor: colors.accentSoft }]}>
                <Icon name={ch.icon} size={20} color={colors.accent} />
              </View>
              <ProDayText variant="section" style={styles.channelLabel}>
                {ch.label}
              </ProDayText>
              <ProDayText variant="caption" muted numberOfLines={2}>
                {ch.description}
              </ProDayText>
            </PressableSpring>
          ))}
        </View>

        <ProDayText variant="eyebrow" muted style={styles.section}>
          Groupes événements
        </ProDayText>
        {upcoming.length === 0 ? (
          <ListEmptyPanel
            icon="calendar"
            title="Aucun événement à venir"
            subtitle="Les groupes d'équipe apparaissent après RSVP sur une convocation."
          />
        ) : (
          upcoming.map((event) => (
            <PressableSpring
              key={event.id}
              style={[styles.eventRow, { borderColor: colors.border }]}
              onPress={() => handleOpenEvent(event.id)}
              scaleTo={0.98}
            >
              <Icon name="people" size={18} color={colors.accent} />
              <View style={styles.eventCopy}>
                <ProDayText variant="caption" style={styles.eventTitle}>
                  {event.title}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  Chat équipe · {event.city}
                </ProDayText>
              </View>
              <Icon name="chevron-forward" size={14} color={colors.textMuted} />
            </PressableSpring>
          ))
        )}
      </ScrollView>
    </TabScreenShell>
  );
};

const styles = StyleSheet.create({
  scroll: { padding: spacing.lg, gap: spacing.sm },
  section: { marginTop: spacing.sm, marginBottom: spacing.xs },
  channelGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  channel: {
    width: '47%',
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.xs,
  },
  channelIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  channelLabel: { fontSize: 15 },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  eventCopy: { flex: 1 },
  eventTitle: { fontWeight: '700' },
});
