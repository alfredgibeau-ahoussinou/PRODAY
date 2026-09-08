import React, { useState, useEffect, useMemo } from 'react';
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
import { fontFamily } from '../../theme/typography';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import type { SignupVisualChrome } from '../../screens/signup/signupVisualSystem';
import {
  fffOfficialRegistryService,
  type OfficialFffClub,
  type PreRegisteredMember,
} from '../../services/fffOfficialRegistry.service';
import { PublicClubAutocomplete } from './PublicClubAutocomplete';
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
  const { visual } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(visual), [visual]);
  const [rosterMembers, setRosterMembers] = useState<PreRegisteredMember[]>([]);
  const [loadingRoster, setLoadingRoster] = useState(false);
  const [rosterMeta, setRosterMeta] = useState<{
    totalInClub: number;
    syncedAt?: Date;
    categoryFallback: boolean;
  } | null>(null);
  const [clubCategories, setClubCategories] = useState<string[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [manualCategory, setManualCategory] = useState('');
  const [uploadingDoc, setUploadingDoc] = useState(false);

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

  // Licenciés : cache FootClubs public (fff_club_rosters) — pas memberships (ACL)
  useEffect(() => {
    let active = true;
    if (!selectedClub || !selectedCategory) {
      setRosterMembers([]);
      setRosterMeta(null);
      return;
    }

    setLoadingRoster(true);
    void (async () => {
      try {
        const { fffClubRosterService } = await import('../../services/fffClubRoster.service');
        if (selectedClub.fffNumber) {
          const cached = await fffClubRosterService.listMembersForSignup(
            selectedClub.fffNumber,
            selectedCategory
          );
          if (!active) return;
          if (cached.totalInClub > 0) {
            setRosterMembers(cached.members);
            setRosterMeta({
              totalInClub: cached.totalInClub,
              syncedAt: cached.syncedAt,
              categoryFallback: cached.categoryFallback,
            });
            if (cached.members.length === 0) onToggleCustomProfile(true);
            return;
          }
        }

        const members = await fffOfficialRegistryService.getRosterForTeam(
          selectedClub.id,
          selectedCategory,
          {
            name: selectedClub.name,
            city: selectedClub.city,
            fffNumber: selectedClub.fffNumber,
          }
        );
        if (!active) return;
        setRosterMembers(members);
        setRosterMeta(
          members.length > 0
            ? { totalInClub: members.length, categoryFallback: false }
            : { totalInClub: 0, categoryFallback: false }
        );
        if (members.length === 0) onToggleCustomProfile(true);
      } catch {
        if (!active) return;
        setRosterMembers([]);
        setRosterMeta({ totalInClub: 0, categoryFallback: false });
        onToggleCustomProfile(true);
      } finally {
        if (active) setLoadingRoster(false);
      }
    })();

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
            {role === 'parent'
              ? 'Votre enfant est-il licencié dans un club ?'
              : role === 'coach'
                ? 'Encadrez-vous un club ou une équipe ?'
                : "Faites-vous partie d'un club ou d'une équipe ?"}
          </ProDayText>
          <View style={styles.toggleRow}>
            <PressableSpring
              onPress={() => onToggleHasClub(true)}
              style={[styles.toggleBtn, hasClub && styles.toggleBtnActive]}
            >
              <Icon name="shield" size={16} color={hasClub ? visual.focus : visual.textMuted} />
              <ProDayText style={[styles.toggleBtnText, hasClub && styles.toggleBtnTextActive]}>
                {role === 'parent'
                  ? 'Oui, club licencié'
                  : role === 'coach'
                    ? 'Oui, j’encadre un club'
                    : 'Oui, je suis dans un club'}
              </ProDayText>
            </PressableSpring>
            <PressableSpring
              onPress={() => onToggleHasClub(false)}
              style={[styles.toggleBtn, !hasClub && styles.toggleBtnActive]}
            >
              <Icon name="close" size={16} color={!hasClub ? visual.focus : visual.textMuted} />
              <ProDayText style={[styles.toggleBtnText, !hasClub && styles.toggleBtnTextActive]}>
                {role === 'parent' ? 'Pas encore de club' : 'Sans club pour le moment'}
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
              Annuaire public ProDay + FFF (ville, CP ou n° d’affiliation). Aucune donnée personnelle.
            </ProDayText>

            <PublicClubAutocomplete
              accent={visual.accent}
              selectedClub={selectedClub}
              onSelectClub={(club) => {
                if (!club) {
                  onSelectClub(null);
                  onSelectCategory('');
                  onSelectRosterMember(null);
                  onToggleCustomProfile(false);
                  setClubCategories([]);
                  setManualCategory('');
                  return;
                }
                selectClub(club);
              }}
              error={error}
            />
          </View>

          {selectedClub && (
            <View style={styles.section}>
              <ProDayText style={styles.label}>2. Catégorie / équipe FFF</ProDayText>
              {loadingCategories ? (
                <ActivityIndicator size="small" color={visual.focus} style={{ marginVertical: 12 }} />
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
                    placeholderTextColor={visual.textFaint}
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
                3. Trouver mon nom dans l’effectif du club
              </ProDayText>
              {loadingRoster ? (
                <ActivityIndicator size="small" color={visual.focus} style={{ marginVertical: 12 }} />
              ) : rosterMembers.length > 0 ? (
                <View style={styles.rosterContainer}>
                  <ProDayText style={styles.rosterHint}>
                    {rosterMembers.length} licencié
                    {rosterMembers.length > 1 ? 's' : ''} trouvé
                    {rosterMembers.length > 1 ? 's' : ''}
                    {rosterMeta?.syncedAt
                      ? ` · maj. ${rosterMeta.syncedAt.toLocaleDateString('fr-FR')}`
                      : ''}{' '}
                    — sélectionnez votre nom :
                  </ProDayText>
                  {rosterMeta?.categoryFallback ? (
                    <ProDayText style={styles.infoText}>
                      Aucun match exact pour « {selectedCategory} » — effectif complet du club affiché.
                    </ProDayText>
                  ) : null}
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
                            color={isSelected ? visual.focus : visual.textMuted}
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
                              {!!member.category && (
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
                              )}
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
                      color={isCustomProfile ? visual.focus : visual.textMuted}
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
                        placeholderTextColor={visual.textFaint}
                        value={defaultUserName || ''}
                        onChangeText={onChangeCustomName}
                      />
                    </View>
                  )}
                </View>
              ) : (
                <View style={styles.noRosterBox}>
                  <Icon name="person" size={20} color={visual.focus} />
                  <View style={{ flex: 1 }}>
                    <ProDayText style={styles.noRosterTitle}>
                      Effectif non publié sur ProDay pour ce club
                    </ProDayText>
                    <ProDayText style={styles.noRosterText}>
                      La FFF ne publie pas les listes de licenciés (données personnelles). Votre club doit
                      importer son fichier FootClubs sur ProDay — la liste se met à jour chaque nuit.
                      En attendant, saisissez votre nom tel qu’il figure sur votre licence : ce n’est pas
                      un bug, c’est le parcours normal.
                    </ProDayText>
                    <View style={styles.customNameBox}>
                      <ProDayText style={styles.customNameLabel}>
                        Nom et prénom officiels (licence FFF)
                      </ProDayText>
                      <TextInput
                        style={styles.customNameInput}
                        placeholder="Prénom Nom"
                        placeholderTextColor={visual.textFaint}
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
                    <Icon name="trash" size={16} color={visual.danger} />
                  </PressableSpring>
                </View>
              ) : (
                <View style={styles.docButtonsRow}>
                  <PressableSpring onPress={handlePickCamera} disabled={uploadingDoc} style={styles.uploadDocBtn}>
                    <Icon name="camera" size={18} color={visual.focus} />
                    <ProDayText style={styles.uploadDocBtnText}>Caméra</ProDayText>
                  </PressableSpring>
                  <PressableSpring onPress={handlePickGallery} disabled={uploadingDoc} style={styles.uploadDocBtn}>
                    <Icon name="image" size={18} color={visual.focus} />
                    <ProDayText style={styles.uploadDocBtnText}>Galerie</ProDayText>
                  </PressableSpring>
                  <PressableSpring onPress={handlePickPdf} disabled={uploadingDoc} style={styles.uploadDocBtn}>
                    <Icon name="document-text" size={18} color={visual.focus} />
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
                placeholderTextColor={visual.textFaint}
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
                  <Icon name="trash" size={16} color={visual.danger} />
                </PressableSpring>
              </View>
            ) : (
              <View style={styles.docButtonsRow}>
                <PressableSpring onPress={handlePickCamera} disabled={uploadingDoc} style={styles.uploadDocBtn}>
                  <Icon name="camera" size={18} color={visual.focus} />
                  <ProDayText style={styles.uploadDocBtnText}>Caméra</ProDayText>
                </PressableSpring>
                <PressableSpring onPress={handlePickGallery} disabled={uploadingDoc} style={styles.uploadDocBtn}>
                  <Icon name="image" size={18} color={visual.focus} />
                  <ProDayText style={styles.uploadDocBtnText}>Galerie</ProDayText>
                </PressableSpring>
                <PressableSpring onPress={handlePickPdf} disabled={uploadingDoc} style={styles.uploadDocBtn}>
                  <Icon name="document-text" size={18} color={visual.focus} />
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

function createStyles(v: SignupVisualChrome) {
  return StyleSheet.create({
  container: { gap: spacing.md },
  section: { gap: spacing.xs },
  label: {
    fontSize: 12,
    fontFamily: fontFamily.bold,
    color: v.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sourceHint: {
    fontSize: 11,
    fontFamily: fontFamily.regular,
    color: v.textFaint,
    marginBottom: 4,
  },
  infoText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: v.textMuted,
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
    borderColor: v.border,
    backgroundColor: v.surface,
  },
  toggleBtnActive: { borderColor: v.accent, backgroundColor: v.accentSoft },
  toggleBtnText: { fontSize: 12, fontFamily: fontFamily.semibold, color: v.textMuted },
  toggleBtnTextActive: { color: v.focus, fontFamily: fontFamily.bold },
  searchWrapper: { gap: spacing.xs },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    height: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: v.border,
    backgroundColor: v.surface,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: v.text,
    paddingVertical: 0,
  },
  resultsList: {
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: v.border,
    overflow: 'hidden',
    backgroundColor: v.surface,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: v.border,
    gap: spacing.xs,
  },
  resultCol: { flex: 1, gap: 2 },
  resultTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  resultClubName: { fontSize: 14, fontFamily: fontFamily.semibold, color: v.text },
  resultCity: { fontSize: 12, fontFamily: fontFamily.regular, color: v.textMuted },
  fffBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: v.accentSoft,
  },
  fffBadgeText: { fontSize: 10, fontFamily: fontFamily.bold, color: v.focus },
  selectedClubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: v.accent,
    backgroundColor: 'rgba(245, 208, 74, 0.08)',
  },
  clubBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: v.focus,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubInfo: { flex: 1, gap: 2 },
  clubName: { fontSize: 15, fontFamily: fontFamily.bold, color: v.text },
  clubSub: { fontSize: 12, fontFamily: fontFamily.regular, color: v.textMuted },
  clubLeague: { fontSize: 11, fontFamily: fontFamily.regular, color: v.textFaint },
  changeClubBtn: { paddingHorizontal: 8, paddingVertical: 6 },
  changeClubBtnText: { fontSize: 12, fontFamily: fontFamily.bold, color: v.focus },
  categoriesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  categoryPill: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: v.border,
    backgroundColor: v.surface,
  },
  categoryPillActive: { borderColor: v.accent, backgroundColor: v.accentSoft },
  categoryPillText: { fontSize: 12, fontFamily: fontFamily.semibold, color: v.textMuted },
  categoryPillTextActive: { color: v.focus, fontFamily: fontFamily.bold },
  manualCategoryBox: { gap: spacing.xs, marginTop: 4 },
  manualCategoryInput: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: v.border,
    backgroundColor: v.surface,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: v.text,
  },
  selectedManualCat: {
    fontSize: 12,
    fontFamily: fontFamily.semibold,
    color: v.focus,
  },
  rosterContainer: { gap: spacing.sm },
  rosterHint: { fontSize: 12, fontFamily: fontFamily.regular, color: v.textMuted },
  rosterList: { gap: 6 },
  rosterItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: v.border,
    backgroundColor: v.surface,
  },
  rosterItemActive: { borderColor: v.accent, backgroundColor: v.accentSoft },
  rosterItemCol: { flex: 1, gap: 4 },
  rosterMemberName: { fontSize: 14, fontFamily: fontFamily.semibold, color: v.text },
  rosterMemberNameActive: { color: v.focus },
  rosterMemberMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  categoryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  categoryTagActive: { backgroundColor: 'rgba(245, 208, 74, 0.2)' },
  categoryTagText: { fontSize: 10, fontFamily: fontFamily.semibold, color: v.textMuted },
  categoryTagTextActive: { color: v.focus },
  rosterLicense: { fontSize: 11, fontFamily: fontFamily.regular, color: v.textMuted },
  selectedCheckBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(245, 208, 74, 0.2)',
  },
  selectedCheckText: { fontSize: 10, fontFamily: fontFamily.bold, color: v.focus },
  customProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: v.border,
    borderStyle: 'dashed',
  },
  customProfileBtnActive: { borderColor: v.accent, borderStyle: 'solid' },
  customProfileBtnText: { fontSize: 13, fontFamily: fontFamily.semibold, color: v.textMuted },
  customProfileBtnTextActive: { color: v.focus },
  customNameBox: { gap: 6, marginTop: 8 },
  customNameLabel: { fontSize: 12, fontFamily: fontFamily.semibold, color: v.textMuted },
  customNameInput: {
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: v.border,
    backgroundColor: v.surface,
    paddingHorizontal: spacing.sm,
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: v.text,
  },
  noRosterBox: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: v.border,
    backgroundColor: v.surface,
  },
  noRosterTitle: { fontSize: 13, fontFamily: fontFamily.bold, color: v.text, marginBottom: 4 },
  noRosterText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: v.textMuted,
    lineHeight: 16,
    marginBottom: 8,
  },
  docHint: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: v.textMuted,
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
  docAttachedTitle: { fontSize: 13, fontFamily: fontFamily.bold, color: v.text },
  docAttachedName: { fontSize: 11, fontFamily: fontFamily.regular, color: v.textMuted },
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
    borderColor: v.border,
    backgroundColor: v.surface,
  },
  uploadDocBtnText: { fontSize: 11, fontFamily: fontFamily.semibold, color: v.focus },
  errorText: { fontSize: 12, fontFamily: fontFamily.semibold, color: v.danger },
});
}
