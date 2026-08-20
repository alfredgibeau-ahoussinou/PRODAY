import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { ProDayText } from '../../components/ui/ProDayText';
import { HubMatchRow, HubScreen } from '../../features/footballHub/components';
import { FOOTBALL_HUB, FOOTBALL_HUB_COPY } from '../../features/footballHub/theme/footballHubTheme';
import { useAuth } from '../../context/AuthContext';
import { getFeaturedPopularClubs } from '../../content/supporterPopularClubs';
import { followsService } from '../../services/follows.service';
import { footballDataFacade } from '../../services/footballData';
import { externalScoresService } from '../../services/externalScores.service';
import type { FootballTeamHit } from '../../services/footballData/types';
import type { Follow } from '../../models/Follow';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { externalFixtureToMatchItem } from '../../utils/supporterMatchFilters';
import { worldFollowTargetForTeam } from '../../utils/supporterWorldFollows';
import { FootballHubMatchCenterScreen } from './FootballHubMatchCenterScreen';

const FEATURED = getFeaturedPopularClubs();

function chipLabel(name: string): string {
  if (name === 'Paris Saint-Germain') return 'PSG';
  if (name === 'Olympique de Marseille') return 'OM';
  if (name === 'FC Barcelone') return 'Barça';
  return name.replace(/^FC |^AS |^Olympique de |^Olympique /, '');
}

export type FootballHubSearchScreenProps = {
  onBack: () => void;
};

