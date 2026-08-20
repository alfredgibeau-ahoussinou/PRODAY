import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { Icon } from '../../../components/ui/Icon';
import { ProDayText } from '../../../components/ui/ProDayText';
import { footballDataFacade } from '../../../services/footballData';
import type { FootballCompetitionEntry, FootballTeamHit } from '../../../services/footballData/types';
import { FOOTBALL_HUB, FOOTBALL_HUB_COPY } from '../theme/footballHubTheme';

type Props = {
  onSelectClub?: (hit: FootballTeamHit) => void;
  onSelectCompetition?: (entry: FootballCompetitionEntry) => void;
  placeholder?: string;
};

export const HubSearchBar: React.FC<Props> = ({
  onSelectClub,
  onSelectCompetition,
  placeholder = 'Chercher un club, un match, une compétition…',
}) => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [clubs, setClubs] = useState<FootballTeamHit[]>([]);
  const [comps, setComps] = useState<FootballCompetitionEntry[]>([]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setClubs([]);
      setComps([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const [teamHits, competitionHits] = await Promise.all([
          footballDataFacade.searchTeams(q),
          footballDataFacade.listCompetitionsByCountry().then((all) =>
            all.filter((c) => c.label.toLowerCase().includes(q.toLowerCase())).slice(0, 8),
          ),
        ]);
        if (!cancelled) {
          setClubs(teamHits);
          setComps(competitionHits);
        }
      } catch {
        if (!cancelled) {
          setClubs([]);
          setComps([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 320);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const empty =
    query.trim().length >= 2 && !loading && clubs.length === 0 && comps.length === 0;

  return (
    <View style={styles.wrap}>
      <View style={styles.inputRow}>
        <Icon name="search" size={18} color={FOOTBALL_HUB.muted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={placeholder}
          placeholderTextColor={FOOTBALL_HUB.muted}
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
        />
        {loading ? <ActivityIndicator color={FOOTBALL_HUB.bright} /> : null}
      </View>
      {empty ? (
        <ProDayText variant="caption" style={styles.empty}>
          {FOOTBALL_HUB_COPY.emptySearch}
        </ProDayText>
      ) : null}
      {clubs.map((hit) => (
        <Pressable
          key={`club-${hit.id}`}
          style={styles.result}
          onPress={() => onSelectClub?.(hit)}
        >
          <ProDayText variant="body" style={styles.resultText}>
            {hit.name}
          </ProDayText>
          <ProDayText variant="caption" style={styles.meta}>
            Club{hit.country ? ` · ${hit.country}` : ''}
          </ProDayText>
        </Pressable>
      ))}
      {comps.map((c) => (
        <Pressable
          key={`comp-${c.id}`}
          style={styles.result}
          onPress={() => onSelectCompetition?.(c)}
        >
          <ProDayText variant="body" style={styles.resultText}>
            {c.label}
          </ProDayText>
          <ProDayText variant="caption" style={styles.meta}>
            Compétition · {c.country}
          </ProDayText>
        </Pressable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: 8 },
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
  },
  input: {
    flex: 1,
    color: FOOTBALL_HUB.foreground,
    fontSize: 15,
    padding: 0,
  },
  empty: { color: FOOTBALL_HUB.muted, paddingHorizontal: 4 },
  result: {
    backgroundColor: FOOTBALL_HUB.elevated,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
  },
  resultText: { color: FOOTBALL_HUB.foreground },
  meta: { color: FOOTBALL_HUB.muted, marginTop: 2 },
});
