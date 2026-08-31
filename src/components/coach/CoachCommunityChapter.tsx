import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { CoachChapterCommonProps } from './coachPortalUi';
import {
  CoachChapterScroll,
  CoachEmptyState,
  CoachSectionCard,
  CoachText,
} from './coachPortalUi';
import { CoachPane } from './CoachScreenHeader';
import { PressableSpring, PushScreenTransition } from '../motion';
import { Icon } from '../ui/Icon';
import { clubAnnouncementsService } from '../../services/clubAnnouncements.service';
import { teamDocumentsService } from '../../services/teamDocuments.service';
import { teamEventsService } from '../../services/teamEvents.service';
import {
  staffNotificationsService,
  type StaffNotification,
} from '../../services/staffNotifications.service';
import type { ClubAnnouncement } from '../../models/ClubAnnouncement';
import type { TeamDocument } from '../../models/TeamDocument';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachThemedStyles, useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { useCoachTeamChrome } from '../../hooks/useCoachTeamChrome';
import { CLUB_COMMUNITY_CHANNELS } from '../../content/clubCommunityChannels';
import { useClubCommunityChannelNav } from '../../utils/clubCommunityNav';
import { ClubAnnouncementsScreen } from '../../screens/ClubAnnouncementsScreen';
import { isOrganizerCapable } from '../../utils/roleCapabilities';
import { useAuth } from '../../context/AuthContext';

function SalonTile({
  label,
  icon,
  description,
  onPress,
}: {
  label: string;
  icon: (typeof CLUB_COMMUNITY_CHANNELS)[number]['icon'];
  description: string;
  onPress: () => void;
}) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createTileStyles);

  return (
    <PressableSpring style={styles.cell} onPress={onPress} scaleTo={0.94} haptic>
      <View style={styles.tile}>
        <View style={styles.iconCircle}>
          <Icon name={icon} size={22} color={tokens.accent} variant="filled" />
        </View>
        <CoachText variant="caption" style={styles.label} numberOfLines={1}>
          {label}
        </CoachText>
        <CoachText variant="caption" muted numberOfLines={2} style={styles.desc}>
          {description}
        </CoachText>
      </View>
    </PressableSpring>
  );
}

