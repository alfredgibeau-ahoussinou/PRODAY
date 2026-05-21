import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { colors, spacing, radius, shadows } from '../theme/designTokens';
import { friendlyMatchesService } from '../services/friendlyMatches.service';
import type { FriendlyMatch } from '../models/FriendlyMatch';
import { formatMatchDateTime } from '../utils/matchDisplay';

const CHIPS = ['Tous', 'Loisir', 'Compétition', 'Mixte'] as const;

interface SearchMatchScreenProps {
  onBack: () => void;
}

export const SearchMatchScreen: React.FC<SearchMatchScreenProps> = ({ onBack }) => {
  const [chip, setChip] = useState<(typeof CHIPS)[number]>('Tous');
  const [query, setQuery] = useState('');
  const [matches, setMatches] = useState<FriendlyMatch[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    friendlyMatchesService
      .listOpenForSearch(chip === 'Tous' ? undefined : chip)
      .then(setMatches)
      .finally(() => setLoading(false));
  }, [chip]);

  const filtered = matches.filter((m) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      m.requester_club_name.toLowerCase().includes(q) ||
      m.city.toLowerCase().includes(q) ||
      (m.opponent_club_name?.toLowerCase().includes(q) ?? false) ||
      m.level.toLowerCase().includes(q)
    );
  });

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Rechercher un match"
        onBack={onBack}
        rightAction={
          <TouchableOpacity style={styles.filterBtn}>
            <Text style={styles.filterText}>Filtres</Text>
          </TouchableOpacity>
        }
      />
      <SearchBar
        placeholder="Ville, club, niveau…"
        value={query}
        onChangeText={setQuery}
      />

      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.chips}>
          {CHIPS.map((c) => (
            <TouchableOpacity
              key={c}
              style={[styles.chip, chip === c && styles.chipActive]}
              onPress={() => setChip(c)}
            >
              <Text style={[styles.chipText, chip === c && styles.chipTextActive]}>
                {c}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator color={colors.brand} style={styles.loader} />
        ) : filtered.length === 0 ? (
          <Text style={styles.empty}>Aucun match ouvert pour ces critères.</Text>
        ) : (
          filtered.map((m) => (
            <View key={m.id} style={[styles.card, shadows.card]}>
              <View style={styles.logo}>
                <Text style={styles.logoLetter}>
                  {m.requester_club_name.charAt(0)}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{m.requester_club_name}</Text>
                <Text style={styles.meta}>
                  {m.city} · {m.level} · {m.level_type}
                </Text>
                <Text style={styles.avail}>
                  Disponible le {formatMatchDateTime(m.date, m.time_label)}
                </Text>
              </View>
              <TouchableOpacity style={styles.contactBtn}>
                <Text style={styles.contactText}>Contacter</Text>
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  filterBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.brand,
  },
  filterText: { color: colors.brand, fontWeight: '600', fontSize: 13 },
  list: { paddingBottom: spacing.xxl },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.brand, borderColor: colors.brand },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: '#FFF' },
  loader: { marginVertical: spacing.xl },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: spacing.xl,
    fontSize: 14,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    flexWrap: 'wrap',
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.brandSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoLetter: { fontSize: 20, fontWeight: '800', color: colors.brand },
  info: { flex: 1, minWidth: 120 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  avail: { fontSize: 12, color: colors.brand, marginTop: 4, fontWeight: '600' },
  contactBtn: {
    borderWidth: 1,
    borderColor: colors.brand,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  contactText: { color: colors.brand, fontWeight: '700', fontSize: 13 },
});
