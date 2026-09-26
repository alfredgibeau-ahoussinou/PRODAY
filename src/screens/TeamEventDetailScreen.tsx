import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { TeamEvent, RsvpStatus } from '../models/TeamEvent';
import {
  EVENT_TYPE_LABELS,
  countRsvpYes,
  userRsvp,
  getPendingInviteeUids,
  RSVP_STATUS_LABELS,
  isLateRsvp,
} from '../models/TeamEvent';
import { teamEventsService } from '../services/teamEvents.service';
import { useAuth } from '../context/AuthContext';
import { formatCalendarDate } from '../utils/seasonCalendar';
import { formatTrainingSessionTitle, formatEventScheduleLabel } from '../utils/teamEventFormatting';
import { buildConvocationShareMessage } from '../utils/teamEventShare';
import { EventLineupScreen } from './EventLineupScreen';
import { EventLiveStatsScreen } from './EventLiveStatsScreen';
import { EventAttendancePanel } from '../components/team/EventAttendancePanel';
import { EventCarpoolPanel } from '../components/team/EventCarpoolPanel';
import { LateReportControl } from '../components/team/LateReportControl';
import { EventEquipmentChecklistPanel } from '../components/team/EventEquipmentChecklistPanel';
import { PlayerFeedbackModal } from '../components/player/PlayerFeedbackModal';
import { PushScreenTransition, PressableSpring } from '../components/motion';
import { ProDayText } from '../components/ui/ProDayText';
import { PLAYER_DARK } from '../theme/playerDarkPremium';
import { playerType } from '../theme/playerDesignSystem';
import { prodayHaptics } from '../utils/prodayHaptics';
import { calendarExportService } from '../services/calendarExport.service';

interface TeamEventDetailScreenProps {
  eventId: string;
  onBack: () => void;
}

type SubView = 'detail' | 'lineup' | 'live';

const RSVP_OPTIONS: { status: RsvpStatus; label: string; icon: keyof typeof Ionicons.glyphMap; color: string }[] = [
  { status: 'yes', label: 'Présent', icon: 'checkmark-circle', color: '#10B981' },
  { status: 'maybe', label: 'Peut-être', icon: 'help-circle', color: '#F59E0B' },
  { status: 'no', label: 'Absent', icon: 'close-circle', color: '#EF4444' },
];

