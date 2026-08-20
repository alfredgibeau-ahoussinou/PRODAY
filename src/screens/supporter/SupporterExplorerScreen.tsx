import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SupporterPageFrame } from '../../components/supporter/SupporterPageFrame';
import { getSupporterPageIdentity, SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring, PushScreenTransition } from '../../components/motion';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useSupporterGlobalSearch } from '../../hooks/useSupporterGlobalSearch';
import { spacing, radius } from '../../theme/designTokens';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { SupporterMatchDetailScreen } from './SupporterMatchDetailScreen';

/** Explorer — recherche globale clubs / matchs / compétitions / vidéos. */
export const SupporterExplorerScreen: React.FC = () => {
  const { profile } = useAuth();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile.club_id);
  const { query, setQuery, search, loading, results } = useSupporterGlobalSearch(events);
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);

  const onChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      void search(text);
    },
    [search, setQuery],
  );

  if (selected) {
    return (
      <PushScreenTransition active={Boolean(selected)}>
        {selected ? (
          <SupporterMatchDetailScreen item={selected} onBack={() => setSelected(null)} />
        ) : null}
      </PushScreenTransition>
    );
  }

  return (
    <SupporterPageFrame identity={getSupporterPageIdentity('suivis')}>
      <View style={styles.searchBox}>
        <TextInput
          value={query}
          onChangeText={onChangeText}
          placeholder="Club, ligue, match, ProDay…"
          placeholderTextColor={SUPPORTER_SITE.muted}
          style={styles.input}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
      </View>

      {loading ? (
        <ActivityIndicator color={SUPPORTER_SITE.accent} style={{ marginTop: spacing.lg }} />
      ) : (
        <ScrollView contentContainerStyle={styles.results} showsVerticalScrollIndicator={false}>
          {results.length === 0 && query.length >= 2 ? (
            <ProDayText variant="body" style={styles.empty}>
              Aucun résultat pour « {query} »
            </ProDayText>
          ) : null}
          {results.length === 0 && query.length < 2 ? (
            <ProDayText variant="body" style={styles.empty}>
              Recherche un club (ex. Real Madrid), une compétition (Ligue 1) ou « ProDay ».
            </ProDayText>
          ) : null}
          {results.map((group) => (
            <View key={group.group} style={styles.group}>
              <ProDayText variant="caption" style={styles.groupLabel}>
                {group.label}
              </ProDayText>
              {group.items.map((item) => (
                <PressableSpring
                  key={item.id}
                  style={styles.row}
                  onPress={() => {
                    if (item.matchItem) setSelected(item.matchItem);
                  }}
                  scaleTo={0.98}
                >
                  <ProDayText variant="section" style={styles.rowTitle}>
                    {item.title}
                  </ProDayText>
                  {item.subtitle ? (
                    <ProDayText variant="caption" style={styles.rowSub}>
                      {item.subtitle}
                    </ProDayText>
                  ) : null}
                </PressableSpring>
              ))}
            </View>
          ))}
        </ScrollView>
      )}
    </SupporterPageFrame>
  );
};

const styles = StyleSheet.create({
  searchBox: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md },
  input: {
    backgroundColor: SUPPORTER_SITE.elevated,
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    color: SUPPORTER_SITE.foreground,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    fontSize: 16,
  },
  results: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  empty: { color: SUPPORTER_SITE.muted, lineHeight: 22 },
  group: { gap: spacing.sm },
  groupLabel: {
    color: SUPPORTER_SITE.accent,
    letterSpacing: 1.4,
    fontSize: 10,
    textTransform: 'uppercase',
  },
  row: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SITE.border,
    gap: 2,
  },
  rowTitle: { color: SUPPORTER_SITE.foreground, fontSize: 15 },
  rowSub: { color: SUPPORTER_SITE.muted, fontSize: 12 },
});
