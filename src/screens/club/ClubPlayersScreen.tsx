import React, { useMemo, useState } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubActionRow,
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubRosterPlayerCard } from '../../features/club/ui/ClubRosterPlayerCard';
import { ClubPlayerDetailScreen } from './ClubPlayerDetailScreen';
import { PressableSpring } from '../../components/motion';
import { spacing } from '../../theme/designTokens';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

type FilterId = 'all' | 'pending' | 'active';

/** Liste joueurs + recherche / filtres → fiches style pôle Joueur. */
export function ClubPlayersScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<FilterId>('all');
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const selected = shellNav?.selectedPlayerUid ?? null;

  if (selected) {
    return (
      <ClubPlayerDetailScreen
        playerUid={selected}
        onBack={() => shellNav?.setSelectedPlayerUid?.(null)}
      />
    );
  }

  if (ws.loading) return <ClubLoading />;

  const membershipByUid = new Map(ws.memberships.map((m) => [m.player_uid, m]));
  const pendingUids = new Set(
    ws.memberships.filter((m) => m.status === 'pending').map((m) => m.player_uid),
  );
  const activeUids = new Set(
    ws.memberships.filter((m) => m.status === 'active').map((m) => m.player_uid),
  );

  let list = ws.players.length > 0 ? ws.players : ws.members.filter((m) => m.role === 'player');
  if (list.length === 0) {
    const byUid = new Map(ws.members.map((m) => [m.uid, m]));
    list = ws.memberships
      .map((m) => byUid.get(m.player_uid))
      .filter(Boolean) as typeof list;
    const map = new Map(list.map((u) => [u.uid, u]));
    list = Array.from(map.values());
  }

  const q = query.trim().toLowerCase();
  const filtered = list.filter((p) => {
    if (filter === 'pending' && !pendingUids.has(p.uid)) return false;
    if (filter === 'active' && !activeUids.has(p.uid)) return false;
    if (!q) return true;
    return (
      p.display_name?.toLowerCase().includes(q) ||
      p.email?.toLowerCase().includes(q)
    );
  });

  const filters: { id: FilterId; label: string }[] = [
    { id: 'all', label: 'Tous' },
    { id: 'active', label: 'Actifs' },
    { id: 'pending', label: 'En attente' },
  ];

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader title="Joueurs" subtitle={`${filtered.length} profil(s)`} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un joueur…"
          placeholderTextColor={tokens.muted}
          style={styles.search}
        />

        <View style={styles.filters}>
          {filters.map((f) => {
            const on = filter === f.id;
            return (
              <PressableSpring
                key={f.id}
                onPress={() => setFilter(f.id)}
                scaleTo={0.96}
                haptic
                style={[
                  styles.chip,
                  on && { backgroundColor: tokens.accent, borderColor: tokens.accent },
                ]}
              >
                <ClubText
                  variant="caption"
                  style={{
                    fontWeight: '700',
                    color: on ? tokens.onAccent : tokens.muted,
                  }}
                >
                  {f.label}
                </ClubText>
              </PressableSpring>
            );
          })}
        </View>

        {filtered.length === 0 ? (
          <ClubEmptyState
            title="Aucun joueur"
            body="Invitez des licenciés ou validez les demandes d’adhésion. Pas de dossier médical ici."
            actionLabel="Inviter un membre"
            onAction={() => shellNav?.openCreate?.('invite_member')}
            icon="people"
          />
        ) : (
          <View style={styles.list}>
            {filtered.map((p, index) => {
              const membership = membershipByUid.get(p.uid);
              const team = ws.teams.find((t) => t.id === membership?.team_id);
              return (
                <ClubRosterPlayerCard
                  key={p.uid}
                  player={p}
                  membership={membership}
                  teamName={team?.name}
                  clubName={ws.club?.name}
                  index={index}
                  onPress={() => shellNav?.setSelectedPlayerUid?.(p.uid)}
                />
              );
            })}
          </View>
        )}
      </ClubChapterScroll>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: tokens.bg },
    search: {
      backgroundColor: tokens.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: 12,
      color: tokens.foreground,
      fontSize: 16,
    },
    filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
    chip: {
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 999,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
    },
    list: { gap: spacing.sm },
  });
