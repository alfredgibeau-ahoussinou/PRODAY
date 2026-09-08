import React, { useState, useEffect } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { AUTH_XP } from '../../features/auth/experience/tokens';
import { fontFamily } from '../../theme/typography';
import {
  fffOfficialRegistryService,
  FffOfficialRegistryError,
  type OfficialFffClub,
  type PreRegisteredMember,
} from '../../services/fffOfficialRegistry.service';
import {
  pickVerificationFromCamera,
  pickVerificationFromGallery,
  pickVerificationPdf,
} from '../../utils/pickVerificationDocument';
import { spacing, radius } from '../../theme/designTokens';

export interface SignupFffAffiliationCardProps {
  role: 'player' | 'coach' | 'club' | 'parent';
  hasClub: boolean;
  onToggleHasClub: (hasClub: boolean) => void;
  selectedClub: OfficialFffClub | null;
  onSelectClub: (club: OfficialFffClub | null) => void;
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
  selectedRosterMember: PreRegisteredMember | null;
  onSelectRosterMember: (member: PreRegisteredMember | null) => void;
  isCustomProfile: boolean;
  onToggleCustomProfile: (custom: boolean) => void;
  identityDoc: { uri: string; name: string; type: string } | null;
  onSetIdentityDoc: (doc: { uri: string; name: string; type: string } | null) => void;
  defaultUserName?: string;
  onChangeCustomName?: (name: string) => void;
  error?: string;
}

