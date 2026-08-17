import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachChapterScroll, CoachEmptyState, CoachText } from './coachPortalUi';
import { CoachPane } from './CoachScreenHeader';
import { PressableSpring } from '../motion';
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
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';

export const CoachCommunicationChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  members,
  events,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();
  const shellNav = useCoachShellNav();
  const styles = useCoachThemedStyles(createStyles);
  const clubId = profile.profile.club_id;
  const [announcements, setAnnouncements] = useState<ClubAnnouncement[]>([]);
  const [docs, setDocs] = useState<TeamDocument[]>([]);
  const [staffNotifs, setStaffNotifs] = useState<StaffNotification[]>([]);
  const [busy, setBusy] = useState(false);

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

  const nextEvent = useMemo(
    () =>
      [...events]
        .filter((e) => e.starts_at.getTime() > Date.now())
        .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime())[0] ?? null,
    [events],
  );

  if (!clubId) {
    return (
      <CoachPane title={getCoachPageIdentity('com_staff').title}>
        <CoachChapterScroll>
          <CoachEmptyState
            title={t('coach.portal.effectif.noClub')}
            body={t('coach.portal.effectif.noClubBody')}
          />
        </CoachChapterScroll>
      </CoachPane>
    );
  }

  return (
    <CoachPane title={getCoachPageIdentity('com_staff').title}>
    <CoachChapterScroll>
      <View style={styles.card}>
        <CoachText variant="caption" muted style={styles.section}>
          Alertes staff
        </CoachText>
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
                if (n.event_id) tabNav.openMatchs({ eventId: n.event_id });
              }}
              scaleTo={0.98}
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
              </View>
            </PressableSpring>
          ))
        )}
      </View>

      <PressableSpring onPress={() => tabNav.setActiveTab('messages')} scaleTo={0.96} haptic>
        <View style={styles.card}>
          <CoachText variant="section">{t('coach.portal.communication.messages')}</CoachText>
          <CoachText variant="caption" muted>
            {t('coach.portal.communication.messagesBody')}
          </CoachText>
        </View>
      </PressableSpring>

      <View style={styles.card}>
        <CoachText variant="caption" muted style={styles.section}>
          {t('coach.portal.communication.parents')}
        </CoachText>
        <CoachText variant="caption" muted>
          {t('coach.portal.communication.parentsBody')}
        </CoachText>
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
      </View>

      <View style={styles.card}>
        <CoachText variant="caption" muted style={styles.section}>
          {t('coach.portal.communication.announcements')}
        </CoachText>
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
        <PressableSpring
          onPress={() => {
            if (shellNav) shellNav.requestNav('gestion');
            else nav.openDashboard('gestion');
          }}
          scaleTo={0.96}
          haptic
        >
          <CoachText variant="caption" accent style={styles.link}>
            {t('coach.portal.communication.openAnnouncements')}
          </CoachText>
        </PressableSpring>
      </View>

      <View style={styles.card}>
        <CoachText variant="caption" muted style={styles.section}>
          {t('coach.portal.communication.docs')}
        </CoachText>
        <CoachText variant="caption" muted>
          {t('coach.portal.communication.docsBody')}
        </CoachText>
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
      </View>
    </CoachChapterScroll>
    </CoachPane>
  );
};

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: spacing.md,
    gap: spacing.xs,
    backgroundColor: tokens.surface,
  },
  section: { fontWeight: '700', fontSize: 15 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  link: { fontWeight: '800', marginTop: 4 },
});
