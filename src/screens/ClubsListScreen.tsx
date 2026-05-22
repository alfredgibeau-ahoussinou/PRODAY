import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import type { Club } from '../models/Club';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { clubsService } from '../services/clubs.service';
import { Icon } from '../components/ui/Icon';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

interface ClubsListScreenProps {
  onBack: () => void;
  onCreateClub?: () => void;
}

export const ClubsListScreen: React.FC<ClubsListScreenProps> = ({
  onBack,
  onCreateClub,
}) => {
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setClubs(await clubsService.searchByName(query));
    setLoading(false);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(load, 300);
    return () => clearTimeout(t);
  }, [load]);

  return (
    <View style={styles.root}>
      <ScreenHeader
        title="Clubs"
        onBack={onBack}
        centered
        rightAction={
          onCreateClub ? (
            <TouchableOpacity onPress={onCreateClub} hitSlop={12}>
              <Icon name="add" size={24} color={colors.brand} />
            </TouchableOpacity>
          ) : undefined
        }
      />
      <SearchBar
        placeholder="Nom ou ville…"
        value={query}
        onChangeText={setQuery}
      />
      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Aucun club enregistré. Créez le vôtre avec le bouton +.
            </Text>
          }
          renderItem={({ item }) => (
            <View style={[styles.card, shadows.card]}>
              <View style={styles.logo}>
                <Text style={styles.logoLetter}>{item.name.charAt(0)}</Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {item.city}
                  {item.department ? ` · ${item.department}` : ''}
                </Text>
                {item.categories.length > 0 && (
                  <Text style={styles.cats}>{item.categories.join(' · ')}</Text>
                )}
              </View>
              {item.verified && (
                <Icon name="checkmark-circle" size={20} color={colors.success} />
              )}
            </View>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  loader: { marginTop: spacing.xl },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  empty: {
    textAlign: 'center',
    color: colors.textMuted,
    padding: spacing.xl,
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
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
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700', color: colors.text },
  meta: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  cats: { fontSize: 12, color: colors.brand, marginTop: 4, fontWeight: '600' },
});
