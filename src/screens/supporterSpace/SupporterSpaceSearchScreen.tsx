import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { ProDayText } from '../../components/ui/ProDayText';
import { Icon } from '../../components/ui/Icon';
import { MatchCard, SpaceScreen, SpaceSection } from '../../features/supporterSpace/components';
import {
  SUPPORTER_SPACE,
  SUPPORTER_SPACE_COPY,
} from '../../features/supporterSpace/theme/supporterSpaceTheme';
import type {
  MergedSupporterFootballFacade,
  SearchResult,
  UnifiedMatch,
} from '../../services/supporterFootball';

type Props = {
  facade: MergedSupporterFootballFacade;
  onClose: () => void;
  onOpenMatch: (m: UnifiedMatch) => void;
};

export const SupporterSpaceSearchScreen: React.FC<Props> = ({
  facade,
  onClose,
  onOpenMatch,
}) => {
  const [query, setQuery] = useState('');
  const [result, setResult] = useState<SearchResult>({
    matches: [],
    teams: [],
    competitions: [],
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResult({ matches: [], teams: [], competitions: [] });
      return undefined;
    }
    const t = setTimeout(() => {
      setLoading(true);
      void facade
        .search(q)
        .then(setResult)
        .catch(() => setResult({ matches: [], teams: [], competitions: [] }))
        .finally(() => setLoading(false));
    }, 350);
    return () => clearTimeout(t);
  }, [query, facade]);

  const empty =
    !loading &&
    query.trim().length >= 2 &&
    !result.matches.length &&
    !result.teams.length &&
    !result.competitions.length;

  return (
    <SpaceScreen>
      <View style={styles.head}>
        <Pressable onPress={onClose} hitSlop={12}>
          <Icon name="arrow-back" size={22} color={SUPPORTER_SPACE.foreground} />
        </Pressable>
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={SUPPORTER_SPACE_COPY.searchPlaceholder}
          placeholderTextColor={SUPPORTER_SPACE.muted}
          style={styles.input}
          autoFocus
          autoCorrect={false}
        />
      </View>

      {loading ? <ActivityIndicator color={SUPPORTER_SPACE.bright} /> : null}
      {empty ? (
        <ProDayText variant="body" style={styles.muted}>
          {SUPPORTER_SPACE_COPY.emptySearch}
        </ProDayText>
      ) : null}

      {result.matches.length ? (
        <SpaceSection title="Matchs">
          {result.matches.map((m) => (
            <MatchCard key={m.id} match={m} onPress={() => onOpenMatch(m)} />
          ))}
        </SpaceSection>
      ) : null}

      {result.teams.length ? (
        <SpaceSection title="Clubs">
          {result.teams.map((t) => (
            <View key={t.id} style={styles.row}>
              <ProDayText variant="body" style={styles.name}>
                {t.name}
              </ProDayText>
            </View>
          ))}
        </SpaceSection>
      ) : null}

      {result.competitions.length ? (
        <SpaceSection title="Compétitions">
          {result.competitions.map((c) => (
            <View key={c.id} style={styles.row}>
              <ProDayText variant="body" style={styles.name}>
                {c.name}
              </ProDayText>
              {c.country ? (
                <ProDayText variant="caption" style={styles.muted}>
                  {c.country}
                </ProDayText>
              ) : null}
            </View>
          ))}
        </SpaceSection>
      ) : null}
    </SpaceScreen>
  );
};

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  input: {
    flex: 1,
    backgroundColor: SUPPORTER_SPACE.surface,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: SUPPORTER_SPACE.foreground,
  },
  muted: { color: SUPPORTER_SPACE.muted },
  row: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: SUPPORTER_SPACE.surface,
    borderWidth: 1,
    borderColor: SUPPORTER_SPACE.border,
    marginBottom: 8,
  },
  name: { color: SUPPORTER_SPACE.foreground },
});