export const SignupFffAffiliationCard: React.FC<SignupFffAffiliationCardProps> = ({
  role,
  hasClub,
  onToggleHasClub,
  selectedClub,
  onSelectClub,
  selectedCategory,
  onSelectCategory,
  selectedRosterMember,
  onSelectRosterMember,
  isCustomProfile,
  onToggleCustomProfile,
  identityDoc,
  onSetIdentityDoc,
  defaultUserName,
  onChangeCustomName,
  error,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<OfficialFffClub[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [rosterMembers, setRosterMembers] = useState<PreRegisteredMember[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [clubCategories, setClubCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [manualCategory, setManualCategory] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

  // Recherche clubs FFF (live DOFA) — jamais de seed locale
  useEffect(() => {
    let active = true;
    if (selectedClub) {
      setSearchResults([]);
      setSearchError(null);
      return;
    }

    const q = searchQuery.trim();
    if (q.length < 2) {
      setSearchResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    const timer = setTimeout(async () => {
      try {
        const results = await fffOfficialRegistryService.searchOfficialClubs(q);
        if (!active) return;
        setSearchResults(results.slice(0, 25));
        if (results.length === 0) {
          setSearchError(
            'Aucun club FFF trouvé. Essayez la ville, le code postal (5 chiffres) ou le n° d’affiliation.'
          );
        }
      } catch (err) {
        if (!active) return;
        setSearchResults([]);
        setSearchError(
          err instanceof FffOfficialRegistryError
            ? err.message
            : 'Erreur lors de la recherche FFF. Réessayez.'
        );
      } finally {
        if (active) setIsSearching(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, selectedClub]);

  // Catégories / équipes engagées DOFA pour le club sélectionné
  useEffect(() => {
    let active = true;
    if (!selectedClub) {
      setClubCategories([]);
      setCategoriesError(null);
      setManualCategory('');
      return;
    }

    setLoadingCategories(true);
    setCategoriesError(null);
    void fffOfficialRegistryService
      .getCategoriesForClub(selectedClub)
      .then((cats) => {
        if (!active) return;
        setClubCategories(cats);
        if (cats.length === 0) {
          setCategoriesError(
            'Aucune équipe engagée récupérée auprès de la FFF pour ce club. Saisissez la catégorie indiquée sur votre licence.'
          );
        }
      })
      .catch(() => {
        if (!active) return;
        setClubCategories([]);
        setCategoriesError(
          'Impossible de charger les équipes FFF de ce club. Saisissez la catégorie de votre licence.'
        );
      })
      .finally(() => {
        if (active) setLoadingCategories(false);
      });

    return () => {
      active = false;
    };
  }, [selectedClub]);

  // Licenciés : uniquement imports FootClubs / memberships réels (sinon vide)
  useEffect(() => {
    let active = true;
    if (!selectedClub || !selectedCategory) {
      setRosterMembers([]);
      return;
    }

    setLoadingRoster(true);
    void fffOfficialRegistryService
      .getRosterForTeam(selectedClub.id, selectedCategory, {
        name: selectedClub.name,
        city: selectedClub.city,
        fffNumber: selectedClub.fffNumber,
      })
      .then((members) => {
        if (!active) return;
        setRosterMembers(members);
        if (members.length === 0) {
          onToggleCustomProfile(true);
        }
      })
      .catch(() => {
        if (!active) return;
        setRosterMembers([]);
        onToggleCustomProfile(true);
      })
      .finally(() => {
        if (active) setLoadingRoster(false);
      });

    return () => {
      active = false;
    };
  }, [selectedClub, selectedCategory, onToggleCustomProfile]);

  const handlePickCamera = async () => {
    try {
      setUploadingDoc(true);
      const file = await pickVerificationFromCamera(role === 'club' ? 'document' : 'identity');
      if (file) {
        onSetIdentityDoc({
          uri: file.uri,
          name: role === 'club' ? 'Attestation_Club_Photo.jpg' : 'CNI_Photo.jpg',
          type: role === 'club' ? 'club_mandate' : 'cni',
        });
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d’accéder à la caméra.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handlePickGallery = async () => {
    try {
      setUploadingDoc(true);
      const file = await pickVerificationFromGallery();
      if (file) {
        onSetIdentityDoc({
          uri: file.uri,
          name: role === 'club' ? 'Justificatif_Club.jpg' : 'Piece_Identite.jpg',
          type: role === 'club' ? 'club_mandate' : 'cni',
        });
      }
    } catch {
      Alert.alert('Erreur', 'Impossible d’accéder à la galerie.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handlePickPdf = async () => {
    try {
      setUploadingDoc(true);
      const file = await pickVerificationPdf();
      if (file) {
        onSetIdentityDoc({
          uri: file.uri,
          name: role === 'club' ? 'Attestation_Officielle_FFF.pdf' : 'Document_Identite.pdf',
          type: role === 'club' ? 'club_mandate' : 'fff_license',
        });
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de sélectionner le fichier PDF.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const selectClub = (club: OfficialFffClub) => {
    onSelectClub({ ...club, categories: [] });
    onSelectCategory('');
    onSelectRosterMember(null);
    onToggleCustomProfile(false);
    setManualCategory('');
    setSearchQuery('');
  };

  const applyManualCategory = () => {
    const cat = manualCategory.trim();
    if (!cat) return;
    onSelectCategory(cat);
    onSelectRosterMember(null);
    onToggleCustomProfile(false);
  };

  const isClubRole = role === 'club';
  const displayCategories = clubCategories;

  return (
    <View style={styles.container}>
      {!isClubRole && (
        <View style={styles.section}>
          <ProDayText style={styles.label}>
            Faites-vous partie d'un club ou d'une équipe ?
          </ProDayText>
          <View style={styles.toggleRow}>
            <PressableSpring
              onPress={() => onToggleHasClub(true)}
              style={[styles.toggleBtn, hasClub && styles.toggleBtnActive]}
            >
              <Icon name="shield" size={16} color={hasClub ? AUTH_XP.goldBright : AUTH_XP.textMuted} />
              <ProDayText style={[styles.toggleBtnText, hasClub && styles.toggleBtnTextActive]}>
                Oui, je suis dans un club
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              onPress={() => onToggleHasClub(false)}
              style={[styles.toggleBtn, !hasClub && styles.toggleBtnActive]}
            >
              <Icon name="close" size={16} color={!hasClub ? AUTH_XP.goldBright : AUTH_XP.textMuted} />
              <ProDayText style={[styles.toggleBtnText, !hasClub && styles.toggleBtnTextActive]}>
                Sans club pour le moment
              </ProDayText>
            </PressableSpring>
          </View>
        </View>
      )}

      {(hasClub || isClubRole) && (
        <>
          <View style={styles.section}>
            <ProDayText style={styles.label}>
              {isClubRole ? '1. Club officiel FFF' : '1. Club officiel FFF'}
            </ProDayText>
            <ProDayText style={styles.sourceHint}>
              Recherche officielle FFF (ville, code postal ou n° d’affiliation). Aucun club inventé.
            </ProDayText>

            {selectedClub ? (
              <View style={styles.selectedClubCard}>
                <View style={styles.clubBadge}>
                  <Icon name="shield" size={18} color="#000000" />
                </View>
                <View style={styles.clubInfo}>
                  <ProDayText style={styles.clubName}>{selectedClub.name}</ProDayText>
                  <ProDayText style={styles.clubSub}>
                    {selectedClub.fffNumber
                      ? `N° FFF : ${selectedClub.fffNumber} · `
                      : ''}
                    {selectedClub.city}
                    {selectedClub.department ? ` (${selectedClub.department})` : ''}
                  </ProDayText>
                  {!!selectedClub.league && (
                    <ProDayText style={styles.clubLeague}>{selectedClub.league}</ProDayText>
                  )}
                </View>
                <PressableSpring
                  onPress={() => {
                    onSelectClub(null);
                    onSelectCategory('');
                    onSelectRosterMember(null);
                    onToggleCustomProfile(false);
                    setClubCategories([]);
                    setManualCategory('');
                  }}
                  style={styles.changeClubBtn}
                >
                  <ProDayText style={styles.changeClubBtnText}>Changer</ProDayText>
                </PressableSpring>
              </View>
            ) : (
              <View style={styles.searchWrapper}>
                <View style={styles.searchBar}>
                  <Icon name="search" size={16} color={AUTH_XP.goldBright} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Ex. Melun, 77350, Le Mée, n° affiliation…"
                    placeholderTextColor={AUTH_XP.textDim}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                    autoCorrect={false}
                    autoCapitalize="none"
                  />
                  {isSearching && <ActivityIndicator size="small" color={AUTH_XP.goldBright} />}
                </View>
                {searchQuery.trim().length > 0 && searchQuery.trim().length < 2 ? (
                  <ProDayText style={styles.infoText}>Saisissez au moins 2 caractères.</ProDayText>
                ) : null}
                {searchError ? (
                  <ProDayText style={styles.infoText}>{searchError}</ProDayText>
                ) : null}
                {searchResults.length > 0 && (
                  <View style={styles.resultsList}>
                    {searchResults.map((club) => (
                      <PressableSpring
                        key={club.id}
                        onPress={() => selectClub(club)}
                        style={styles.resultItem}
                      >
                        <View style={styles.resultCol}>
                          <View style={styles.resultTopRow}>
                            <ProDayText style={styles.resultClubName}>{club.name}</ProDayText>
                            {!!club.fffNumber && (
                              <View style={styles.fffBadge}>
                                <ProDayText style={styles.fffBadgeText}>
                                  FFF #{club.fffNumber}
                                </ProDayText>
                              </View>
                            )}
                          </View>
                          <ProDayText style={styles.resultCity}>
                            {[club.city, club.postalCode].filter(Boolean).join(' ')}
                            {club.league ? ` · ${club.league}` : ''}
                          </ProDayText>
                        </View>
                        <Icon name="chevron-forward" size={16} color={AUTH_XP.textMuted} />
                      </PressableSpring>
                    ))}
                  </View>
                )}
              </View>
            )}
          </View>

          {selectedClub && (
            <View style={styles.section}>
              <ProDayText style={styles.label}>2. Catégorie / équipe FFF</ProDayText>
              {loadingCategories ? (
                <ActivityIndicator size="small" color={AUTH_XP.goldBright} style={{ marginVertical: 12 }} />
              ) : displayCategories.length > 0 ? (
                <View style={styles.categoriesGrid}>
                  {displayCategories.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    return (
                      <PressableSpring
                        key={cat}
                        onPress={() => {
                          onSelectCategory(cat);
                          onSelectRosterMember(null);
                          onToggleCustomProfile(false);
                        }}
                        style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                      >
                        <ProDayText
                          style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}
                        >
                          {cat}
                        </ProDayText>
                      </PressableSpring>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.manualCategoryBox}>
                  {categoriesError ? (
                    <ProDayText style={styles.infoText}>{categoriesError}</ProDayText>
                  ) : null}
                  <TextInput
                    style={styles.manualCategoryInput}
                    placeholder="Ex. Seniors D1, U17 R1…"
                    placeholderTextColor={AUTH_XP.textDim}
                    value={manualCategory}
                    onChangeText={setManualCategory}
                    onSubmitEditing={applyManualCategory}
                    onBlur={applyManualCategory}
                  />
                  {!!selectedCategory && (
                    <ProDayText style={styles.selectedManualCat}>
                      Catégorie retenue : {selectedCategory}
                    </ProDayText>
                  )}
                </View>
              )}
            </View>
          )}

          {selectedClub && selectedCategory && !isClubRole && (
            <View style={styles.section}>
              <ProDayText style={styles.label}>
                3. Licenciés FootClubs / ProDay ({selectedCategory})
              </ProDayText>
              {loadingRoster ? (
                <ActivityIndicator size="small" color={AUTH_XP.goldBright} style={{ marginVertical: 12 }} />
              ) : rosterMembers.length > 0 ? (
                <View style={styles.rosterContainer}>
                  <ProDayText style={styles.rosterHint}>
                    {rosterMembers.length} licencié
                    {rosterMembers.length > 1 ? 's' : ''} trouvé
                    {rosterMembers.length > 1 ? 's' : ''} (import FootClubs / club) — sélectionnez votre nom :
                  </ProDayText>
                  <View style={styles.rosterList}>
                    {rosterMembers.map((member) => {
                      const isSelected = selectedRosterMember?.id === member.id && !isCustomProfile;
                      return (
                        <PressableSpring
                          key={member.id}
                          onPress={() => {
                            onSelectRosterMember(member);
                            onToggleCustomProfile(false);
                          }}
                          style={[styles.rosterItem, isSelected && styles.rosterItemActive]}
                        >
                          <Icon
                            name={isSelected ? 'checkmark-circle' : 'person'}
                            size={18}
                            color={isSelected ? AUTH_XP.goldBright : AUTH_XP.textMuted}
                          />
                          <View style={styles.rosterItemCol}>
                            <ProDayText
                              style={[
                                styles.rosterMemberName,
                                isSelected && styles.rosterMemberNameActive,
                              ]}
                            >
                              {member.displayName}
                            </ProDayText>
                            <View style={styles.rosterMemberMeta}>
                              <View style={[styles.categoryTag, isSelected && styles.categoryTagActive]}>
                                <ProDayText
                                  style={[
                                    styles.categoryTagText,
                                    isSelected && styles.categoryTagTextActive,
                                  ]}
                                >
                                  {member.category}
                                </ProDayText>
                              </View>
                              {member.licenseNumber ? (
                                <ProDayText style={styles.rosterLicense}>
                                  Lic. {member.licenseNumber}
                                </ProDayText>
                              ) : null}
                            </View>
                          </View>
                          {isSelected && (
                            <View style={styles.selectedCheckBadge}>
                              <ProDayText style={styles.selectedCheckText}>C'est moi ✓</ProDayText>
                            </View>
                          )}
                        </PressableSpring>
                      );
                    })}
                  </View>

                  <PressableSpring
                    onPress={() => {
                      onSelectRosterMember(null);
                      onToggleCustomProfile(true);
                    }}
                    style={[styles.customProfileBtn, isCustomProfile && styles.customProfileBtnActive]}
                  >
                    <Icon
                      name={isCustomProfile ? 'checkmark-circle' : 'add'}
                      size={18}
                      color={isCustomProfile ? AUTH_XP.goldBright : AUTH_XP.textMuted}
                    />
                    <ProDayText
                      style={[
                        styles.customProfileBtnText,
                        isCustomProfile && styles.customProfileBtnTextActive,
                      ]}
                    >
                      Mon nom n'apparaît pas dans la liste
                    </ProDayText>
                  </PressableSpring>

                  {isCustomProfile && (
                    <View style={styles.customNameBox}>
                      <ProDayText style={styles.customNameLabel}>
                        Nom et prénom tels que sur votre licence FFF
                      </ProDayText>
                      <TextInput
                        style={styles.customNameInput}
                        placeholder="Prénom Nom"
                        placeholderTextColor={AUTH_XP.textDim}
                        value={defaultUserName || ''}
                        onChangeText={onChangeCustomName}
                      />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noRosterBox}>
                  <Icon name="person" size={20} color={AUTH_XP.goldBright} />
                  <View style={{ flex: 1 }}>
                    <ProDayText style={styles.noRosterTitle}>
                      Aucun licencié pré-importé pour cette catégorie
                    </ProDayText>
                    <ProDayText style={styles.noRosterText}>
                      Le club n’a pas encore importé son effectif FootClubs sur ProDay — ou votre nom n’y figure pas encore. Saisissez votre identité telle qu’elle apparaît sur votre licence FFF.
                    </ProDayText>
                    <View style={styles.customNameBox}>
                      <ProDayText style={styles.customNameLabel}>
                        Nom et prénom officiels (licence FFF)
                      </ProDayText>
                      <TextInput
                        style={styles.customNameInput}
                        placeholder="Prénom Nom"
                        placeholderTextColor={AUTH_XP.textDim}
                        value={defaultUserName || ''}
                        onChangeText={(text) => {
                          onToggleCustomProfile(true);
                          onChangeCustomName?.(text);
                        }}
                      />
                    </View>
                  </View>
                </View>
              )}
            </View>
          )}

          {(selectedRosterMember || isCustomProfile || isClubRole || (selectedClub && selectedCategory && !isClubRole)) && (
            <View style={styles.section}>
              <ProDayText style={styles.label}>
                {isClubRole
                  ? '3. Justificatif officiel d\'appartenance au club'
                  : '4. Confirmation d\'identité officielle'}
              </ProDayText>
              <ProDayText style={styles.docHint}>
                {isClubRole
                  ? 'Attestation d\'affiliation FFF, Procès-Verbal d\'AG, Récépissé préfecture ou Extrait Kbis prouvant que vous représentez cette équipe.'
                  : 'Carte Nationale d\'Identité (CNI), Passeport ou Licence officielle FFF.'}
              </ProDayText>
              {identityDoc ? (
                <View style={styles.docAttachedCard}>
                  <Icon name="checkmark-circle" size={20} color="#10B981" />
                  <View style={styles.docAttachedCol}>
                    <ProDayText style={styles.docAttachedTitle}>Document officiel joint</ProDayText>
                    <ProDayText style={styles.docAttachedName}>{identityDoc.name}</ProDayText>
                  </View>
                  <PressableSpring onPress={() => onSetIdentityDoc(null)} style={styles.removeDocBtn}>
                    <Icon name="trash" size={16} color={AUTH_XP.error} />
                  </PressableSpring>
                </View>
              ) : (
                <View style={styles.docButtonsRow}>
                  <PressableSpring onPress={handlePickCamera} disabled={uploadingDoc} style={styles.uploadDocBtn}>
                    <Icon name="camera" size={18} color={AUTH_XP.goldBright} />
                    <ProDayText style={styles.uploadDocBtnText}>Caméra</ProDayText>
                  </PressableSpring>
                  <PressableSpring onPress={handlePickGallery} disabled={uploadingDoc} style={styles.uploadDocBtn}>
                    <Icon name="image" size={18} color={AUTH_XP.goldBright} />
                    <ProDayText style={styles.uploadDocBtnText}>Galerie</ProDayText>
                  </PressableSpring>
                  <PressableSpring onPress={handlePickPdf} disabled={uploadingDoc} style={styles.uploadDocBtn}>
                    <Icon name="document-text" size={18} color={AUTH_XP.goldBright} />
                    <ProDayText style={styles.uploadDocBtnText}>PDF</ProDayText>
                  </PressableSpring>
                </View>
              )}
            </View>
          )}
        </>
      )}

      {!hasClub && !isClubRole && (
        <>
          <View style={styles.section}>
            <ProDayText style={styles.label}>1. Votre nom et prénom officiels</ProDayText>
            <View style={styles.customNameBox}>
              <TextInput
                style={styles.customNameInput}
                placeholder="Prénom Nom"
                placeholderTextColor={AUTH_XP.textDim}
                value={defaultUserName || ''}
                onChangeText={onChangeCustomName}
              />
            </View>
          </View>

          <View style={styles.section}>
            <ProDayText style={styles.label}>2. Confirmation d'identité officielle</ProDayText>
            <ProDayText style={styles.docHint}>
              Carte Nationale d'Identité (CNI), Passeport ou Licence officielle FFF.
            </ProDayText>
            {identityDoc ? (
              <View style={styles.docAttachedCard}>
                <Icon name="checkmark-circle" size={20} color="#10B981" />
                <View style={styles.docAttachedCol}>
                  <ProDayText style={styles.docAttachedTitle}>Document officiel joint</ProDayText>
                  <ProDayText style={styles.docAttachedName}>{identityDoc.name}</ProDayText>
                </View>
                <PressableSpring onPress={() => onSetIdentityDoc(null)} style={styles.removeDocBtn}>
                  <Icon name="trash" size={16} color={AUTH_XP.error} />
                </PressableSpring>
              </View>
            ) : (
              <View style={styles.docButtonsRow}>
                <PressableSpring onPress={handlePickCamera} disabled={uploadingDoc} style={styles.uploadDocBtn}>
                  <Icon name="camera" size={18} color={AUTH_XP.goldBright} />
                  <ProDayText style={styles.uploadDocBtnText}>Caméra</ProDayText>
                </PressableSpring>
                <PressableSpring onPress={handlePickGallery} disabled={uploadingDoc} style={styles.uploadDocBtn}>
                  <Icon name="image" size={18} color={AUTH_XP.goldBright} />
                  <ProDayText style={styles.uploadDocBtnText}>Galerie</ProDayText>
                </PressableSpring>
                <PressableSpring onPress={handlePickPdf} disabled={uploadingDoc} style={styles.uploadDocBtn}>
                  <Icon name="document-text" size={18} color={AUTH_XP.goldBright} />
                  <ProDayText style={styles.uploadDocBtnText}>PDF</ProDayText>
                </PressableSpring>
              </View>
            )}
          </View>
        </>
      )}

      {error ? <ProDayText style={styles.errorText}>{error}</ProDayText> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  section: { gap: spacing.xs },
  label: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: AUTH_XP.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceHint: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: AUTH_XP.textDim,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: AUTH_XP.textMuted,
    lineHeight: 16,
  },
  toggleRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  toggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
    backgroundColor: AUTH_XP.inputBg,
  },
  toggleBtnActive: { borderColor: AUTH_XP.gold, backgroundColor: 'rgba(245, 208, 74, 0.12)' },
  toggleBtnText: { fontSize: 12, fontFamily: fontFamily.semibold, color: AUTH_XP.textMuted },
  toggleBtnTextActive: { color: AUTH_XP.goldBright, fontFamily: fontFamily.bold },
  searchWrapper: { gap: spacing.xs },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
    backgroundColor: AUTH_XP.inputBg,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: AUTH_XP.text,
    paddingVertical: 0,
  },
  resultsList: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
    overflow: 'hidden',
    backgroundColor: AUTH_XP.inputBg,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: AUTH_XP.border,
    gap: spacing.xs,
  },
  resultCol: { flex: 1, gap: 2 },
  resultTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  resultClubName: { fontSize: 14, fontFamily: fontFamily.semibold, color: AUTH_XP.text },
  resultCity: { fontSize: 12, fontFamily: fontFamily.regular, color: AUTH_XP.textMuted },
  fffBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(245, 208, 74, 0.15)',
  },
  fffBadgeText: { fontSize: 10, fontFamily: fontFamily.bold, color: AUTH_XP.goldBright },
  selectedClubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: AUTH_XP.gold,
    backgroundColor: 'rgba(245, 208, 74, 0.08)',
  },
  clubBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: AUTH_XP.goldBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubInfo: { flex: 1, gap: 2 },
  clubName: { fontSize: 15, fontFamily: fontFamily.bold, color: AUTH_XP.text },
  clubSub: { fontSize: 12, fontFamily: fontFamily.regular, color: AUTH_XP.textMuted },
  clubLeague: { fontSize: 11, fontFamily: fontFamily.regular, color: AUTH_XP.textDim },
  changeClubBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  changeClubBtnText: { fontSize: 12, fontFamily: fontFamily.bold, color: AUTH_XP.goldBright },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
    backgroundColor: AUTH_XP.inputBg,
  },
  categoryPillActive: { borderColor: AUTH_XP.gold, backgroundColor: 'rgba(245, 208, 74, 0.15)' },
  categoryPillText: { fontSize: 12, fontFamily: fontFamily.semibold, color: AUTH_XP.textMuted },
  categoryPillTextActive: { color: AUTH_XP.goldBright, fontFamily: fontFamily.bold },
  manualCategoryBox: { gap: spacing.xs, marginTop: 4 },
  manualCategoryInput: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
    backgroundColor: AUTH_XP.inputBg,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: AUTH_XP.text,
  },
  selectedManualCat: {
    fontSize: 12,
    fontFamily: fontFamily.semibold,
    color: AUTH_XP.goldBright,
  },
  rosterContainer: { gap: spacing.sm },
  rosterHint: { fontSize: 12, fontFamily: fontFamily.regular, color: AUTH_XP.textMuted },
  rosterList: { gap: 6 },
  rosterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
    backgroundColor: AUTH_XP.inputBg,
  },
  rosterItemActive: { borderColor: AUTH_XP.gold, backgroundColor: 'rgba(245, 208, 74, 0.1)' },
  rosterItemCol: { flex: 1, gap: 4 },
  rosterMemberName: { fontSize: 14, fontFamily: fontFamily.semibold, color: AUTH_XP.text },
  rosterMemberNameActive: { color: AUTH_XP.goldBright },
  rosterMemberMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  categoryTagActive: { backgroundColor: 'rgba(245, 208, 74, 0.2)' },
  categoryTagText: { fontSize: 10, fontFamily: fontFamily.semibold, color: AUTH_XP.textMuted },
  categoryTagTextActive: { color: AUTH_XP.goldBright },
  rosterLicense: { fontSize: 11, fontFamily: fontFamily.regular, color: AUTH_XP.textMuted },
  selectedCheckBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(245, 208, 74, 0.2)',
  },
  selectedCheckText: { fontSize: 10, fontFamily: fontFamily.bold, color: AUTH_XP.goldBright },
  customProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
    borderStyle: 'dashed',
  },
  customProfileBtnActive: { borderColor: AUTH_XP.gold, borderStyle: 'solid' },
  customProfileBtnText: { fontSize: 13, fontFamily: fontFamily.semibold, color: AUTH_XP.textMuted },
  customProfileBtnTextActive: { color: AUTH_XP.goldBright },
  customNameBox: { gap: 6, marginTop: 8 },
  customNameLabel: { fontSize: 12, fontFamily: fontFamily.semibold, color: AUTH_XP.textMuted },
  customNameInput: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
    backgroundColor: AUTH_XP.inputBg,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: AUTH_XP.text,
  },
  noRosterBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
    backgroundColor: AUTH_XP.inputBg,
  },
  noRosterTitle: { fontSize: 13, fontFamily: fontFamily.bold, color: AUTH_XP.text, marginBottom: 4 },
  noRosterText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: AUTH_XP.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  docHint: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: AUTH_XP.textMuted,
    lineHeight: 16,
    marginBottom: 4,
  },
  docAttachedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  docAttachedCol: { flex: 1 },
  docAttachedTitle: { fontSize: 13, fontFamily: fontFamily.bold, color: AUTH_XP.text },
  docAttachedName: { fontSize: 11, fontFamily: fontFamily.regular, color: AUTH_XP.textMuted },
  removeDocBtn: { padding: 6 },
  docButtonsRow: { flexDirection: 'row', gap: spacing.sm },
  uploadDocBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: AUTH_XP.border,
    backgroundColor: AUTH_XP.inputBg,
  },
  uploadDocBtnText: { fontSize: 11, fontFamily: fontFamily.semibold, color: AUTH_XP.goldBright },
  errorText: { fontSize: 12, fontFamily: fontFamily.semibold, color: AUTH_XP.error },
});
