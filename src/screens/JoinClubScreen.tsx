import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { Club } from '../models/Club';
import type { User } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { SearchBar } from '../components/ui/SearchBar';
import { clubsService } from '../services/clubs.service';
import { profileService } from '../services/profile.service';
import { Icon } from '../components/ui/Icon';
import { colors, spacing, radius, shadows } from '../theme/designTokens';

interface JoinClubScreenProps {
  profile: User;
  onBack: () => void;
  onJoined: () => void;
}

export const JoinClubScreen: React.FC<JoinClubScreenProps> = ({
  profile,
  onBack,
  onJoined,
}) => {
  const [query, setQuery] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loading, setLoading] = useState(true);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setClubs(await clubsService.searchByName(query));
    setLoading(false);
  }, [query]);

  useEffect(() => {
    const t = setTimeout(() => void load(), 300);
    return () => clearTimeout(t);
  }, [load]);

  const handleJoin = async (club: Club) => {
    Alert.alert(
      'Rejoindre le club',
      `Associer votre profil à ${club.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Rejoindre',
          onPress: async () => {
            setJoiningId(club.id);
            try {
              await profileService.updateProfile(profile.uid, {
                profile: { club_id: club.id },
              });
              Alert.alert('Club rejoint', `Vous êtes maintenant membre de ${club.name}.`);
              onJoined();
            } catch (e) {
              Alert.alert(
                'Erreur',
                e instanceof Error ? e.message : 'Impossible de rejoindre ce club.'
              );
            } finally {
              setJoiningId(null);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Rejoindre un club" onBack={onBack} centered />
      <Text style={styles.hint}>
        Recherchez votre structure pour accéder aux convocations, présences et cotisations.
      </Text>
      <SearchBar placeholder="Nom ou ville…" value={query} onChangeText={setQuery} />
      {loading ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <FlatList
          data={clubs}
          keyExtractor={(c) => c.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>
              Aucun club trouvé. Créez le vôtre depuis le profil.
            </Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.card, shadows.card]}
              onPress={() => void handleJoin(item)}
              disabled={joiningId === item.id}
            >
              <View style={styles.cardBody}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.meta}>
                  {[item.city, item.categories?.[0]].filter(Boolean).join(' · ')}
                </Text>
              </View>
              {joiningId === item.id ? (
                <ActivityIndicator color={colors.brand} />
              ) : (
                <Icon name="chevron-forward" size={20} color={colors.textMuted} />
              )}
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  hint: {
    fontSize: 13,
    color: colors.textSecondary,
    lineHeight: 20,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  loader: { marginTop: spacing.xl },
  list: { padding: spacing.lg, paddingBottom: spacing.xxl },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: spacing.xl },
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
  cardBody: { flex: 1 },
  name: { fontSize: 15, fontWeight: '800', color: colors.text },
  meta: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
});
