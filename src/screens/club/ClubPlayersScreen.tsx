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
  ClubScreenHeader,
  ClubSectionCard,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubPlayerDetailScreen } from './ClubPlayerDetailScreen';
import { spacing } from '../../theme/designTokens';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';

type FilterId = 'all' | 'pending' | 'active';

/** Liste joueurs + recherche / filtres → fiche club. */
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

  const pendingUids = new Set(
    ws.memberships.filter((m) => m.status === 'pending').map((m) => m.player_uid),
  );
  const activeUids = new Set(
    ws.memberships.filter((m) => m.status === 'active').map((m) => m.player_uid),
  );

  let list = ws.players.length > 0 ? ws.players : ws.members.filter((m) => m.role === 'player');
  if (list.length === 0) {
    // fallback : membres liés via memberships
    const byUid = new Map(ws.members.map((m) => [m.uid, m]));
    list = ws.memberships
      .map((m) => byUid.get(m.player_uid))
      .filter(Boolean) as typeof list;
    // dedupe
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

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubScreenHeader title="Joueurs" subtitle={`${filtered.length} profil(s)`} />

        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Rechercher un joueur…"
          placeholderTextColor={tokens.muted}
          style={styles.search}
        />

        <View style={styles.filters}>
          {(
            [
              ['all', 'Tous'],
              ['active', 'Actifs'],
              ['pending', 'En attente'],
            ] as const
          ).map(([id, label]) => (
            <ClubActionRow
              key={id}
              label={label}
              trailing={
                filter === id ? (
                  <ClubText variant="caption" style={{ color: tokens.accent }}>
                    ●
                  </ClubText>
                ) : undefined
              }
              onPress={() => setFilter(id)}
            />
          ))}
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
          <ClubSectionCard>
            {filtered.map((p) => (
              <ClubActionRow
                key={p.uid}
                icon="person"
                label={p.display_name || 'Joueur'}
                hint={
                  pendingUids.has(p.uid)
                    ? 'Adhésion en attente'
                    : p.profile?.category || p.email || undefined
                }
                onPress={() => shellNav?.setSelectedPlayerUid?.(p.uid)}
              />
            ))}
          </ClubSectionCard>
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
    filters: { gap: 0 },
  });