export const FootballHubSearchScreen: React.FC<FootballHubSearchScreenProps> = ({ onBack }) => {
  const { profile } = useAuth();
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [hits, setHits] = useState<FootballTeamHit[]>([]);
  const [follows, setFollows] = useState<Follow[]>([]);
  const [toggling, setToggling] = useState<string | null>(null);
  const [clubSheet, setClubSheet] = useState<FootballTeamHit | null>(null);
  const [clubUpcoming, setClubUpcoming] = useState<SupporterMatchViewItem[]>([]);
  const [clubRecent, setClubRecent] = useState<SupporterMatchViewItem[]>([]);
  const [clubLoading, setClubLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<SupporterMatchViewItem | null>(null);

  const followedIds = useMemo(
    () => new Set(follows.filter((f) => f.target_type === 'club').map((f) => f.target_id)),
    [follows],
  );

  const loadFollows = useCallback(async () => {
    if (!profile?.uid) {
      setFollows([]);
      return;
    }
    try {
      const list = await followsService.listByFollower(profile.uid);
      setFollows(Array.isArray(list) ? list : []);
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
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const teamHits = await footballDataFacade.searchTeams(q);
        if (!cancelled) setHits(teamHits);
      } catch {
        if (!cancelled) setHits([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const toggleFollow = async (hit: FootballTeamHit) => {
    if (!profile?.uid) return;
    const target = worldFollowTargetForTeam({ apiTeamId: hit.apiTeamId, name: hit.name });
    setToggling(target.id);
    try {
      await followsService.toggle(profile.uid, 'club', target.id, hit.name);
      await loadFollows();
    } catch {
      /* ignore */
    } finally {
      setToggling(null);
    }
  };

  const openClubSheet = async (hit: FootballTeamHit) => {
    setClubSheet(hit);
    setClubUpcoming([]);
    setClubRecent([]);
    if (hit.apiTeamId == null) return;
    setClubLoading(true);
    try {
      const [next, last] = await Promise.all([
        externalScoresService
          .listTeamFixtures(hit.apiTeamId, { next: 6, status: 'scheduled' })
          .catch(() => []),
        externalScoresService
          .listTeamFixtures(hit.apiTeamId, { next: 5, status: 'finished' })
          .catch(() => []),
      ]);
      setClubUpcoming(next.map(externalFixtureToMatchItem));
      setClubRecent(last.map(externalFixtureToMatchItem));
    } catch {
      setClubUpcoming([]);
      setClubRecent([]);
    } finally {
      setClubLoading(false);
    }
  };

  if (selectedMatch) {
    return (
      <FootballHubMatchCenterScreen
        item={selectedMatch}
        onBack={() => setSelectedMatch(null)}
      />
    );
  }

  if (clubSheet) {
    const target = worldFollowTargetForTeam({
      apiTeamId: clubSheet.apiTeamId,
      name: clubSheet.name,
    });
    const following = followedIds.has(target.id);
    return (
      <HubScreen scroll>
        <Pressable onPress={() => setClubSheet(null)} hitSlop={12}>
          <ProDayText variant="body" style={styles.back}>
            ← Recherche
          </ProDayText>
        </Pressable>
        <ProDayText variant="hero" style={styles.title}>
          {clubSheet.name}
        </ProDayText>
        {clubSheet.country ? (
          <ProDayText variant="body" style={styles.sub}>
            {clubSheet.country}
          </ProDayText>
        ) : null}
        <Pressable
          style={[styles.followBtn, following && styles.followBtnOn]}
          onPress={() => void toggleFollow(clubSheet)}
          disabled={toggling === target.id}
        >
          <ProDayText variant="caption" style={styles.followLabel}>
            {following ? 'Ne plus suivre' : 'Suivre'}
          </ProDayText>
        </Pressable>

        {clubLoading ? <ActivityIndicator color={FOOTBALL_HUB.bright} /> : null}

        <ProDayText variant="section" style={styles.section}>
          Prochains matchs
        </ProDayText>
        {clubUpcoming.length === 0 && !clubLoading ? (
          <ProDayText variant="body" style={styles.muted}>
            Aucun prochain match disponible.
          </ProDayText>
        ) : (
          clubUpcoming.map((item) => (
            <HubMatchRow key={item.id} item={item} onPress={() => setSelectedMatch(item)} />
          ))
        )}

        <ProDayText variant="section" style={styles.section}>
          Résultats récents
        </ProDayText>
        {clubRecent.length === 0 && !clubLoading ? (
          <ProDayText variant="body" style={styles.muted}>
            Aucun résultat récent disponible.
          </ProDayText>
        ) : (
          clubRecent.map((item) => (
            <HubMatchRow key={item.id} item={item} onPress={() => setSelectedMatch(item)} />
          ))
        )}
      </HubScreen>
    );
  }

  const showPopular = query.trim().length < 2;
  const empty =
    query.trim().length >= 2 && !loading && hits.length === 0;

  return (
    <HubScreen scroll>
      <Pressable onPress={onBack} hitSlop={12}>
        <ProDayText variant="body" style={styles.back}>
          ← Retour
        </ProDayText>
      </Pressable>
      <ProDayText variant="hero" style={styles.title}>
        Chercher
      </ProDayText>
      <ProDayText variant="body" style={styles.sub}>
        Trouve un club et suis-le pour personnaliser ton fil.
      </ProDayText>

      <View style={styles.inputRow}>
        <Icon name="search" size={18} color={FOOTBALL_HUB.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="PSG, OM, Real, Barça…"
          placeholderTextColor={FOOTBALL_HUB.muted}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          autoFocus
        />
        {loading ? <ActivityIndicator color={FOOTBALL_HUB.bright} /> : null}
      </View>

      {showPopular ? (
        <View style={styles.popularBlock}>
          <ProDayText variant="caption" style={styles.popularLabel}>
            Clubs populaires
          </ProDayText>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {FEATURED.map((club) => {
              const target = worldFollowTargetForTeam({
                apiTeamId: club.apiTeamId,
                name: club.name,
              });
              const following = followedIds.has(target.id);
              const hit: FootballTeamHit = {
                id: club.id,
                name: club.name,
                apiTeamId: club.apiTeamId,
                country: club.country,
                source: 'world',
              };
              return (
                <Pressable
                  key={target.id}
                  style={[styles.chip, following && styles.chipOn]}
                  onPress={() => void toggleFollow(hit)}
                  onLongPress={() => void openClubSheet(hit)}
                >
                  <ProDayText
                    variant="caption"
                    style={[styles.chipText, following && styles.chipTextOn]}
                  >
                    {chipLabel(club.name)}
                  </ProDayText>
                </Pressable>
              );
            })}
          </ScrollView>
          <ProDayText variant="caption" style={styles.hint}>
            Appui long sur un chip pour voir le calendrier du club.
          </ProDayText>
        </View>
      ) : null}

      {empty ? (
        <ProDayText variant="body" style={styles.muted}>
          {FOOTBALL_HUB_COPY.emptySearch}
        </ProDayText>
      ) : null}

      {hits.map((hit) => {
        const target = worldFollowTargetForTeam({
          apiTeamId: hit.apiTeamId,
          name: hit.name,
        });
        const following = followedIds.has(target.id);
        return (
          <View key={hit.id} style={styles.result}>
            <Pressable style={styles.resultMain} onPress={() => void openClubSheet(hit)}>
              <ProDayText variant="body" style={styles.resultName}>
                {hit.name}
              </ProDayText>
              <ProDayText variant="caption" style={styles.muted}>
                Club{hit.country ? ` · ${hit.country}` : ''}
              </ProDayText>
            </Pressable>
            <Pressable
              style={[styles.followBtnSm, following && styles.followBtnOn]}
              onPress={() => void toggleFollow(hit)}
              disabled={toggling === target.id}
            >
              <ProDayText variant="caption" style={styles.followLabel}>
                {following ? 'Suivi' : 'Suivre'}
              </ProDayText>
            </Pressable>
          </View>
        );
      })}
    </HubScreen>
  );
};

const styles = StyleSheet.create({
  back: { color: FOOTBALL_HUB.bright, marginBottom: 8 },
  title: { color: FOOTBALL_HUB.foreground, fontSize: 28 },
  sub: { color: FOOTBALL_HUB.muted, marginBottom: 12 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: FOOTBALL_HUB.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 14,
  },
  input: { flex: 1, color: FOOTBALL_HUB.foreground, fontSize: 15, padding: 0 },
  popularBlock: { gap: 10, marginBottom: 12 },
  popularLabel: { color: FOOTBALL_HUB.muted, fontWeight: '600' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: FOOTBALL_HUB.surface,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
    marginRight: 8,
  },
  chipOn: { backgroundColor: FOOTBALL_HUB.soft, borderColor: FOOTBALL_HUB.accent },
  chipText: { color: FOOTBALL_HUB.muted, fontWeight: '600' },
  chipTextOn: { color: FOOTBALL_HUB.foreground },
  hint: { color: FOOTBALL_HUB.muted },
  muted: { color: FOOTBALL_HUB.muted },
  result: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: FOOTBALL_HUB.elevated,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
    marginBottom: 8,
  },
  resultMain: { flex: 1 },
  resultName: { color: FOOTBALL_HUB.foreground, fontWeight: '600' },
  followBtn: {
    alignSelf: 'flex-start',
    backgroundColor: FOOTBALL_HUB.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 999,
    marginVertical: 12,
  },
  followBtnSm: {
    backgroundColor: FOOTBALL_HUB.accent,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  followBtnOn: {
    backgroundColor: FOOTBALL_HUB.soft,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  followLabel: { color: '#fff', fontWeight: '700' },
  section: {
    color: FOOTBALL_HUB.foreground,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    fontSize: 12,
    marginTop: 16,
    marginBottom: 8,
  },
});
