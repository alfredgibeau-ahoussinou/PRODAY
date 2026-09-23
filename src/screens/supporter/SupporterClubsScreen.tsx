import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useAuth } from '../../context/AuthContext';
import {
  supporterProfileService,
  type SupporterFollowedClub,
} from '../../services/supporterProfile.service';
import { clubsService } from '../../services/clubs.service';
import type { Club } from '../../models/Club';
import { Icon } from '../../components/ui/Icon';
import { AnimatedEntrance, PressableSpring } from '../../components/motion';
import { colors, radius, spacing } from '../../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { prodayHaptics } from '../../utils/prodayHaptics';

export const SupporterClubsScreen: React.FC = () => {
  const { colors: themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const { firebaseUser } = useAuth();
  const currentUid = profile?.uid || firebaseUser?.uid || '';

  const [followedClubs, setFollowedClubs] = useState<SupporterFollowedClub[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Recherche de clubs
  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<Club[]>([]);

  const loadFollowedClubs = useCallback(async () => {
    if (!currentUid) {
      setFollowedClubs([]);
      setLoading(false);
      return;
    }
    try {
      const list = await supporterProfileService.getFollowedClubs(currentUid);
      setFollowedClubs(list);
    } catch {
      setFollowedClubs([]);
    } finally {
      setLoading(false);
    }
  }, [currentUid]);

  useEffect(() => {
    void loadFollowedClubs();
  }, [loadFollowedClubs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFollowedClubs();
    setRefreshing(false);
  };

  // Recherche dynamique avec debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        setSearching(false);
        return;
      }
      setSearching(true);
      try {
        const res = await clubsService.searchByName(searchQuery);
        setSearchResults(res);
      } catch {
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleFollow = async (club: Club) => {
    if (!currentUid) {
      Alert.alert('Connexion requise', 'Connectez-vous pour suivre des clubs.');
      return;
    }
    prodayHaptics.press();
    await supporterProfileService.followClub(currentUid, {
      clubId: club.id,
      clubName: club.name,
    });
    await loadFollowedClubs();
  };

  const handleUnfollow = (club: SupporterFollowedClub) => {
    Alert.alert(
      'Ne plus suivre',
      `Arrêter de suivre ${club.clubName} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          style: 'destructive',
          onPress: async () => {
            prodayHaptics.press();
            await supporterProfileService.unfollowClub(currentUid, club.clubId);
            await loadFollowedClubs();
          },
        },
      ],
    );
  };

  const isClubFollowed = (clubId: string) => {
    return followedClubs.some((c) => c.clubId === clubId);
  };

  return (
    <View style={[styles.root, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 16) + 12,
            paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void onRefresh()}
            tintColor={colors.brand}
          />
        }
      >
        {/* En-tête */}
        <AnimatedEntrance kind="fadeUp" index={0}>
          <View style={styles.header}>
            <Text style={styles.title}>Mes clubs</Text>
            <Text style={styles.subtitle}>
              Suivez les actualités, matchs et résultats de vos clubs préférés
            </Text>
          </View>
        </AnimatedEntrance>

        {/* Section 1 : Clubs suivis */}
        <AnimatedEntrance kind="fadeUp" index={1}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="bookmark" size={16} color={colors.brand} />
              <Text style={styles.sectionTitle}>
                Clubs suivis ({followedClubs.length})
              </Text>
            </View>

            {loading ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator color={colors.brand} />
              </View>
            ) : followedClubs.length === 0 ? (
              <View style={styles.emptyCard}>
                <Icon name="shield" size={32} color={colors.textMuted} />
                <Text style={styles.emptyCardTitle}>Aucun club suivi</Text>
                <Text style={styles.emptyCardSubtitle}>
                  Utilisez la recherche ci-dessous pour trouver votre club et recevoir ses alertes.
                </Text>
              </View>
            ) : (
              <View style={styles.cardsList}>
                {followedClubs.map((c) => (
                  <View key={c.clubId} style={styles.clubCard}>
                    <View style={styles.clubIcon}>
                      <Icon name="shield" size={20} color={colors.brand} />
                    </View>
                    <View style={styles.clubMeta}>
                      <Text style={styles.clubName}>{c.clubName}</Text>
                      <Text style={styles.clubSub}>
                        Suivi depuis le{' '}
                        {new Date(c.followedAt).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                    <PressableSpring
                      onPress={() => handleUnfollow(c)}
                      scaleTo={0.94}
                      haptic
                      style={styles.unfollowBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Ne plus suivre ${c.clubName}`}
                    >
                      <Icon name="close" size={14} color={colors.textMuted} />
                    </PressableSpring>
                  </View>
                ))}
              </View>
            )}
          </View>
        </AnimatedEntrance>

        {/* Section 2 : Découvrir des clubs */}
        <AnimatedEntrance kind="fadeUp" index={2}>
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="search" size={16} color={colors.tone4} />
              <Text style={styles.sectionTitle}>Découvrir des clubs</Text>
            </View>

            {/* Barre de recherche */}
            <View style={styles.searchBox}>
              <Icon name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher par nom de club, ville…"
                placeholderTextColor={colors.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCorrect={false}
              />
              {searchQuery.length > 0 && (
                <PressableSpring onPress={() => setSearchQuery('')} hitSlop={8}>
                  <Icon name="close" size={16} color={colors.textMuted} />
                </PressableSpring>
              )}
            </View>

            {searching ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator color={colors.brand} size="small" />
              </View>
            ) : searchQuery.trim().length > 0 && searchResults.length === 0 ? (
              <View style={styles.emptyCard}>
                <Text style={styles.emptyCardTitle}>Aucun résultat</Text>
                <Text style={styles.emptyCardSubtitle}>
                  Aucun club ne correspond à votre recherche "{searchQuery}".
                </Text>
              </View>
            ) : (
              <View style={styles.cardsList}>
                {searchResults.map((club) => {
                  const followed = isClubFollowed(club.id);
                  return (
                    <View key={club.id} style={styles.clubCard}>
                      <View style={styles.clubIcon}>
                        <Icon name="football" size={20} color={colors.tone4} />
                      </View>
                      <View style={styles.clubMeta}>
                        <Text style={styles.clubName}>{club.name}</Text>
                        <Text style={styles.clubSub}>
                          {club.city}
                          {club.department ? ` (${club.department})` : ''}
                        </Text>
                      </View>
                      {followed ? (
                        <View style={styles.alreadyFollowedBadge}>
                          <Icon name="checkmark-circle" size={13} color={colors.brand} />
                          <Text style={styles.alreadyFollowedText}>Suivi</Text>
                        </View>
                      ) : (
                        <PressableSpring
                          onPress={() => void handleFollow(club)}
                          scaleTo={0.94}
                          haptic
                          style={styles.followBtn}
                          accessibilityRole="button"
                          accessibilityLabel={`Suivre ${club.name}`}
                        >
                          <Icon name="add" size={14} color="#000" />
                          <Text style={styles.followBtnText}>Suivre</Text>
                        </PressableSpring>
                      )}
                    </View>
                  );
                })}
              </View>
            )}
          </View>
        </AnimatedEntrance>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.xl,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    letterSpacing: -0.4,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
  },
  section: {
    gap: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.text,
  },
  loaderBox: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyCardTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  emptyCardSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
  },
  cardsList: {
    gap: spacing.sm,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  clubIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  clubMeta: {
    flex: 1,
  },
  clubName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  clubSub: {
    color: colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  unfollowBtn: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: colors.border,
  },
  followBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.brand,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    minHeight: 44,
  },
  followBtnText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '800',
  },
  alreadyFollowedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(234, 179, 8, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.25)',
  },
  alreadyFollowedText: {
    color: colors.brand,
    fontSize: 11,
    fontWeight: '700',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: colors.borderStrong,
    gap: spacing.sm,
    height: 44,
  },
  searchInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
    paddingVertical: 0,
  },
});
