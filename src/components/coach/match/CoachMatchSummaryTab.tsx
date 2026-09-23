import React, { useEffect, useState } from 'react';
import { Alert, Pressable, Share, StyleSheet, View } from 'react-native';
import type { TeamEvent } from '../../../models/TeamEvent';
import type { User } from '../../../models/User';
import type { ClubMatchVideo } from '../../../models/ClubCameras';
import {
  EVENT_TYPE_LABELS,
  countRsvpYes,
  getPendingInviteeUids,
} from '../../../models/TeamEvent';
import { formatCalendarDate } from '../../../utils/seasonCalendar';
import { resolveLiveState } from '../../../utils/matchLive';
import { clubCamerasService } from '../../../services/clubCameras.service';
import { coachVideoMissingSourceAlert } from '../../../utils/coachVideoHonesty';
import { filterCapturesForRole } from '../../../utils/matchVideoVisibility';
import { ProDayIntegratedVideoPlayer } from '../../video/ProDayIntegratedVideoPlayer';
import { CoachSectionCard, CoachSettingsGroup, CoachSettingsRow, CoachText } from '../coachPortalUi';
import { Icon } from '../../ui/Icon';
import type { MatchHubChapterId } from '../../../content/matchHubChapters';
import { spacing } from '../../../theme/designTokens';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { OpponentMatchDaySheet } from '../../matchs/OpponentMatchDaySheet';
import { MatchTalkPanel } from '../MatchTalkPanel';

/**
 * Section captation VEO de la fiche de match : liste honnête des captations
 * réellement rattachées à l'événement (event_id), aucune vidéo de démonstration.
 * Visibilité par rôle (VEO-03) déléguée à `matchVideoVisibility` (pure, testée).
 */
function EventVeoCaptureSection({ event, profile }: { event: TeamEvent; profile: User }) {
  const { tokens } = useCoachTheme();
  const [videos, setVideos] = useState<ClubMatchVideo[] | null>(null);
  const [playing, setPlaying] = useState<ClubMatchVideo | null>(null);

  const isStaffViewer = !['coach', 'player', 'parent'].includes(profile.role);

  useEffect(() => {
    let active = true;
    if (!event.club_id) {
      setVideos([]);
      return () => {
        active = false;
      };
    }
    void clubCamerasService
      .listVideosForEvent(event.club_id, event.id)
      .then((stored) => {
        if (!active) return;
        setVideos(filterCapturesForRole(stored, profile.role));
      })
      .catch(() => {
        if (active) setVideos([]);
      });
    return () => {
      active = false;
    };
  }, [event.club_id, event.id]);

  const handlePlay = (video: ClubMatchVideo) => {
    if (!video.storage_url) {
      Alert.alert('Lecture impossible', coachVideoMissingSourceAlert());
      return;
    }
    setPlaying(video);
  };

  const statusLabel = (video: ClubMatchVideo): string => {
    switch (video.kind) {
      case 'live':
        return 'En direct';
      case 'replay':
        return 'Replay';
      case 'imported':
        return 'Vidéo importée';
      default:
        return 'Source associée';
    }
  };

  if (videos === null) return null;

  const visibleVideos = videos;

  return (
    <View>
      <CoachSectionCard
        kicker="Captation vidéo"
        title={visibleVideos.length > 0 ? `${visibleVideos.length} captation(s) associée(s)` : 'Aucune captation associée'}
        body={
          visibleVideos.length > 0
            ? undefined
            : 'Rattachez un lien Veo ou un flux réel depuis « Captation VEO » ci-dessous. Aucun direct de démonstration n’est affiché.'
        }
      >
        {visibleVideos.map((video) => (
          <Pressable
            key={video.id}
            onPress={() => handlePlay(video)}
            style={({ pressed }) => [styles.captureRow, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
          >
            <Icon name="videocam" size={18} color={tokens.accent} />
            <View style={styles.captureMeta}>
              <CoachText variant="section" accent style={styles.captureTitle}>
                {video.title}
              </CoachText>
              <CoachText variant="caption" muted>
                {statusLabel(video)}
                {video.duration_sec ? ` · ${Math.floor(video.duration_sec / 60)} min` : ''}
              </CoachText>
            </View>
            <Icon name="play" size={16} color={tokens.accent} />
          </Pressable>
        ))}
      </CoachSectionCard>

      {playing && playing.storage_url ? (
        <ProDayIntegratedVideoPlayer
          isModal
          sourceUrl={playing.storage_url}
          title={playing.title}
          matchInfo={`${event.title}${playing.opponent ? ` vs ${playing.opponent}` : ''}`}
          userRole={profile.role === 'player' || profile.role === 'parent' || profile.role === 'coach' ? profile.role : 'club'}
          onClose={() => setPlaying(null)}
        />
      ) : null}
    </View>
  );
}

type Props = {
  event: TeamEvent;
  profile: User;
  members?: User[];
  onOpenChapter: (chapter: MatchHubChapterId) => void;
  onOpenCarpool?: () => void;
  /** Staff : ouvre l'association d'une captation VEO rattachée à ce match. */
  onOpenVeoAssociate?: () => void;
};

export function CoachMatchSummaryTab({
  event,
  profile,
  members = [],
  onOpenChapter,
  onOpenCarpool,
  onOpenVeoAssociate,
}: Props) {
  const { tokens } = useCoachTheme();
  const live = resolveLiveState(event);
  const yesCount = countRsvpYes(event);
  const pendingCount = getPendingInviteeUids(event).length;

  const shareConvocation = async () => {
    const msg = `Convocation ProDay\n${event.title}\n${formatCalendarDate(event.starts_at)}\n${live.home_label} vs ${live.opponent_name}\n${event.city}`;
    await Share.share({ message: msg });
  };  return (
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

      <EventVeoCaptureSection event={event} profile={profile} />

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
        {onOpenVeoAssociate ? (
          <CoachSettingsRow icon="videocam" label="Captation VEO" onPress={onOpenVeoAssociate} last />
        ) : null}
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
  captureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  captureMeta: { flex: 1 },
  captureTitle: { fontWeight: '700' },
});
