import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
} from 'react-native';
import {
  type OfficialFffClub,
  FffOfficialRegistryError,
} from '../../services/fffOfficialRegistry.service';
import { publicClubDirectoryService } from '../../services/publicClubDirectory.service';
import {
  overseasClubsService,
  OVERSEAS_TERRITORIES,
} from '../../services/overseasClubs.service';
import { PressableSpring } from '../motion';
import { Icon } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import type { PublicClubClaimStatus } from '../../models/PublicClubDirectory';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import { ClubCrestThumb } from './ClubCrestThumb';

type Props = {
  selectedClub: OfficialFffClub | null;
  onSelectClub: (club: OfficialFffClub | null) => void;
  /** Accent pôle (coach / club / joueur) */
  accent?: string;
  placeholder?: string;
  error?: string;
  /** Affiche le badge claim si connu dans l’annuaire */
  showClaimBadge?: boolean;
};

const CLAIM_LABEL: Record<PublicClubClaimStatus, string> = {
  unclaimed: 'À revendiquer',
  claimed_pending: 'En vérification',
  verified: 'Vérifié',
  activated: 'Actif',
};

/**
 * Autocomplete clubs français — annuaire public ProDay + DOFA live.
 * Données association uniquement (pas de licenciés / PII).
 */
export const PublicClubAutocomplete: React.FC<Props> = ({
  selectedClub,
  onSelectClub,
  accent: accentProp,
  placeholder = 'Club, ville, CP ou n° affiliation FFF',
  error,
  showClaimBadge = true,
}) => {
  const { visual } = useSignupFlowTheme();
  const accent = accentProp ?? visual.accent;
  const styles = useMemo(() => createStyles(accent), [accent]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTerritory, setSelectedTerritory] = useState<string | null>(null);
  const [customModalVisible, setCustomModalVisible] = useState(false);
  const [customName, setCustomName] = useState('');
  const [customCity, setCustomCity] = useState('');
  const [customPostal, setCustomPostal] = useState('');
  const [customTerritory, setCustomTerritory] = useState('971');
  const [customDivision, setCustomDivision] = useState('Régionale 1');

  const [results, setResults] = useState<OfficialFffClub[]>([]);
  const [claimByFff, setClaimByFff] = useState<Record<string, PublicClubClaimStatus>>({});
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const handleSelectTerritory = (code: string | null) => {
    setSelectedTerritory(code);
    if (code) {
      const omClubs = overseasClubsService.searchOverseasClubs(searchQuery, code);
      setResults(omClubs);
      setSearchError(omClubs.length === 0 ? `Aucun club trouvé pour ce territoire.` : null);
    } else if (searchQuery.trim().length >= 2) {
      void executeSearch(searchQuery.trim());
    } else {
      setResults([]);
      setSearchError(null);
    }
  };

  const executeSearch = async (q: string) => {
    setIsSearching(true);
    setSearchError(null);
    try {
      let clubs: OfficialFffClub[] = [];
      if (selectedTerritory) {
        clubs = overseasClubsService.searchOverseasClubs(q, selectedTerritory);
      } else {
        clubs = await publicClubDirectoryService.searchClubs(q);
      }
      setResults(clubs.slice(0, 25));
      if (clubs.length === 0) {
        setSearchError(
          'Aucun club trouvé. Vérifiez le nom, la ville, le code postal ou utilisez « Mon club n’apparaît pas » ci-dessous.',
        );
      }
      // Badges claim
      if (!selectedTerritory) {
        const statuses: Record<string, PublicClubClaimStatus> = {};
        const logos: Record<string, string> = {};
        await Promise.all(
          clubs.slice(0, 16).map(async (c) => {
            if (!c.fffNumber) return;
            const entry = await publicClubDirectoryService.getByAffiliation(c.fffNumber);
            if (!entry) return;
            if (showClaimBadge) statuses[c.fffNumber] = entry.claim_status;
            if (entry.logo_url?.trim()) logos[c.fffNumber] = entry.logo_url.trim();
          }),
        );
        if (showClaimBadge) setClaimByFff((prev) => ({ ...prev, ...statuses }));
        if (Object.keys(logos).length > 0) {
          setResults((prev) =>
            prev.map((c) =>
              c.fffNumber && logos[c.fffNumber] && !c.logoUrl
                ? { ...c, logoUrl: logos[c.fffNumber] }
                : c,
            ),
          );
        }
      }
    } catch (err) {
      setResults([]);
      setSearchError(
        err instanceof FffOfficialRegistryError
          ? err.message
          : 'Erreur de recherche club. Réessayez.',
      );
    } finally {
      setIsSearching(false);
    }
  };

  const handleCreateCustomClub = () => {
    if (!customName.trim() || !customCity.trim()) {
      Alert.alert('Champs obligatoires', 'Veuillez renseigner le nom du club et la ville.');
      return;
    }
    const unlisted = overseasClubsService.createUnlistedClub({
      name: customName,
      city: customCity,
      postalCode: customPostal,
      territoryCodeOrDepartment: customTerritory,
      estimatedDivision: customDivision,
    });
    onSelectClub(unlisted);
    setCustomModalVisible(false);
    setCustomName('');
    setCustomCity('');
    setCustomPostal('');
  };

  useEffect(() => {
    let active = true;
    if (selectedClub) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }
    const q = searchQuery.trim();
    if (q.length < 2 && !selectedTerritory) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }
    const timer = setTimeout(() => {
      if (active) void executeSearch(q);
    }, 280);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedClub, selectedTerritory]);


  if (selectedClub) {
    const status = selectedClub.fffNumber
      ? claimByFff[selectedClub.fffNumber]
      : undefined;
    return (
      <View style={styles.selectedCard}>
        <View style={[styles.selectedAccent, { backgroundColor: accent }]} />
        <ClubCrestThumb
          name={selectedClub.name}
          logoUrl={selectedClub.logoUrl}
          size={48}
          accent={accent}
        />
        <View style={styles.selectedBody}>
          <ProDayText variant="section" style={styles.selectedName}>
            {selectedClub.name}
          </ProDayText>
          <ProDayText variant="caption" style={styles.selectedMeta}>
            {[selectedClub.city, selectedClub.postalCode, selectedClub.department]
              .filter(Boolean)
              .join(' · ')}
          </ProDayText>
          {selectedClub.fffNumber ? (
            <ProDayText variant="caption" style={styles.selectedFff}>
              N° FFF {selectedClub.fffNumber}
            </ProDayText>
          ) : null}
          {status && showClaimBadge ? (
            <View style={styles.badge}>
              <ProDayText variant="caption" style={[styles.badgeText, { color: accent }]}>
                {CLAIM_LABEL[status]}
              </ProDayText>
            </View>
          ) : null}
        </View>
        <PressableSpring
          onPress={() => {
            onSelectClub(null);
            setSearchQuery('');
          }}
          scaleTo={0.94}
          haptic
          style={styles.clearBtn}
          accessibilityLabel="Changer de club"
        >
          <Icon name="close" size={16} color="#FFFFFF" />
        </PressableSpring>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Sélecteur rapide Outre-Mer / Territoire (Section 24) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.territoryScroll}
      >
        <TouchableOpacity
          style={[
            styles.territoryPill,
            !selectedTerritory && { backgroundColor: accent, borderColor: accent },
          ]}
          onPress={() => handleSelectTerritory(null)}
        >
          <ProDayText
            variant="caption"
            style={[
              styles.territoryPillText,
              !selectedTerritory && styles.territoryPillTextActive,
            ]}
          >
            Tous / Métropole
          </ProDayText>
        </TouchableOpacity>

        {OVERSEAS_TERRITORIES.map((t) => {
          const isSelected = selectedTerritory === t.code;
          return (
            <TouchableOpacity
              key={t.code}
              style={[
                styles.territoryPill,
                isSelected && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => handleSelectTerritory(isSelected ? null : t.code)}
            >
              <ProDayText
                variant="caption"
                style={[
                  styles.territoryPillText,
                  isSelected && styles.territoryPillTextActive,
                ]}
              >
                {t.shortName} ({t.code})
              </ProDayText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.inputWrap}>
        <Icon name="search" size={18} color="rgba(255,255,255,0.45)" />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={
            selectedTerritory
              ? `Rechercher en ${OVERSEAS_TERRITORIES.find((t) => t.code === selectedTerritory)?.shortName || 'Outre-Mer'}...`
              : placeholder
          }
          placeholderTextColor="rgba(255,255,255,0.35)"
          style={styles.input}
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {isSearching ? <ActivityIndicator size="small" color={accent} /> : null}
      </View>

      {error ? (
        <ProDayText variant="caption" style={styles.error}>
          {error}
        </ProDayText>
      ) : null}
      {searchError ? (
        <ProDayText variant="caption" style={styles.hint}>
          {searchError}
        </ProDayText>
      ) : null}

      {results.length > 0 ? (
        <ScrollView
          style={styles.dropdown}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
        >
          {results.map((club) => {
            const status = club.fffNumber ? claimByFff[club.fffNumber] : undefined;
            return (
              <PressableSpring
                key={`${club.id}-${club.fffNumber}`}
                onPress={() => {
                  onSelectClub(club);
                  if (club.fffNumber && !club.logoUrl) {
                    void publicClubDirectoryService
                      .getByAffiliation(club.fffNumber)
                      .then((entry) => {
                        const url = entry?.logo_url?.trim();
                        if (url) onSelectClub({ ...club, logoUrl: url });
                      })
                      .catch(() => undefined);
                  }
                }}
                scaleTo={0.98}
                haptic
                style={styles.row}
                accessibilityRole="button"
                accessibilityLabel={club.name}
              >
                <ClubCrestThumb
                  name={club.name}
                  logoUrl={club.logoUrl}
                  size={40}
                  accent={accent}
                />
                <View style={styles.rowCopy}>
                  <ProDayText variant="section" style={styles.rowTitle} numberOfLines={1}>
                    {club.name}
                  </ProDayText>
                  <ProDayText variant="caption" style={styles.rowSub} numberOfLines={1}>
                    {[club.city, club.postalCode, club.department ? `Dept ${club.department}` : '']
                      .filter(Boolean)
                      .join(' · ')}
                  </ProDayText>
                </View>
                {status && status !== 'unclaimed' ? (
                  <ProDayText variant="caption" style={[styles.rowBadge, { color: accent }]}>
                    {CLAIM_LABEL[status]}
                  </ProDayText>
                ) : (
                  <Icon name="chevron-forward" size={16} color="rgba(255,255,255,0.3)" />
                )}
              </PressableSpring>
            );
          })}
        </ScrollView>
      ) : null}

      {/* Action Mon club n'apparaît pas (Section 24) */}
      <TouchableOpacity
        style={styles.unlistedClubBtn}
        onPress={() => setCustomModalVisible(true)}
      >
        <Icon name="add" size={16} color={accent} />
        <ProDayText variant="caption" style={[styles.unlistedClubText, { color: accent }]}>
          Mon club n'apparaît pas (Métropole & Outre-Mer)
        </ProDayText>
      </TouchableOpacity>

      {/* Modal Ajout Club Inconnu */}
      <Modal
        visible={customModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setCustomModalVisible(false)}
      >
        <View style={styles.customModalOverlay}>
          <View style={styles.customModalCard}>
            <View style={styles.customModalHeader}>
              <ProDayText variant="section" style={styles.customModalTitle}>
                Ajouter un club non répertorié
              </ProDayText>
              <TouchableOpacity onPress={() => setCustomModalVisible(false)}>
                <Icon name="close" size={20} color="rgba(255,255,255,0.6)" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ maxHeight: 380 }} contentContainerStyle={{ gap: 12, paddingVertical: 8 }}>
              <View>
                <ProDayText variant="caption" style={styles.fieldLabel}>
                  Nom officiel du club *
                </ProDayText>
                <TextInput
                  style={styles.customInput}
                  placeholder="Ex : FC Rivière des Roches"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={customName}
                  onChangeText={setCustomName}
                />
              </View>

              <View>
                <ProDayText variant="caption" style={styles.fieldLabel}>
                  Territoire / Département *
                </ProDayText>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                  {OVERSEAS_TERRITORIES.map((t) => (
                    <TouchableOpacity
                      key={t.code}
                      style={[
                        styles.territoryChipSmall,
                        customTerritory === t.code && { backgroundColor: accent, borderColor: accent },
                      ]}
                      onPress={() => setCustomTerritory(t.code)}
                    >
                      <ProDayText variant="caption" style={{ color: '#FFFFFF', fontSize: 11 }}>
                        {t.shortName} ({t.code})
                      </ProDayText>
                    </TouchableOpacity>
                  ))}
                  <TouchableOpacity
                    style={[
                      styles.territoryChipSmall,
                      customTerritory === 'METRO' && { backgroundColor: accent, borderColor: accent },
                    ]}
                    onPress={() => setCustomTerritory('METRO')}
                  >
                    <ProDayText variant="caption" style={{ color: '#FFFFFF', fontSize: 11 }}>
                      Métropole
                    </ProDayText>
                  </TouchableOpacity>
                </ScrollView>
              </View>

              <View style={{ flexDirection: 'row', gap: 10 }}>
                <View style={{ flex: 1 }}>
                  <ProDayText variant="caption" style={styles.fieldLabel}>
                    Ville *
                  </ProDayText>
                  <TextInput
                    style={styles.customInput}
                    placeholder="Ex : Bras-Panon"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={customCity}
                    onChangeText={setCustomCity}
                  />
                </View>
                <View style={{ width: 100 }}>
                  <ProDayText variant="caption" style={styles.fieldLabel}>
                    Code Postal
                  </ProDayText>
                  <TextInput
                    style={styles.customInput}
                    placeholder="97412"
                    placeholderTextColor="rgba(255,255,255,0.35)"
                    value={customPostal}
                    onChangeText={setCustomPostal}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View>
                <ProDayText variant="caption" style={styles.fieldLabel}>
                  Niveau / Division estimée
                </ProDayText>
                <TextInput
                  style={styles.customInput}
                  placeholder="Ex : Régionale 1, D1, Jeunes"
                  placeholderTextColor="rgba(255,255,255,0.35)"
                  value={customDivision}
                  onChangeText={setCustomDivision}
                />
              </View>
            </ScrollView>

            <View style={styles.customModalActions}>
              <TouchableOpacity
                style={styles.customCancelBtn}
                onPress={() => setCustomModalVisible(false)}
              >
                <ProDayText variant="caption" style={{ color: 'rgba(255,255,255,0.6)' }}>
                  Annuler
                </ProDayText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.customSaveBtn, { backgroundColor: accent }]}
                onPress={handleCreateCustomClub}
              >
                <ProDayText variant="caption" style={{ color: '#0F172A', fontWeight: '800' }}>
                  Valider et continuer
                </ProDayText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

function createStyles(accent: string) {
  return StyleSheet.create({
    root: { gap: 8 },
    inputWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      paddingHorizontal: 14,
      minHeight: 48,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    input: {
      flex: 1,
      color: '#FFFFFF',
      fontSize: 15,
      fontFamily: fontFamily.regular,
      paddingVertical: 10,
    },
    dropdown: {
      maxHeight: 260,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(0,0,0,0.55)',
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'rgba(255,255,255,0.1)',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
      minHeight: 60,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: 'rgba(255,255,255,0.06)',
    },
    rowCopy: { flex: 1, gap: 2 },
    rowTitle: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
    rowSub: { color: 'rgba(255,255,255,0.5)', fontSize: 12 },
    rowBadge: { fontSize: 10, fontWeight: '700' },
    error: { color: '#FF6B6B' },
    hint: { color: 'rgba(255,255,255,0.45)' },
    selectedCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      padding: 14,
      borderRadius: radius.lg,
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: `${accent}55`,
    },
    selectedAccent: { width: 3, alignSelf: 'stretch', borderRadius: 2 },
    selectedBody: { flex: 1, gap: 2 },
    selectedName: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
    selectedMeta: { color: 'rgba(255,255,255,0.55)' },
    selectedFff: { color: 'rgba(255,255,255,0.4)', marginTop: 2 },
    badge: {
      alignSelf: 'flex-start',
      marginTop: 6,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderRadius: 8,
      backgroundColor: `${accent}22`,
    },
    badgeText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.3 },
    clearBtn: {
      width: 32,
      height: 32,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255,255,255,0.08)',
    },
    territoryScroll: {
      gap: 6,
      paddingBottom: 4,
    },
    territoryPill: {
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    territoryPillText: {
      fontSize: 11,
      color: 'rgba(255,255,255,0.7)',
      fontWeight: '600',
    },
    territoryPillTextActive: {
      color: '#0F172A',
      fontWeight: '800',
    },
    unlistedClubBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: 8,
      alignSelf: 'flex-start',
    },
    unlistedClubText: {
      fontSize: 12,
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    customModalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0,0,0,0.75)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 16,
    },
    customModalCard: {
      width: '100%',
      maxWidth: 480,
      backgroundColor: '#1E293B',
      borderRadius: radius.xl,
      padding: 20,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
    },
    customModalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 12,
    },
    customModalTitle: {
      color: '#FFFFFF',
      fontSize: 16,
      fontWeight: '700',
    },
    fieldLabel: {
      color: 'rgba(255,255,255,0.7)',
      fontSize: 12,
      marginBottom: 4,
    },
    customInput: {
      backgroundColor: 'rgba(255,255,255,0.06)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.15)',
      borderRadius: radius.md,
      paddingHorizontal: 12,
      paddingVertical: 8,
      color: '#FFFFFF',
      fontSize: 14,
    },
    territoryChipSmall: {
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: radius.sm,
      backgroundColor: 'rgba(255,255,255,0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.12)',
    },
    customModalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: 12,
      marginTop: 16,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: 'rgba(255,255,255,0.1)',
    },
    customCancelBtn: {
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: radius.md,
    },
    customSaveBtn: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: radius.md,
    },
  });
}
