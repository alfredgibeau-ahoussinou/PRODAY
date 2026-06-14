import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import type { User } from '../models/User';
import type { TeamEvent } from '../models/TeamEvent';
import { V3TabShell } from '../components/v3/V3TabShell';
import { V3ScreenBack } from '../components/v3/V3ScreenBack';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { Icon, type IconName } from '../components/ui/Icon';
import { PressableSpring } from '../components/motion';
import { useAppTheme } from '../context/ProductLineContext';
import { spacing, radius } from '../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';
import { teamThreadId } from '../utils/teamChatIds';

export type ClubChannelId = 'general' | 'mercato' | 'covoit' | 'convocations';

const CHANNELS: { id: ClubChannelId; label: string; icon: IconName; description: string }[] = [
  { id: 'general', label: 'Général', icon: 'chat', description: 'Annonces et discussions club' },
  { id: 'mercato', label: 'Mercato', icon: 'briefcase', description: 'Recrutement et détections' },
  { id: 'covoit', label: 'Covoiturage', icon: 'car', description: 'Trajets vers matchs et stages' },
  { id: 'convocations', label: 'Convocations', icon: 'calendar', description: 'Événements et RSVP' },
];

type ClubHubScreenProps = {
  profile: User;
  events: TeamEvent[];
  onBack: () => void;
  onChannel: (channel: ClubChannelId) => void;
  onOpenEvent?: (eventId: string) => void;
  onOpenTeamChat?: (threadId: string, title: string) => void;
};

/** Hub club type Discord — salons thématiques. */
export const ClubHubScreen: React.FC<ClubHubScreenProps> = ({
  profile,
  events,
  onBack,
  onChannel,
  onOpenEvent,
  onOpenTeamChat,
}) => {
  const { colors, productLine } = useAppTheme();
  const clubName = profile.display_name;

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => e.starts_at.getTime() > Date.now())
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
        .slice(0, 5),
    [events]
  );

  return (
    <V3TabShell
      caption="Communauté"
      title={clubName}
      subtitle="Salons équipe — messagerie, mercato, trajets"
      right={<V3ScreenBack onPress={onBack} />}
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
          {CHANNELS.map((ch) => (
            <PressableSpring
              key={ch.id}
              style={[styles.channel, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={() => onChannel(ch.id)}
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
          <ProDaySurface variant="module" style={styles.empty}>
            <ProDayText variant="body" muted>
              Aucun événement à venir — les groupes apparaissent après RSVP.
            </ProDayText>
          </ProDaySurface>
        ) : (
          upcoming.map((event) => (
            <PressableSpring
              key={event.id}
              style={[styles.eventRow, { borderColor: colors.border }]}
              onPress={() => {
                if (onOpenTeamChat) {
                  onOpenTeamChat(teamThreadId(event.id), `Équipe · ${event.title}`);
                } else {
                  onOpenEvent?.(event.id);
                }
              }}
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
    </V3TabShell>
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
  empty: { padding: spacing.lg },
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
