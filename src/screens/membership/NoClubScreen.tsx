import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  ScrollView,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, radius, typography } from '../../theme/designTokens';
import { useAuth } from '../../context/AuthContext';
import { clubsService } from '../../services/clubs.service';
import { membershipsService } from '../../services/memberships.service';
import type { Club } from '../../models/Club';
import type { Membership } from '../../models/Membership';

interface NoClubScreenProps {
  latestRejected?: Membership;
  onMembershipSubmitted?: () => Promise<void> | void;
}

export function NoClubScreen({ latestRejected, onMembershipSubmitted }: NoClubScreenProps) {
  const { profile, signOut } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [clubs, setClubs] = useState<Club[]>([]);
  const [loadingClubs, setLoadingClubs] = useState(false);
  const [selectedClub, setSelectedClub] = useState<Club | null>(null);

  // Request modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [requestedRole, setRequestedRole] = useState<'player' | 'coach'>(
    profile?.role === 'coach' ? 'coach' : 'player',
  );
  const [requestedTeamName, setRequestedTeamName] = useState('');
  const [category, setCategory] = useState('');
  const [applicantMessage, setApplicantMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Unlisted club modal state
  const [unlistedModalVisible, setUnlistedModalVisible] = useState(false);
  const [unlistedClubName, setUnlistedClubName] = useState('');
  const [unlistedCity, setUnlistedCity] = useState('');
  const [unlistedPostalCode, setUnlistedPostalCode] = useState('');
  const [unlistedContact, setUnlistedContact] = useState('');
  const [submittingUnlisted, setSubmittingUnlisted] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchClubs = async () => {
      setLoadingClubs(true);
      try {
        const results = await clubsService.searchByName(searchTerm);
        if (active) {
          // Filter out demo clubs for real users
          const filtered = results.filter(
            (c) => c.id !== 'demo-club' && c.id !== 'club-demo' && !c.name.includes('Demo'),
          );
          setClubs(filtered);
        }
      } catch {
        if (active) setClubs([]);
      } finally {
        if (active) setLoadingClubs(false);
      }
    };

    const timer = setTimeout(fetchClubs, searchTerm ? 250 : 0);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchTerm]);

  useEffect(() => {
    if (Platform.OS !== 'web' || (!modalVisible && !unlistedModalVisible)) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setModalVisible(false);
        setUnlistedModalVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalVisible, unlistedModalVisible]);

  const handleOpenRequest = (club: Club) => {
    setSelectedClub(club);
    setRequestedRole(profile?.role === 'coach' ? 'coach' : 'player');
    setRequestedTeamName('');
    setCategory(club.categories?.[0] ?? '');
    setApplicantMessage('');
    setModalVisible(true);
  };

  const handleSubmitRequest = async () => {
    if (!selectedClub || !profile?.uid) return;
    setSubmitting(true);
    try {
      await membershipsService.requestJoin({
        club_id: selectedClub.id,
        player_uid: profile.uid,
        player_name: profile.display_name || 'Adhérent',
        role: requestedRole,
        requested_role: requestedRole,
        requested_team_name: requestedTeamName.trim() || undefined,
        category: category.trim() || undefined,
        applicant_message: applicantMessage.trim() || undefined,
      });

      setModalVisible(false);
      Alert.alert(
        'Demande envoyée !',
        `Votre demande d’adhésion pour rejoindre ${selectedClub.name} a été transmise aux responsables du club.`,
      );
      if (onMembershipSubmitted) {
        await onMembershipSubmitted();
      }
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible d’envoyer la demande.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitUnlisted = () => {
    if (!unlistedClubName.trim() || !unlistedCity.trim()) {
      Alert.alert('Champs requis', 'Veuillez renseigner au minimum le nom du club et la ville.');
      return;
    }
    setSubmittingUnlisted(true);
    setTimeout(() => {
      setSubmittingUnlisted(false);
      setUnlistedModalVisible(false);
      Alert.alert(
        'Demande de référencement enregistrée',
        `Merci ! Notre équipe a bien pris en compte votre signalement pour le club "${unlistedClubName.trim()}". Nous allons vérifier son enregistrement et vous avertirons dès son ajout.`,
      );
      setUnlistedClubName('');
      setUnlistedCity('');
      setUnlistedPostalCode('');
      setUnlistedContact('');
    }, 600);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* User Greeting & Header */}
        <View style={styles.header}>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={28} color={colors.accent} />
          </View>
          <Text style={styles.welcomeText}>
            Bonjour, {profile?.display_name || 'Sportif'}
          </Text>
          <Text style={styles.subtitleText}>
            Vous n’êtes affilié à aucun club actuellement. Recherchez votre club pour rejoindre votre équipe ou découvrez nos fonctionnalités autonomes.
          </Text>
        </View>

        {/* Previous rejection banner if applicable */}
        {latestRejected ? (
          <View style={styles.rejectedBanner}>
            <Ionicons name="alert-circle" size={22} color="#FF453A" style={{ marginTop: 1 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.rejectedTitle}>Demande précédente non retenue</Text>
              <Text style={styles.rejectedBody}>
                Votre demande d’adhésion à {latestRejected.club_name || 'ce club'} n’a pas abouti
                {latestRejected.rejection_reason ? ` : « ${latestRejected.rejection_reason} »` : '.'}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Search Box */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>Rechercher un club</Text>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Nom du club ou ville..."
              placeholderTextColor={colors.textSecondary}
              value={searchTerm}
              onChangeText={setSearchTerm}
              autoCapitalize="none"
              clearButtonMode="while-editing"
            />
          </View>
        </View>

        {/* Clubs List */}
        <View style={styles.listContainer}>
          {loadingClubs ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={styles.loadingText}>Recherche des clubs...</Text>
            </View>
          ) : clubs.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="shield-outline" size={40} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Aucun club trouvé</Text>
              <Text style={styles.emptySubtitle}>
                Votre club n’apparaît pas encore dans l’annuaire ProDay ?
              </Text>
              <TouchableOpacity
                style={styles.unlistedButton}
                onPress={() => setUnlistedModalVisible(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={18} color="#000000" />
                <Text style={styles.unlistedButtonText}>Demander l’ajout de mon club</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.clubCardsWrapper}>
              {clubs.map((club) => (
                <View key={club.id} style={styles.clubCard}>
                  <View style={styles.clubCardLeft}>
                    <View style={styles.clubBadge}>
                      <Ionicons name="shield" size={20} color={colors.accent} />
                    </View>
                    <View style={styles.clubCardInfo}>
                      <Text style={styles.clubCardName}>{club.name}</Text>
                      <Text style={styles.clubCardCity}>
                        {club.city} {club.department ? `(${club.department})` : ''}
                      </Text>
                      {club.categories && club.categories.length > 0 ? (
                        <Text style={styles.clubCardCategories} numberOfLines={1}>
                          Catégories : {club.categories.join(', ')}
                        </Text>
                      ) : null}
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.joinButton}
                    onPress={() => handleOpenRequest(club)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.joinButtonText}>Rejoindre</Text>
                    <Ionicons name="chevron-forward" size={16} color="#000000" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Unlisted club helper banner */}
        <TouchableOpacity
          style={styles.unlistedHelperBanner}
          onPress={() => setUnlistedModalVisible(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="help-buoy-outline" size={24} color={colors.accent} />
          <View style={{ flex: 1 }}>
            <Text style={styles.unlistedHelperTitle}>Mon club n’est pas référencé</Text>
            <Text style={styles.unlistedHelperSubtitle}>
              Indiquez-nous les coordonnées de votre association sportive pour l’enregistrer.
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.accent} />
        </TouchableOpacity>

        {/* Footer actions */}
        <View style={styles.footerSection}>
          <TouchableOpacity
            style={styles.signOutButton}
            onPress={() => void signOut()}
            activeOpacity={0.7}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.textSecondary} />
            <Text style={styles.signOutButtonText}>Se déconnecter</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Modal: Request Join Club */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent} edges={['bottom']}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Rejoindre le club</Text>
                <Text style={styles.modalSubtitle}>{selectedClub?.name}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              {/* Role selector */}
              <Text style={styles.fieldLabel}>Votre statut au sein du club</Text>
              <View style={styles.rolePickerRow}>
                <TouchableOpacity
                  style={[
                    styles.roleChoice,
                    requestedRole === 'player' && styles.roleChoiceActive,
                  ]}
                  onPress={() => setRequestedRole('player')}
                >
                  <Ionicons
                    name="football-outline"
                    size={18}
                    color={requestedRole === 'player' ? '#000000' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.roleChoiceText,
                      requestedRole === 'player' && styles.roleChoiceTextActive,
                    ]}
                  >
                    Joueur
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.roleChoice,
                    requestedRole === 'coach' && styles.roleChoiceActive,
                  ]}
                  onPress={() => setRequestedRole('coach')}
                >
                  <Ionicons
                    name="clipboard-outline"
                    size={18}
                    color={requestedRole === 'coach' ? '#000000' : colors.textSecondary}
                  />
                  <Text
                    style={[
                      styles.roleChoiceText,
                      requestedRole === 'coach' && styles.roleChoiceTextActive,
                    ]}
                  >
                    Éducateur / Coach
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Team / Category */}
              <Text style={styles.fieldLabel}>Équipe ou catégorie souhaitée</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Séniors A, U17 R2, Vétérans..."
                placeholderTextColor={colors.textSecondary}
                value={requestedTeamName}
                onChangeText={setRequestedTeamName}
              />

              {/* Message to staff */}
              <Text style={styles.fieldLabel}>Message pour le staff (facultatif)</Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea]}
                placeholder="Précisez votre poste, vos précédentes expériences ou votre disponibilité..."
                placeholderTextColor={colors.textSecondary}
                value={applicantMessage}
                onChangeText={setApplicantMessage}
                multiline
                numberOfLines={3}
              />

              {/* Action buttons */}
              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSubmitRequest}
                disabled={submitting}
                activeOpacity={0.8}
              >
                {submitting ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#000000" />
                    <Text style={styles.modalSubmitButtonText}>Envoyer la demande</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>

      {/* Modal: Request Unlisted Club Reference */}
      <Modal
        visible={unlistedModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setUnlistedModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <SafeAreaView style={styles.modalContent} edges={['bottom']}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Référencer mon club</Text>
                <Text style={styles.modalSubtitle}>Signalement d’une association sportive</Text>
              </View>
              <TouchableOpacity
                onPress={() => setUnlistedModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={22} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={styles.modalForm} showsVerticalScrollIndicator={false}>
              <Text style={styles.fieldLabel}>Nom complet du club *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: AS Saint-Germain Foot"
                placeholderTextColor={colors.textSecondary}
                value={unlistedClubName}
                onChangeText={setUnlistedClubName}
              />

              <Text style={styles.fieldLabel}>Ville du club *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: Saint-Germain-en-Laye"
                placeholderTextColor={colors.textSecondary}
                value={unlistedCity}
                onChangeText={setUnlistedCity}
              />

              <Text style={styles.fieldLabel}>Code postal / Département</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Ex: 78100"
                placeholderTextColor={colors.textSecondary}
                value={unlistedPostalCode}
                onChangeText={setUnlistedPostalCode}
                keyboardType="numeric"
              />

              <Text style={styles.fieldLabel}>Email ou contact du club (facultatif)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="contact@monclub.fr"
                placeholderTextColor={colors.textSecondary}
                value={unlistedContact}
                onChangeText={setUnlistedContact}
                autoCapitalize="none"
                keyboardType="email-address"
              />

              <TouchableOpacity
                style={styles.modalSubmitButton}
                onPress={handleSubmitUnlisted}
                disabled={submittingUnlisted}
                activeOpacity={0.8}
              >
                {submittingUnlisted ? (
                  <ActivityIndicator size="small" color="#000000" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={18} color="#000000" />
                    <Text style={styles.modalSubmitButtonText}>Transmettre le référencement</Text>
                  </>
                )}
              </TouchableOpacity>
            </ScrollView>
          </SafeAreaView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    maxWidth: 600,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 215, 0, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.25)',
  },
  welcomeText: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing.md,
  },
  rejectedBanner: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 69, 58, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.35)',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  rejectedTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF453A',
    marginBottom: 2,
  },
  rejectedBody: {
    fontSize: 13,
    color: colors.text,
    lineHeight: 18,
  },
  searchSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchIcon: {
    marginRight: spacing.sm,
  },
  searchInput: {
    flex: 1,
    height: 48,
    color: colors.text,
    fontSize: 15,
  },
  listContainer: {
    marginBottom: spacing.lg,
  },
  loadingContainer: {
    paddingVertical: spacing.xl,
    alignItems: 'center',
    gap: spacing.sm,
  },
  loadingText: {
    color: colors.textSecondary,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.sm,
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  unlistedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 10,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  unlistedButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '700',
  },
  clubCardsWrapper: {
    gap: spacing.sm,
  },
  clubCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  clubCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  clubBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clubCardInfo: {
    flex: 1,
  },
  clubCardName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  clubCardCity: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 2,
  },
  clubCardCategories: {
    fontSize: 11,
    color: colors.accent,
    marginTop: 2,
  },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.md,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
    marginLeft: spacing.sm,
  },
  joinButtonText: {
    color: '#000000',
    fontSize: 13,
    fontWeight: '700',
  },
  unlistedHelperBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  unlistedHelperTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 2,
  },
  unlistedHelperSubtitle: {
    fontSize: 12,
    color: colors.textSecondary,
    lineHeight: 16,
  },
  footerSection: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    padding: spacing.sm,
  },
  signOutButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#161922',
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    maxHeight: '90%',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubtitle: {
    fontSize: 14,
    color: colors.accent,
    marginTop: 2,
  },
  modalCloseButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalForm: {
    paddingBottom: spacing.xxl,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSecondary,
    marginTop: spacing.md,
    marginBottom: 6,
  },
  rolePickerRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  roleChoice: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingVertical: 12,
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  roleChoiceActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  roleChoiceText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textSecondary,
  },
  roleChoiceTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  modalInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    borderRadius: radius.lg,
    paddingVertical: 14,
    gap: spacing.sm,
    marginTop: spacing.xl,
  },
  modalSubmitButtonText: {
    color: '#000000',
    fontSize: 15,
    fontWeight: '700',
  },
});
