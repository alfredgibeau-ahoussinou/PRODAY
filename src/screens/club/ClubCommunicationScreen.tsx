import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MessagesScreen } from '../MessagesScreen';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubSegmentedControl,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import {
  ClubCommInboxHero,
  ClubOperationalCanalsGrid,
  type ClubOperationalCanalItem,
  ClubUrgentAnnouncementsCard,
  type ClubUrgentAnnouncement,
} from '../../features/club/ui/ClubCommunicationHub';
import {
  resolveClubCommSubtitle,
} from '../../features/club/ui/clubCommunicationModel';
import { staffNotificationsService } from '../../services/staffNotifications.service';
import { messagesService } from '../../services/messages.service';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';

type Channel = 'hub' | 'inbox';

/**
 * Communication Club — hub opérationnel unifié + messagerie instantanée ProDay.
 */
export function ClubCommunicationScreen() {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const [channel, setChannel] = useState<Channel>('hub');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const loadUnread = useCallback(async () => {
    if (!profile?.uid) {
      setUnreadNotifications(0);
      setUnreadMessages(0);
      return;
    }
    try {
      const [list, threads] = await Promise.all([
        staffNotificationsService.listForUser(profile.uid, 40),
        messagesService.listThreads(profile.uid, 40),
      ]);
      const filtered = ws.clubId
        ? list.filter((n) => !n.club_id || n.club_id === ws.clubId)
        : list;
      setUnreadNotifications(filtered.filter((n) => !n.read_at).length);
      setUnreadMessages(threads.filter((t) => t.unread).length);
    } catch {
      setUnreadNotifications(0);
      setUnreadMessages(0);
    }
  }, [profile?.uid, ws.clubId]);

  useEffect(() => {
    void loadUnread();
  }, [loadUnread]);

  const subtitle = useMemo(
    () =>
      resolveClubCommSubtitle({
        pendingMemberships: ws.pendingMemberships,
        unreadNotifications,
        unreadMessages,
      }),
    [ws.pendingMemberships, unreadNotifications, unreadMessages],
  );

  const urgentAnnouncements = useMemo<ClubUrgentAnnouncement[]>(() => {
    const list: ClubUrgentAnnouncement[] = [];
    if (ws.teamsWithoutCoach > 0) {
      list.push({
        id: 'urgent-no-coach',
        type: 'general_alert',
        title: `${ws.teamsWithoutCoach} équipe(s) sans encadrement`,
        message: 'Affectez un coach pour sécuriser les prochaines séances et rencontres officielles.',
        priority: 'high',
        targetGroup: 'Staff technique',
      });
    }
    return list;
  }, [ws.teamsWithoutCoach]);

  const operationalCanals = useMemo<ClubOperationalCanalItem[]>(() => {
    return [
      {
        id: 'teams',
        title: 'Équipes',
        subtitle: 'Annonces & vestiaires',
        icon: 'people',
        badgeLabel: `${ws.teamRows.length} équipe${ws.teamRows.length > 1 ? 's' : ''}`,
        badgeTone: 'default',
        onPress: () => shellNav?.requestNav('teams'),
      },
      {
        id: 'coaches',
        title: 'Staff Coachs',
        subtitle: 'Coordination staff',
        icon: 'school',
        badgeLabel:
          ws.teamsWithoutCoach > 0
            ? `${ws.teamsWithoutCoach} à pourvoir`
            : 'Complet',
        badgeTone: ws.teamsWithoutCoach > 0 ? 'warning' : 'success',
        onPress: () => shellNav?.requestNav('coaches'),
      },
      {
        id: 'players',
        title: 'Effectif Joueurs',
        subtitle: 'Licenciés & adhésions',
        icon: 'football',
        badgeLabel:
          ws.pendingMemberships > 0
            ? `${ws.pendingMemberships} en attente`
            : `${ws.players.length} joueurs`,
        badgeTone: ws.pendingMemberships > 0 ? 'warning' : 'default',
        onPress: () => shellNav?.requestNav('players'),
      },
      {
        id: 'notifications',
        title: 'Notifications',
        subtitle: 'Alertes officielles club',
        icon: 'notifications',
        badgeLabel:
          unreadNotifications > 0
            ? `${unreadNotifications} non lue${unreadNotifications > 1 ? 's' : ''}`
            : 'À jour',
        badgeTone: unreadNotifications > 0 ? 'warning' : 'success',
        onPress: () => shellNav?.requestNav('notifications'),
      },
    ];
  }, [
    ws.teamRows.length,
    ws.teamsWithoutCoach,
    ws.pendingMemberships,
    ws.players.length,
    unreadNotifications,
    shellNav,
  ]);

  if (channel === 'inbox') {
    return (
      <View style={styles.root}>
        <View style={styles.inboxBar}>
          <ClubActionRow
            icon="arrow-back"
            label="Retour Communication"
            hint="Canaux · alertes · annonces"
            onPress={() => {
              setChannel('hub');
              void loadUnread();
            }}
          />
        </View>
        <MessagesScreen />
      </View>
    );
  }

  if (!ws.clubId && !ws.loading) {
    return (
      <View style={styles.root}>
        <ClubChapterScroll>
          <ClubBrandHeader title="Communication" subtitle="Club non lié" />
          <ClubEmptyState
            title="Liez un club"
            body="La messagerie et les alertes club s’activent dès qu’un club est rattaché à votre compte."
            actionLabel="Ouvrir le club"
            onAction={() => shellNav?.requestNav('club')}
            icon="chat"
          />
        </ClubChapterScroll>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void Promise.all([ws.refresh(), loadUnread()])}>
        <ClubBrandHeader title="Communication" subtitle={subtitle} />

        <ClubSegmentedControl
          options={[
            { id: 'hub' as const, label: 'Canaux' },
            { id: 'inbox' as const, label: 'Messagerie' },
          ]}
          value={channel}
          onChange={setChannel}
        />

        <ClubUrgentAnnouncementsCard
          announcements={urgentAnnouncements}
          onCreateUrgent={() => setChannel('inbox')}
        />

        <ClubCommInboxHero
          subtitle={
            unreadMessages > 0
              ? `${unreadMessages} conversation${unreadMessages > 1 ? 's' : ''} non lue${unreadMessages > 1 ? 's' : ''} · ouvrir la messagerie`
              : unreadNotifications > 0
                ? `${unreadNotifications} alerte${unreadNotifications > 1 ? 's' : ''} · fils staff & effectif`
                : 'Fils staff, effectif et parents — messagerie ProDay'
          }
          onOpenInbox={() => setChannel('inbox')}
          onOpenNotifications={() => shellNav?.requestNav('notifications')}
          unreadNotifications={unreadNotifications}
        />

        <View style={styles.section}>
          <ClubText variant="label" muted style={styles.sectionLabel}>
            Canaux & Outils Opérationnels
          </ClubText>
          <ClubOperationalCanalsGrid items={operationalCanals} />
        </View>

        <ClubText variant="caption" muted style={styles.footer}>
          Messagerie ProDay réutilisée — pas de second système parallèle.
        </ClubText>
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (_tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    inboxBar: {
      paddingHorizontal: clubSpace.lg,
      paddingTop: clubSpace.sm,
      paddingBottom: clubSpace.xs,
    },
    section: { gap: clubSpace.sm },
    sectionLabel: {
      letterSpacing: 1.05,
      opacity: 0.92,
    },
    list: { gap: clubSpace.sm },
    footer: {
      textAlign: 'center',
      paddingVertical: clubSpace.sm,
    },
  });
