import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { SupporterPageFrame } from '../../components/supporter/SupporterPageFrame';
import { SupporterPlusBackBar } from '../../components/supporter/SupporterPlusBackBar';
import { getSupporterPageIdentity, SUPPORTER_SITE } from '../../content/supporterPageIdentity';
import { ProDayText } from '../../components/ui/ProDayText';
import { PressableSpring, PushScreenTransition } from '../../components/motion';
import { useAuth } from '../../context/AuthContext';
import { useSeasonCalendar } from '../../hooks/useAppData';
import { useSupporterGlobalSearch } from '../../hooks/useSupporterGlobalSearch';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { spacing, radius } from '../../theme/designTokens';
import type { SupporterMatchViewItem } from '../../utils/supporterMatchFilters';
import { SupporterMatchDetailScreen } from './SupporterMatchDetailScreen';
import { SupporterFootballMapScreen } from './SupporterFootballMapScreen';
import { SupporterSuivisScreen } from '../SupporterSuivisScreen';
import { SUPPORTER_COUNTRY_CHIPS } from '../../content/supporterCompetitionsCatalog';

/** Explorer — recherche globale clubs / matchs / compétitions / vidéos. */
export const SupporterExplorerScreen: React.FC = () => {
  const { profile } = useAuth();
  const nav = useTabNavigationActions();
  const { events } = useSeasonCalendar(profile?.uid, profile?.profile?.club_id);
  const { query, setQuery, search, loading, results } = useSupporterGlobalSearch(events);
  const [selected, setSelected] = useState<SupporterMatchViewItem | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [showSuivis, setShowSuivis] = useState(false);

  const onChangeText = useCallback(
    (text: string) => {
      setQuery(text);
      void search(text);
    },
    [search, setQuery],
  );

  if (showMap) {
    return (
      <PushScreenTransition active={showMap}>
        <SupporterFootballMapScreen onBack={() => setShowMap(false)} />
      </PushScreenTransition>
    );
  }

  if (showSuivis) {
    return (
      <PushScreenTransition active={showSuivis}>
        <View style={{ flex: 1, backgroundColor: SUPPORTER_SITE.bg }}>
          <PressableSpring
            style={{ paddingHorizontal: spacing.lg, paddingTop: spacing.md }}
            onPress={() => setShowSuivis(false)}
            haptic
          >
            <ProDayText variant="caption" style={styles.rowSub}>
              ← Explorer
            </ProDayText>
          </PressableSpring>
          <SupporterSuivisScreen />
        </View>
      </PushScreenTransition>
    );
  }

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
      <SupporterPlusBackBar />
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
          <PressableSpring style={styles.mapLink} onPress={() => setShowMap(true)} scaleTo={0.98}>
            <ProDayText variant="section" style={styles.mapLinkTitle}>
              Proche de toi
            </ProDayText>
            <ProDayText variant="caption" style={styles.rowSub}>
              Matchs ProDay cette semaine sur la carte
            </ProDayText>
          </PressableSpring>

          {query.length < 2 ? (
            <View style={styles.countryRow}>
              {SUPPORTER_COUNTRY_CHIPS.map((c) => (
                <PressableSpring
                  key={c.code}
                  style={styles.countryChip}
                  onPress={() => onChangeText(c.label)}
                  scaleTo={0.97}
                >
                  <ProDayText variant="caption" style={styles.countryChipText}>
                    {c.label}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
          ) : null}

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
                    if (item.matchItem) {
                      setSelected(item.matchItem);
                      return;
                    }
                    if (group.group === 'videos') {
                      nav.setActiveTab('reels', { returnTo: 'plus' });
                      return;
                    }
                    if (group.group === 'clubs') {
                      setShowSuivis(true);
                      return;
                    }
                    if (group.group === 'competitions') {
                      nav.openMatchs({ supporterChapter: 'world' });
                      return;
                    }
                    Alert.alert(
                      item.title,
                      item.subtitle ?? 'Ouvre Matchs pour voir le calendrier.',
                    );
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
  mapLink: {
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SITE.border,
    gap: 4,
    marginBottom: spacing.sm,
  },
  mapLinkTitle: { color: SUPPORTER_SITE.foreground, fontSize: 15 },
  countryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
  countryChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SITE.border,
    backgroundColor: SUPPORTER_SITE.elevated,
  },
  countryChipText: { color: SUPPORTER_SITE.muted, fontSize: 11 },
});