/** Communauté coach — salons équipe + alertes staff / parents / docs. */
export const CoachCommunityChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  members,
  events,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const { isAdmin } = useAuth();
  const tabNav = useTabNavigation();
  const shellNav = useCoachShellNav();
  const { teamName } = useCoachTeamChrome();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const clubId = profile.profile.club_id;
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [docs, setDocs] = useState<TeamDocument[]>([]);
  const [staffNotifs, setStaffNotifs] = useState<StaffNotification[]>([]);
  const [busy, setBusy] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  const pageTitle = teamName.trim() ? teamName : 'Communauté';
  const isStaff =
    Boolean(isAdmin) ||
    profile.role === 'coach' ||
    profile.role === 'organizer' ||
    profile.role === 'agent' ||
    profile.role === 'club' ||
    isOrganizerCapable(profile.role);

  const openChannel = useClubCommunityChannelNav({
    onGeneral: () => setShowAnnouncements(true),
  });

  const load = useCallback(async () => {
    if (!clubId) return;
    const [a, d, n] = await Promise.all([
      clubAnnouncementsService.listByClub(clubId, 8),
      teamDocumentsService.listForClub(clubId),
      staffNotificationsService.listForUser(profile.uid, 15),
    ]);
    setAnnouncements(a);
    setDocs(d);
    setStaffNotifs(n);
  }, [clubId, profile.uid]);

  useEffect(() => {
    void load();
  }, [load]);

  const upcoming = useMemo(
    () =>
      events
        .filter((e) => e.starts_at.getTime() > Date.now())
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())
        .slice(0, 5),
    [events],
  );

  const minors = useMemo(
    () => members.filter((m) => m.parental_settings?.is_minor === true),
    [members],
  );

  const parentHints = useMemo(() => {
    return minors.slice(0, 8).map((m) => {
      const note = events
        .flatMap((e) => {
          const n = e.rsvp_notes?.[m.uid];
          return n ? [`${e.title}: ${n}`] : [];
        })
        .slice(0, 1)[0];
      return { player: m, note };
    });
  }, [minors, events]);

  const nextEvent = useMemo(
    () =>
      [...events]
        .filter((e) => e.starts_at.getTime() > Date.now())
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0] ?? null,
    [events],
  );

  const uploadDoc = async () => {
    if (!clubId) return;
    try {
      const picked = await DocumentPicker.getDocumentAsync({
        copyToCacheDirectory: true,
        multiple: false,
      });
      if (picked.canceled || !picked.assets?.[0]) return;
      const asset = picked.assets[0];
      setBusy(true);
      await teamDocumentsService.uploadAndCreate(
        profile.uid,
        profile.display_name,
        clubId,
        {
          uri: asset.uri,
          name: asset.name ?? 'document',
          mimeType: asset.mimeType ?? undefined,
        },
        'other',
      );
      await load();
      onRefresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const remindEvent = async (eventId: string) => {
    try {
      setBusy(true);
      const n = await teamEventsService.sendReminders(eventId);
      Alert.alert(
        t('coach.portal.communication.remindTitle'),
        t('coach.portal.communication.remindSent', { n }),
      );
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const openEvent = (eventId: string) => {
    tabNav.openMatchs({ eventId });
  };

  if (!clubId) {
    return (
      <CoachPane title={pageTitle}>
        <CoachChapterScroll>
          <CoachEmptyState
            title={t('coach.portal.effectif.noClub')}
            body={t('coach.portal.effectif.noClubBody')}
          />
        </CoachChapterScroll>
      </CoachPane>
    );
  }

  if (showAnnouncements) {
    return (
      <PushScreenTransition active={showAnnouncements}>
        <ClubAnnouncementsScreen
          profile={profile}
          canManage={isStaff}
          onBack={() => setShowAnnouncements(false)}
        />
      </PushScreenTransition>
    );
  }

  return (
    <CoachPane title={pageTitle}>
      <CoachChapterScroll>
        <CoachText variant="caption" muted style={styles.subtitle}>
          Salons équipe · Messagerie, mercato, trajets
        </CoachText>

        <CoachSectionCard kicker="Salons" title="Canaux équipe">
          <View style={styles.salonGrid}>
            {CLUB_COMMUNITY_CHANNELS.map((ch) => (
              <SalonTile
                key={ch.id}
                label={ch.label}
                icon={ch.icon}
                description={ch.description}
                onPress={() => openChannel(ch.id)}
              />
            ))}
          </View>
        </CoachSectionCard>

        <CoachSectionCard kicker="Événements" title="Groupes événements">
          {upcoming.length === 0 ? (
            <CoachEmptyState
              title="Aucun événement à venir"
              body="Les groupes d'équipe apparaissent après RSVP sur une convocation."
            />
          ) : (
            upcoming.map((event) => (
              <PressableSpring
                key={event.id}
                onPress={() => openEvent(event.id)}
                scaleTo={0.98}
                haptic
                style={styles.eventRow}
              >
                <Icon name="people" size={18} color={tokens.accent} />
                <View style={styles.eventCopy}>
                  <CoachText variant="caption" style={styles.eventTitle}>
                    {event.title}
                  </CoachText>
                  <CoachText variant="caption" muted>
                    {event.city} ·{' '}
                    {event.starts_at.toLocaleDateString('fr-FR', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}
                  </CoachText>
                </View>
                <Icon name="chevron-forward" size={14} color={tokens.muted} />
              </PressableSpring>
            ))
          )}
        </CoachSectionCard>

        <CoachSectionCard kicker="Staff" title="Alertes staff">
          {staffNotifs.length === 0 ? (
            <CoachText variant="caption" muted>
              Aucun retard ni alerte récente.
            </CoachText>
          ) : (
            staffNotifs.slice(0, 8).map((n) => (
              <PressableSpring
                key={n.id}
                onPress={() => {
                  void staffNotificationsService.markRead(n.id).then(() => void load());
                  if (n.event_id) {
                    tabNav.openMatchs({
                      eventId: n.event_id,
                      hubChapter: 'effectif',
                    });
                    return;
                  }
                  if (shellNav) shellNav.requestNav('com_staff');
                  else tabNav.setActiveTab('home');
                }}
                scaleTo={0.98}
                haptic
              >
                <View style={styles.row}>
                  <View style={{ flex: 1 }}>
                    <CoachText variant="caption" style={{ fontWeight: n.read_at ? '500' : '800' }}>
                      {n.title}
                    </CoachText>
                    <CoachText variant="caption" muted numberOfLines={2}>
                      {n.body}
                    </CoachText>
                  </View>
                  <Icon name="chevron-forward" size={14} color={tokens.muted} />
                </View>
              </PressableSpring>
            ))
          )}
        </CoachSectionCard>

        <PressableSpring
          onPress={() => {
            if (shellNav) shellNav.requestNav('messages');
            else tabNav.setActiveTab('messages');
          }}
          scaleTo={0.96}
          haptic
        >
          <CoachSectionCard
            kicker="Inbox"
            title={t('coach.portal.communication.messages')}
            body={t('coach.portal.communication.messagesBody')}
          />
        </PressableSpring>

        <CoachSectionCard
          kicker="Familles"
          title={t('coach.portal.communication.parents')}
          body={t('coach.portal.communication.parentsBody')}
        >
          {parentHints.length === 0 ? (
            <CoachText variant="caption" muted>
              {t('coach.portal.communication.parentsEmpty')}
            </CoachText>
          ) : (
            parentHints.map(({ player, note }) => (
              <View key={player.uid} style={styles.row}>
                <View style={{ flex: 1 }}>
                  <CoachText variant="caption" style={{ fontWeight: '700' }}>
                    {player.display_name}
                  </CoachText>
                  {note ? (
                    <CoachText variant="caption" muted>
                      {note}
                    </CoachText>
                  ) : (
                    <CoachText variant="caption" muted>
                      {t('coach.portal.communication.noAbsenceNote')}
                    </CoachText>
                  )}
                </View>
              </View>
            ))
          )}
          {nextEvent ? (
            <PressableSpring
              onPress={() => void remindEvent(nextEvent.id)}
              disabled={busy}
              scaleTo={0.96}
              haptic
            >
              <CoachText variant="caption" accent style={styles.link}>
                {t('coach.portal.communication.remindConvoc')}
              </CoachText>
            </PressableSpring>
          ) : null}
        </CoachSectionCard>

        <CoachSectionCard
          kicker="Club"
          title={t('coach.portal.communication.announcements')}
        >
          {announcements.length === 0 ? (
            <CoachText variant="caption" muted>
              {t('coach.portal.communication.announcementsEmpty')}
            </CoachText>
          ) : (
            announcements.map((a) => (
              <CoachText key={a.id} variant="caption" muted>
                {a.title}
              </CoachText>
            ))
          )}
          <PressableSpring onPress={() => setShowAnnouncements(true)} scaleTo={0.96} haptic>
            <CoachText variant="caption" accent style={styles.link}>
              {t('coach.portal.communication.openAnnouncements')}
            </CoachText>
          </PressableSpring>
        </CoachSectionCard>

        <CoachSectionCard
          kicker="Fichiers"
          title={t('coach.portal.communication.docs')}
          body={t('coach.portal.communication.docsBody')}
        >
          {docs.map((d) => (
            <PressableSpring
              key={d.id}
              onPress={() => {
                if (d.download_url) void Linking.openURL(d.download_url);
              }}
              scaleTo={0.97}
              haptic
              style={styles.row}
            >
              <CoachText variant="caption" style={{ flex: 1, fontWeight: '700' }}>
                {d.title}
              </CoachText>
              <CoachText variant="caption" muted>
                {d.kind}
              </CoachText>
            </PressableSpring>
          ))}
          <PressableSpring onPress={() => void uploadDoc()} disabled={busy} scaleTo={0.96} haptic>
            <CoachText variant="caption" accent style={styles.link}>
              {t('coach.portal.communication.upload')}
            </CoachText>
          </PressableSpring>
        </CoachSectionCard>
      </CoachChapterScroll>
    </CoachPane>
  );
};

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
    subtitle: { marginBottom: spacing.xs, fontWeight: '600' },
    salonGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
    },
    eventRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    eventCopy: { flex: 1 },
    eventTitle: { fontWeight: '700' },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
    link: { fontWeight: '800', marginTop: 4 },
  });

function createTileStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    cell: {
      width: '48%',
      flexGrow: 1,
      minWidth: '46%',
    },
    tile: {
      minHeight: 96,
      borderRadius: 16,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      gap: spacing.xs,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.soft,
    },
    label: { fontWeight: '800', textAlign: 'center' },
    desc: { textAlign: 'center', fontSize: 11, lineHeight: 14 },
  });
}

/** @deprecated Utiliser CoachCommunityChapter */
export const CoachCommunicationChapter = CoachCommunityChapter;