export const TeamEventDetailScreen: React.FC<TeamEventDetailScreenProps> = ({
  eventId,
  onBack,
}) => {
  const { profile, isAdmin } = useAuth();
  const [subView, setSubView] = useState<SubView>('detail');
  const [event, setEvent] = useState<TeamEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [absenceNote, setAbsenceNote] = useState('');
  const [showAbsenceNote, setShowAbsenceNote] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const data = await teamEventsService.getById(eventId);
    setEvent(data);
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleRsvp = async (status: RsvpStatus) => {
    if (!profile || !event) return;
    if (status === 'no' && !showAbsenceNote) {
      setShowAbsenceNote(true);
      return;
    }
    const prevStatus = userRsvp(event, profile.uid);
    setSaving(true);

    // Optimistic update
    setEvent((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        rsvps: {
          ...prev.rsvps,
          [profile.uid]: status,
        },
      };
    });

    try {
      if (status === 'no') {
        await teamEventsService.updateRsvpWithReason(
          eventId,
          profile.uid,
          status,
          absenceNote.trim() || undefined
        );
        setShowAbsenceNote(false);
        setAbsenceNote('');
      } else {
        await teamEventsService.updateRsvp(eventId, profile.uid, status);
      }
      prodayHaptics.rsvpConfirm();
      await load();
    } catch (e) {
      // Rollback
      setEvent((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          rsvps: {
            ...prev.rsvps,
            [profile.uid]: prevStatus,
          },
        };
      });
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Impossible d’enregistrer votre réponse.');
    } finally {
      setSaving(false);
    }
  };

  const handleReminder = async () => {
    setSaving(true);
    try {
      const n = await teamEventsService.sendReminders(eventId);
      if (n === 0) {
        Alert.alert('Relance', 'Personne en attente de réponse.');
      } else {
        Alert.alert('Relance envoyée', `${n} joueur${n > 1 ? 's' : ''} relancé${n > 1 ? 's' : ''} par notification.`);
        await load();
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Relance impossible.');
    } finally {
      setSaving(false);
    }
  };

  const shareConvocation = async () => {
    if (!event) return;
    await Share.share({ message: buildConvocationShareMessage(event) });
  };

  const handleExportCalendar = () => {
    if (!event) return;
    const start = event.starts_at ? new Date(event.starts_at) : new Date();
    const end = event.ends_at ? new Date(event.ends_at) : new Date(start.getTime() + 2 * 60 * 60 * 1000);
    void calendarExportService.exportEventToCalendar({
      id: event.id,
      title: event.title,
      description: `${EVENT_TYPE_LABELS[event.event_type]} • ${event.description || 'ProDay Football'}`,
      location: `${event.location_label ? `${event.location_label}, ` : ''}${event.city || ''}`,
      startDate: start,
      endDate: end,
    });
  };

  const openMapsDirections = () => {
    if (!event) return;
    const query = encodeURIComponent(`${event.location_label || ''} ${event.city || ''}`.trim());
    if (!query) return;
    const url = `https://maps.apple.com/?q=${query}`;
    void Linking.openURL(url);
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={PLAYER_DARK.accent} size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Ionicons name="chevron-back" size={22} color={PLAYER_DARK.text} />
          </TouchableOpacity>
          <ProDayText style={styles.navHeaderTitle}>Événement</ProDayText>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.emptyWrap}>
          <Ionicons name="alert-circle-outline" size={40} color={PLAYER_DARK.textMuted} />
          <ProDayText style={styles.missingText}>Événement introuvable ou supprimé.</ProDayText>
        </View>
      </View>
    );
  }

  const myStatus = profile ? userRsvp(event, profile.uid) : 'pending';
  const isOrganizer = profile?.uid === event.organizer_uid;
  const yesCount = countRsvpYes(event);
  const pendingCount = getPendingInviteeUids(event).length;
  const canRespond =
    profile &&
    (event.invitee_uids.includes(profile.uid) || isOrganizer || event.event_type === 'detection');
  const isStaff =
    Boolean(isAdmin) ||
    profile?.role === 'coach' ||
    profile?.role === 'organizer' ||
    profile?.role === 'agent' ||
    profile?.role === 'club';
  const canManageFinalizedReport = isStaff;
  const reportLocked = Boolean(event.match_report_finalized_at) && !canManageFinalizedReport;

  const isTraining = event.event_type === 'training';
  const isTournament = event.event_type === 'tournament';
  const kindBadgeColor = isTraining ? '#10B981' : isTournament ? '#F59E0B' : PLAYER_DARK.accent;

  const toggleReportLock = async () => {
    if (!canManageFinalizedReport || !profile) return;
    await teamEventsService.setMatchReportFinalized(
      event.id,
      !event.match_report_finalized_at,
      { user: profile, isAdmin },
    );
    await load();
  };

  return (
    <>
      <View style={styles.container}>
        {/* Navigation Header Apple */}
        <View style={styles.navHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name="chevron-back" size={22} color={PLAYER_DARK.text} />
          </TouchableOpacity>

          <View style={styles.navCenter}>
            <ProDayText style={styles.navHeaderTitle} numberOfLines={1}>
              {EVENT_TYPE_LABELS[event.event_type] || 'Événement'}
            </ProDayText>
          </View>

          <View style={styles.navActionsRow}>
            <TouchableOpacity onPress={handleExportCalendar} style={styles.headerIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Ajouter au calendrier">
              <Ionicons name="calendar-outline" size={18} color={PLAYER_DARK.text} />
            </TouchableOpacity>
            <TouchableOpacity onPress={shareConvocation} style={styles.headerIconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }} accessibilityRole="button" accessibilityLabel="Partager la convocation">
              <Ionicons name="share-outline" size={18} color={PLAYER_DARK.text} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {/* 1. CARTE PRINCIPALE : EN-TÊTE & HORAIRES */}
          <View style={styles.heroCard}>
            <View style={styles.heroTopRow}>
              <View style={[styles.typeBadge, { backgroundColor: `${kindBadgeColor}18`, borderColor: `${kindBadgeColor}35` }]}>
                <ProDayText style={[styles.typeBadgeText, { color: kindBadgeColor }]}>
                  {EVENT_TYPE_LABELS[event.event_type] || 'Événement'}
                </ProDayText>
              </View>

              {event.live_state?.status === 'cancelled' ? (
                <View style={styles.statusBadgeCancelled}>
                  <ProDayText style={styles.statusBadgeTextCancelled}>ANNULÉ</ProDayText>
                </View>
              ) : (
                <View style={styles.statusBadgeActive}>
                  <ProDayText style={styles.statusBadgeTextActive}>CONFIRMÉ</ProDayText>
                </View>
              )}
            </View>

            <ProDayText style={styles.heroTitle}>
              {isTraining ? formatTrainingSessionTitle(event) : event.title}
            </ProDayText>

            {/* Date & Heures */}
            <View style={styles.metaStack}>
              <View style={styles.metaRow}>
                <Ionicons name="calendar" size={15} color={PLAYER_DARK.textMuted} />
                <ProDayText style={styles.metaText}>
                  {formatCalendarDate(event.starts_at)}
                </ProDayText>
              </View>

              <View style={styles.metaRow}>
                <Ionicons name="time" size={15} color={PLAYER_DARK.textMuted} />
                <ProDayText style={styles.metaText}>
                  {formatEventScheduleLabel(event)}
                </ProDayText>
              </View>

              {event.carpool_slots?.[0]?.meeting_time ? (
                <View style={[styles.metaRow, styles.meetingHighlight]}>
                  <Ionicons name="alarm-outline" size={15} color={PLAYER_DARK.accent} />
                  <ProDayText style={[styles.metaText, { color: PLAYER_DARK.accent, fontWeight: '700' }]}>
                    Rendez-vous vestiaire : {event.carpool_slots[0].meeting_time}
                  </ProDayText>
                </View>
              ) : null}
            </View>

            {/* Organisateur */}
            <View style={styles.organizerRow}>
              <Ionicons name="person-circle-outline" size={15} color={PLAYER_DARK.textMuted} />
              <ProDayText style={styles.organizerText}>
                Organisé par {event.organizer_name}
              </ProDayText>
            </View>
          </View>

          {/* 2. LIEU & ITINÉRAIRE */}
          {(event.city || event.location_label) && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="location" size={16} color={PLAYER_DARK.accent} />
                  <ProDayText style={styles.sectionTitle}>Lieu & Rendez-vous</ProDayText>
                </View>

                <TouchableOpacity
                  onPress={openMapsDirections}
                  style={styles.itineraryButton}
                  activeOpacity={0.7}
                >
                  <Ionicons name="navigate-outline" size={13} color={PLAYER_DARK.accent} />
                  <ProDayText style={[styles.itineraryButtonText, { color: PLAYER_DARK.accent }]}>
                    Itinéraire
                  </ProDayText>
                </TouchableOpacity>
              </View>

              <ProDayText style={styles.locationMainText}>
                {event.location_label || event.city}
              </ProDayText>
              {event.location_label && event.city ? (
                <ProDayText style={styles.locationSubText}>{event.city}</ProDayText>
              ) : null}
            </View>
          )}

          {/* 3. RÉPONSE DU JOUEUR (RSVP 1-TAP) */}
          {canRespond && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="checkmark-done-circle" size={16} color={PLAYER_DARK.accent} />
                <ProDayText style={styles.sectionTitle}>Votre présence</ProDayText>
                {saving ? (
                  <ActivityIndicator size="small" color={PLAYER_DARK.accent} style={{ marginLeft: 6 }} />
                ) : null}
              </View>

              <View style={styles.rsvpSegment}>
                {RSVP_OPTIONS.map((opt) => {
                  const isSelected = myStatus === opt.status;

                  return (
                    <TouchableOpacity
                      key={opt.status}
                      onPress={() => {
                        prodayHaptics.press();
                        void handleRsvp(opt.status);
                      }}
                      style={[
                        styles.rsvpButton,
                        isSelected && {
                          backgroundColor: `${opt.color}20`,
                          borderColor: opt.color,
                        },
                      ]}
                      disabled={saving}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={opt.icon}
                        size={15}
                        color={isSelected ? opt.color : PLAYER_DARK.textMuted}
                      />
                      <ProDayText
                        style={[
                          styles.rsvpButtonLabel,
                          { color: isSelected ? opt.color : PLAYER_DARK.textMuted },
                          isSelected && styles.rsvpButtonLabelActive,
                        ]}
                      >
                        {opt.label}
                      </ProDayText>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {showAbsenceNote ? (
                <View style={styles.absenceNoteContainer}>
                  <ProDayText style={styles.absenceNotePrompt}>
                    Motif d’absence (optionnel) :
                  </ProDayText>
                  <TextInput
                    style={styles.absenceInput}
                    placeholder="Ex. blessure, examen, déplacement professionnel…"
                    placeholderTextColor={PLAYER_DARK.textMuted}
                    value={absenceNote}
                    onChangeText={setAbsenceNote}
                    multiline
                  />
                  <TouchableOpacity
                    style={styles.confirmAbsenceBtn}
                    onPress={() => void handleRsvp('no')}
                    disabled={saving}
                  >
                    <ProDayText style={styles.confirmAbsenceBtnText}>
                      Confirmer l’absence
                    </ProDayText>
                  </TouchableOpacity>
                </View>
              ) : null}

              {profile && event.rsvp_notes?.[profile.uid] ? (
                <View style={styles.savedNoteRow}>
                  <Ionicons name="information-circle-outline" size={14} color={PLAYER_DARK.textMuted} />
                  <ProDayText style={styles.savedNoteText}>
                    Motif transmis : {event.rsvp_notes[profile.uid]}
                  </ProDayText>
                </View>
              ) : null}

              {profile ? (
                <LateReportControl
                  eventId={event.id}
                  playerUid={profile.uid}
                  playerName={profile.display_name}
                  currentRsvp={myStatus}
                  onReported={() => void load()}
                />
              ) : null}
            </View>
          )}

          {/* CHECKLIST ÉQUIPEMENT D'ÉVÉNEMENT (PERSONNELLE & REQUIS COACH) */}
          {profile ? (
            <EventEquipmentChecklistPanel
              eventId={event.id}
              eventType={event.event_type}
              playerUid={profile.uid}
              accent={PLAYER_DARK.accent}
            />
          ) : null}

          {/* DEMANDER UN FEEDBACK AU COACH SUR CET ÉVÉNEMENT */}
          {profile && (event.club_id || isStaff) ? (
            <TouchableOpacity
              style={styles.askFeedbackBtn}
              onPress={() => {
                prodayHaptics.selection();
                setShowFeedbackModal(true);
              }}
              activeOpacity={0.8}
            >
              <View style={styles.askFeedbackLeft}>
                <View style={styles.askFeedbackIconWrap}>
                  <Ionicons name="chatbubble-ellipses" size={17} color={PLAYER_DARK.accent} />
                </View>
                <View style={styles.askFeedbackTextCol}>
                  <ProDayText style={styles.askFeedbackTitle}>
                    Une question sur ce rendez-vous ?
                  </ProDayText>
                  <ProDayText style={styles.askFeedbackSub}>
                    Demander un feedback personnalisé à votre coach
                  </ProDayText>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={16} color={PLAYER_DARK.textMuted} />
            </TouchableOpacity>
          ) : null}

          {/* 4. COMPOSITION D'ÉQUIPE (SI PUBLIÉE) */}
          {event.lineup && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeaderRow}>
                <View style={styles.sectionTitleRow}>
                  <Ionicons name="football" size={16} color={PLAYER_DARK.accent} />
                  <ProDayText style={styles.sectionTitle}>
                    Composition · {event.lineup.formation}
                  </ProDayText>
                </View>

                <TouchableOpacity
                  style={styles.viewLineupBtn}
                  onPress={() => setSubView('lineup')}
                >
                  <ProDayText style={[styles.viewLineupBtnText, { color: PLAYER_DARK.accent }]}>
                    Voir le terrain →
                  </ProDayText>
                </TouchableOpacity>
              </View>

              <ProDayText style={styles.lineupSummaryText}>
                {event.lineup.slots.filter((s) => s.role === 'starter').length} titulaires ·{' '}
                {event.lineup.slots.filter((s) => s.role === 'sub').length} remplaçants
              </ProDayText>
            </View>
          )}

          {/* 5. COVOITURAGE D'ÉQUIPE */}
          {profile &&
          (isOrganizer ||
            isStaff ||
            event.invitee_uids.includes(profile.uid) ||
            event.event_type === 'detection') ? (
            <EventCarpoolPanel
              event={event}
              profile={profile}
              isStaff={Boolean(isStaff)}
              onUpdated={load}
            />
          ) : null}

          {/* 6. CONSIGNES & DESCRIPTION */}
          {event.description ? (
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="document-text-outline" size={16} color={PLAYER_DARK.accent} />
                <ProDayText style={styles.sectionTitle}>Consignes du staff</ProDayText>
              </View>
              <ProDayText style={styles.descriptionText}>{event.description}</ProDayText>
            </View>
          ) : null}

          {/* 7. ESPACE STAFF & POINTAGE (SI AUTORISÉ) */}
          {isOrganizer && (
            <View style={styles.sectionCard}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="shield-checkmark" size={16} color={PLAYER_DARK.accent} />
                <ProDayText style={styles.sectionTitle}>Gestion Staff</ProDayText>
              </View>

              <View style={styles.summaryStatsRow}>
                {(['yes', 'maybe', 'no', 'pending'] as RsvpStatus[]).map((st) => {
                  const n = Object.values(event.rsvps).filter((s) => s === st).length;
                  return (
                    <View key={st} style={styles.summaryStatBox}>
                      <ProDayText style={styles.summaryStatNumber}>{n}</ProDayText>
                      <ProDayText style={styles.summaryStatLabel}>{RSVP_STATUS_LABELS[st]}</ProDayText>
                    </View>
                  );
                })}
              </View>

              <View style={styles.staffActionRow}>
                {pendingCount > 0 && (
                  <TouchableOpacity
                    style={[styles.staffPrimaryBtn, { backgroundColor: PLAYER_DARK.accent }]}
                    onPress={handleReminder}
                    disabled={saving}
                  >
                    <ProDayText style={styles.staffPrimaryBtnText}>
                      Relancer ({pendingCount})
                    </ProDayText>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.staffSecondaryBtn}
                  onPress={() => setSubView('lineup')}
                >
                  <ProDayText style={styles.staffSecondaryBtnText}>Modifier la composition</ProDayText>
                </TouchableOpacity>
              </View>

              {event.invitee_uids.length > 0 ? (
                <View style={{ marginTop: 12 }}>
                  <EventAttendancePanel
                    event={event}
                    profile={profile}
                    isStaff={isStaff}
                    onUpdated={load}
                  />
                </View>
              ) : null}
            </View>
          )}
        </ScrollView>
      </View>

      <PushScreenTransition active={subView !== 'detail'}>
        {subView === 'lineup' ? (
          <EventLineupScreen
            eventId={eventId}
            onBack={() => {
              setSubView('detail');
              void load();
            }}
          />
        ) : subView === 'live' ? (
          <EventLiveStatsScreen
            eventId={eventId}
            onBack={() => {
              setSubView('detail');
              void load();
            }}
          />
        ) : null}
      </PushScreenTransition>

      {profile ? (
        <PlayerFeedbackModal
          visible={showFeedbackModal}
          onClose={() => setShowFeedbackModal(false)}
          playerUid={profile.uid}
          playerName={profile.display_name}
          clubId={event.club_id}
          teamId={event.team_id}
          initialKind="event_feedback"
          initialEventId={event.id}
          initialEventTitle={event.title}
          initialEventDate={event.starts_at ? new Date(event.starts_at) : undefined}
          accent={PLAYER_DARK.accent}
        />
      ) : null}
    </>
  );
};

const styles = StyleSheet.create({
  askFeedbackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginVertical: 8,
  },
  askFeedbackLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  askFeedbackIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(76, 139, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  askFeedbackTextCol: {
    flex: 1,
  },
  askFeedbackTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: PLAYER_DARK.text,
  },
  askFeedbackSub: {
    fontSize: 11,
    color: PLAYER_DARK.textMuted,
    marginTop: 2,
  },
  container: {
    flex: 1,
    backgroundColor: PLAYER_DARK.bg,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: PLAYER_DARK.bg,
  },
  navHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  navCenter: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  navHeaderTitle: {
    ...playerType.headline,
    color: PLAYER_DARK.text,
  },
  navActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  content: {
    padding: 16,
    paddingBottom: 36,
    gap: 12,
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  missingText: {
    ...playerType.subheadline,
    color: PLAYER_DARK.textMuted,
    textAlign: 'center',
  },
  heroCard: {
    backgroundColor: PLAYER_DARK.surface,
    borderColor: PLAYER_DARK.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
    gap: 12,
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  typeBadgeText: {
    ...playerType.micro,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statusBadgeActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusBadgeTextActive: {
    ...playerType.micro,
    color: '#10B981',
    fontWeight: '800',
  },
  statusBadgeCancelled: {
    backgroundColor: 'rgba(239, 68, 68, 0.14)',
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 6,
  },
  statusBadgeTextCancelled: {
    ...playerType.micro,
    color: '#EF4444',
    fontWeight: '800',
  },
  heroTitle: {
    ...playerType.title,
    fontSize: 22,
    color: PLAYER_DARK.text,
  },
  metaStack: {
    gap: 6,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  metaText: {
    ...playerType.subheadline,
    color: PLAYER_DARK.text,
    fontSize: 13.5,
  },
  meetingHighlight: {
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.06)',
  },
  organizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  organizerText: {
    ...playerType.caption,
    color: PLAYER_DARK.textMuted,
  },
  sectionCard: {
    backgroundColor: PLAYER_DARK.surface,
    borderColor: PLAYER_DARK.border,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 10,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    ...playerType.headline,
    fontSize: 15,
    color: PLAYER_DARK.text,
  },
  itineraryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  itineraryButtonText: {
    ...playerType.micro,
    fontWeight: '700',
  },
  locationMainText: {
    ...playerType.subheadline,
    color: PLAYER_DARK.text,
    fontWeight: '600',
  },
  locationSubText: {
    ...playerType.caption,
    color: PLAYER_DARK.textMuted,
  },
  rsvpSegment: {
    flexDirection: 'row',
    gap: 8,
  },
  rsvpButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderColor: PLAYER_DARK.border,
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 12,
  },
  rsvpButtonLabel: {
    ...playerType.caption,
    fontWeight: '600',
  },
  rsvpButtonLabelActive: {
    fontWeight: '800',
  },
  absenceNoteContainer: {
    gap: 6,
    marginTop: 6,
  },
  absenceNotePrompt: {
    ...playerType.caption,
    color: PLAYER_DARK.textMuted,
  },
  absenceInput: {
    backgroundColor: PLAYER_DARK.surfaceRaised,
    borderColor: PLAYER_DARK.border,
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    color: PLAYER_DARK.text,
    ...playerType.caption,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  confirmAbsenceBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.16)',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmAbsenceBtnText: {
    ...playerType.caption,
    color: '#EF4444',
    fontWeight: '700',
  },
  savedNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  savedNoteText: {
    ...playerType.caption,
    color: PLAYER_DARK.textMuted,
    fontStyle: 'italic',
  },
  viewLineupBtn: {
    paddingVertical: 2,
  },
  viewLineupBtnText: {
    ...playerType.caption,
    fontWeight: '700',
  },
  lineupSummaryText: {
    ...playerType.caption,
    color: PLAYER_DARK.textMuted,
  },
  descriptionText: {
    ...playerType.subheadline,
    color: PLAYER_DARK.textMuted,
    lineHeight: 20,
  },
  summaryStatsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  summaryStatBox: {
    flex: 1,
    backgroundColor: PLAYER_DARK.surfaceRaised,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
  },
  summaryStatNumber: {
    ...playerType.headline,
    color: PLAYER_DARK.text,
  },
  summaryStatLabel: {
    ...playerType.micro,
    color: PLAYER_DARK.textMuted,
    marginTop: 2,
  },
  staffActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  staffPrimaryBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffPrimaryBtnText: {
    ...playerType.caption,
    color: '#000000',
    fontWeight: '800',
  },
  staffSecondaryBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  staffSecondaryBtnText: {
    ...playerType.caption,
    color: PLAYER_DARK.text,
    fontWeight: '700',
  },
});

