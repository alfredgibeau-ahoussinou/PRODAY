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
import { ClubCommInboxHero, ClubCommTileRow } from '../../features/club/ui/ClubCommunicationHub';
import {
  buildClubCommHubTiles,
  resolveClubCommSubtitle,
  type ClubCommTileId,
} from '../../features/club/ui/clubCommunicationModel';
import { staffNotificationsService } from '../../services/staffNotifications.service';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubSpace } from '../../features/club/theme/clubDesignSystem';

type Channel = 'hub' | 'inbox';

/**
 * Communication Club — hub premium + messagerie MessagesScreen inchangée.
 */
export function ClubCommunicationScreen() {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const ws = useClubWorkspace();
  const { tokens } = useClubTheme();
  const [channel, setChannel] = useState<Channel>('hub');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const loadUnread = useCallback(async () => {
    if (!profile?.uid) {
      setUnreadNotifications(0);
      return;
    }
    try {
      const list = await staffNotificationsService.listForUser(profile.uid, 40);
      const filtered = ws.clubId
        ? list.filter((n) => !n.club_id || n.club_id === ws.clubId)
        : list;
      setUnreadNotifications(filtered.filter((n) => !n.read_at).length);
    } catch {
      setUnreadNotifications(0);
    }
  }, [profile?.uid, ws.clubId]);

  useEffect(() => {
    void loadUnread();
  }, [loadUnread]);

  const tiles = useMemo(
    () =>
      buildClubCommHubTiles({
        pendingMemberships: ws.pendingMemberships,
        unreadNotifications,
      }),
    [ws.pendingMemberships, unreadNotifications],
  );

  const subtitle = useMemo(
    () =>
      resolveClubCommSubtitle({
        pendingMemberships: ws.pendingMemberships,
        unreadNotifications,
      }),
    [ws.pendingMemberships, unreadNotifications],
  );

  const onTile = (id: ClubCommTileId) => {
    switch (id) {
      case 'inbox':
      case 'announce':
        setChannel('inbox');
        return;
      case 'notifications':
        shellNav?.requestNav('notifications');
        return;
      case 'teams':
        shellNav?.requestNav('teams');
        return;
      case 'coaches':
        shellNav?.requestNav('coaches');
        return;
      case 'players':
        shellNav?.requestNav('players');
        return;
      default:
        return;
    }
  };

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

  const primaryTiles = tiles.filter((t) => t.id === 'inbox' || t.id === 'notifications' || t.id === 'announce');
  const channelTiles = tiles.filter((t) => t.id === 'teams' || t.id === 'coaches' || t.id === 'players');

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

        <ClubCommInboxHero
          subtitle={
            unreadNotifications > 0
              ? `${unreadNotifications} alerte${unreadNotifications > 1 ? 's' : ''} · fils staff & effectif`
              : 'Fils staff, effectif et parents — messagerie ProDay'
          }
          onOpenInbox={() => setChannel('inbox')}
          onOpenNotifications={() => shellNav?.requestNav('notifications')}
          unreadNotifications={unreadNotifications}
        />

        <View style={styles.section}>
          <ClubText variant="label" muted style={styles.sectionLabel}>
            Accès rapides
          </ClubText>
          <View style={styles.list}>
            {primaryTiles.map((tile, index) => (
              <ClubCommTileRow
                key={tile.id}
                tile={tile}
                index={index}
                onPress={() => onTile(tile.id)}
              />
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <ClubText variant="label" muted style={styles.sectionLabel}>
            Canaux club
          </ClubText>
          <View style={styles.list}>
            {channelTiles.map((tile, index) => (
              <ClubCommTileRow
                key={tile.id}
                tile={tile}
                index={index + 3}
                onPress={() => onTile(tile.id)}
              />
            ))}
          </View>
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
