import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Linking, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachChapterScroll, CoachEmptyState } from './coachPortalUi';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
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
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { radius, spacing } from '../../theme/designTokens';

export const CoachCommunicationChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  members,
  events,
  onRefresh,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const tabNav = useTabNavigation();
  const nav = useTabNavigationActions();
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
      <CoachChapterScroll>
        <CoachEmptyState
          title={t('coach.portal.effectif.noClub')}
          body={t('coach.portal.effectif.noClubBody')}
        />
      </CoachChapterScroll>
    );
  }

  return (
    <CoachChapterScroll>
      <ProDayText variant="section">{t('coach.portal.communication.title')}</ProDayText>
      <ProDayText variant="caption" muted>
        {t('coach.portal.communication.subtitle')}
      </ProDayText>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent style={styles.section}>
          Alertes staff
        </ProDayText>
        {staffNotifs.length === 0 ? (
          <ProDayText variant="caption" muted>
            Aucun retard ni alerte récente.
          </ProDayText>
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
                  <ProDayText variant="caption" style={{ fontWeight: n.read_at ? '500' : '800' }}>
                    {n.title}
                  </ProDayText>
                  <ProDayText variant="caption" muted numberOfLines={2}>
                    {n.body}
                  </ProDayText>
                </View>
              </View>
            </PressableSpring>
          ))
        )}
      </ProDaySurface>

      <PressableSpring onPress={() => tabNav.setActiveTab('messages')} scaleTo={0.96} haptic>
        <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
          <ProDayText variant="section">{t('coach.portal.communication.messages')}</ProDayText>
          <ProDayText variant="caption" muted>
            {t('coach.portal.communication.messagesBody')}
          </ProDayText>
        </ProDaySurface>
      </PressableSpring>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent style={styles.section}>
          {t('coach.portal.communication.parents')}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {t('coach.portal.communication.parentsBody')}
        </ProDayText>
        {parentHints.length === 0 ? (
          <ProDayText variant="caption" muted>
            {t('coach.portal.communication.parentsEmpty')}
          </ProDayText>
        ) : (
          parentHints.map(({ player, note }) => (
            <View key={player.uid} style={styles.row}>
              <View style={{ flex: 1 }}>
                <ProDayText variant="caption" style={{ fontWeight: '700' }}>
                  {player.display_name}
                </ProDayText>
                {note ? (
                  <ProDayText variant="caption" muted>
                    {note}
                  </ProDayText>
                ) : (
                  <ProDayText variant="caption" muted>
                    {t('coach.portal.communication.noAbsenceNote')}
                  </ProDayText>
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
            <ProDayText variant="caption" accent style={styles.link}>
              {t('coach.portal.communication.remindConvoc')}
            </ProDayText>
          </PressableSpring>
        ) : null}
      </ProDaySurface>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent style={styles.section}>
          {t('coach.portal.communication.announcements')}
        </ProDayText>
        {announcements.length === 0 ? (
          <ProDayText variant="caption" muted>
            {t('coach.portal.communication.announcementsEmpty')}
          </ProDayText>
        ) : (
          announcements.map((a) => (
            <ProDayText key={a.id} variant="caption" muted>
              {a.title}
            </ProDayText>
          ))
        )}
        <PressableSpring onPress={() => nav.openDashboard('gestion')} scaleTo={0.96} haptic>
          <ProDayText variant="caption" accent style={styles.link}>
            {t('coach.portal.communication.openAnnouncements')}
          </ProDayText>
        </PressableSpring>
      </ProDaySurface>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent style={styles.section}>
          {t('coach.portal.communication.docs')}
        </ProDayText>
        <ProDayText variant="caption" muted>
          {t('coach.portal.communication.docsBody')}
        </ProDayText>
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
            <ProDayText variant="caption" style={{ flex: 1, fontWeight: '700' }}>
              {d.title}
            </ProDayText>
            <ProDayText variant="caption" muted>
              {d.kind}
            </ProDayText>
          </PressableSpring>
        ))}
        <PressableSpring onPress={() => void uploadDoc()} disabled={busy} scaleTo={0.96} haptic>
          <ProDayText variant="caption" accent style={styles.link}>
            {t('coach.portal.communication.upload')}
          </ProDayText>
        </PressableSpring>
      </ProDaySurface>
    </CoachChapterScroll>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  section: { fontWeight: '800', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  link: { fontWeight: '800', marginTop: 4 },
});
