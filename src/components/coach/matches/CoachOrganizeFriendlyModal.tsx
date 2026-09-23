import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useCoachTheme } from '../../../features/coach/shell/CoachThemeContext';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { clubsService } from '../../../services/clubs.service';
import { teamsService } from '../../../services/teams.service';
import {
  friendlyMatchesService,
  type CoachOrganizeFriendlyMatchInput,
} from '../../../services/friendlyMatches.service';
import type { Club } from '../../../models/Club';
import type { Team } from '../../../models/Team';
import type { FriendlyVenueSide } from '../../../models/FriendlyMatch';
import { CoachText } from '../coachPortalUi';
import { PressableSpring } from '../../motion';
import { prodayHaptics } from '../../../utils/prodayHaptics';
import { formatFrenchDate, parseFrenchDate } from '../../../utils/parseFrenchDate';
import { radius, spacing } from '../../../theme/designTokens';
import { withAlpha } from '../../../utils/coachTeamTheme';

export interface CoachOrganizeFriendlyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (friendlyMatchId: string, eventId: string) => void;
  initialTeamId?: string;
}

type Step = 1 | 2 | 3 | 4;

const CATEGORIES = [
  'U11',
  'U12',
  'U13',
  'U14',
  'U15',
  'U16',
  'U17',
  'U18',
  'U19',
  'Seniors',
  'Vétérans',
  'Féminines',
];

const GAME_FORMATS: { id: 'foot_11' | 'foot_8' | 'futsal' | 'foot_5'; label: string; defaultHalf: number }[] = [
  { id: 'foot_11', label: 'Foot à 11', defaultHalf: 45 },
  { id: 'foot_8', label: 'Foot à 8', defaultHalf: 30 },
  { id: 'futsal', label: 'Futsal', defaultHalf: 25 },
  { id: 'foot_5', label: 'Foot à 5', defaultHalf: 25 },
];

const HALF_DURATIONS = [25, 30, 35, 40, 45];

const VENUE_OPTIONS: { id: FriendlyVenueSide; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { id: 'home', label: 'Domicile', icon: 'home-outline' },
  { id: 'away', label: 'Extérieur', icon: 'airplane-outline' },
  { id: 'neutral', label: 'Terrain neutre', icon: 'pin-outline' },
];

const REFEREE_PRESETS = [
  'Arbitre officiel FFF',
  'Arbitrage bénévole mi-temps par mi-temps',
  'Arbitre club recevant',
];

