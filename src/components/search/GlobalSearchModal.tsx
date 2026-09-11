import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  globalSearchService,
  type GlobalSearchPageTarget,
  type GlobalSearchPlayerItem,
  type GlobalSearchClubItem,
  type SearchResultCategory,
} from '../../services/globalSearch.service';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { ELITE_COLORS, ELITE_RADIUS } from '../../theme/prodayEliteTheme';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { PressableSpring } from '../motion';
import type { User } from '../../models/User';
import type { Club } from '../../models/Club';

interface GlobalSearchModalProps {
  visible: boolean;
  onClose: () => void;
  accent?: string;
  initialQuery?: string;
}

const { width: WINDOW_WIDTH } = Dimensions.get('window');

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  visible,
  onClose,
  accent = ELITE_COLORS.pitchGreen,
  initialQuery = '',
}) => {
  const insets = useSafeAreaInsets();
  const nav = useTabNavigationActions();

  const [query, setQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<SearchResultCategory>('all');
  const [loading, setLoading] = useState(false);

  const [pagesResults, setPagesResults] = useState<GlobalSearchPageTarget[]>([]);
  const [playersResults, setPlayersResults] = useState<GlobalSearchPlayerItem[]>([]);
  const [clubsResults, setClubsResults] = useState<GlobalSearchClubItem[]>([]);

  // Aperçu fiche joueur
  const [selectedPlayer, setSelectedPlayer] = useState<User | null>(null);
  // Aperçu fiche club
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  // Exécution de la recherche
  useEffect(() => {
    if (!visible) return;

    let isMounted = true;
    setLoading(true);

    const runSearch = async () => {
      try {
        const res = await globalSearchService.searchAll({
          query,
          category: activeCategory,
          limit: 20,
        });

        if (isMounted) {
          setPagesResults(res.pages);
          setPlayersResults(res.players);
          setClubsResults(res.clubs);
        }
      } catch (err) {
        console.warn('[GlobalSearchModal] Erreur de recherche:', err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    const timer = setTimeout(runSearch, query ? 180 : 0);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [visible, query, activeCategory]);

  // Réinitialisation à la fermeture
  const handleClose = useCallback(() => {
    prodayHaptics.press();
    setSelectedPlayer(null);
    setSelectedClub(null);
    onClose();
  }, [onClose]);

  // Navigation vers une page
  const handleSelectPage = useCallback(
    (page: GlobalSearchPageTarget) => {
      prodayHaptics.confirm();
      handleClose();

      if (page.tab) {
        nav.setActiveTab(page.tab);
      }
      if (page.matchsLink) {
        nav.openMatchs(page.matchsLink);
      }
      if (page.profileLink) {
        nav.openProfile(page.profileLink);
      }
      if (page.dashboardView) {
        nav.openDashboard(page.dashboardView);
      }
      if (page.shop) {
        nav.openShop();
      }
    },
    [handleClose, nav],
  );

  // Sélection d'un joueur
  const handleSelectPlayer = useCallback((item: GlobalSearchPlayerItem) => {
    prodayHaptics.press();
    setSelectedPlayer(item.user);
  }, []);

  // Sélection d'un club
  const handleSelectClub = useCallback((item: GlobalSearchClubItem) => {
    prodayHaptics.press();
    setSelectedClub(item.club);
  }, []);

  // Total de résultats
  const totalCount = pagesResults.length + playersResults.length + clubsResults.length;

  const popularShortcuts = useMemo(
    () => [
      { label: 'Matchs', query: 'matchs', icon: 'trophy' },
      { label: 'Conseiller IA', query: 'ia', icon: 'sparkles' },
      { label: 'Vitrine CV', query: 'vitrine', icon: 'id-card' },
      { label: 'Convocations', query: 'convocations', icon: 'checkbox' },
      { label: 'Équipe', query: 'equipe', icon: 'people' },
      { label: 'Entraînement', query: 'train', icon: 'football' },
    ],
    [],
  );

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <View style={styles.modalOverlay}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.keyboardWrap}
        >
          <View
            style={[
              styles.modalContainer,
              { paddingTop: Math.max(insets.top, 16), paddingBottom: insets.bottom + 12 },
            ]}
          >
            {/* 1. BARRE DE SAISIE PRINCIPALE */}
            <View style={styles.searchHeader}>
              <View style={styles.inputContainer}>
                <Ionicons name="search" size={18} color={accent} style={styles.searchLeadingIcon} />
                <TextInput
                  style={styles.searchInput}
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Rechercher un joueur, une page, un club..."
                  placeholderTextColor="#64748B"
                  autoFocus
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setQuery('')}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    style={styles.clearBtn}
                  >
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                )}
              </View>

              <TouchableOpacity
                onPress={handleClose}
                style={styles.cancelButton}
                hitSlop={{ top: 12, bottom: 12, left: 10, right: 10 }}
              >
                <Text style={styles.cancelText}>Fermer</Text>
              </TouchableOpacity>
            </View>

            {/* 2. ONGLETS DE FILTRE CATÉGORIES */}
            <View style={styles.categoriesRow}>
              {(
                [
                  { key: 'all', label: 'Tout' },
                  { key: 'pages', label: 'Pages' },
                  { key: 'players', label: 'Joueurs' },
                  { key: 'clubs', label: 'Clubs' },
                ] as const
              ).map((cat) => {
                const isSelected = activeCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => {
                      prodayHaptics.press();
                      setActiveCategory(cat.key);
                    }}
                    style={[
                      styles.categoryChip,
                      isSelected && [styles.categoryChipActive, { backgroundColor: `${accent}20`, borderColor: accent }],
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && [styles.categoryChipTextActive, { color: accent }],
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}

              {loading && <ActivityIndicator size="small" color={accent} style={styles.loader} />}
            </View>

            {/* 3. CONTENU : RÉSULTATS OU SUGGESTIONS */}
            <ScrollView
              style={styles.resultsScroll}
              contentContainerStyle={styles.resultsContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* QUAND LA RECHERCHE EST VIDE : RACCOURCIS RAPIDES */}
              {!query.trim() && (
                <View style={styles.suggestionsContainer}>
                  <Text style={styles.sectionHeading}>ACCÈS RAPIDE</Text>
                  <View style={styles.quickShortcutsGrid}>
                    {popularShortcuts.map((sc) => (
                      <TouchableOpacity
                        key={sc.query}
                        onPress={() => {
                          prodayHaptics.press();
                          setQuery(sc.query);
                        }}
                        style={styles.shortcutTile}
                      >
                        <View style={[styles.shortcutIconWrap, { backgroundColor: `${accent}14` }]}>
                          <Ionicons name={sc.icon as any} size={16} color={accent} />
                        </View>
                        <Text style={styles.shortcutTileText}>{sc.label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={[styles.sectionHeading, { marginTop: 22 }]}>SUGGESTIONS</Text>
                  <View style={styles.tagChipsWrap}>
                    {['Attaquant', 'Convocations', 'Carte ProDay', 'Conseiller IA', 'PSG Academy', 'Red Star'].map(
                      (tag) => (
                        <TouchableOpacity
                          key={tag}
                          onPress={() => {
                            prodayHaptics.press();
                            setQuery(tag);
                          }}
                          style={styles.tagChip}
                        >
                          <Ionicons name="search-outline" size={12} color="#94A3B8" />
                          <Text style={styles.tagChipText}>{tag}</Text>
                        </TouchableOpacity>
                      ),
                    )}
                  </View>
                </View>
              )}

              {/* RÉSULTATS PAGES */}
              {pagesResults.length > 0 && (
                <View style={styles.resultGroup}>
                  <View style={styles.groupHeaderRow}>
                    <Ionicons name="apps-outline" size={14} color="#38BDF8" />
                    <Text style={styles.groupHeaderText}>
                      PAGES & SECTIONS ({pagesResults.length})
                    </Text>
                  </View>

                  {pagesResults.map((page) => (
                    <PressableSpring
                      key={page.id}
                      onPress={() => handleSelectPage(page)}
                      style={styles.resultItem}
                      scaleTo={0.98}
                    >
                      <View style={[styles.itemIconWrap, { backgroundColor: '#0284C720' }]}>
                        <Ionicons name={page.iconName as any} size={18} color="#38BDF8" />
                      </View>

                      <View style={styles.itemDetails}>
                        <Text style={styles.itemTitle}>{page.title}</Text>
                        <Text style={styles.itemSubtitle} numberOfLines={1}>
                          {page.subtitle}
                        </Text>
                      </View>

                      <View style={[styles.badgePill, { backgroundColor: '#0284C725' }]}>
                        <Text style={[styles.badgePillText, { color: '#38BDF8' }]}>{page.badge}</Text>
                      </View>

                      <Ionicons name="chevron-forward" size={16} color="#475569" />
                    </PressableSpring>
                  ))}
                </View>
              )}

              {/* RÉSULTATS JOUEURS */}
              {playersResults.length > 0 && (
                <View style={styles.resultGroup}>
                  <View style={styles.groupHeaderRow}>
                    <Ionicons name="people-outline" size={14} color={ELITE_COLORS.pitchGreen} />
                    <Text style={styles.groupHeaderText}>
                      JOUEURS ({playersResults.length})
                    </Text>
                  </View>

                  {playersResults.map((playerItem) => (
                    <PressableSpring
                      key={playerItem.id}
                      onPress={() => handleSelectPlayer(playerItem)}
                      style={styles.resultItem}
                      scaleTo={0.98}
                    >
                      <View style={[styles.itemIconWrap, { backgroundColor: `${ELITE_COLORS.pitchGreen}20` }]}>
                        <Ionicons name="person" size={16} color={ELITE_COLORS.pitchGreen} />
                      </View>

                      <View style={styles.itemDetails}>
                        <Text style={styles.itemTitle}>{playerItem.title}</Text>
                        <Text style={styles.itemSubtitle} numberOfLines={1}>
                          {playerItem.subtitle}
                        </Text>
                      </View>

                      {playerItem.user.profile?.rating ? (
                        <View style={[styles.ovrBadge, { backgroundColor: 'rgba(255, 255, 255, 0.12)' }]}>
                          <Text style={styles.ovrBadgeText}>{playerItem.user.profile.rating}</Text>
                        </View>
                      ) : null}

                      <View style={[styles.badgePill, { backgroundColor: `${ELITE_COLORS.pitchGreen}20` }]}>
                        <Text style={[styles.badgePillText, { color: ELITE_COLORS.pitchGreen }]}>
                          {playerItem.badge}
                        </Text>
                      </View>

                      <Ionicons name="chevron-forward" size={16} color="#475569" />
                    </PressableSpring>
                  ))}
                </View>
              )}

              {/* RÉSULTATS CLUBS */}
              {clubsResults.length > 0 && (
                <View style={styles.resultGroup}>
                  <View style={styles.groupHeaderRow}>
                    <Ionicons name="shield-checkmark-outline" size={14} color={accent} />
                    <Text style={styles.groupHeaderText}>
                      CLUBS ({clubsResults.length})
                    </Text>
                  </View>

                  {clubsResults.map((clubItem) => (
                    <PressableSpring
                      key={clubItem.id}
                      onPress={() => handleSelectClub(clubItem)}
                      style={styles.resultItem}
                      scaleTo={0.98}
                    >
                      <View style={[styles.itemIconWrap, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                        <Ionicons name="shield-checkmark" size={16} color={accent} />
                      </View>

                      <View style={styles.itemDetails}>
                        <Text style={styles.itemTitle}>{clubItem.title}</Text>
                        <Text style={styles.itemSubtitle} numberOfLines={1}>
                          {clubItem.subtitle}
                        </Text>
                      </View>

                      <View style={[styles.badgePill, { backgroundColor: 'rgba(255, 255, 255, 0.08)' }]}>
                        <Text style={[styles.badgePillText, { color: ELITE_COLORS.textPrimary }]}>
                          {clubItem.badge}
                        </Text>
                      </View>

                      <Ionicons name="chevron-forward" size={16} color="#475569" />
                    </PressableSpring>
                  ))}
                </View>
              )}

              {/* ÉTAT VIDE LORSQU'AUCUN RÉSULTAT */}
              {query.trim().length > 0 && totalCount === 0 && !loading && (
                <View style={styles.emptyState}>
                  <View style={styles.emptyIconCircle}>
                    <Ionicons name="search" size={32} color="#64748B" />
                  </View>
                  <Text style={styles.emptyTitle}>Aucun résultat trouvé</Text>
                  <Text style={styles.emptySubtitle}>
                    Aucune page, joueur ou club ne correspond à « {query} ».
                  </Text>
                  <TouchableOpacity
                    onPress={() => setQuery('')}
                    style={[styles.resetSearchBtn, { borderColor: accent }]}
                  >
                    <Text style={[styles.resetSearchText, { color: accent }]}>Effacer la recherche</Text>
                  </TouchableOpacity>
                </View>
              )}
            </ScrollView>

            {/* 4. MODAL DÉTAILS JOUEUR */}
            {selectedPlayer && (
              <View style={styles.detailOverlay}>
                <View style={styles.detailCard}>
                  <View style={styles.detailHeader}>
                    <View style={[styles.detailAvatarHolder, { borderColor: accent }]}>
                      <Ionicons name="person" size={28} color={accent} />
                    </View>
                    <View style={styles.detailHeaderTextWrap}>
                      <Text style={styles.detailPlayerName}>{selectedPlayer.display_name}</Text>
                      <Text style={styles.detailPlayerMeta}>
                        {selectedPlayer.profile?.position || 'Joueur'} · {selectedPlayer.profile?.club_id || 'Club'}
                      </Text>
                      {selectedPlayer.city ? (
                        <Text style={styles.detailPlayerCity}>📍 {selectedPlayer.city}</Text>
                      ) : null}
                    </View>
                  </View>

                  <View style={styles.detailStatsRow}>
                    <View style={styles.detailStatBox}>
                      <Text style={styles.detailStatVal}>{selectedPlayer.profile?.rating ?? 85}</Text>
                      <Text style={styles.detailStatLbl}>NOTE OVR</Text>
                    </View>
                    <View style={styles.detailStatBox}>
                      <Text style={styles.detailStatVal}>{selectedPlayer.profile?.age ? `${selectedPlayer.profile.age} ans` : 'N/A'}</Text>
                      <Text style={styles.detailStatLbl}>ÂGE</Text>
                    </View>
                    <View style={styles.detailStatBox}>
                      <Text style={styles.detailStatVal}>{selectedPlayer.profile?.level || 'Élite'}</Text>
                      <Text style={styles.detailStatLbl}>NIVEAU</Text>
                    </View>
                  </View>

                  <View style={styles.detailActionsRow}>
                    <TouchableOpacity
                      onPress={() => {
                        prodayHaptics.confirm();
                        setSelectedPlayer(null);
                        handleClose();
                        nav.setActiveTab('messages');
                      }}
                      style={[styles.detailPrimaryBtn, { backgroundColor: accent }]}
                    >
                      <Ionicons name="chatbubble-ellipses" size={16} color="#07090E" />
                      <Text style={styles.detailPrimaryBtnText}>Envoyer un message</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedPlayer(null)}
                      style={styles.detailSecondaryBtn}
                    >
                      <Text style={styles.detailSecondaryBtnText}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}

            {/* 5. MODAL DÉTAILS CLUB */}
            {selectedClub && (
              <View style={styles.detailOverlay}>
                <View style={styles.detailCard}>
                  <View style={styles.detailHeader}>
                    <View style={[styles.detailAvatarHolder, { borderColor: accent }]}>
                      <Ionicons name="shield-checkmark" size={28} color={accent} />
                    </View>
                    <View style={styles.detailHeaderTextWrap}>
                      <Text style={styles.detailPlayerName}>{selectedClub.name}</Text>
                      <Text style={styles.detailPlayerMeta}>
                        {selectedClub.city} {selectedClub.department ? `(${selectedClub.department})` : ''}
                      </Text>
                      <Text style={styles.detailPlayerCity}>
                        {selectedClub.categories?.join(' · ') || 'Club officiel'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.detailActionsRow}>
                    <TouchableOpacity
                      onPress={() => {
                        prodayHaptics.confirm();
                        setSelectedClub(null);
                        handleClose();
                        nav.setActiveTab('recrutement');
                      }}
                      style={[styles.detailPrimaryBtn, { backgroundColor: accent }]}
                    >
                      <Ionicons name="people" size={16} color="#07090E" />
                      <Text style={styles.detailPrimaryBtnText}>Voir l’équipe & Mercato</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedClub(null)}
                      style={styles.detailSecondaryBtn}
                    >
                      <Text style={styles.detailSecondaryBtnText}>Fermer</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(7, 9, 14, 0.96)',
  },
  keyboardWrap: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F131C',
    borderRadius: ELITE_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    height: 48,
  },
  searchLeadingIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '500',
    paddingVertical: 0,
  },
  clearBtn: {
    padding: 4,
  },
  cancelButton: {
    paddingHorizontal: 6,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 14,
    color: '#94A3B8',
    fontWeight: '600',
  },
  categoriesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: ELITE_RADIUS.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  categoryChipActive: {
    borderWidth: 1,
  },
  categoryChipText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  categoryChipTextActive: {
    fontWeight: '700',
  },
  loader: {
    marginLeft: 8,
  },
  resultsScroll: {
    flex: 1,
  },
  resultsContent: {
    paddingVertical: 14,
    paddingBottom: 40,
    gap: 16,
  },
  suggestionsContainer: {
    paddingTop: 8,
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    color: '#64748B',
    marginBottom: 12,
  },
  quickShortcutsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  shortcutTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0F131C',
    borderRadius: ELITE_RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    paddingHorizontal: 12,
    paddingVertical: 10,
    width: (WINDOW_WIDTH - 42) / 2,
  },
  shortcutIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  shortcutTileText: {
    fontSize: 13,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  tagChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ELITE_RADIUS.pill,
    backgroundColor: '#0F131C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
  },
  tagChipText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  resultGroup: {
    backgroundColor: '#0F131C',
    borderRadius: ELITE_RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
    padding: 12,
    gap: 10,
  },
  groupHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  groupHeaderText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    color: '#94A3B8',
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  itemIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemDetails: {
    flex: 1,
    gap: 2,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.2,
  },
  itemSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
  },
  badgePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ELITE_RADIUS.pill,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '700',
  },
  ovrBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ovrBadgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    paddingHorizontal: 20,
    gap: 10,
  },
  emptyIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#0F131C',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 18,
  },
  resetSearchBtn: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ELITE_RADIUS.pill,
    borderWidth: 1,
  },
  resetSearchText: {
    fontSize: 12,
    fontWeight: '600',
  },
  detailOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
    zIndex: 99,
  },
  detailCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#0F131C',
    borderRadius: ELITE_RADIUS.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    padding: 20,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 10,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  detailAvatarHolder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailHeaderTextWrap: {
    flex: 1,
    gap: 2,
  },
  detailPlayerName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailPlayerMeta: {
    fontSize: 13,
    color: '#CBD5E1',
    fontWeight: '500',
  },
  detailPlayerCity: {
    fontSize: 12,
    color: '#94A3B8',
  },
  detailStatsRow: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#161B26',
    borderRadius: ELITE_RADIUS.md,
    padding: 12,
  },
  detailStatBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  detailStatVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  detailStatLbl: {
    fontSize: 9,
    fontWeight: '700',
    color: '#64748B',
    letterSpacing: 0.8,
  },
  detailActionsRow: {
    gap: 8,
  },
  detailPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderRadius: ELITE_RADIUS.md,
  },
  detailPrimaryBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#07090E',
  },
  detailSecondaryBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  detailSecondaryBtnText: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
  },
});
