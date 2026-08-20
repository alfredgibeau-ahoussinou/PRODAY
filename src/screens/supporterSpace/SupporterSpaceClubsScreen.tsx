import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useTournaments } from '../../hooks/useTournaments';
import { createSupporterFootballFacade } from '../../services/supporterFootball';
import type { UnifiedMatch, UnifiedTeamRef } from '../../services/supporterFootball';
import { followsService } from '../../services/follows.service';
import type { Follow } from '../../models/Follow';
import { SpaceScreen, SpaceSection } from '../../features/supporterSpace/components';
import { SUPPORTER_SPACE, SUPPORTER_SPACE_COPY } from '../../features/supporterSpace/theme/supporterSpaceTheme';
import { SupporterSpaceClubDetailScreen } from './SupporterSpaceClubDetailScreen';
import { SupporterSpaceMatchCenterScreen } from './SupporterSpaceMatchCenterScreen';

const EMPTY: never[] = [];

export const SupporterSpaceClubsScreen: React.FC = () => {
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { tournaments } = useTournaments();
  const facade = createSupporterFootballFacade(events ?? EMPTY, tournaments ?? EMPTY);

  const [follows, setFollows] = useState<Follow[]>([]);
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<UnifiedTeamRef[]>([]);
  const [searching, setSearching] = useState(false);
  const [club, setClub] = useState<UnifiedTeamRef | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<UnifiedMatch | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) {
      setFollows([]);
      return;
    }
    try {
      const list = await followsService.listByFollower(profile.uid);
      setFollows((list ?? []).filter((f) => f.target_type === 'club'));
    } catch {
      setFollows([]);
    }
  }, [profile?.uid]);

  useEffect(() => {
    void loadFollows();
  }, [loadFollows]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return undefined;
    }
    const t = setTimeout(() => {
      setSearching(true);
      void facade
        .getTeams(q)
        .then(setHits)
        .catch(() => setHits([]))
        .finally(() => setSearching(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query, facade]);

  const toggleFollow = async (team: UnifiedTeamRef) => {
    if (!profile?.uid) return;
    const existing = follows.find(
      (f) => f.target_id === team.id || f.target_label === team.name,
    );
    try {
      if (existing) {
        await followsService.unfollow(profile.uid, 'club', existing.target_id);
      } else {
        await followsService.follow(profile.uid, 'club', team.id, team.name);
      }
      await loadFollows();
    } catch {
      /* ignore */
    }
  };

  if (selectedMatch) {
    return (
      <SupporterSpaceMatchCenterScreen
        matchId={selectedMatch.id}
        seed={selectedMatch}
        onClose={() => setSelectedMatch(null)}
        facade={facade}
      />
    );
  }

  if (club) {
    return (
      <SupporterSpaceClubDetailScreen
        team={club}
        facade={facade}
        onClose={() => setClub(null)}
        onOpenMatch={setSelectedMatch}
        isFollowed={follows.some((f) => f.target_id === club.id || f.target_label === club.name)}
        onToggleFollow={() => void toggleFollow(club)}
      />
    );
  }

  return (
    <SpaceScreen
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await loadFollows();
            setRefreshing(false);
          }}
          tintColor={SUPPORTER_SPACE.bright}
        />
      }
    >
      <ProDayText variant="title" style={styles.title}>
        Clubs
      </ProDayText>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Chercher un club…"
        placeholderTextColor={SUPPORTER_SPACE.muted}
        style={styles.input}
        autoCorrect={false}
      />
      {searching ? <ActivityIndicator color={SUPPORTER_SPACE.bright} /> : null}

      {hits.length ? (
        <SpaceSection title="Résultats">
          {hits.map((t) => (
            <View key={t.id} style={styles.row}>
              <Pressable style={{ flex: 1 }} onPress={() => setClub(t)}>
                <ProDayText variant="body" style={styles.name}>
                  {t.name}
                </ProDayText>
                {t.country ? (
                  <ProDayText variant="caption" style={styles.muted}>
                    {t.country}
                  </ProDayText>
                ) : null}
              </Pressable>
              <Pressable onPress={() => void toggleFollow(t)} style={styles.followBtn}>
                <ProDayText variant="caption" style={styles.followText}>
                  {follows.some((f) => f.target_id === t.id || f.target_label === t.name)
                    ? 'Suivi'
                    : 'Suivre'}
                </ProDayText>
              </Pressable>
            </View>
          ))}
        </SpaceSection>
      ) : null}

      <SpaceSection title="Mes clubs">
        {follows.length ? (
          follows.map((f) => (
            <Pressable
              key={f.id}
              style={styles.row}
              onPress={() =>
                setClub({ id: f.target_id, name: f.target_label || f.target_id })
              }
            >
              <ProDayText variant="body" style={styles.name}>
                {f.target_label || f.target_id}
              </ProDayText>
            </Pressable>
          ))
        ) : (
          <ProDayText variant="body" style={styles.muted}>
            {SUPPORTER_SPACE_COPY.emptyClubs}
          </ProDayText>
        )}
      </SpaceSection>
    </SpaceScreen>
  );
};

const styles = StyleSheet.create({
  title: { color: SUPPORTER_SPACE.foreground, fontSize: 22, marginBottom: 12 },
  input: {
    backgroundColor: SUPPORTER_SPACE.surface,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: SUPPORTER_SPACE.foreground,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: SUPPORTER_SPACE.surface,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
    marginBottom: 8,
    gap: 8,
  },
  name: { color: SUPPORTER_SPACE.foreground },
  muted: { color: SUPPORTER_SPACE.muted },
  followBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: SUPPORTER_SPACE.soft,
  },
  followText: { color: SUPPORTER_SPACE.bright },
});
