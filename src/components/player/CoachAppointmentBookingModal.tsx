import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ProDayText } from '../ui/ProDayText';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { coachAppointmentsService } from '../../services/coachAppointments.service';
import { usersService } from '../../services/users.service';
import type {
  CoachAppointment,
  CoachAvailabilitySlot,
  AppointmentPurpose,
} from '../../models/CoachAppointment';
import type { User } from '../../models/User';

interface Props {
  visible: boolean;
  onClose: () => void;
  playerUid: string;
  playerName: string;
  clubId?: string;
  isMinor?: boolean;
  parentUid?: string;
  accent?: string;
}

const PURPOSES: { key: AppointmentPurpose; label: string; desc: string }[] = [
  { key: 'individual_debrief', label: 'Débriefing individuel', desc: 'Analyse des derniers matchs et axes de travail' },
  { key: 'career_orientation', label: 'Projet de jeu & orientation', desc: 'Évolution du poste, objectifs de saison' },
  { key: 'mental_wellbeing', label: 'Bien-être & confiance', desc: 'Confiance en soi, gestion de la pression' },
  { key: 'other', label: 'Autre sujet', desc: 'Question spécifique à aborder' },
];

export function CoachAppointmentBookingModal({
  visible,
  onClose,
  playerUid,
  playerName,
  clubId,
  isMinor = false,
  parentUid,
  accent = '#10B981',
}: Props) {
  const [appointments, setAppointments] = useState<CoachAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [coaches, setCoaches] = useState<User[]>([]);

  // Booking step
  const [isBookingStep, setIsBookingStep] = useState(false);
  const [selectedCoach, setSelectedCoach] = useState<User | null>(null);
  const [slots, setSlots] = useState<CoachAvailabilitySlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<CoachAvailabilitySlot | null>(null);
  const [selectedPurpose, setSelectedPurpose] = useState<AppointmentPurpose>('individual_debrief');
  const [playerNotes, setPlayerNotes] = useState('');
  const [bookingInProgress, setBookingInProgress] = useState(false);

  useEffect(() => {
    if (visible && playerUid) {
      loadAppointments();
      loadCoaches();
    }
  }, [visible, playerUid]);

  const loadAppointments = async () => {
    setLoading(true);
    try {
      const data = await coachAppointmentsService.listForPlayer(playerUid);
      setAppointments(data);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  const loadCoaches = async () => {
    try {
      const staff = await usersService.listStaff('coach');
      setCoaches(staff.filter((s) => !clubId || s.profile?.club_id === clubId));
    } catch {
      setCoaches([]);
    }
  };

  const handleSelectCoach = async (coach: User) => {
    setSelectedCoach(coach);
    setSelectedSlot(null);
    setLoadingSlots(true);
    try {
      const available = await coachAppointmentsService.listAvailableSlots(coach.uid);
      setSlots(available);
    } catch {
      setSlots([]);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedCoach || !selectedSlot) {
      Alert.alert('Créneau manquant', 'Veuillez sélectionner un coach et un créneau horaire.');
      return;
    }

    setBookingInProgress(true);
    try {
      await coachAppointmentsService.requestAppointment(
        {
          coach_uid: selectedCoach.uid,
          coach_name: selectedCoach.display_name,
          player_uid: playerUid,
          player_name: playerName,
          club_id: clubId,
          starts_at: selectedSlot.starts_at,
          duration_minutes:
            Math.round((selectedSlot.ends_at.getTime() - selectedSlot.starts_at.getTime()) / 60000) || 30,
          purpose:
            selectedPurpose === 'individual_debrief'
              ? 'Débriefing individuel'
              : selectedPurpose === 'career_orientation'
              ? 'Projet de jeu & orientation'
              : selectedPurpose === 'mental_wellbeing'
              ? 'Bien-être & confiance'
              : playerNotes.trim() || 'Entretien personnel',
          is_minor: isMinor,
          guardian_name: isMinor ? 'Parent / Tuteur' : undefined,
          guardian_notified: isMinor,
        },
        selectedSlot.id,
      );

      prodayHaptics.confirm();
      Alert.alert(
        'Rendez-vous réservé !',
        `Ton créneau avec ${selectedCoach.display_name} est confirmé. Une invitation a été enregistrée dans ton agenda ProDay.${
          isMinor ? ' Conformément aux règles du club, un parent a été notifié.' : ''
        }`,
      );
      setIsBookingStep(false);
      setSelectedCoach(null);
      setSelectedSlot(null);
      setPlayerNotes('');
      await loadAppointments();
    } catch (err: any) {
      Alert.alert('Réservation impossible', err?.message || 'Ce créneau vient peut-être d’être réservé.');
      if (selectedCoach) {
        handleSelectCoach(selectedCoach);
      }
    } finally {
      setBookingInProgress(false);
    }
  };

  const handleCancelAppointment = (item: CoachAppointment) => {
    Alert.alert(
      'Annuler le rendez-vous',
      `Souhaites-tu annuler l'entretien avec ${item.coach_name} prévu le ${item.starts_at.toLocaleDateString(
        'fr-FR',
        { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' },
      )} ?`,
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Confirmer l’annulation',
          style: 'destructive',
          onPress: async () => {
            try {
              await coachAppointmentsService.cancelAppointment(item.id, playerUid, 'Annulé par le joueur');
              prodayHaptics.confirm();
              await loadAppointments();
            } catch (err: any) {
              Alert.alert('Erreur', err?.message || 'Impossible d’annuler le rendez-vous.');
            }
          },
        },
      ],
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent presentationStyle="overFullScreen">
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={[styles.headerIconBadge, { backgroundColor: `${accent}20` }]}>
                <Ionicons name="calendar" size={20} color={accent} />
              </View>
              <View>
                <ProDayText variant="title" style={styles.headerTitle}>
                  Rendez-vous Coach
                </ProDayText>
                <ProDayText variant="caption" style={styles.headerSubtitle}>
                  Créneaux d'entretien individuel & débriefing personnalisé
                </ProDayText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={22} color={PLAYER_DARK.textMuted} />
            </TouchableOpacity>
          </View>

          {isMinor && (
            <View style={styles.parentNotice}>
              <Ionicons name="shield-outline" size={14} color="#3B82F6" />
              <ProDayText variant="caption" style={styles.parentNoticeText}>
                Protection mineurs : le compte tuteur/parent déclaré est automatiquement informé de
                chaque rendez-vous pris.
              </ProDayText>
            </View>
          )}

          {isBookingStep ? (
            /* Booking wizard */
            <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
              <ProDayText variant="section" style={styles.formSectionTitle}>
                1. Choisis ton coach
              </ProDayText>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.coachRow}>
                {coaches.map((c) => (
                  <TouchableOpacity
                    key={c.uid}
                    style={[
                      styles.coachCard,
                      selectedCoach?.uid === c.uid && [styles.coachCardActive, { borderColor: accent }],
                    ]}
                    onPress={() => {
                      prodayHaptics.selection();
                      handleSelectCoach(c);
                    }}
                  >
                    <Ionicons
                      name="person-circle"
                      size={32}
                      color={selectedCoach?.uid === c.uid ? accent : PLAYER_DARK.textMuted}
                    />
                    <ProDayText
                      variant="body"
                      style={[
                        styles.coachCardName,
                        selectedCoach?.uid === c.uid && { color: accent, fontWeight: '700' },
                      ]}
                      numberOfLines={1}
                    >
                      {c.display_name}
                    </ProDayText>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {selectedCoach && (
                <>
                  <ProDayText variant="section" style={styles.formSectionTitle}>
                    2. Créneaux disponibles ({slots.length})
                  </ProDayText>

                  {loadingSlots ? (
                    <ActivityIndicator style={{ paddingVertical: 14 }} color={accent} />
                  ) : slots.length === 0 ? (
                    <ProDayText variant="caption" style={styles.noSlotsText}>
                      Ce coach n'a pas encore ouvert de créneaux publics cette semaine.
                    </ProDayText>
                  ) : (
                    <View style={styles.slotsGrid}>
                      {slots.map((s) => {
                        const isSelected = selectedSlot?.id === s.id;
                        return (
                          <TouchableOpacity
                            key={s.id}
                            style={[
                              styles.slotChip,
                              isSelected && [styles.slotChipActive, { borderColor: accent, backgroundColor: `${accent}15` }],
                            ]}
                            onPress={() => {
                              prodayHaptics.selection();
                              setSelectedSlot(s);
                            }}
                          >
                            <ProDayText
                              variant="caption"
                              style={[styles.slotDateText, isSelected && { color: accent, fontWeight: '700' }]}
                            >
                              {s.starts_at.toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                              })}
                            </ProDayText>
                            <ProDayText
                              variant="caption"
                              style={[styles.slotTimeText, isSelected && { color: accent, fontWeight: '800' }]}
                            >
                              {s.starts_at.toLocaleTimeString('fr-FR', {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </ProDayText>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}

                  <ProDayText variant="section" style={styles.formSectionTitle}>
                    3. Sujet de l'entretien
                  </ProDayText>
                  <View style={styles.purposesList}>
                    {PURPOSES.map((p) => (
                      <TouchableOpacity
                        key={p.key}
                        style={[
                          styles.purposeItem,
                          selectedPurpose === p.key && [styles.purposeItemActive, { borderColor: accent }],
                        ]}
                        onPress={() => {
                          prodayHaptics.selection();
                          setSelectedPurpose(p.key);
                        }}
                      >
                        <Ionicons
                          name={selectedPurpose === p.key ? 'radio-button-on' : 'radio-button-off'}
                          size={16}
                          color={selectedPurpose === p.key ? accent : PLAYER_DARK.textMuted}
                        />
                        <View style={{ flex: 1 }}>
                          <ProDayText
                            variant="body"
                            style={[
                              styles.purposeLabel,
                              selectedPurpose === p.key && { color: accent, fontWeight: '700' },
                            ]}
                          >
                            {p.label}
                          </ProDayText>
                          <ProDayText variant="caption" style={styles.purposeDesc}>
                            {p.desc}
                          </ProDayText>
                        </View>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <View style={styles.notesField}>
                    <ProDayText variant="caption" style={styles.notesLabel}>
                      NOTE OU QUESTION PRÉALABLE (OPTIONNEL)
                    </ProDayText>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Précise les points clés que tu veux aborder..."
                      placeholderTextColor={PLAYER_DARK.textMuted}
                      value={playerNotes}
                      onChangeText={setPlayerNotes}
                    />
                  </View>
                </>
              )}

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsBookingStep(false)}
                >
                  <ProDayText variant="caption" style={styles.cancelBtnText}>
                    Retour
                  </ProDayText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.confirmBookingBtn,
                    { backgroundColor: accent },
                    (!selectedSlot || bookingInProgress) && { opacity: 0.5 },
                  ]}
                  disabled={!selectedSlot || bookingInProgress}
                  onPress={handleConfirmBooking}
                >
                  {bookingInProgress ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <ProDayText variant="caption" style={styles.confirmBookingBtnText}>
                      Confirmer le créneau
                    </ProDayText>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* Appointments list */
            <>
              <View style={styles.listHeaderActions}>
                <ProDayText variant="caption" style={{ color: PLAYER_DARK.textMuted }}>
                  {appointments.length} rendez-vous programmé{appointments.length > 1 ? 's' : ''}
                </ProDayText>

                <TouchableOpacity
                  style={[styles.newBtn, { backgroundColor: accent }]}
                  onPress={() => {
                    prodayHaptics.selection();
                    setIsBookingStep(true);
                  }}
                >
                  <Ionicons name="add" size={18} color="#000" />
                  <ProDayText variant="caption" style={styles.newBtnText}>
                    Prendre RDV
                  </ProDayText>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={accent} />
                </View>
              ) : appointments.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="calendar-outline" size={44} color={PLAYER_DARK.textMuted} />
                  <ProDayText variant="section" style={styles.emptyTitle}>
                    Aucun rendez-vous à venir
                  </ProDayText>
                  <ProDayText variant="body" style={styles.emptySubtitle}>
                    Tu as besoin d'un temps d'échange individuel avec ton coach pour faire le point sur
                    tes performances ou tes objectifs ? Réserve un créneau disponible.
                  </ProDayText>
                </View>
              ) : (
                <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
                  {appointments.map((item) => {
                    const isConfirmed = item.status === 'confirmed';
                    const isCancelled = item.status === 'cancelled';

                    return (
                      <View key={item.id} style={styles.appointmentCard}>
                        <View style={styles.appointmentTop}>
                          <View style={{ flex: 1 }}>
                            <ProDayText variant="section" style={styles.coachNameText}>
                              {item.coach_name}
                            </ProDayText>
                            <ProDayText variant="caption" style={styles.purposeText}>
                              {item.purpose}
                            </ProDayText>
                          </View>

                          <View
                            style={[
                              styles.statusBadge,
                              isConfirmed && { backgroundColor: 'rgba(16, 185, 129, 0.15)' },
                              isCancelled && { backgroundColor: 'rgba(239, 68, 68, 0.15)' },
                            ]}
                          >
                            <ProDayText
                              variant="caption"
                              style={[
                                styles.statusBadgeText,
                                isConfirmed && { color: '#10B981' },
                                isCancelled && { color: '#EF4444' },
                              ]}
                            >
                              {isConfirmed ? 'Confirmé' : isCancelled ? 'Annulé' : 'En attente'}
                            </ProDayText>
                          </View>
                        </View>

                        <View style={styles.timeRow}>
                          <Ionicons name="time" size={14} color={accent} />
                          <ProDayText variant="caption" style={[styles.timeText, { color: accent }]}>
                            {item.starts_at.toLocaleDateString('fr-FR', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                            })}{' '}
                            à{' '}
                            {item.starts_at.toLocaleTimeString('fr-FR', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </ProDayText>
                        </View>

                        {item.coach_notes ? (
                          <ProDayText variant="caption" style={styles.playerNotesText}>
                            Note coach : {item.coach_notes}
                          </ProDayText>
                        ) : null}

                        {isConfirmed && (
                          <View style={styles.cardActionsRow}>
                            <TouchableOpacity
                              style={styles.cancelRdvBtn}
                              onPress={() => handleCancelAppointment(item)}
                            >
                              <ProDayText variant="caption" style={styles.cancelRdvBtnText}>
                                Annuler le RDV
                              </ProDayText>
                            </TouchableOpacity>
                          </View>
                        )}
                      </View>
                    );
                  })}
                </ScrollView>
              )}
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: PLAYER_DARK.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    minHeight: '60%',
    paddingBottom: 24,
    borderTopWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: PLAYER_DARK.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: PLAYER_DARK.text,
  },
  headerSubtitle: {
    fontSize: 12,
    color: PLAYER_DARK.textMuted,
  },
  closeBtn: {
    padding: 6,
  },
  parentNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  parentNoticeText: {
    flex: 1,
    color: '#3B82F6',
    fontSize: 11,
    lineHeight: 15,
  },
  listHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
  },
  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 36,
    borderRadius: 10,
    gap: 4,
  },
  newBtnText: {
    color: '#000',
    fontWeight: '800',
    fontSize: 13,
  },
  loadingWrap: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyWrap: {
    padding: 30,
    alignItems: 'center',
    gap: 10,
  },
  emptyTitle: {
    color: PLAYER_DARK.text,
    marginTop: 8,
  },
  emptySubtitle: {
    color: PLAYER_DARK.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
    marginTop: 8,
  },
  listContent: {
    gap: 12,
    paddingBottom: 24,
  },
  appointmentCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    gap: 8,
  },
  appointmentTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  coachNameText: {
    fontSize: 15,
    fontWeight: '700',
    color: PLAYER_DARK.text,
  },
  purposeText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  playerNotesText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    backgroundColor: PLAYER_DARK.surface,
    padding: 8,
    borderRadius: 6,
  },
  cardActionsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: `${PLAYER_DARK.border}60`,
    paddingTop: 8,
    marginTop: 4,
  },
  cancelRdvBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  cancelRdvBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    gap: 14,
  },
  formSectionTitle: {
    color: PLAYER_DARK.text,
    fontSize: 14,
    fontWeight: '800',
  },
  coachRow: {
    flexDirection: 'row',
    gap: 10,
    marginVertical: 4,
  },
  coachCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 6,
    width: 100,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  coachCardActive: {
    backgroundColor: PLAYER_DARK.surface,
  },
  coachCardName: {
    color: PLAYER_DARK.text,
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
  noSlotsText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 12,
    paddingVertical: 8,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotChip: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    alignItems: 'center',
    gap: 2,
  },
  slotChipActive: {},
  slotDateText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
  },
  slotTimeText: {
    color: PLAYER_DARK.text,
    fontSize: 13,
  },
  purposesList: {
    gap: 8,
  },
  purposeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  purposeItemActive: {
    backgroundColor: PLAYER_DARK.surface,
  },
  purposeLabel: {
    color: PLAYER_DARK.text,
    fontSize: 13,
    fontWeight: '600',
  },
  purposeDesc: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  notesField: {
    gap: 6,
  },
  notesLabel: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    fontWeight: '800',
  },
  notesInput: {
    backgroundColor: PLAYER_DARK.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: PLAYER_DARK.text,
    fontSize: 13,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 10,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  cancelBtnText: {
    color: PLAYER_DARK.textMuted,
    fontWeight: '700',
  },
  confirmBookingBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmBookingBtnText: {
    color: '#000',
    fontWeight: '800',
  },
});
