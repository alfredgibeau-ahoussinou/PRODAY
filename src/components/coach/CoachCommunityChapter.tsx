import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Linking, StyleSheet, View } from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { CoachChapterCommonProps } from './coachPortalUi';
import {
  CoachChapterScroll,
  CoachEmptyState,
} from './coachPortalUi';
import { CoachPane } from './CoachScreenHeader';
import { PressableSpring, PushScreenTransition } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
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
import { radius, spacing } from '../../theme/designTokens';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachThemedStyles, useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { useCoachTeamChrome } from '../../hooks/useCoachTeamChrome';
import { CLUB_COMMUNITY_CHANNELS, type ClubChannelId } from '../../content/clubCommunityChannels';
import { useClubCommunityChannelNav } from '../../utils/clubCommunityNav';
import { ClubAnnouncementsScreen } from '../../screens/ClubAnnouncementsScreen';
import { isOrganizerCapable } from '../../utils/roleCapabilities';
import { useAuth } from '../../context/AuthContext';

/** Hub Communauté & Salons Équipe — Design Système ProDay Elite */
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
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);

  const pageTitle = teamName.trim() ? teamName : 'Seniors A';
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

  const nextEvent = upcoming[0] ?? null;

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
      setUploadingDoc(true);
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
      setUploadingDoc(false);
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

  const channelBadges: Record<ClubChannelId, { badge: string; count?: number }> = {
    general: { badge: 'En direct', count: announcements.length },
    mercato: { badge: 'Ouvert' },
    covoit: { badge: 'Trajets actifs' },
    convocations: { badge: 'RSVP' },
  };

  return (
    <CoachPane title={pageTitle}>
      <CoachChapterScroll>
        {/* Hero Team Hub Banner */}
        <View style={styles.heroCard}>
          <View style={styles.heroHead}>
            <View style={styles.heroIconCircle}>
              <Icon name="people" size={24} color={tokens.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <View style={styles.heroBadgeRow}>
                <View style={styles.liveIndicator}>
                  <View style={styles.liveDot} />
                  <ProDayText variant="caption" style={styles.liveText}>
                    HUB CONNECTÉ
                  </ProDayText>
                </View>
                <ProDayText variant="caption" style={styles.teamTag}>
                  {profile.profile.category || 'SENIORS'}
                </ProDayText>
              </View>
              <ProDayText variant="title" style={styles.heroTitle}>
                {pageTitle}
              </ProDayText>
              <ProDayText variant="caption" style={styles.heroSub}>
                Canaux d’équipe, messagerie instantanée, trajets et convocations.
              </ProDayText>
            </View>
          </View>

          {/* Metric Pills */}
          <View style={styles.metricsRow}>
            <View style={styles.metricPill}>
              <Icon name="chatbubbles" size={14} color={tokens.accent} />
              <ProDayText variant="caption" style={styles.metricValue}>
                4 Salons
              </ProDayText>
            </View>
            <View style={styles.metricPill}>
              <Icon name="calendar" size={14} color={tokens.accent} />
              <ProDayText variant="caption" style={styles.metricValue}>
                {upcoming.length} Événement{upcoming.length > 1 ? 's' : ''}
              </ProDayText>
            </View>
            <View style={styles.metricPill}>
              <Icon name="person" size={14} color={tokens.accent} />
              <ProDayText variant="caption" style={styles.metricValue}>
                {members.length} Membre{members.length > 1 ? 's' : ''}
              </ProDayText>
            </View>
          </View>

          {/* Quick Action Shortcuts */}
          <View style={styles.heroActionRow}>
            <PressableSpring
              onPress={() => setShowAnnouncements(true)}
              scaleTo={0.96}
              haptic
              style={styles.heroActionBtn}
            >
              <Icon name="notifications" size={14} color={tokens.accent} />
              <ProDayText variant="caption" style={styles.heroActionText}>
                Annonce
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              onPress={() => {
                if (shellNav) shellNav.requestNav('planning');
                else tabNav.openMatchs();
              }}
              scaleTo={0.96}
              haptic
              style={styles.heroActionBtn}
            >
              <Icon name="calendar" size={14} color={tokens.accent} />
              <ProDayText variant="caption" style={styles.heroActionText}>
                Convoquer
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              onPress={() => {
                if (shellNav) shellNav.requestNav('carpool');
                else tabNav.setActiveTab('covoiturage');
              }}
              scaleTo={0.96}
              haptic
              style={styles.heroActionBtn}
            >
              <Icon name="car" size={14} color={tokens.accent} />
              <ProDayText variant="caption" style={styles.heroActionText}>
                Trajet
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              onPress={() => void uploadDoc()}
              disabled={uploadingDoc}
              scaleTo={0.96}
              haptic
              style={styles.heroActionBtn}
            >
              {uploadingDoc ? (
                <ActivityIndicator size="small" color={tokens.accent} />
              ) : (
                <Icon name="document-text" size={14} color={tokens.accent} />
              )}
              <ProDayText variant="caption" style={styles.heroActionText}>
                Document
              </ProDayText>
            </PressableSpring>
          </View>
        </View>

        {/* Canaux Équipe Grid */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Icon name="grid" size={16} color={tokens.accent} />
            <ProDayText variant="section" style={styles.sectionTitle}>
              Canaux d’équipe
            </ProDayText>
          </View>
          <ProDayText variant="caption" style={styles.sectionCounter}>
            4 Salons
          </ProDayText>
        </View>

        <View style={styles.channelGrid}>
          {CLUB_COMMUNITY_CHANNELS.map((ch) => {
            const meta = channelBadges[ch.id];
            return (
              <PressableSpring
                key={ch.id}
                style={styles.channelCard}
                onPress={() => openChannel(ch.id)}
                scaleTo={0.97}
                haptic
              >
                <View style={styles.channelTop}>
                  <View style={styles.channelIconBox}>
                    <Icon name={ch.icon} size={22} color={tokens.accent} />
                  </View>
                  <View style={styles.channelBadge}>
                    <ProDayText variant="caption" style={styles.channelBadgeText}>
                      {meta?.badge}
                    </ProDayText>
                  </View>
                </View>

                <View style={styles.channelBody}>
                  <ProDayText variant="section" style={styles.channelName}>
                    {ch.label}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.channelDesc} numberOfLines={2}>
                    {ch.description}
                  </ProDayText>
                </View>

                <View style={styles.channelFooter}>
                  <ProDayText variant="caption" style={styles.channelActionLink}>
                    Accéder au salon
                  </ProDayText>
                  <Icon name="chevron-forward" size={14} color={tokens.accent} />
                </View>
              </PressableSpring>
            );
          })}
        </View>

        {/* Groupes Événements & Match Threads */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Icon name="calendar" size={16} color={tokens.accent} />
            <ProDayText variant="section" style={styles.sectionTitle}>
              Discussions Match & Événements
            </ProDayText>
          </View>
          <ProDayText variant="caption" style={styles.sectionCounter}>
            {upcoming.length} à venir
          </ProDayText>
        </View>

        {upcoming.length === 0 ? (
          <View style={styles.emptyCard}>
            <View style={styles.emptyIconCircle}>
              <Icon name="calendar" size={28} color={tokens.accent} />
            </View>
            <ProDayText variant="section" style={styles.emptyTitle}>
              Aucun match ni événement programmé
            </ProDayText>
            <ProDayText variant="caption" style={styles.emptyBody}>
              Les salons de discussion dédiés se synchronisent automatiquement lors de la création d’une convocation.
            </ProDayText>
            <PressableSpring
              onPress={() => {
                if (shellNav) shellNav.requestNav('planning');
                else tabNav.openMatchs();
              }}
              scaleTo={0.96}
              haptic
              style={styles.primaryActionBtn}
            >
              <Icon name="add" size={16} color={tokens.isLight ? '#FFFFFF' : '#000000'} />
              <ProDayText variant="caption" style={styles.primaryActionBtnText}>
                Planifier un match ou entraînement
              </ProDayText>
            </PressableSpring>
          </View>
        ) : (
          <View style={styles.eventList}>
            {upcoming.map((event) => {
              const dateStr = event.starts_at.toLocaleDateString('fr-FR', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              });
              const timeStr = event.starts_at.toLocaleTimeString('fr-FR', {
                hour: '2-digit',
                minute: '2-digit',
              });
              return (
                <PressableSpring
                  key={event.id}
                  onPress={() => openEvent(event.id)}
                  scaleTo={0.98}
                  haptic
                  style={styles.eventCard}
                >
                  <View style={styles.eventDateBlock}>
                    <ProDayText variant="caption" style={styles.eventDateDay}>
                      {dateStr.split(' ')[0]?.toUpperCase()}
                    </ProDayText>
                    <ProDayText variant="section" style={styles.eventDateNum}>
                      {dateStr.split(' ')[1]}
                    </ProDayText>
                  </View>

                  <View style={styles.eventContent}>
                    <View style={styles.eventTitleRow}>
                      <ProDayText variant="section" style={styles.eventTitle} numberOfLines={1}>
                        {event.title}
                      </ProDayText>
                      <View style={styles.eventTimePill}>
                        <ProDayText variant="caption" style={styles.eventTimeText}>
                          {timeStr}
                        </ProDayText>
                      </View>
                    </View>
                    <View style={styles.eventMetaRow}>
                      <Icon name="location" size={12} color={tokens.muted} />
                      <ProDayText variant="caption" style={styles.eventCity} numberOfLines={1}>
                        {event.city || 'Terrain officiel'}
                      </ProDayText>
                      <ProDayText variant="caption" style={styles.eventDot}>
                        ·
                      </ProDayText>
                      <Icon name="chat" size={12} color={tokens.accent} />
                      <ProDayText variant="caption" style={styles.eventChatTag}>
                        Salon actif
                      </ProDayText>
                    </View>
                  </View>

                  <Icon name="chevron-forward" size={16} color={tokens.muted} />
                </PressableSpring>
              );
            })}
          </View>
        )}

        {/* Alertes Staff & Retards */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Icon name="shield" size={16} color={tokens.accent} />
            <ProDayText variant="section" style={styles.sectionTitle}>
              Alertes Staff & Retards
            </ProDayText>
          </View>
          <ProDayText variant="caption" style={styles.sectionCounter}>
            {staffNotifs.length > 0 ? `${staffNotifs.length} alerte(s)` : 'Effectif OK'}
          </ProDayText>
        </View>

        {staffNotifs.length === 0 ? (
          <View style={styles.reassuranceCard}>
            <View style={styles.reassuranceIconBox}>
              <Icon name="checkmark-circle" size={22} color={tokens.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <ProDayText variant="section" style={styles.reassuranceTitle}>
                Effectif à l’heure & opérationnel
              </ProDayText>
              <ProDayText variant="caption" style={styles.reassuranceBody}>
                Aucun retard ni indisponibilité signalés sur les dernières 48h.
              </ProDayText>
            </View>
          </View>
        ) : (
          <View style={styles.notifList}>
            {staffNotifs.slice(0, 5).map((n) => (
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
                style={[styles.notifCard, !n.read_at && styles.notifUnread]}
              >
                <View style={[styles.notifDot, !n.read_at && styles.notifDotActive]} />
                <View style={{ flex: 1, gap: 2 }}>
                  <ProDayText
                    variant="caption"
                    style={[styles.notifTitle, !n.read_at && styles.notifTitleBold]}
                  >
                    {n.title}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.notifBody} numberOfLines={2}>
                    {n.body}
                  </ProDayText>
                </View>
                <Icon name="chevron-forward" size={14} color={tokens.muted} />
              </PressableSpring>
            ))}
          </View>
        )}

        {/* Inbox / Messagerie Équipe Directe */}
        <PressableSpring
          onPress={() => {
            if (shellNav) shellNav.requestNav('messages');
            else tabNav.setActiveTab('messages');
          }}
          scaleTo={0.97}
          haptic
          style={styles.inboxBanner}
        >
          <View style={styles.inboxIconWrap}>
            <Icon name="chatbubbles" size={22} color={tokens.accent} />
          </View>
          <View style={{ flex: 1 }}>
            <ProDayText variant="section" style={styles.inboxTitle}>
              {t('coach.portal.communication.messages')}
            </ProDayText>
            <ProDayText variant="caption" style={styles.inboxSub}>
              {t('coach.portal.communication.messagesBody')}
            </ProDayText>
          </View>
          <View style={styles.inboxActionPill}>
            <ProDayText variant="caption" style={styles.inboxActionText}>
              Ouvrir
            </ProDayText>
            <Icon name="chevron-forward" size={12} color={tokens.accent} />
          </View>
        </PressableSpring>

        {/* Espace Familles & Convocations */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Icon name="people" size={16} color={tokens.accent} />
            <ProDayText variant="section" style={styles.sectionTitle}>
              Suivi Familles & Présences
            </ProDayText>
          </View>
          <ProDayText variant="caption" style={styles.sectionCounter}>
            {minors.length} joueur(s) suivi(s)
          </ProDayText>
        </View>

        <View style={styles.familyCard}>
          <ProDayText variant="caption" style={styles.familyDesc}>
            Justifications d’absence, consignes parentales et relances de convocation.
          </ProDayText>

          {parentHints.length === 0 ? (
            <View style={styles.familyEmptyBox}>
              <Icon name="checkmark-circle" size={16} color={tokens.muted} />
              <ProDayText variant="caption" style={styles.familyEmptyText}>
                Toutes les autorisations et consignes de présence sont à jour.
              </ProDayText>
            </View>
          ) : (
            <View style={styles.familyHintList}>
              {parentHints.map(({ player, note }) => (
                <View key={player.uid} style={styles.familyHintRow}>
                  <View style={styles.familyAvatarMini}>
                    <ProDayText variant="caption" style={styles.familyAvatarText}>
                      {player.display_name.charAt(0)}
                    </ProDayText>
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="caption" style={styles.familyPlayerName}>
                      {player.display_name}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.familyNote} numberOfLines={1}>
                      {note || 'Présence confirmée par les parents'}
                    </ProDayText>
                  </View>
                </View>
              ))}
            </View>
          )}

          {nextEvent ? (
            <PressableSpring
              onPress={() => void remindEvent(nextEvent.id)}
              disabled={busy}
              scaleTo={0.96}
              haptic
              style={styles.remindBtn}
            >
              <Icon name="notifications" size={14} color={tokens.accent} />
              <ProDayText variant="caption" style={styles.remindBtnText}>
                {t('coach.portal.communication.remindConvoc')}
              </ProDayText>
            </PressableSpring>
          ) : null}
        </View>

        {/* Coffre-fort Documents & Règlements */}
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionHeaderLeft}>
            <Icon name="document-text" size={16} color={tokens.accent} />
            <ProDayText variant="section" style={styles.sectionTitle}>
              Documents & Coffre-fort Équipe
            </ProDayText>
          </View>
          <ProDayText variant="caption" style={styles.sectionCounter}>
            {docs.length} fichier(s)
          </ProDayText>
        </View>

        <View style={styles.docsCard}>
          {docs.length === 0 ? (
            <View style={styles.docsEmpty}>
              <Icon name="document" size={24} color={tokens.muted} />
              <ProDayText variant="caption" style={styles.docsEmptyText}>
                Aucun document partagé (projet de jeu, règlement, plannings).
              </ProDayText>
            </View>
          ) : (
            <View style={styles.docsList}>
              {docs.map((d) => (
                <PressableSpring
                  key={d.id}
                  onPress={() => {
                    if (d.download_url) void Linking.openURL(d.download_url);
                  }}
                  scaleTo={0.98}
                  haptic
                  style={styles.docRow}
                >
                  <View style={styles.docIconBox}>
                    <Icon name="document-text" size={18} color={tokens.accent} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <ProDayText variant="caption" style={styles.docTitle} numberOfLines={1}>
                      {d.title}
                    </ProDayText>
                    <ProDayText variant="caption" style={styles.docKind}>
                      {d.kind || 'Fichier PDF/Doc'}
                    </ProDayText>
                  </View>
                  <Icon name="document" size={16} color={tokens.muted} />
                </PressableSpring>
              ))}
            </View>
          )}

          <PressableSpring
            onPress={() => void uploadDoc()}
            disabled={uploadingDoc}
            scaleTo={0.96}
            haptic
            style={styles.uploadDocBtn}
          >
            {uploadingDoc ? (
              <ActivityIndicator size="small" color={tokens.accent} />
            ) : (
              <Icon name="add" size={16} color={tokens.accent} />
            )}
            <ProDayText variant="caption" style={styles.uploadDocBtnText}>
              {t('coach.portal.communication.upload')}
            </ProDayText>
          </PressableSpring>
        </View>
      </CoachChapterScroll>
    </CoachPane>
  );
};