export const CoachOrganizeFriendlyModal: React.FC<CoachOrganizeFriendlyModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialTeamId,
}) => {
  const { tokens, coachTeams, teamId: currentTeamId } = useCoachTheme();
  const profile = useSessionProfile();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Équipe coach
  const [selectedTeamId, setSelectedTeamId] = useState<string>(initialTeamId || currentTeamId || '');
  const [customTeamName, setCustomTeamName] = useState('');
  const [customTeamCategory, setCustomTeamCategory] = useState('Seniors');

  // Step 2: Adversaire
  const [isExternalOpponent, setIsExternalOpponent] = useState(false);
  // ProDay search
  const [searchQuery, setSearchQuery] = useState('');
  const [searchingClubs, setSearchingClubs] = useState(false);
  const [clubResults, setClubResults] = useState<Club[]>([]);
  const [selectedOpponentClub, setSelectedOpponentClub] = useState<Club | null>(null);
  const [opponentClubTeams, setOpponentClubTeams] = useState<Team[]>([]);
  const [loadingOpponentTeams, setLoadingOpponentTeams] = useState(false);
  const [selectedOpponentTeamId, setSelectedOpponentTeamId] = useState<string | null>(null);
  // External opponent
  const [externalClubName, setExternalClubName] = useState('');
  const [externalCity, setExternalCity] = useState('');
  const [externalContactName, setExternalContactName] = useState('');
  const [externalContactPhone, setExternalContactPhone] = useState('');
  const [externalContactEmail, setExternalContactEmail] = useState('');

  // Step 3: Paramètres sportifs & logistiques
  const [category, setCategory] = useState('U15');
  const [gameFormat, setGameFormat] = useState<'foot_11' | 'foot_8' | 'futsal' | 'foot_5'>('foot_11');
  const [dateStr, setDateStr] = useState('');
  const [kickoffTime, setKickoffTime] = useState('15:00');
  const [meetingTime, setMeetingTime] = useState('14:00');
  const [timezone] = useState('Europe/Paris');
  const [venueSide, setVenueSide] = useState<FriendlyVenueSide>('home');
  const [venueAddress, setVenueAddress] = useState('');
  const [city, setCity] = useState(profile?.city || '');
  // Consignes
  const [halfDuration, setHalfDuration] = useState(45);
  const [jerseysNotes, setJerseysNotes] = useState('Couleurs principales du club');
  const [refereeingNotes, setRefereeingNotes] = useState('Arbitrage bénévole mi-temps par mi-temps');
  const [hostingNotes, setHostingNotes] = useState('Vestiaires ouverts 1h avant le coup d’envoi');
  const [additionalNotes, setAdditionalNotes] = useState('');

  // Initialisation à l'ouverture
  useEffect(() => {
    if (visible) {
      setCurrentStep(1);
      const defaultTeam = coachTeams.find((t) => t.id === (initialTeamId || currentTeamId)) || coachTeams[0];
      if (defaultTeam) {
        setSelectedTeamId(defaultTeam.id);
        if (defaultTeam.category) {
          setCategory(defaultTeam.category);
        }
      }
      // Date par défaut : samedi prochain
      const now = new Date();
      const nextSat = new Date();
      nextSat.setDate(now.getDate() + ((6 - now.getDay() + 7) % 7 || 7));
      setDateStr(formatFrenchDate(nextSat));
      setCity(profile?.city || '');
    }
  }, [visible, initialTeamId, currentTeamId, coachTeams, profile?.city]);

  // Résolution du nom d'équipe du coach
  const activeCoachTeam = useMemo(() => {
    return coachTeams.find((t) => t.id === selectedTeamId);
  }, [coachTeams, selectedTeamId]);

  const coachTeamLabel = activeCoachTeam?.name || customTeamName || 'Mon équipe';

  // Recherche dynamique clubs ProDay
  useEffect(() => {
    if (isExternalOpponent) return;
    const term = searchQuery.trim();
    if (!term || term.length < 2) {
      setClubResults([]);
      return;
    }

    let active = true;
    setSearchingClubs(true);
    const timer = setTimeout(async () => {
      try {
        const list = await clubsService.searchByName(term);
        if (active) {
          // Filtrer son propre club
          const myClubId = profile?.profile?.club_id;
          const filtered = list.filter((c) => c.id !== myClubId);
          setClubResults(filtered.slice(0, 10));
        }
      } catch {
        if (active) setClubResults([]);
      } finally {
        if (active) setSearchingClubs(false);
      }
    }, 250);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [searchQuery, isExternalOpponent, profile?.profile?.club_id]);

  // Chargement équipes du club adverse ProDay sélectionné
  const handleSelectOpponentClub = useCallback(async (club: Club) => {
    prodayHaptics.selection();
    setSelectedOpponentClub(club);
    setSearchQuery('');
    setClubResults([]);
    setSelectedOpponentTeamId(null);
    setLoadingOpponentTeams(true);
    try {
      const teams = await teamsService.listByClubId(club.id);
      setOpponentClubTeams(teams);
      if (teams.length > 0) {
        setSelectedOpponentTeamId(teams[0].id);
      }
    } catch {
      setOpponentClubTeams([]);
    } finally {
      setLoadingOpponentTeams(false);
    }
  }, []);

  // Opponent display label
  const opponentLabel = useMemo(() => {
    if (isExternalOpponent) {
      return externalClubName.trim() || 'Adversaire externe';
    }
    if (selectedOpponentClub) {
      const team = opponentClubTeams.find((t) => t.id === selectedOpponentTeamId);
      return team ? `${selectedOpponentClub.name} (${team.name})` : selectedOpponentClub.name;
    }
    return 'Adversaire non sélectionné';
  }, [isExternalOpponent, externalClubName, selectedOpponentClub, opponentClubTeams, selectedOpponentTeamId]);

  // Validation par étape
  const isStep1Valid = Boolean(selectedTeamId || customTeamName.trim());
  const isStep2Valid = isExternalOpponent
    ? Boolean(externalClubName.trim() && externalCity.trim())
    : Boolean(selectedOpponentClub);
  const isStep3Valid = Boolean(
    category.trim() &&
      parseFrenchDate(dateStr) &&
      kickoffTime.trim() &&
      city.trim(),
  );

  const handleNextStep = () => {
    prodayHaptics.press();
    if (currentStep === 1 && isStep1Valid) {
      setCurrentStep(2);
    } else if (currentStep === 2 && isStep2Valid) {
      setCurrentStep(3);
    } else if (currentStep === 3 && isStep3Valid) {
      setCurrentStep(4);
    }
  };

  const handlePrevStep = () => {
    prodayHaptics.press();
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as Step);
    }
  };

  // Soumission finale
  const handleSubmit = async (action: 'invite' | 'confirm' | 'draft') => {
    const coachUid = profile?.uid;
    const clubId = profile?.profile?.club_id;
    if (!coachUid || !clubId) {
      Alert.alert('Action non autorisée', 'Votre profil doit être rattaché à un club pour organiser un match amical.');
      return;
    }

    const parsedDate = parseFrenchDate(dateStr);
    if (!parsedDate) {
      Alert.alert('Date invalide', 'Veuillez saisir une date valide au format JJ/MM/AAAA.');
      return;
    }

    setSubmitting(true);
    prodayHaptics.impactMedium();

    try {
      const oppTeam = opponentClubTeams.find((t) => t.id === selectedOpponentTeamId);
      const opponentClubName = isExternalOpponent
        ? externalClubName.trim()
        : selectedOpponentClub?.name || 'Adversaire';

      const payload: CoachOrganizeFriendlyMatchInput = {
        coachUid,
        coachName: profile.display_name || 'Coach',
        clubId,
        clubName: profile.display_name ? `${profile.display_name} Club` : 'Club',
        teamId: selectedTeamId || 'default',
        teamLabel: coachTeamLabel,
        isExternalOpponent,
        opponentClubId: isExternalOpponent ? undefined : selectedOpponentClub?.id,
        opponentClubName,
        opponentTeamId: isExternalOpponent ? undefined : selectedOpponentTeamId || undefined,
        opponentTeamLabel: oppTeam?.name,
        opponentCity: isExternalOpponent ? externalCity.trim() : selectedOpponentClub?.city,
        opponentContact: isExternalOpponent
          ? {
              name: externalContactName.trim() || undefined,
              phone: externalContactPhone.trim() || undefined,
              email: externalContactEmail.trim() || undefined,
            }
          : undefined,
        category,
        gameFormat,
        date: parsedDate,
        kickoffTime,
        meetingTime: meetingTime.trim() || undefined,
        timezone,
        venueSide,
        venueAddress: venueAddress.trim() || undefined,
        city: city.trim() || profile?.city || 'Paris',
        rules: {
          halfDurationMinutes: halfDuration,
          jerseysNotes: jerseysNotes.trim() || undefined,
          refereeingNotes: refereeingNotes.trim() || undefined,
          hostingNotes: hostingNotes.trim() || undefined,
        },
        notes: additionalNotes.trim() || undefined,
        action,
      };

      const result = await friendlyMatchesService.organizeCoachFriendlyMatch(payload);

      prodayHaptics.confirm();

      const successTitle =
        action === 'draft'
          ? 'Brouillon enregistré'
          : action === 'confirm'
          ? 'Match amical confirmé'
          : 'Invitation envoyée !';

      const successMsg =
        action === 'draft'
          ? 'Votre match amical est sauvegardé en brouillon et accessible dans votre calendrier.'
          : action === 'confirm'
          ? `Le match amical contre ${opponentClubName} est planifié. Convocations, tactique, covoiturage et feuille de match sont prêts !`
          : `L'invitation a été transmise à ${opponentClubName}. Le créneau est réservé dans votre calendrier coach et club.`;

      Alert.alert(successTitle, successMsg, [
        {
          text: 'Super',
          onPress: () => {
            onSuccess?.(result.friendlyMatchId, result.eventId);
            onClose();
          },
        },
      ]);
    } catch (err) {
      prodayHaptics.error();
      const message = err instanceof Error ? err.message : 'Une erreur est survenue lors de la création.';
      Alert.alert('Erreur', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: tokens.bg }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: tokens.border }]}>
          <View style={styles.headerLeft}>
            <MaterialCommunityIcons name="soccer" size={24} color={tokens.accent} />
            <View>
              <CoachText variant="title" style={styles.headerTitle}>
                Organiser un amical
              </CoachText>
              <CoachText variant="caption" muted>
                Étape {currentStep} sur 4 · {
                  currentStep === 1
                    ? 'Mon équipe'
                    : currentStep === 2
                    ? 'Adversaire'
                    : currentStep === 3
                    ? 'Paramètres sportifs'
                    : 'Récapitulatif & validation'
                }
              </CoachText>
            </View>
          </View>
          <Pressable onPress={onClose} style={styles.closeBtn} accessibilityRole="button" accessibilityLabel="Fermer">
            <Ionicons name="close" size={22} color={tokens.foreground} />
          </Pressable>
        </View>

        {/* Progress Bar */}
        <View style={[styles.progressTrack, { backgroundColor: tokens.border }]}>
          <View
            style={[
              styles.progressBar,
              { backgroundColor: tokens.accent, width: `${(currentStep / 4) * 100}%` },
            ]}
          />
        </View>

        {/* Body Content */}
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* STEP 1: SÉLECTION DE L'ÉQUIPE */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepBadgeRow}>
                <View style={[styles.stepNumBadge, { backgroundColor: tokens.accent }]}>
                  <CoachText variant="caption" style={styles.stepNumText}>1</CoachText>
                </View>
                <CoachText variant="section" style={styles.stepTitle}>
                  Sélectionnez votre équipe
                </CoachText>
              </View>
              <CoachText variant="body" muted style={styles.stepSubtitle}>
                Choisissez l’effectif assigné qui disputera cette rencontre amicale.
              </CoachText>

              {coachTeams.length > 0 ? (
                <View style={styles.teamList}>
                  {coachTeams.map((team) => {
                    const isSelected = selectedTeamId === team.id;
                    return (
                      <PressableSpring
                        key={team.id}
                        onPress={() => {
                          prodayHaptics.selection();
                          setSelectedTeamId(team.id);
                          if (team.category) setCategory(team.category);
                        }}
                        style={[
                          styles.teamCard,
                          {
                            borderColor: isSelected ? tokens.accent : tokens.border,
                            backgroundColor: isSelected ? withAlpha(tokens.accent, 0.08) : tokens.surface,
                          },
                        ]}
                      >
                        <View style={styles.teamCardLeft}>
                          <View
                            style={[
                              styles.teamIconCircle,
                              { backgroundColor: isSelected ? tokens.accent : tokens.border },
                            ]}
                          >
                            <Ionicons
                              name="shirt-outline"
                              size={18}
                              color={isSelected ? '#000' : tokens.muted}
                            />
                          </View>
                          <View>
                            <CoachText variant="body" style={styles.teamCardName}>
                              {team.name}
                            </CoachText>
                            {team.category ? (
                              <CoachText variant="caption" muted>
                                Catégorie {team.category}
                              </CoachText>
                            ) : null}
                          </View>
                        </View>
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={isSelected ? tokens.accent : tokens.muted}
                        />
                      </PressableSpring>
                    );
                  })}
                </View>
              ) : (
                <View style={styles.customTeamForm}>
                  <CoachText variant="caption" muted style={styles.inputLabel}>
                    Nom de l'équipe
                  </CoachText>
                  <TextInput
                    style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                    placeholder="Ex: Seniors R2, U17 Nationaux..."
                    placeholderTextColor={tokens.muted}
                    value={customTeamName}
                    onChangeText={setCustomTeamName}
                  />
                  <CoachText variant="caption" muted style={[styles.inputLabel, { marginTop: spacing.md }]}>
                    Catégorie
                  </CoachText>
                  <TextInput
                    style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                    placeholder="Ex: U15, U17, Seniors..."
                    placeholderTextColor={tokens.muted}
                    value={customTeamCategory}
                    onChangeText={setCustomTeamCategory}
                  />
                </View>
              )}
            </View>
          )}

          {/* STEP 2: RECHERCHE DE L'ADVERSAIRE */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepBadgeRow}>
                <View style={[styles.stepNumBadge, { backgroundColor: tokens.accent }]}>
                  <CoachText variant="caption" style={styles.stepNumText}>2</CoachText>
                </View>
                <CoachText variant="section" style={styles.stepTitle}>
                  Recherche de l'adversaire
                </CoachText>
              </View>
              <CoachText variant="body" muted style={styles.stepSubtitle}>
                Sélectionnez un club inscrit sur ProDay pour envoyer une invitation directe, ou saisissez un adversaire externe.
              </CoachText>

              {/* Segmented control : ProDay vs Externe */}
              <View style={[styles.segmentedRow, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <Pressable
                  style={[styles.segmentBtn, !isExternalOpponent && { backgroundColor: tokens.accent }]}
                  onPress={() => {
                    prodayHaptics.selection();
                    setIsExternalOpponent(false);
                  }}
                >
                  <Ionicons
                    name="shield-checkmark"
                    size={16}
                    color={!isExternalOpponent ? '#000' : tokens.muted}
                  />
                  <CoachText
                    variant="caption"
                    style={[styles.segmentLabel, !isExternalOpponent && styles.segmentLabelActive]}
                  >
                    Club ProDay
                  </CoachText>
                </Pressable>

                <Pressable
                  style={[styles.segmentBtn, isExternalOpponent && { backgroundColor: tokens.accent }]}
                  onPress={() => {
                    prodayHaptics.selection();
                    setIsExternalOpponent(true);
                  }}
                >
                  <Ionicons
                    name="globe-outline"
                    size={16}
                    color={isExternalOpponent ? '#000' : tokens.muted}
                  />
                  <CoachText
                    variant="caption"
                    style={[styles.segmentLabel, isExternalOpponent && styles.segmentLabelActive]}
                  >
                    Adversaire externe
                  </CoachText>
                </Pressable>
              </View>

              {/* Mode ProDay */}
              {!isExternalOpponent && (
                <View style={styles.prodaySection}>
                  {selectedOpponentClub ? (
                    <View
                      style={[
                        styles.selectedOpponentCard,
                        { borderColor: tokens.accent, backgroundColor: withAlpha(tokens.accent, 0.08) },
                      ]}
                    >
                      <View style={styles.selectedClubRow}>
                        <Ionicons name="shield-checkmark" size={24} color={tokens.accent} />
                        <View style={{ flex: 1, marginLeft: spacing.sm }}>
                          <CoachText variant="section" style={styles.selectedClubName}>
                            {selectedOpponentClub.name}
                          </CoachText>
                          <CoachText variant="caption" muted>
                            {selectedOpponentClub.city} {selectedOpponentClub.department ? `(${selectedOpponentClub.department})` : ''} · Club certifié ProDay
                          </CoachText>
                        </View>
                        <PressableSpring
                          onPress={() => {
                            setSelectedOpponentClub(null);
                            setSelectedOpponentTeamId(null);
                            setOpponentClubTeams([]);
                          }}
                          style={[styles.changeOpponentBtn, { borderColor: tokens.border }]}
                        >
                          <CoachText variant="caption" accent>
                            Changer
                          </CoachText>
                        </PressableSpring>
                      </View>

                      {/* Équipes du club adverse */}
                      <View style={styles.opponentTeamsWrapper}>
                        <CoachText variant="caption" muted style={{ marginBottom: spacing.xs }}>
                          Équipe adverse cible :
                        </CoachText>
                        {loadingOpponentTeams ? (
                          <ActivityIndicator color={tokens.accent} size="small" />
                        ) : opponentClubTeams.length > 0 ? (
                          <View style={styles.chipsWrap}>
                            {opponentClubTeams.map((t) => {
                              const active = selectedOpponentTeamId === t.id;
                              return (
                                <Pressable
                                  key={t.id}
                                  onPress={() => setSelectedOpponentTeamId(t.id)}
                                  style={[
                                    styles.choiceChip,
                                    {
                                      borderColor: active ? tokens.accent : tokens.border,
                                      backgroundColor: active ? tokens.accent : tokens.surface,
                                    },
                                  ]}
                                >
                                  <CoachText
                                    variant="caption"
                                    style={{ color: active ? '#000' : tokens.foreground, fontWeight: '700' }}
                                  >
                                    {t.name}
                                  </CoachText>
                                </Pressable>
                              );
                            })}
                          </View>
                        ) : (
                          <CoachText variant="caption" muted>
                            Effectif général du club
                          </CoachText>
                        )}
                      </View>
                    </View>
                  ) : (
                    <>
                      <View
                        style={[
                          styles.searchBox,
                          { borderColor: tokens.border, backgroundColor: tokens.surface },
                        ]}
                      >
                        <Ionicons name="search" size={18} color={tokens.muted} />
                        <TextInput
                          style={[styles.searchInput, { color: tokens.foreground }]}
                          placeholder="Rechercher par nom de club ou ville..."
                          placeholderTextColor={tokens.muted}
                          value={searchQuery}
                          onChangeText={setSearchQuery}
                          autoCapitalize="none"
                        />
                        {searchingClubs ? (
                          <ActivityIndicator size="small" color={tokens.accent} />
                        ) : searchQuery ? (
                          <Pressable onPress={() => setSearchQuery('')}
                            accessibilityRole="button"
                            accessibilityLabel="Fermer">
                            <Ionicons name="close-circle" size={18} color={tokens.muted} />
                          </Pressable>
                        ) : null}
                      </View>

                      {/* Résultats de recherche */}
                      {clubResults.length > 0 ? (
                        <View style={styles.resultsList}>
                          {clubResults.map((club) => (
                            <PressableSpring
                              key={club.id}
                              onPress={() => handleSelectOpponentClub(club)}
                              style={[
                                styles.clubResultCard,
                                { borderColor: tokens.border, backgroundColor: tokens.surface },
                              ]}
                            >
                              <View style={styles.clubResultIcon}>
                                <Ionicons name="shield-outline" size={18} color={tokens.accent} />
                              </View>
                              <View style={{ flex: 1 }}>
                                <CoachText variant="body" style={{ fontWeight: '700' }}>
                                  {club.name}
                                </CoachText>
                                <CoachText variant="caption" muted>
                                  {club.city} {club.department ? `· Dép. ${club.department}` : ''}
                                </CoachText>
                              </View>
                              <Ionicons name="chevron-forward" size={16} color={tokens.muted} />
                            </PressableSpring>
                          ))}
                        </View>
                      ) : searchQuery.length >= 2 && !searchingClubs ? (
                        <View style={[styles.noResultCard, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
                          <Ionicons name="search-outline" size={24} color={tokens.muted} />
                          <CoachText variant="caption" muted style={{ textAlign: 'center', marginTop: 6 }}>
                            Aucun club ProDay trouvé pour « {searchQuery} ».{'\n'}
                            Vous pouvez basculer sur l’option « Adversaire externe ».
                          </CoachText>
                        </View>
                      ) : null}
                    </>
                  )}
                </View>
              )}

              {/* Mode Adversaire Externe */}
              {isExternalOpponent && (
                <View style={styles.externalSection}>
                  <View style={[styles.externalNotice, { backgroundColor: withAlpha(tokens.accent, 0.08), borderColor: tokens.accent }]}>
                    <Ionicons name="information-circle-outline" size={18} color={tokens.accent} />
                    <CoachText variant="caption" style={{ flex: 1, marginLeft: 8 }}>
                      Pour les clubs non encore inscrits sur ProDay. Le match sera planifié dans votre calendrier, avec covoiturage, convocations et feuille de match.
                    </CoachText>
                  </View>

                  <CoachText variant="caption" muted style={styles.inputLabel}>
                    Nom du club adverse *
                  </CoachText>
                  <TextInput
                    style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                    placeholder="Ex: AS Saint-Ouen, FC Montrouge..."
                    placeholderTextColor={tokens.muted}
                    value={externalClubName}
                    onChangeText={setExternalClubName}
                  />

                  <CoachText variant="caption" muted style={[styles.inputLabel, { marginTop: spacing.md }]}>
                    Ville de l'adversaire *
                  </CoachText>
                  <TextInput
                    style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                    placeholder="Ex: Saint-Ouen, Montrouge..."
                    placeholderTextColor={tokens.muted}
                    value={externalCity}
                    onChangeText={setExternalCity}
                  />

                  <View style={[styles.contactBox, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
                    <CoachText variant="caption" style={{ fontWeight: '800', marginBottom: spacing.xs, color: tokens.accent }}>
                      COORDONNÉES DU RESPONSABLE ADVERSE (OPTIONNEL)
                    </CoachText>
                    <CoachText variant="caption" muted style={styles.inputLabel}>
                      Nom du contact / coach
                    </CoachText>
                    <TextInput
                      style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.bg }]}
                      placeholder="Ex: Julien Dupont"
                      placeholderTextColor={tokens.muted}
                      value={externalContactName}
                      onChangeText={setExternalContactName}
                    />

                    <CoachText variant="caption" muted style={[styles.inputLabel, { marginTop: spacing.sm }]}>
                      Numéro de téléphone
                    </CoachText>
                    <TextInput
                      style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.bg }]}
                      placeholder="Ex: 06 12 34 56 78"
                      placeholderTextColor={tokens.muted}
                      keyboardType="phone-pad"
                      value={externalContactPhone}
                      onChangeText={setExternalContactPhone}
                    />

                    <CoachText variant="caption" muted style={[styles.inputLabel, { marginTop: spacing.sm }]}>
                      Adresse email
                    </CoachText>
                    <TextInput
                      style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.bg }]}
                      placeholder="Ex: contact@club-adverse.fr"
                      placeholderTextColor={tokens.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={externalContactEmail}
                      onChangeText={setExternalContactEmail}
                    />
                  </View>
                </View>
              )}
            </View>
          )}

          {/* STEP 3: PARAMÈTRES SPORTIFS & LOGISTIQUES */}
          {currentStep === 3 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepBadgeRow}>
                <View style={[styles.stepNumBadge, { backgroundColor: tokens.accent }]}>
                  <CoachText variant="caption" style={styles.stepNumText}>3</CoachText>
                </View>
                <CoachText variant="section" style={styles.stepTitle}>
                  Paramètres sportifs & logistiques
                </CoachText>
              </View>

              {/* Catégorie d'âge */}
              <CoachText variant="caption" muted style={styles.inputLabel}>
                Catégorie d'âge
              </CoachText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalChips}>
                {CATEGORIES.map((cat) => {
                  const on = category === cat;
                  return (
                    <Pressable
                      key={cat}
                      onPress={() => setCategory(cat)}
                      style={[
                        styles.choiceChip,
                        {
                          borderColor: on ? tokens.accent : tokens.border,
                          backgroundColor: on ? tokens.accent : tokens.surface,
                        },
                      ]}
                    >
                      <CoachText variant="caption" style={{ color: on ? '#000' : tokens.foreground, fontWeight: '700' }}>
                        {cat}
                      </CoachText>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Format de jeu */}
              <CoachText variant="caption" muted style={[styles.inputLabel, { marginTop: spacing.md }]}>
                Format de jeu
              </CoachText>
              <View style={styles.chipsWrap}>
                {GAME_FORMATS.map((fmt) => {
                  const on = gameFormat === fmt.id;
                  return (
                    <Pressable
                      key={fmt.id}
                      onPress={() => {
                        setGameFormat(fmt.id);
                        setHalfDuration(fmt.defaultHalf);
                      }}
                      style={[
                        styles.formatChip,
                        {
                          borderColor: on ? tokens.accent : tokens.border,
                          backgroundColor: on ? withAlpha(tokens.accent, 0.12) : tokens.surface,
                        },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={fmt.id === 'futsal' ? 'soccer-field' : 'soccer'}
                        size={16}
                        color={on ? tokens.accent : tokens.muted}
                      />
                      <CoachText
                        variant="caption"
                        style={{ color: on ? tokens.accent : tokens.foreground, fontWeight: '700', marginLeft: 6 }}
                      >
                        {fmt.label}
                      </CoachText>
                    </Pressable>
                  );
                })}
              </View>

              {/* Date & Horaires */}
              <View style={[styles.formGridRow, { marginTop: spacing.md }]}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <CoachText variant="caption" muted style={styles.inputLabel}>
                    Date du match (JJ/MM/AAAA) *
                  </CoachText>
                  <TextInput
                    style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                    placeholder="JJ/MM/AAAA"
                    placeholderTextColor={tokens.muted}
                    value={dateStr}
                    onChangeText={setDateStr}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <CoachText variant="caption" muted style={styles.inputLabel}>
                    Coup d'envoi (HH:MM) *
                  </CoachText>
                  <TextInput
                    style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                    placeholder="15:00"
                    placeholderTextColor={tokens.muted}
                    value={kickoffTime}
                    onChangeText={setKickoffTime}
                  />
                </View>
              </View>

              <View style={[styles.formGridRow, { marginTop: spacing.sm }]}>
                <View style={{ flex: 1, marginRight: spacing.sm }}>
                  <CoachText variant="caption" muted style={styles.inputLabel}>
                    RDV Vestiaire (HH:MM)
                  </CoachText>
                  <TextInput
                    style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                    placeholder="14:00"
                    placeholderTextColor={tokens.muted}
                    value={meetingTime}
                    onChangeText={setMeetingTime}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <CoachText variant="caption" muted style={styles.inputLabel}>
                    Fuseau horaire
                  </CoachText>
                  <View style={[styles.inputDisabled, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
                    <CoachText variant="caption" style={{ color: tokens.foreground }}>
                      {timezone}
                    </CoachText>
                  </View>
                </View>
              </View>

              {/* Lieu & Adresse */}
              <CoachText variant="caption" muted style={[styles.inputLabel, { marginTop: spacing.md }]}>
                Lieu de la rencontre
              </CoachText>
              <View style={styles.chipsWrap}>
                {VENUE_OPTIONS.map((v) => {
                  const on = venueSide === v.id;
                  return (
                    <Pressable
                      key={v.id}
                      onPress={() => setVenueSide(v.id)}
                      style={[
                        styles.choiceChipWithIcon,
                        {
                          borderColor: on ? tokens.accent : tokens.border,
                          backgroundColor: on ? tokens.accent : tokens.surface,
                        },
                      ]}
                    >
                      <Ionicons name={v.icon} size={15} color={on ? '#000' : tokens.muted} />
                      <CoachText variant="caption" style={{ color: on ? '#000' : tokens.foreground, fontWeight: '700', marginLeft: 4 }}>
                        {v.label}
                      </CoachText>
                    </Pressable>
                  );
                })}
              </View>

              <View style={[styles.formGridRow, { marginTop: spacing.sm }]}>
                <View style={{ flex: 1.5, marginRight: spacing.sm }}>
                  <CoachText variant="caption" muted style={styles.inputLabel}>
                    Stade / Adresse
                  </CoachText>
                  <TextInput
                    style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                    placeholder="Ex: Stade Jean Bouin, 12 rue du Stade"
                    placeholderTextColor={tokens.muted}
                    value={venueAddress}
                    onChangeText={setVenueAddress}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <CoachText variant="caption" muted style={styles.inputLabel}>
                    Ville *
                  </CoachText>
                  <TextInput
                    style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                    placeholder="Ex: Paris"
                    placeholderTextColor={tokens.muted}
                    value={city}
                    onChangeText={setCity}
                  />
                </View>
              </View>

              {/* Consignes spécifiques */}
              <CoachText variant="caption" muted style={[styles.inputLabel, { marginTop: spacing.md }]}>
                Durée des mi-temps
              </CoachText>
              <View style={styles.chipsWrap}>
                {HALF_DURATIONS.map((dur) => {
                  const on = halfDuration === dur;
                  return (
                    <Pressable
                      key={dur}
                      onPress={() => setHalfDuration(dur)}
                      style={[
                        styles.choiceChip,
                        {
                          borderColor: on ? tokens.accent : tokens.border,
                          backgroundColor: on ? tokens.accent : tokens.surface,
                        },
                      ]}
                    >
                      <CoachText variant="caption" style={{ color: on ? '#000' : tokens.foreground, fontWeight: '700' }}>
                        2 x {dur} min
                      </CoachText>
                    </Pressable>
                  );
                })}
              </View>

              <CoachText variant="caption" muted style={[styles.inputLabel, { marginTop: spacing.sm }]}>
                Consignes maillots
              </CoachText>
              <TextInput
                style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                placeholder="Ex: Bleu domicile (prévoir jeu blanc alternatif)"
                placeholderTextColor={tokens.muted}
                value={jerseysNotes}
                onChangeText={setJerseysNotes}
              />

              <CoachText variant="caption" muted style={[styles.inputLabel, { marginTop: spacing.sm }]}>
                Arbitrage
              </CoachText>
              <TextInput
                style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                placeholder="Ex: Arbitre officiel désigné ou arbitrage partagé"
                placeholderTextColor={tokens.muted}
                value={refereeingNotes}
                onChangeText={setRefereeingNotes}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.presetChips}>
                {REFEREE_PRESETS.map((preset) => (
                  <Pressable
                    key={preset}
                    onPress={() => setRefereeingNotes(preset)}
                    style={[styles.presetChip, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
                  >
                    <CoachText variant="caption" muted style={{ fontSize: 11 }}>
                      {preset}
                    </CoachText>
                  </Pressable>
                ))}
              </ScrollView>

              <CoachText variant="caption" muted style={[styles.inputLabel, { marginTop: spacing.sm }]}>
                Consignes d'accueil & collation
              </CoachText>
              <TextInput
                style={[styles.input, { borderColor: tokens.border, color: tokens.foreground, backgroundColor: tokens.surface }]}
                placeholder="Ex: Collation offerte au club-house après la rencontre"
                placeholderTextColor={tokens.muted}
                value={hostingNotes}
                onChangeText={setHostingNotes}
              />
            </View>
          )}

          {/* STEP 4: RÉCAPITULATIF ET VALIDATION */}
          {currentStep === 4 && (
            <View style={styles.stepContainer}>
              <View style={styles.stepBadgeRow}>
                <View style={[styles.stepNumBadge, { backgroundColor: tokens.accent }]}>
                  <CoachText variant="caption" style={styles.stepNumText}>4</CoachText>
                </View>
                <CoachText variant="section" style={styles.stepTitle}>
                  Récapitulatif & validation
                </CoachText>
              </View>

              {/* Main Summary Card */}
              <View style={[styles.summaryCard, { borderColor: tokens.accent, backgroundColor: tokens.surface }]}>
                <View style={styles.matchupRow}>
                  <View style={styles.matchupSide}>
                    <Ionicons name="shield" size={24} color={tokens.accent} />
                    <CoachText variant="body" style={styles.matchupTeamName}>
                      {coachTeamLabel}
                    </CoachText>
                    <CoachText variant="caption" muted>
                      {venueSide === 'home' ? 'Domicile' : venueSide === 'away' ? 'Extérieur' : 'Neutre'}
                    </CoachText>
                  </View>

                  <View style={styles.matchupVs}>
                    <CoachText variant="caption" style={[styles.vsText, { color: tokens.accent }]}>
                      VS
                    </CoachText>
                  </View>

                  <View style={styles.matchupSide}>
                    <Ionicons
                      name={isExternalOpponent ? 'globe-outline' : 'shield-checkmark'}
                      size={24}
                      color={isExternalOpponent ? tokens.muted : tokens.accent}
                    />
                    <CoachText variant="body" style={styles.matchupTeamName}>
                      {opponentLabel}
                    </CoachText>
                    <CoachText variant="caption" muted>
                      {isExternalOpponent ? 'Adversaire externe' : 'Club ProDay'}
                    </CoachText>
                  </View>
                </View>

                <View style={[styles.summaryDivider, { backgroundColor: tokens.border }]} />

                {/* Logistics details */}
                <View style={styles.summaryDetails}>
                  <View style={styles.summaryDetailRow}>
                    <Ionicons name="calendar-outline" size={16} color={tokens.accent} />
                    <CoachText variant="caption" style={styles.summaryDetailText}>
                      Date : <CoachText variant="caption" style={{ fontWeight: '700' }}>{dateStr}</CoachText> · Coup d'envoi <CoachText variant="caption" style={{ fontWeight: '700' }}>{kickoffTime}</CoachText> (RDV vestiaire : {meetingTime})
                    </CoachText>
                  </View>

                  <View style={styles.summaryDetailRow}>
                    <Ionicons name="location-outline" size={16} color={tokens.accent} />
                    <CoachText variant="caption" style={styles.summaryDetailText}>
                      Lieu : {venueAddress ? `${venueAddress}, ` : ''}{city} ({venueSide === 'home' ? 'Domicile' : venueSide === 'away' ? 'Extérieur' : 'Terrain neutre'})
                    </CoachText>
                  </View>

                  <View style={styles.summaryDetailRow}>
                    <Ionicons name="football-outline" size={16} color={tokens.accent} />
                    <CoachText variant="caption" style={styles.summaryDetailText}>
                      Catégorie {category} · {GAME_FORMATS.find((f) => f.id === gameFormat)?.label} · Mi-temps 2x{halfDuration} min
                    </CoachText>
                  </View>

                  {jerseysNotes ? (
                    <View style={styles.summaryDetailRow}>
                      <Ionicons name="shirt-outline" size={16} color={tokens.accent} />
                      <CoachText variant="caption" style={styles.summaryDetailText}>
                        Maillots : {jerseysNotes}
                      </CoachText>
                    </View>
                  ) : null}

                  {refereeingNotes ? (
                    <View style={styles.summaryDetailRow}>
                      <MaterialCommunityIcons name="whistle" size={16} color={tokens.accent} />
                      <CoachText variant="caption" style={styles.summaryDetailText}>
                        Arbitrage : {refereeingNotes}
                      </CoachText>
                    </View>
                  ) : null}

                  {hostingNotes ? (
                    <View style={styles.summaryDetailRow}>
                      <Ionicons name="cafe-outline" size={16} color={tokens.accent} />
                      <CoachText variant="caption" style={styles.summaryDetailText}>
                        Accueil : {hostingNotes}
                      </CoachText>
                    </View>
                  ) : null}
                </View>
              </View>

              {/* Checklist des raccordements immédiats */}
              <View style={[styles.raccordementCard, { borderColor: tokens.border, backgroundColor: tokens.surface }]}>
                <CoachText variant="caption" style={{ fontWeight: '800', color: tokens.accent, marginBottom: spacing.xs }}>
                  RACCORDEMENTS IMMÉDIATS PRODAY
                </CoachText>
                <View style={styles.checkItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <CoachText variant="caption" style={styles.checkItemText}>
                    Synchronisé au Calendrier Coach & Club
                  </CoachText>
                </View>
                <View style={styles.checkItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <CoachText variant="caption" style={styles.checkItemText}>
                    Convocations joueurs et pointage des présences prêts
                  </CoachText>
                </View>
                <View style={styles.checkItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <CoachText variant="caption" style={styles.checkItemText}>
                    Préparation de la composition tactique accessible
                  </CoachText>
                </View>
                <View style={styles.checkItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <CoachText variant="caption" style={styles.checkItemText}>
                    Covoiturage et plan de transport activés
                  </CoachText>
                </View>
                <View style={styles.checkItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#22c55e" />
                  <CoachText variant="caption" style={styles.checkItemText}>
                    Feuille de match et score live opérationnels
                  </CoachText>
                </View>
                <View style={styles.checkItem}>
                  <Ionicons name="shield-checkmark" size={16} color="#3b82f6" />
                  <CoachText variant="caption" style={styles.checkItemText}>
                    Protection anti-doublon · Aucune incidence sur le classement FFF
                  </CoachText>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtonsCol}>
                {!isExternalOpponent && selectedOpponentClub ? (
                  <PressableSpring
                    onPress={() => handleSubmit('invite')}
                    disabled={submitting}
                    style={[styles.primarySubmitBtn, { backgroundColor: tokens.accent }]}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (
                      <>
                        <Ionicons name="paper-plane" size={18} color="#000" />
                        <CoachText variant="body" style={styles.primarySubmitText}>
                          Envoyer l'invitation
                        </CoachText>
                      </>
                    )}
                  </PressableSpring>
                ) : (
                  <PressableSpring
                    onPress={() => handleSubmit('confirm')}
                    disabled={submitting}
                    style={[styles.primarySubmitBtn, { backgroundColor: tokens.accent }]}
                  >
                    {submitting ? (
                      <ActivityIndicator color="#000" size="small" />
                    ) : (
                      <>
                        <Ionicons name="checkmark-done" size={18} color="#000" />
                        <CoachText variant="body" style={styles.primarySubmitText}>
                          Confirmer le match amical
                        </CoachText>
                      </>
                    )}
                  </PressableSpring>
                )}

                <PressableSpring
                  onPress={() => handleSubmit('draft')}
                  disabled={submitting}
                  style={[styles.secondarySubmitBtn, { borderColor: tokens.border, backgroundColor: tokens.surface }]}
                >
                  <Ionicons name="bookmark-outline" size={16} color={tokens.foreground} />
                  <CoachText variant="caption" style={{ fontWeight: '700', marginLeft: 6 }}>
                    Enregistrer en brouillon
                  </CoachText>
                </PressableSpring>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Footer Navigation */}
        <View style={[styles.footer, { borderTopColor: tokens.border, backgroundColor: tokens.bg }]}>
          {currentStep > 1 ? (
            <PressableSpring
              onPress={handlePrevStep}
              style={[styles.navPrevBtn, { borderColor: tokens.border }]}
            >
              <Ionicons name="arrow-back" size={16} color={tokens.foreground} />
              <CoachText variant="caption" style={{ fontWeight: '700', marginLeft: 4 }}>
                Retour
              </CoachText>
            </PressableSpring>
          ) : (
            <View style={{ width: 80 }} />
          )}

          {currentStep < 4 ? (
            <PressableSpring
              onPress={handleNextStep}
              disabled={
                (currentStep === 1 && !isStep1Valid) ||
                (currentStep === 2 && !isStep2Valid) ||
                (currentStep === 3 && !isStep3Valid)
              }
              style={[
                styles.navNextBtn,
                {
                  backgroundColor:
                    (currentStep === 1 && !isStep1Valid) ||
                    (currentStep === 2 && !isStep2Valid) ||
                    (currentStep === 3 && !isStep3Valid)
                      ? tokens.border
                      : tokens.accent,
                },
              ]}
            >
              <CoachText
                variant="caption"
                style={{
                  fontWeight: '800',
                  color:
                    (currentStep === 1 && !isStep1Valid) ||
                    (currentStep === 2 && !isStep2Valid) ||
                    (currentStep === 3 && !isStep3Valid)
                      ? tokens.muted
                      : '#000',
                  marginRight: 4,
                }}
              >
                Suivant
              </CoachText>
              <Ionicons
                name="arrow-forward"
                size={16}
                color={
                  (currentStep === 1 && !isStep1Valid) ||
                  (currentStep === 2 && !isStep2Valid) ||
                  (currentStep === 3 && !isStep3Valid)
                    ? tokens.muted
                    : '#000'
                }
              />
            </PressableSpring>
          ) : (
            <PressableSpring
              onPress={() => setCurrentStep(3)}
              style={[styles.navPrevBtn, { borderColor: tokens.border }]}
            >
              <Ionicons name="pencil" size={14} color={tokens.accent} />
              <CoachText variant="caption" accent style={{ marginLeft: 4, fontWeight: '700' }}>
                Modifier
              </CoachText>
            </PressableSpring>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTitle: {
    fontWeight: '800',
    fontSize: 18,
    letterSpacing: -0.3,
  },
  closeBtn: {
    padding: spacing.xs,
  },
  progressTrack: {
    height: 3,
    width: '100%',
  },
  progressBar: {
    height: 3,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: 80,
  },
  stepContainer: {
    gap: spacing.md,
  },
  stepBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  stepNumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 12,
  },
  stepTitle: {
    fontWeight: '800',
    fontSize: 18,
  },
  stepSubtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  // Step 1
  teamList: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  teamCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
  },
  teamCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  teamIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamCardName: {
    fontWeight: '700',
    fontSize: 15,
  },
  customTeamForm: {
    gap: spacing.xs,
  },
  inputLabel: {
    fontWeight: '700',
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputDisabled: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
  },
  // Step 2
  segmentedRow: {
    flexDirection: 'row',
    borderRadius: radius.md,
    borderWidth: 1,
    padding: 3,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: radius.sm,
  },
  segmentLabel: {
    fontWeight: '700',
  },
  segmentLabelActive: {
    color: '#000',
  },
  prodaySection: {
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 44,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  resultsList: {
    gap: spacing.xs,
    maxHeight: 280,
  },
  clubResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.sm,
  },
  clubResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedOpponentCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  selectedClubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedClubName: {
    fontWeight: '800',
    fontSize: 16,
  },
  changeOpponentBtn: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  opponentTeamsWrapper: {
    gap: spacing.xs,
  },
  noResultCard: {
    padding: spacing.lg,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  externalSection: {
    gap: spacing.sm,
  },
  externalNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  contactBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  // Step 3
  horizontalChips: {
    gap: spacing.xs,
    paddingVertical: spacing.xs,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  choiceChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  choiceChipWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1,
  },
  formatChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.sm,
    borderWidth: 1.5,
  },
  formGridRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  presetChips: {
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 4,
  },
  presetChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  // Step 4
  summaryCard: {
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    gap: spacing.md,
  },
  matchupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  matchupSide: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  matchupTeamName: {
    fontWeight: '800',
    fontSize: 15,
    textAlign: 'center',
  },
  matchupVs: {
    paddingHorizontal: spacing.sm,
  },
  vsText: {
    fontWeight: '900',
    fontSize: 16,
    letterSpacing: 1,
  },
  summaryDivider: {
    height: 1,
    width: '100%',
  },
  summaryDetails: {
    gap: spacing.sm,
  },
  summaryDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  summaryDetailText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  raccordementCard: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: 6,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkItemText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionButtonsCol: {
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  primarySubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  primarySubmitText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 16,
  },
  secondarySubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  navPrevBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  navNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: 10,
    borderRadius: radius.md,
  },
});
