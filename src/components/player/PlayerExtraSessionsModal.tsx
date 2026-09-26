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
import { playerExtraSessionsService } from '../../services/playerExtraSessions.service';
import type { PlayerExtraSession } from '../../models/PlayerExtraSession';

interface Props {
  visible: boolean;
  onClose: () => void;
  playerUid: string;
  playerName: string;
  clubId?: string;
  teamId?: string;
  isMinor?: boolean;
  accent?: string;
}

export function PlayerExtraSessionsModal({
  visible,
  onClose,
  playerUid,
  playerName,
  clubId,
  teamId,
  isMinor = false,
  accent = '#3B82F6',
}: Props) {
  const [sessions, setSessions] = useState<PlayerExtraSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [creating, setCreating] = useState(false);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [locationName, setLocationName] = useState('');
  const [notes, setNotes] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('6');
  const [hoursAhead, setHoursAhead] = useState('24'); // Default session tomorrow

  useEffect(() => {
    if (visible && clubId) {
      loadSessions();
    } else if (visible && !clubId) {
      setLoading(false);
    }
  }, [visible, clubId]);

  const loadSessions = async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const data = await playerExtraSessionsService.listUpcomingSessions(clubId, teamId);
      setSessions(data);
    } catch {
      // Non-blocking
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!clubId) {
      Alert.alert('Club requis', 'Tu dois être affilié à un club pour organiser une session entre coéquipiers.');
      return;
    }
    if (!title.trim() || !locationName.trim()) {
      Alert.alert('Champs incomplets', 'Veuillez préciser le thème de la séance et le lieu autorisé.');
      return;
    }
    const max = parseInt(maxParticipants, 10);
    if (isNaN(max) || max < 2 || max > 22) {
      Alert.alert('Capacité invalide', 'Le nombre de participants doit être compris entre 2 et 22.');
      return;
    }

    const sessionDate = new Date(Date.now() + Math.max(1, parseInt(hoursAhead, 10) || 24) * 3600 * 1000);

    setCreating(true);
    try {
      await playerExtraSessionsService.createSession({
        club_id: clubId,
        team_id: teamId,
        organizer_uid: playerUid,
        organizer_name: playerName,
        title: title.trim(),
        description: notes.trim(),
        location_name: locationName.trim(),
        starts_at: sessionDate,
        ends_at: new Date(sessionDate.getTime() + 90 * 60 * 1000),
        max_participants: max,
        requires_parent_supervision: isMinor,
      });
      prodayHaptics.confirm();
      Alert.alert(
        'Séance proposée',
        'Ta séance supplémentaire a été publiée auprès de tes coéquipiers de club.',
      );
      setIsCreating(false);
      setTitle('');
      setLocationName('');
      setNotes('');
      await loadSessions();
    } catch (err: any) {
      Alert.alert('Erreur', err?.message || 'Impossible de créer la séance.');
    } finally {
      setCreating(false);
    }
  };

  const handleJoin = async (session: PlayerExtraSession) => {
    prodayHaptics.selection();
    setJoiningId(session.id);
    try {
      await playerExtraSessionsService.joinSession(session.id, {
        uid: playerUid,
        display_name: playerName,
        is_minor: isMinor,
      });
      prodayHaptics.confirm();
      await loadSessions();
    } catch (err: any) {
      Alert.alert('Action impossible', err?.message || 'Impossible de rejoindre la session.');
    } finally {
      setJoiningId(null);
    }
  };

  const handleLeave = async (session: PlayerExtraSession) => {
    Alert.alert(
      'Quitter la séance',
      'Es-tu sûr de vouloir te désister de cette séance supplémentaire ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Me désister',
          style: 'destructive',
          onPress: async () => {
            setJoiningId(session.id);
            try {
              await playerExtraSessionsService.leaveSession(session.id, playerUid);
              prodayHaptics.selection();
              await loadSessions();
            } catch (err: any) {
              Alert.alert('Erreur', err?.message || 'Impossible de se désister.');
            } finally {
              setJoiningId(null);
            }
          },
        },
      ],
    );
  };

  const handleCancelSession = (session: PlayerExtraSession) => {
    Alert.alert(
      'Annuler la séance',
      'En tant qu’organisateur, souhaites-tu annuler cette séance ? Les participants recevront une notification.',
      [
        { text: 'Retour', style: 'cancel' },
        {
          text: 'Annuler la séance',
          style: 'destructive',
          onPress: async () => {
            try {
              await playerExtraSessionsService.cancelSession(session.id, playerUid, 'Annulé par l’organisateur');
              prodayHaptics.confirm();
              await loadSessions();
            } catch (err: any) {
              Alert.alert('Erreur', err?.message || 'Impossible d’annuler la séance.');
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
                <Ionicons name="people" size={20} color={accent} />
              </View>
              <View>
                <ProDayText variant="title" style={styles.headerTitle}>
                  Séances Entre Coéquipiers
                </ProDayText>
                <ProDayText variant="caption" style={styles.headerSubtitle}>
                  Entraînements libres facultatifs • Non supervisés par le club
                </ProDayText>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} hitSlop={12}>
              <Ionicons name="close" size={22} color={PLAYER_DARK.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Legal / safety banner */}
          <View style={styles.disclaimerBanner}>
            <Ionicons name="shield-checkmark-outline" size={16} color="#F59E0B" />
            <ProDayText variant="caption" style={styles.disclaimerText}>
              {isMinor
                ? 'Rappel mineurs : l’accord de vos parents est requis. Aucune présence de personnes tierces non autorisées.'
                : 'Activité non officielle : ne compte pas pour les présences officielles du club. Pratique sous votre responsabilité.'}
            </ProDayText>
          </View>

          {!clubId ? (
            <View style={styles.emptyWrap}>
              <Ionicons name="business-outline" size={44} color={PLAYER_DARK.textMuted} />
              <ProDayText variant="section" style={styles.emptyTitle}>
                Aucun club affilié
              </ProDayText>
              <ProDayText variant="body" style={styles.emptySubtitle}>
                Pour organiser des sessions supplémentaires avec tes coéquipiers, ton profil doit être
                rattaché à un club.
              </ProDayText>
            </View>
          ) : isCreating ? (
            /* Creation Form */
            <ScrollView style={styles.formScroll} contentContainerStyle={styles.formContent}>
              <ProDayText variant="section" style={styles.formTitle}>
                Proposer un entraînement facultatif
              </ProDayText>

              <View style={styles.field}>
                <ProDayText variant="caption" style={styles.label}>
                  THÈME DE LA SÉANCE *
                </ProDayText>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Frappes & coups francs, Gammes techniques"
                  placeholderTextColor={PLAYER_DARK.textMuted}
                  value={title}
                  onChangeText={setTitle}
                />
              </View>

              <View style={styles.field}>
                <ProDayText variant="caption" style={styles.label}>
                  LIEU AUTORISÉ (TERRAIN / CITY-STADE) *
                </ProDayText>
                <TextInput
                  style={styles.input}
                  placeholder="Ex: Terrain annexe synthétique du complexe"
                  placeholderTextColor={PLAYER_DARK.textMuted}
                  value={locationName}
                  onChangeText={setLocationName}
                />
              </View>

              <View style={styles.fieldRow}>
                <View style={[styles.field, { flex: 1 }]}>
                  <ProDayText variant="caption" style={styles.label}>
                    DANS COMBIEN D'HEURES ?
                  </ProDayText>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Ex: 24"
                    placeholderTextColor={PLAYER_DARK.textMuted}
                    value={hoursAhead}
                    onChangeText={setHoursAhead}
                  />
                </View>

                <View style={[styles.field, { flex: 1 }]}>
                  <ProDayText variant="caption" style={styles.label}>
                    CAPACITÉ MAX (JOUEURS)
                  </ProDayText>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    placeholder="Ex: 6"
                    placeholderTextColor={PLAYER_DARK.textMuted}
                    value={maxParticipants}
                    onChangeText={setMaxParticipants}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <ProDayText variant="caption" style={styles.label}>
                  CONSIGNES / ÉQUIPEMENT À APPORTER
                </ProDayText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  multiline
                  placeholder="Ex: Amener son propre ballon et des crampons synthétiques."
                  placeholderTextColor={PLAYER_DARK.textMuted}
                  value={notes}
                  onChangeText={setNotes}
                />
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setIsCreating(false)}
                >
                  <ProDayText variant="caption" style={styles.cancelBtnText}>
                    Annuler
                  </ProDayText>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: accent }]}
                  onPress={handleCreate}
                  disabled={creating}
                >
                  {creating ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <ProDayText variant="caption" style={styles.saveBtnText}>
                      Publier la séance
                    </ProDayText>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          ) : (
            /* Sessions List */
            <>
              <View style={styles.listHeaderActions}>
                <ProDayText variant="caption" style={{ color: PLAYER_DARK.textMuted }}>
                  {sessions.length} session{sessions.length > 1 ? 's' : ''} disponible{sessions.length > 1 ? 's' : ''}
                </ProDayText>
                <TouchableOpacity
                  style={[styles.newBtn, { backgroundColor: accent }]}
                  onPress={() => {
                    prodayHaptics.selection();
                    setIsCreating(true);
                  }}
                >
                  <Ionicons name="add" size={18} color="#fff" />
                  <ProDayText variant="caption" style={styles.newBtnText}>
                    Proposer
                  </ProDayText>
                </TouchableOpacity>
              </View>

              {loading ? (
                <View style={styles.loadingWrap}>
                  <ActivityIndicator color={accent} />
                </View>
              ) : sessions.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Ionicons name="calendar-outline" size={44} color={PLAYER_DARK.textMuted} />
                  <ProDayText variant="section" style={styles.emptyTitle}>
                    Aucune séance proposée
                  </ProDayText>
                  <ProDayText variant="body" style={styles.emptySubtitle}>
                    Propose un entraînement entre coéquipiers pour bosser les coups francs, la passe
                    ou faire du travail physique ensemble.
                  </ProDayText>
                </View>
              ) : (
                <ScrollView style={styles.sessionsList} contentContainerStyle={styles.sessionsContent}>
                  {sessions.map((item) => {
                    const isInitiator = item.organizer_uid === playerUid;
                    const isJoined = item.participants.some((p) => p.uid === playerUid);
                    const isFull = item.participants.length >= item.max_participants;
                    const isCancelled = item.is_cancelled;

                    return (
                      <View
                        key={item.id}
                        style={[
                          styles.sessionCard,
                          isCancelled && { opacity: 0.5 },
                        ]}
                      >
                        <View style={styles.cardHeader}>
                          <View style={{ flex: 1 }}>
                            <ProDayText variant="section" style={styles.sessionTitle}>
                              {item.title}
                            </ProDayText>
                            <ProDayText variant="caption" style={styles.initiatorText}>
                              Proposé par {item.organizer_name} {isInitiator ? '(Toi)' : ''}
                            </ProDayText>
                          </View>
                          {isCancelled ? (
                            <View style={styles.cancelledBadge}>
                              <ProDayText variant="caption" style={styles.cancelledText}>
                                Annulée
                              </ProDayText>
                            </View>
                          ) : (
                            <View style={[styles.capacityBadge, isFull && styles.capacityFullBadge]}>
                              <Ionicons
                                name="people-outline"
                                size={12}
                                color={isFull ? '#EF4444' : accent}
                              />
                              <ProDayText
                                variant="caption"
                                style={[styles.capacityText, isFull && { color: '#EF4444' }]}
                              >
                                {item.participants.length} / {item.max_participants}
                              </ProDayText>
                            </View>
                          )}
                        </View>

                        <View style={styles.metaRow}>
                          <View style={styles.metaItem}>
                            <Ionicons name="time-outline" size={14} color={PLAYER_DARK.textMuted} />
                            <ProDayText variant="caption" style={styles.metaText}>
                              {item.starts_at.toLocaleDateString('fr-FR', {
                                weekday: 'short',
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </ProDayText>
                          </View>

                          <View style={styles.metaItem}>
                            <Ionicons name="location-outline" size={14} color={PLAYER_DARK.textMuted} />
                            <ProDayText variant="caption" style={styles.metaText} numberOfLines={1}>
                              {item.location_name}
                            </ProDayText>
                          </View>
                        </View>

                        {item.description ? (
                          <ProDayText variant="body" style={styles.sessionNotes} numberOfLines={2}>
                            {item.description}
                          </ProDayText>
                        ) : null}

                        {/* Participants names */}
                        <View style={styles.participantsRow}>
                          <ProDayText variant="caption" style={styles.participantsLabel}>
                            Participants :
                          </ProDayText>
                          <ProDayText variant="caption" style={styles.participantsList} numberOfLines={1}>
                            {item.participants.map((p) => p.display_name).join(', ')}
                          </ProDayText>
                        </View>

                        {/* Actions */}
                        {!isCancelled && (
                          <View style={styles.cardActions}>
                            {isInitiator && (
                              <TouchableOpacity
                                style={styles.cancelSessionBtn}
                                onPress={() => handleCancelSession(item)}
                              >
                                <ProDayText variant="caption" style={styles.cancelSessionBtnText}>
                                  Annuler la séance
                                </ProDayText>
                              </TouchableOpacity>
                            )}

                            {isJoined ? (
                              <TouchableOpacity
                                style={styles.leaveBtn}
                                onPress={() => handleLeave(item)}
                                disabled={joiningId === item.id}
                              >
                                <ProDayText variant="caption" style={styles.leaveBtnText}>
                                  Se désister
                                </ProDayText>
                              </TouchableOpacity>
                            ) : !isFull ? (
                              <TouchableOpacity
                                style={[styles.joinBtn, { backgroundColor: accent }]}
                                onPress={() => handleJoin(item)}
                                disabled={joiningId === item.id}
                              >
                                {joiningId === item.id ? (
                                  <ActivityIndicator size="small" color="#fff" />
                                ) : (
                                  <ProDayText variant="caption" style={styles.joinBtnText}>
                                    Rejoindre
                                  </ProDayText>
                                )}
                              </TouchableOpacity>
                            ) : (
                              <View style={styles.fullNotice}>
                                <ProDayText variant="caption" style={styles.fullNoticeText}>
                                  Séance complète
                                </ProDayText>
                              </View>
                            )}
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
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    marginHorizontal: 16,
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.25)',
  },
  disclaimerText: {
    flex: 1,
    color: '#F59E0B',
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
    color: '#fff',
    fontWeight: '700',
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
  sessionsList: {
    flex: 1,
    paddingHorizontal: 16,
  },
  sessionsContent: {
    gap: 12,
    paddingBottom: 24,
  },
  sessionCard: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: PLAYER_DARK.text,
  },
  initiatorText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  capacityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: PLAYER_DARK.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  capacityFullBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  capacityText: {
    fontSize: 11,
    fontWeight: '700',
    color: PLAYER_DARK.text,
  },
  cancelledBadge: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  cancelledText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
  },
  metaText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 12,
  },
  sessionNotes: {
    color: PLAYER_DARK.text,
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.85,
  },
  participantsRow: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
    backgroundColor: PLAYER_DARK.surface,
    padding: 8,
    borderRadius: 8,
  },
  participantsLabel: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    fontWeight: '700',
  },
  participantsList: {
    flex: 1,
    color: PLAYER_DARK.text,
    fontSize: 11,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  cancelSessionBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  cancelSessionBtnText: {
    color: '#EF4444',
    fontSize: 11,
    fontWeight: '700',
  },
  leaveBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  leaveBtnText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '700',
  },
  joinBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  joinBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '800',
  },
  fullNotice: {
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  fullNoticeText: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
  },
  formScroll: {
    flex: 1,
  },
  formContent: {
    padding: 16,
    gap: 14,
  },
  formTitle: {
    color: PLAYER_DARK.text,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  field: {
    gap: 6,
  },
  fieldRow: {
    flexDirection: 'row',
    gap: 12,
  },
  label: {
    color: PLAYER_DARK.textMuted,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: PLAYER_DARK.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: PLAYER_DARK.text,
    fontSize: 14,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
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
  saveBtn: {
    flex: 1.5,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '800',
  },
});
