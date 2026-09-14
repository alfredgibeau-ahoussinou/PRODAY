import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  globalSearchService,
  type GlobalSearchResultItem,
  type GlobalSearchPlayerItem,
  type GlobalSearchClubItem,
  type GlobalSearchPageTarget,
} from '../../services/globalSearch.service';
import { PublicProfileModal } from '../profile/PublicProfileModal';
import { useTabNavigation } from '../../context/TabNavigationContext';

export interface GlobalSearchBarProps {
  onPress?: () => void;
  placeholder?: string;
  onSelectPage?: (target: GlobalSearchPageTarget) => void;
  accent?: string;
  style?: any;
  testID?: string;
}

export const GlobalSearchBar: React.FC<GlobalSearchBarProps> = ({
  onPress,
  placeholder = 'Rechercher une personne, une équipe, un événement…',
  onSelectPage,
  accent = '#0F172A',
  style,
  testID,
}) => {
  const tabNav = useTabNavigation();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GlobalSearchResultItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<
    'all' | 'player' | 'club' | 'page'
  >('all');
  const [profileUser, setProfileUser] = useState<any>(null);

  const handleTriggerPress = () => {
    if (onPress) {
      onPress();
      return;
    }
    setIsOpen(true);
  };

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const payload = await globalSearchService.searchAll({
          query: query.trim(),
          category: 'all',
          limit: 20,
        });
        const combined: GlobalSearchResultItem[] = [
          ...payload.players,
          ...payload.clubs,
          ...payload.pages,
        ];
        setResults(combined);
      } catch (err) {
        console.warn('[GlobalSearch] Erreur recherche:', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const filteredResults = results.filter((r) => {
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'player') return r.category === 'player';
    if (selectedCategory === 'club') return r.category === 'club';
    if (selectedCategory === 'page') return r.category === 'page';
    return true;
  });

  const handleSelectItem = (item: GlobalSearchResultItem) => {
    if (item.category === 'player') {
      setProfileUser((item as GlobalSearchPlayerItem).user);
    } else if (item.category === 'page') {
      setIsOpen(false);
      setQuery('');
      const pageTarget = item as GlobalSearchPageTarget;
      if (onSelectPage) {
        onSelectPage(pageTarget);
      } else if (pageTarget.tab) {
        tabNav?.setActiveTab(pageTarget.tab);
      }
    } else if (item.category === 'club') {
      setIsOpen(false);
      setQuery('');
      tabNav?.setActiveTab('matchs');
    }
  };

  const renderSearchResult = ({ item }: { item: GlobalSearchResultItem }) => {
    const isPlayer = item.category === 'player';
    const isClub = item.category === 'club';
    const isPage = item.category === 'page';

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleSelectItem(item)}
        activeOpacity={0.75}
      >
        <View
          style={[
            styles.avatarBox,
            isPlayer && { backgroundColor: '#EEF2FF' },
            isClub && { backgroundColor: '#FEF3C7' },
            isPage && { backgroundColor: '#F0FDF4' },
          ]}
        >
          <Ionicons
            name={
              isPlayer
                ? 'person'
                : isClub
                  ? 'shield'
                  : 'sparkles'
            }
            size={18}
            color={
              isPlayer
                ? '#4F46E5'
                : isClub
                  ? '#D97706'
                  : '#15803D'
            }
          />
        </View>

        <View style={styles.resultDetails}>
          <View style={styles.titleRow}>
            <Text style={styles.resultTitle} numberOfLines={1}>
              {item.title}
            </Text>
            <View
              style={[
                styles.badgePill,
                isPlayer && { backgroundColor: '#EEF2FF' },
                isClub && { backgroundColor: '#FEF3C7' },
              ]}
            >
              <Text
                style={[
                  styles.badgeText,
                  isPlayer && { color: '#4F46E5' },
                  isClub && { color: '#D97706' },
                ]}
              >
                {item.badge}
              </Text>
            </View>
          </View>
          <Text style={styles.resultSubtitle} numberOfLines={1}>
            {item.subtitle}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#CBD5E1" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, style]} testID={testID}>
      <TouchableOpacity
        style={styles.searchBarTrigger}
        onPress={handleTriggerPress}
        activeOpacity={0.85}
      >
        <Ionicons name="search" size={16} color="#64748B" />
        <Text style={styles.triggerText} numberOfLines={1}>
          {placeholder}
        </Text>
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.searchSheet}>
            <View style={styles.searchHeader}>
              <View style={styles.inputContainer}>
                <Ionicons name="search" size={18} color="#0F172A" />
                <TextInput
                  style={styles.textInput}
                  placeholder={placeholder}
                  placeholderTextColor="#94A3B8"
                  value={query}
                  onChangeText={setQuery}
                  autoFocus
                  returnKeyType="search"
                />
                {query.length > 0 ? (
                  <TouchableOpacity onPress={() => setQuery('')}>
                    <Ionicons name="close-circle" size={18} color="#94A3B8" />
                  </TouchableOpacity>
                ) : null}
              </View>
              <TouchableOpacity
                onPress={() => {
                  setIsOpen(false);
                  setQuery('');
                }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelBtnText}>Annuler</Text>
              </TouchableOpacity>
            </View>

            {/* Filtres de catégorie */}
            <View style={styles.categoriesRow}>
              {[
                { id: 'all', label: 'Tout' },
                { id: 'player', label: 'Personnes' },
                { id: 'club', label: 'Équipes / Clubs' },
                { id: 'page', label: 'Modules' },
              ].map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  onPress={() => setSelectedCategory(cat.id as any)}
                  style={[
                    styles.catChip,
                    selectedCategory === cat.id && styles.catChipActive,
                  ]}
                >
                  <Text
                    style={[
                      styles.catChipText,
                      selectedCategory === cat.id && styles.catChipTextActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Résultats de recherche */}
            {loading ? (
              <View style={styles.loaderWrap}>
                <ActivityIndicator size="small" color="#0F172A" />
                <Text style={styles.loaderText}>Recherche en cours…</Text>
              </View>
            ) : query.trim().length > 0 && filteredResults.length === 0 ? (
              <View style={styles.emptyWrap}>
                <Ionicons name="search-outline" size={32} color="#94A3B8" />
                <Text style={styles.emptyTitle}>Aucun résultat trouvé</Text>
                <Text style={styles.emptySubtitle}>
                  Vérifiez l’orthographe ou essayez un nom différent.
                </Text>
              </View>
            ) : (
              <FlatList
                data={filteredResults}
                keyExtractor={(item) => item.id}
                renderItem={renderSearchResult}
                contentContainerStyle={styles.listContent}
                keyboardShouldPersistTaps="handled"
              />
            )}
          </View>
        </View>
      </Modal>

      {/* Profil consultable d'une personne avec bouton direct Message */}
      {profileUser ? (
        <PublicProfileModal
          user={profileUser}
          onClose={() => setProfileUser(null)}
          onOpenMessage={(targetUser) => {
            setProfileUser(null);
            setIsOpen(false);
            tabNav?.openChat?.(targetUser.uid);
          }}
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  searchBarTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  triggerText: {
    fontSize: 13,
    color: '#64748B',
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-start',
  },
  searchSheet: {
    backgroundColor: '#FFFFFF',
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 15,
    elevation: 8,
  },
  searchHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 10,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    gap: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: '#0F172A',
    height: '100%',
  },
  cancelBtn: {
    paddingVertical: 8,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoriesRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  catChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 12,
  },
  avatarBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultDetails: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  resultTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
    flex: 1,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#F1F5F9',
    marginLeft: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
  },
  resultSubtitle: {
    fontSize: 12,
    color: '#64748B',
  },
  loaderWrap: {
    padding: 30,
    alignItems: 'center',
    gap: 8,
  },
  loaderText: {
    fontSize: 13,
    color: '#64748B',
  },
  emptyWrap: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 8,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 240,
  },
});