const createStyles = (tokens: CoachThemeTokens) =>
  StyleSheet.create({
    heroCard: {
      borderRadius: radius.lg,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    heroHead: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    heroIconCircle: {
      width: 44,
      height: 44,
      borderRadius: 22,
      backgroundColor: tokens.soft,
      borderWidth: 1,
      borderColor: tokens.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroBadgeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: 2,
    },
    liveIndicator: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: tokens.soft,
    },
    liveDot: {
      width: 5,
      height: 5,
      borderRadius: 3,
      backgroundColor: tokens.accent,
    },
    liveText: {
      fontSize: 9,
      fontWeight: '900',
      letterSpacing: 0.8,
      color: tokens.accent,
    },
    teamTag: {
      fontSize: 10,
      fontWeight: '700',
      color: tokens.muted,
      textTransform: 'uppercase',
    },
    heroTitle: {
      fontSize: 20,
      fontWeight: '900',
      color: tokens.foreground,
    },
    heroSub: {
      fontSize: 12,
      color: tokens.muted,
      lineHeight: 16,
      marginTop: 2,
    },
    metricsRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingTop: 4,
      paddingBottom: 4,
    },
    metricPill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 6,
      paddingHorizontal: 8,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    metricValue: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.foreground,
    },
    heroActionRow: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingTop: 4,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
    },
    heroActionBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 5,
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    heroActionText: {
      fontSize: 11,
      fontWeight: '800',
      color: tokens.foreground,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
      paddingHorizontal: 2,
    },
    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    sectionTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: tokens.foreground,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionCounter: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.muted,
    },
    channelGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    channelCard: {
      width: '48%',
      flexGrow: 1,
      minWidth: '46%',
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: spacing.xs,
    },
    channelTop: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    channelIconBox: {
      width: 40,
      height: 40,
      borderRadius: 12,
      backgroundColor: tokens.soft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.border,
    },
    channelBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    channelBadgeText: {
      fontSize: 9,
      fontWeight: '800',
      color: tokens.accent,
      textTransform: 'uppercase',
    },
    channelBody: {
      gap: 2,
      marginTop: 4,
    },
    channelName: {
      fontSize: 14,
      fontWeight: '800',
      color: tokens.foreground,
    },
    channelDesc: {
      fontSize: 11,
      color: tokens.muted,
      lineHeight: 15,
      minHeight: 30,
    },
    channelFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 6,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: tokens.border,
      marginTop: 2,
    },
    channelActionLink: {
      fontSize: 10,
      fontWeight: '800',
      color: tokens.accent,
    },
    emptyCard: {
      padding: spacing.lg,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      alignItems: 'center',
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    emptyIconCircle: {
      width: 52,
      height: 52,
      borderRadius: 26,
      backgroundColor: tokens.soft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    emptyTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: tokens.foreground,
      textAlign: 'center',
    },
    emptyBody: {
      fontSize: 12,
      color: tokens.muted,
      textAlign: 'center',
      lineHeight: 16,
      maxWidth: '90%',
    },
    primaryActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      marginTop: spacing.sm,
      backgroundColor: tokens.accent,
      paddingHorizontal: spacing.md,
      paddingVertical: 10,
      borderRadius: radius.pill,
    },
    primaryActionBtnText: {
      fontSize: 12,
      fontWeight: '800',
      color: tokens.isLight ? '#FFFFFF' : '#000000',
    },
    eventList: {
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    eventCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    eventDateBlock: {
      width: 44,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 4,
      paddingHorizontal: 2,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    eventDateDay: {
      fontSize: 9,
      fontWeight: '900',
      color: tokens.accent,
    },
    eventDateNum: {
      fontSize: 15,
      fontWeight: '900',
      color: tokens.foreground,
    },
    eventContent: {
      flex: 1,
      gap: 2,
    },
    eventTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 6,
    },
    eventTitle: {
      flex: 1,
      fontSize: 13,
      fontWeight: '800',
      color: tokens.foreground,
    },
    eventTimePill: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
      backgroundColor: tokens.surface,
    },
    eventTimeText: {
      fontSize: 10,
      fontWeight: '700',
      color: tokens.muted,
    },
    eventMetaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    eventCity: {
      fontSize: 11,
      color: tokens.muted,
      flexShrink: 1,
    },
    eventDot: {
      color: tokens.muted,
    },
    eventChatTag: {
      fontSize: 11,
      fontWeight: '700',
      color: tokens.accent,
    },
    reassuranceCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: spacing.md,
    },
    reassuranceIconBox: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: tokens.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    reassuranceTitle: {
      fontSize: 13,
      fontWeight: '800',
      color: tokens.foreground,
    },
    reassuranceBody: {
      fontSize: 11,
      color: tokens.muted,
      lineHeight: 15,
    },
    notifList: {
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    notifCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    notifUnread: {
      borderColor: tokens.accent,
    },
    notifDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: 'transparent',
    },
    notifDotActive: {
      backgroundColor: tokens.accent,
    },
    notifTitle: {
      fontSize: 12,
      color: tokens.foreground,
    },
    notifTitleBold: {
      fontWeight: '800',
    },
    notifBody: {
      fontSize: 11,
      color: tokens.muted,
    },
    inboxBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      marginBottom: spacing.md,
    },
    inboxIconWrap: {
      width: 44,
      height: 44,
      borderRadius: 14,
      backgroundColor: tokens.soft,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: tokens.accent,
    },
    inboxTitle: {
      fontSize: 14,
      fontWeight: '800',
      color: tokens.foreground,
    },
    inboxSub: {
      fontSize: 11,
      color: tokens.muted,
      lineHeight: 15,
    },
    inboxActionPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
    },
    inboxActionText: {
      fontSize: 11,
      fontWeight: '800',
      color: tokens.accent,
    },
    familyCard: {
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    familyDesc: {
      fontSize: 11,
      color: tokens.muted,
    },
    familyEmptyBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      padding: spacing.sm,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
    },
    familyEmptyText: {
      fontSize: 11,
      color: tokens.muted,
      flex: 1,
    },
    familyHintList: {
      gap: 6,
    },
    familyHintRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: 4,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    familyAvatarMini: {
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: tokens.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    familyAvatarText: {
      fontSize: 10,
      fontWeight: '800',
      color: tokens.accent,
    },
    familyPlayerName: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.foreground,
    },
    familyNote: {
      fontSize: 10,
      color: tokens.muted,
    },
    remindBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.accent,
      marginTop: 2,
    },
    remindBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: tokens.accent,
    },
    docsCard: {
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
      gap: spacing.sm,
      marginBottom: spacing.xl,
    },
    docsEmpty: {
      alignItems: 'center',
      paddingVertical: spacing.md,
      gap: 4,
    },
    docsEmptyText: {
      fontSize: 11,
      color: tokens.muted,
      textAlign: 'center',
    },
    docsList: {
      gap: 6,
    },
    docRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: 6,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    docIconBox: {
      width: 32,
      height: 32,
      borderRadius: 8,
      backgroundColor: tokens.soft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    docTitle: {
      fontSize: 12,
      fontWeight: '700',
      color: tokens.foreground,
    },
    docKind: {
      fontSize: 10,
      color: tokens.muted,
      textTransform: 'uppercase',
    },
    uploadDocBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 9,
      borderRadius: radius.sm,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
      marginTop: 4,
    },
    uploadDocBtnText: {
      fontSize: 11,
      fontWeight: '800',
      color: tokens.accent,
    },
  });

/** @deprecated Utiliser CoachCommunityChapter */
export const CoachCommunicationChapter = CoachCommunityChapter;
