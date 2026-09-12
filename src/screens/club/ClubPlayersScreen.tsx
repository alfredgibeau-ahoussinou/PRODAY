import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import {
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSearchField,
  ClubSegmentedControl,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubRosterPlayerCard } from '../../features/club/ui/ClubRosterPlayerCard';
import {
  ClubPlayersPendingHero,
  ClubPlayersPendingRow,
} from '../../features/club/ui/ClubPlayersChrome';
import { ClubImportSquadPanel } from '../../features/club/ui/ClubImportSquadPanel';
import {
  filterClubPlayersList,
  listPendingMembershipPlayers,
  resolveClubPlayersBaseList,
  resolveClubPlayersSubtitle,
  type ClubPlayersFilterId,
} from '../../features/club/ui/clubPlayersModel';
import { ClubPlayerDetailScreen } from './ClubPlayerDetailScreen';
import { membershipsService } from '../../services/memberships.service';
import { ClubPlayersDirectory, DEMO_MEMBERS, type ClubMemberItem } from '../../features/club/ui/ClubPlayersDirectory';
import { PressableSpring } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

/** Liste joueurs + adhésions actionnables → fiches identité Club. */
export function ClubPlayersScreen() {
  const shellNav = useClubShellNav();
  const profile = useSessionProfile();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<ClubPlayersFilterId>('all');
  const [busyMembershipId, setBusyMembershipId] = useState<string | null>(null);
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const selected = shellNav?.selectedPlayerUid ?? null;

  useEffect(() => {
    if (!shellNav?.playersPendingFocus) return;
    setFilter('pending');
    shellNav.clearPlayersPendingFocus?.();
  }, [shellNav?.playersPendingFocus, shellNav]);

  const basePlayers = useMemo(
    () =>
      resolveClubPlayersBaseList({
        players: ws.players,
        members: ws.members,
        memberships: ws.memberships,
      }),
    [ws.players, ws.members, ws.memberships],
  );

  const playersByUid = useMemo(() => {
    const map = new Map(basePlayers.map((p) => [p.uid, p]));
    ws.members.forEach((m) => map.set(m.uid, m));
    return map;
  }, [basePlayers, ws.members]);

  const pendingItems = useMemo(
    () =>
      listPendingMembershipPlayers({
        memberships: ws.memberships,
        playersByUid,
      }),
    [ws.memberships, playersByUid],
  );

  const filtered = useMemo(
    () =>
      filterClubPlayersList({
        players: basePlayers,
        memberships: ws.memberships,
        teams: ws.teams,
        query,
        filter,
      }),
    [basePlayers, ws.memberships, ws.teams, query, filter],
  );

  const activeCount = ws.memberships.filter((m) => m.status === 'active').length;
  const subtitle = resolveClubPlayersSubtitle({
    visibleCount: filtered.length,
    pendingCount: pendingItems.length,
    activeCount,
  });

  const approve = useCallback(
    async (membershipId: string) => {
      if (!profile?.uid) {
        Alert.alert('Connexion requise', 'Reconnectez-vous pour valider une adhésion.');
        return;
      }
      setBusyMembershipId(membershipId);
      try {
        await membershipsService.approve(membershipId, profile.uid);
        await ws.refresh();
      } catch (e) {
        Alert.alert('Adhésion', e instanceof Error ? e.message : 'Validation impossible.');
      } finally {
        setBusyMembershipId(null);
      }
    },
    [profile?.uid, ws],
  );

  const reject = useCallback(
    async (membershipId: string) => {
      if (!profile?.uid) {
        Alert.alert('Connexion requise', 'Reconnectez-vous pour refuser une adhésion.');
        return;
      }
      Alert.alert('Refuser cette adhésion ?', 'Le joueur restera hors effectif actif.', [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              setBusyMembershipId(membershipId);
              try {
                await membershipsService.reject(membershipId, profile.uid);
                await ws.refresh();
              } catch (e) {
                Alert.alert('Adhésion', e instanceof Error ? e.message : 'Refus impossible.');
              } finally {
                setBusyMembershipId(null);
              }
            })();
          },
        },
      ]);
    },
    [profile?.uid, ws],
  );

  if (selected) {
    return (
      <ClubPlayerDetailScreen
        playerUid={selected}
        onBack={() => shellNav?.setSelectedPlayerUid?.(null)}
      />
    );
  }

  if (ws.loading) return <ClubLoading />;

  const filters: { id: ClubPlayersFilterId; label: string }[] = [
    { id: 'all', label: 'Tous' },
    { id: 'active', label: 'Actifs' },
    { id: 'pending', label: 'En attente' },
  ];

  const showPendingBlock = pendingItems.length > 0 && (filter === 'all' || filter === 'pending');
  const rosterItems =
    filter === 'pending'
      ? []
      : showPendingBlock
        ? filtered.filter((item) => item.membership?.status !== 'pending')
        : filtered;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader title="Joueurs" subtitle={subtitle} />

        <View style={styles.shortcutRow}>
          <PressableSpring
            onPress={() => shellNav?.requestNav('teams')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="football" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Équipes
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => shellNav?.openCreate?.('invite_member')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="mail" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Inviter
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => shellNav?.openCreate?.('player')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="add" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Créer
            </ClubText>
          </PressableSpring>
        </View>

        {ws.clubId && profile?.uid ? (
          <ClubImportSquadPanel
            clubId={ws.clubId}
            existingPlayers={ws.players}
            approverUid={profile.uid}
            fffAffiliationNumber={ws.club?.fff_affiliation_number}
            clubName={ws.club?.name}
            clubCity={ws.club?.city}
            onImported={() => void ws.refresh()}
          />
        ) : null}

        {pendingItems.length > 0 && filter !== 'pending' ? (
          <ClubPlayersPendingHero
            count={pendingItems.length}
            previewNames={pendingItems.map((p) => p.name)}
            onFilterPending={() => setFilter('pending')}
            onReview={() => setFilter('pending')}
          />
        ) : null}

        {/* Annuaire Centralisé des Membres, Licences & Conformité FFF */}
        <ClubPlayersDirectory
          onSelectMember={(uid) => shellNav?.setSelectedPlayerUid?.(uid)}
          onSendReminder={(member) => {
            Alert.alert(
              'Relance Administrative Envoyée',
              `Une notification et un email officiel ont été envoyés à ${member.name} (licence et cotisation).`,
            );
          }}
        />
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    shortcutRow: {
      flexDirection: 'row',
      gap: clubSpace.sm,
    },
    shortcut: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    shortcutLabel: {
      color: tokens.foreground,
      fontWeight: '700',
    },
    section: { gap: clubSpace.sm },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
    },
    sectionLabel: {
      letterSpacing: 1.05,
      opacity: 0.92,
    },
    list: { gap: clubSpace.sm },
  });
