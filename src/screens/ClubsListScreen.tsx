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
import { spacing, radius, shadows } from '../theme/designTokens';
import { useAppTheme } from '../context/ProductLineContext';

interface ClubsListScreenProps {
  onBack: () => void;
  onCreateClub?: () => void;
  onSelectClub?: (club: Club) => void;
}

export const ClubsListScreen: React.FC<ClubsListScreenProps> = ({
  onBack,
  onCreateClub,
  onSelectClub,
}) => {
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const { colors: themeColors } = useAppTheme();

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
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScreenHeader
        title="Clubs"
        onBack={onBack}
        centered
        rightAction={
          onCreateClub ? (
            <TouchableOpacity onPress={onCreateClub} hitSlop={12}>
              <Icon name="add" size={24} color={themeColors.brand} />
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
        <ActivityIndicator color={themeColors.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={[styles.empty, { color: themeColors.textMuted }]}>
              Aucun club enregistré. Créez le vôtre avec le bouton +.
            </Text>
          }
          renderItem={({ item }) => {
            const CardWrap = onSelectClub ? TouchableOpacity : View;
            return (
            <CardWrap
              style={[
                styles.card,
                shadows.card,
                {
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                },
              ]}
              onPress={onSelectClub ? () => onSelectClub(item) : undefined}
              activeOpacity={0.85}
            >
              <View style={[styles.logo, { backgroundColor: themeColors.accentSoft }]}>
                <Text style={[styles.logoLetter, { color: themeColors.brand }]}>
                  {item.name.charAt(0)}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={[styles.name, { color: themeColors.text }]}>{item.name}</Text>
                <Text style={[styles.meta, { color: themeColors.textSecondary }]}>
                  {item.city}
                  {item.department ? ` · ${item.department}` : ''}
                </Text>
                {item.categories.length > 0 && (
                  <Text style={[styles.cats, { color: themeColors.brand }]}>
                    {item.categories.join(' · ')}
                  </Text>
                )}
              </View>
              {item.verified && (
                <Icon name="checkmark-circle" size={20} color={themeColors.success} />
              )}
            </CardWrap>
            );
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  loader: { marginTop: spacing.xl },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xxl },
  empty: {
    textAlign: 'center',
    padding: spacing.xl,
    fontSize: 14,
    lineHeight: 22,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
  },
  logo: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  logoLetter: { fontSize: 20, fontWeight: '800' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '700' },
  meta: { fontSize: 13, marginTop: 2 },
  cats: { fontSize: 12, marginTop: 4, fontWeight: '600' },
});
