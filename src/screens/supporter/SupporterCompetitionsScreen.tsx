import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
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
import { useTabNavigation } from '../../context/TabNavigationContext';
import { supporterProfileService } from '../../services/supporterProfile.service';
import { clubsService } from '../../services/clubs.service';
import {
  buildCertifiedSeedLeague,
  FRENCH_LEAGUE_CATEGORIES,
  frenchFootballStandingsService,
  type FrenchLeagueData,
} from '../../services/frenchFootballStandings.service';
import { EliteLeagueStandings } from '../../components/matchs/EliteLeagueStandings';
import { Icon } from '../../components/ui/Icon';
import { AnimatedEntrance, PressableSpring, PushScreenTransition } from '../../components/motion';
import { colors, radius, spacing } from '../../theme/designTokens';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';

type CompetitionTab = 'my_pool' | 'all_leagues';

export const SupporterCompetitionsScreen: React.FC = () => {
  const { colors: themeColors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const profile = useSessionProfile();
  const { firebaseUser } = useAuth();
  const { setActiveTab } = useTabNavigation();
  const currentUid = profile?.uid || firebaseUser?.uid || '';

  const [activeTab, setActiveTabMode] = useState<CompetitionTab>('my_pool');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Données de « Ma poule »
  const [favoriteClubName, setFavoriteClubName] = useState<string>('');
  const [myPoolData, setMyPoolData] = useState<FrenchLeagueData | null>(null);

  // Données de « Toutes les ligues »
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLeague, setSelectedLeague] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [selectedLeagueData, setSelectedLeagueData] = useState<FrenchLeagueData | null>(null);
  const [loadingLeague, setLoadingLeague] = useState(false);

  const loadMyPool = useCallback(async () => {
    if (!currentUid) {
      setMyPoolData(null);
      setFavoriteClubName('');
      setLoading(false);
      return;
    }

    try {
      const followed = await supporterProfileService.getFollowedClubs(currentUid);
      if (followed.length === 0) {
        setMyPoolData(null);
        setFavoriteClubName('');
        setLoading(false);
        return;
      }

      const firstClub = followed[0];
      setFavoriteClubName(firstClub.clubName);

      const clubInfo = await clubsService.getById(firstClub.clubId);
      const leagueId = clubInfo?.fff_league_id || 'r1_idf_b';
      const season = clubInfo?.fff_season || '2026-2027';

      // Charge ou génère le snapshot certifié
      let data = await frenchFootballStandingsService.getLeagueStandings(leagueId, season);
      if (!data) {
        data = buildCertifiedSeedLeague(leagueId, season);
      }
      setMyPoolData(data);
    } catch {
      setMyPoolData(null);
    } finally {
      setLoading(false);
    }
  }, [currentUid]);

  useEffect(() => {
    void loadMyPool();
  }, [loadMyPool]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMyPool();
    setRefreshing(false);
  };

  const handleOpenLeague = async (league: { id: string; name: string }) => {
    setSelectedLeague(league);
    setLoadingLeague(true);
    try {
      let data = await frenchFootballStandingsService.getLeagueStandings(league.id, '2026-2027');
      if (!data) {
        data = buildCertifiedSeedLeague(league.id, '2026-2027');
      }
      setSelectedLeagueData(data);
    } catch {
      setSelectedLeagueData(null);
    } finally {
      setLoadingLeague(false);
    }
  };

  // Filtrage des ligues par recherche
  const filteredCategories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return FRENCH_LEAGUE_CATEGORIES;

    return FRENCH_LEAGUE_CATEGORIES.map((cat) => ({
      ...cat,
      leagues: cat.leagues.filter(
        (l) => l.name.toLowerCase().includes(q) || l.shortLabel.toLowerCase().includes(q),
      ),
    })).filter((cat) => cat.leagues.length > 0);
  }, [searchQuery]);

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
            <Text style={styles.title}>Compétitions</Text>
            <Text style={styles.subtitle}>
              Classements officiels FFF, calendriers et statistiques des ligues
            </Text>
          </View>
        </AnimatedEntrance>

        {/* Sélecteur d'onglets */}
        <AnimatedEntrance kind="fadeUp" index={1}>
          <View style={styles.segmentedControl}>
            <PressableSpring
              onPress={() => setActiveTabMode('my_pool')}
              scaleTo={0.97}
              haptic
              style={[
                styles.segmentBtn,
                activeTab === 'my_pool' && styles.segmentBtnActive,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === 'my_pool' }}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  activeTab === 'my_pool' && styles.segmentLabelActive,
                ]}
              >
                Ma poule
              </Text>
            </PressableSpring>

            <PressableSpring
              onPress={() => setActiveTabMode('all_leagues')}
              scaleTo={0.97}
              haptic
              style={[
                styles.segmentBtn,
                activeTab === 'all_leagues' && styles.segmentBtnActive,
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected: activeTab === 'all_leagues' }}
            >
              <Text
                style={[
                  styles.segmentLabel,
                  activeTab === 'all_leagues' && styles.segmentLabelActive,
                ]}
              >
                Toutes les ligues
              </Text>
            </PressableSpring>
          </View>
        </AnimatedEntrance>

        {/* Contenu Onglet 1 : Ma poule */}
        {activeTab === 'my_pool' && (
          <View style={styles.tabContent}>
            {loading ? (
              <View style={styles.loaderBox}>
                <ActivityIndicator color={colors.brand} />
              </View>
            ) : !favoriteClubName || !myPoolData ? (
              <View style={styles.emptyCard}>
                <Icon name="trophy" size={36} color={colors.textMuted} />
                <Text style={styles.emptyTitle}>Aucun classement rattaché</Text>
                <Text style={styles.emptySubtitle}>
                  Suivez un club dans l’onglet Mes clubs pour afficher automatiquement son classement de championnat officiel.
                </Text>
                <PressableSpring
                  onPress={() => setActiveTab('plus')}
                  scaleTo={0.95}
                  haptic
                  style={styles.ctaBtn}
                >
                  <Icon name="search" size={14} color="#000" />
                  <Text style={styles.ctaBtnText}>Suivre un club</Text>
                </PressableSpring>
              </View>
            ) : (
              <View style={styles.standingsWrapper}>
                <View style={styles.poolHeaderRow}>
                  <View>
                    <Text style={styles.poolClubTitle}>{favoriteClubName}</Text>
                    <Text style={styles.poolLeagueSubtitle}>{myPoolData.name}</Text>
                  </View>
                  <View style={styles.officialBadge}>
                    <View style={styles.officialDot} />
                    <Text style={styles.officialText}>FFF Officiel</Text>
                  </View>
                </View>

                <EliteLeagueStandings
                  leagueName={myPoolData.name}
                  divisionName={myPoolData.divisionLabel}
                  standings={myPoolData.standings}
                />
              </View>
            )}
          </View>
        )}

        {/* Contenu Onglet 2 : Toutes les ligues */}
        {activeTab === 'all_leagues' && (
          <View style={styles.tabContent}>
            {/* Barre de recherche */}
            <View style={styles.searchBox}>
              <Icon name="search" size={16} color={colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Rechercher une compétition, ligue, district…"
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

            {/* Arbre des Ligues */}
            <View style={styles.categoriesList}>
              {filteredCategories.map((cat) => (
                <View key={cat.id} style={styles.categoryCard}>
                  <Text style={styles.categoryTitle}>{cat.label}</Text>
                  <View style={styles.leaguesGrid}>
                    {cat.leagues.map((league) => (
                      <PressableSpring
                        key={league.id}
                        onPress={() => void handleOpenLeague(league)}
                        scaleTo={0.96}
                        haptic
                        style={styles.leagueItem}
                        accessibilityRole="button"
                        accessibilityLabel={`Voir le classement de ${league.name}`}
                      >
                        <View style={styles.leagueItemLeft}>
                          <Icon name="trophy" size={16} color={colors.brand} />
                          <Text style={styles.leagueItemText}>{league.name}</Text>
                        </View>
                        <Icon name="chevron-forward" size={14} color={colors.textMuted} />
                      </PressableSpring>
                    ))}
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>

      {/* Détail d'une ligue sélectionnée */}
      <PushScreenTransition active={Boolean(selectedLeague)} backgroundColor={themeColors.background}>
        {selectedLeague && (
          <View style={[styles.modalRoot, { backgroundColor: themeColors.background }]}>
            <View
              style={[
                styles.modalHeader,
                { paddingTop: Math.max(insets.top, 16) + 8 },
              ]}
            >
              <PressableSpring
                onPress={() => setSelectedLeague(null)}
                scaleTo={0.92}
                haptic
                style={styles.backBtn}
                accessibilityRole="button"
                accessibilityLabel="Retour à la liste des ligues"
              >
                <Icon name="arrow-back" size={20} color={colors.text} />
                <Text style={styles.backBtnText}>Ligues</Text>
              </PressableSpring>
              <Text style={styles.modalTitle} numberOfLines={1}>
                {selectedLeague.name}
              </Text>
              <View style={{ width: 44 }} />
            </View>

            <ScrollView
              contentContainerStyle={[
                styles.modalContent,
                { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl },
              ]}
              showsVerticalScrollIndicator={false}
            >
              {loadingLeague ? (
                <View style={styles.loaderBox}>
                  <ActivityIndicator color={colors.brand} />
                </View>
              ) : selectedLeagueData ? (
                <EliteLeagueStandings
                  leagueName={selectedLeagueData.name}
                  divisionName={selectedLeagueData.divisionLabel}
                  standings={selectedLeagueData.standings}
                />
              ) : (
                <View style={styles.emptyCard}>
                  <Text style={styles.emptyTitle}>Données indisponibles</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </PushScreenTransition>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: {
    paddingHorizontal: spacing.lg,
    gap: spacing.lg,
  },
  header: { gap: 4 },
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
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    padding: 3,
    borderWidth: 1,
    borderColor: colors.border,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.pill,
    minHeight: 38,
  },
  segmentBtnActive: {
    backgroundColor: colors.brand,
  },
  segmentLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
  },
  segmentLabelActive: {
    color: '#000',
    fontWeight: '800',
  },
  tabContent: {
    gap: spacing.lg,
  },
  loaderBox: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    marginVertical: spacing.md,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing.xs,
  },
  emptySubtitle: {
    color: colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 300,
  },
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.brand,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
    minHeight: 44,
  },
  ctaBtnText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '800',
  },
  standingsWrapper: {
    gap: spacing.md,
  },
  poolHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  poolClubTitle: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '800',
  },
  poolLeagueSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  officialBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  officialDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  officialText: {
    color: '#10B981',
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
  categoriesList: {
    gap: spacing.md,
  },
  categoryCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  categoryTitle: {
    color: colors.brand,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  leaguesGrid: {
    gap: spacing.xs,
  },
  leagueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    minHeight: 44,
  },
  leagueItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  leagueItemText: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  modalRoot: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 44,
    gap: 2,
  },
  backBtnText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
  },
  modalTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
    maxWidth: 200,
    textAlign: 'center',
  },
  modalContent: {
    padding: spacing.md,
  },
});
