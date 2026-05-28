import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import type { TeamEvent, RsvpStatus } from '../models/TeamEvent';
import {
  EVENT_TYPE_LABELS,
  countRsvpYes,
  userRsvp,
  getPendingInviteeUids,
} from '../models/TeamEvent';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { teamEventsService } from '../services/teamEvents.service';
import { useAuth } from '../context/AuthContext';
import { formatCalendarDate } from '../utils/seasonCalendar';
import { buildMatchSheetHtml } from '../utils/matchSheetHtml';
import { openPrintableHtml } from '../utils/openCvHtml';
import { EventLineupScreen } from './EventLineupScreen';
import { EventLiveStatsScreen } from './EventLiveStatsScreen';
import { EventAttendancePanel } from '../components/team/EventAttendancePanel';
import { colors, spacing, radius } from '../theme/designTokens';

interface TeamEventDetailScreenProps {
  eventId: string;
  onBack: () => void;
}

type SubView = 'detail' | 'lineup' | 'live';

const RSVP_OPTIONS: { status: RsvpStatus; label: string }[] = [
  { status: 'yes', label: 'Présent' },
  { status: 'maybe', label: 'Peut-être' },
  { status: 'no', label: 'Absent' },
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

  const load = useCallback(async () => {
    setLoading(true);
    setEvent(await teamEventsService.getById(eventId));
    setLoading(false);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  if (subView === 'lineup') {
    return (
      <EventLineupScreen
        eventId={eventId}
        onBack={() => {
          setSubView('detail');
          load();
        }}
      />
    );
  }

  if (subView === 'live') {
    return (
      <EventLiveStatsScreen
        eventId={eventId}
        onBack={() => {
          setSubView('detail');
          load();
        }}
      />
    );
  }

  const handleRsvp = async (status: RsvpStatus) => {
    if (!profile) return;
    if (status === 'no' && !showAbsenceNote) {
      setShowAbsenceNote(true);
      return;
    }
    setSaving(true);
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
      await load();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Réponse impossible.');
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
        Alert.alert('Relance envoyée', `${n} notification(s) (FCM si token configuré).`);
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
    const pending = getPendingInviteeUids(event).length;
    const msg = `Convocation ProDay — ${event.title}\n${formatCalendarDate(event.starts_at)}\n${event.city}${event.location_label ? ` · ${event.location_label}` : ''}\n${pending > 0 ? `${pending} réponse(s) en attente.` : ''}`;
    await Share.share({ message: msg });
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.root}>
        <ScreenHeader title="Événement" onBack={onBack} centered />
        <Text style={styles.missing}>Événement introuvable.</Text>
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
  const showLineupLive =
    event.event_type === 'training' ||
    event.event_type === 'friendly' ||
    event.event_type === 'detection' ||
    event.event_type === 'tournament';
  const isStaff =
    Boolean(isAdmin) ||
    profile?.role === 'coach' ||
    profile?.role === 'organizer' ||
    profile?.role === 'agent';
  const canManageFinalizedReport = isStaff;
  const reportLocked = Boolean(event.match_report_finalized_at) && !canManageFinalizedReport;

  const toggleReportLock = async () => {
    if (!canManageFinalizedReport) return;
    await teamEventsService.setMatchReportFinalized(
      event.id,
      !event.match_report_finalized_at
    );
    await load();
  };

  return (
    <View style={styles.root}>
      <ScreenHeader title="Convocation" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{EVENT_TYPE_LABELS[event.event_type]}</Text>
        </View>
        <Text style={styles.title}>{event.title}</Text>
        <Text style={styles.meta}>{formatCalendarDate(event.starts_at)}</Text>
        <Text style={styles.meta}>
          {event.city}
          {event.location_label ? ` · ${event.location_label}` : ''}
        </Text>
        <Text style={styles.meta}>Par {event.organizer_name}</Text>

        {event.event_type === 'detection' && event.max_participants ? (
          <Text style={styles.stats}>
            {yesCount} / {event.max_participants} places confirmées
          </Text>
        ) : null}

        {event.categories && event.categories.length > 0 ? (
          <Text style={styles.categories}>{event.categories.join(' · ')}</Text>
        ) : null}

        {event.description ? <Text style={styles.desc}>{event.description}</Text> : null}

        {event.lineup && (
          <View style={styles.lineupBox}>
            <Text style={styles.lineupTitle}>Composition · {event.lineup.formation}</Text>
            <Text style={styles.lineupSub}>
              {event.lineup.slots.filter((s) => s.role === 'starter').length} titulaires ·{' '}
              {event.lineup.slots.filter((s) => s.role === 'sub').length} remplaçants
            </Text>
          </View>
        )}

        {isOrganizer && (
          <>
            <View style={styles.summary}>
              <Text style={styles.summaryTitle}>Réponses</Text>
              {(['yes', 'maybe', 'no', 'pending'] as RsvpStatus[]).map((st) => {
                const n = Object.values(event.rsvps).filter((s) => s === st).length;
                const labels: Record<RsvpStatus, string> = {
                  yes: 'Présents',
                  maybe: 'Peut-être',
                  no: 'Absents',
                  pending: 'En attente',
                };
                return (
                  <Text key={st} style={styles.summaryLine}>
                    {labels[st]} : {n}
                  </Text>
                );
              })}
            </View>

            <View style={styles.organizerRow}>
              {pendingCount > 0 && (
                <TouchableOpacity
                  style={styles.orgBtn}
                  onPress={handleReminder}
                  disabled={saving}
                >
                  <Text style={styles.orgBtnText}>
                    Relancer ({pendingCount})
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity style={styles.orgBtnSecondary} onPress={shareConvocation}>
                <Text style={styles.orgBtnSecondaryText}>Partager</Text>
              </TouchableOpacity>
            </View>

            {event.last_reminder_at && (
              <Text style={styles.reminderMeta}>
                Dernière relance :{' '}
                {event.last_reminder_at.toLocaleString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}

            {showLineupLive && (
              <View style={styles.toolRow}>
                <TouchableOpacity
                  style={[styles.toolCard, reportLocked && styles.toolCardMuted]}
                  onPress={() => setSubView('lineup')}
                >
                  <Text style={styles.toolTitle}>Composition</Text>
                  <Text style={styles.toolSub}>Tactique & titulaires</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toolCard, reportLocked && styles.toolCardMuted]}
                  onPress={() => setSubView('live')}
                  disabled={reportLocked}
                >
                  <Text style={styles.toolTitle}>Live Stats</Text>
                  <Text style={styles.toolSub}>
                    {reportLocked
                      ? 'Lecture seule (rapport validé)'
                      : `${event.live_actions?.length ?? 0} action(s)`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {(event.lineup || (event.live_actions?.length ?? 0) > 0) && (
              <TouchableOpacity
                style={styles.exportBtn}
                onPress={() =>
                  openPrintableHtml(buildMatchSheetHtml(event), 'Feuille de match')
                }
              >
                <Text style={styles.exportBtnText}>Exporter feuille de match (PDF)</Text>
              </TouchableOpacity>
            )}
            {event.match_report_finalized_at ? (
              <Text style={styles.reportLockInfo}>
                Rapport validé le{' '}
                {event.match_report_finalized_at.toLocaleDateString('fr-FR')}.
              </Text>
            ) : null}
            {canManageFinalizedReport ? (
              <TouchableOpacity style={styles.lockToggleBtn} onPress={() => void toggleReportLock()}>
                <Text style={styles.lockToggleText}>
                  {event.match_report_finalized_at
                    ? 'Déverrouiller le rapport'
                    : 'Valider et verrouiller le rapport'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {event.invitee_uids.length > 0 ? (
              <View style={styles.attendanceSection}>
                <Text style={styles.summaryTitle}>Présences & pointage</Text>
                <EventAttendancePanel
                  event={event}
                  isStaff={isStaff}
                  onUpdated={load}
                />
              </View>
            ) : null}
          </>
        )}

        {canRespond && (
          <>
            <Text style={styles.rsvpLabel}>Votre réponse</Text>
            <View style={styles.rsvpRow}>
              {RSVP_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.status}
                  style={[styles.rsvpBtn, myStatus === opt.status && styles.rsvpBtnActive]}
                  onPress={() => handleRsvp(opt.status)}
                  disabled={saving}
                >
                  <Text
                    style={[
                      styles.rsvpBtnText,
                      myStatus === opt.status && styles.rsvpBtnTextActive,
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {showAbsenceNote ? (
              <>
                <Text style={styles.rsvpLabel}>Motif d&apos;absence (optionnel)</Text>
                <TextInput
                  style={styles.noteInput}
                  placeholder="Ex. blessure, examen, déplacement…"
                  placeholderTextColor={colors.textMuted}
                  value={absenceNote}
                  onChangeText={setAbsenceNote}
                  multiline
                />
                <TouchableOpacity
                  style={styles.confirmAbsentBtn}
                  onPress={() => void handleRsvp('no')}
                  disabled={saving}
                >
                  <Text style={styles.confirmAbsentText}>Confirmer l&apos;absence</Text>
                </TouchableOpacity>
              </>
            ) : null}
            {profile && event.rsvp_notes?.[profile.uid] ? (
              <Text style={styles.myNote}>
                Votre motif : {event.rsvp_notes[profile.uid]}
              </Text>
            ) : null}
          </>
        )}

        {event.event_type === 'detection' &&
          profile &&
          !event.invitee_uids.includes(profile.uid) && (
            <TouchableOpacity
              style={styles.registerBtn}
              onPress={() => handleRsvp('yes')}
              disabled={saving}
            >
              <Text style={styles.registerText}>S&apos;inscrire à la détection</Text>
            </TouchableOpacity>
          )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  missing: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
  badge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: colors.accent },
  title: { fontSize: 22, fontWeight: '900', color: colors.text, marginBottom: spacing.sm },
  meta: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
  stats: { fontSize: 15, fontWeight: '800', color: colors.accent, marginTop: spacing.md },
  categories: { fontSize: 13, color: colors.textMuted, marginTop: spacing.xs },
  desc: { fontSize: 15, lineHeight: 22, color: colors.text, marginTop: spacing.lg },
  lineupBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  lineupTitle: { fontWeight: '900', color: colors.text },
  lineupSub: { fontSize: 12, color: colors.textMuted, marginTop: 4 },
  summary: {
    marginTop: spacing.xl,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  summaryTitle: { fontWeight: '900', marginBottom: spacing.sm, color: colors.text },
  summaryLine: { fontSize: 13, color: colors.textSecondary, marginBottom: 4 },
  organizerRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  orgBtn: {
    flex: 1,
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  orgBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
  orgBtnSecondary: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  orgBtnSecondaryText: { fontWeight: '800', color: colors.text },
  reminderMeta: { fontSize: 11, color: colors.textMuted, marginTop: spacing.xs },
  toolRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  toolCard: {
    flex: 1,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toolCardMuted: { opacity: 0.6 },
  toolTitle: { fontWeight: '900', fontSize: 14, color: colors.text },
  toolSub: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  exportBtn: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  exportBtnText: { fontWeight: '800', fontSize: 13, color: colors.accent },
  reportLockInfo: { marginTop: spacing.sm, fontSize: 12, color: colors.textMuted },
  lockToggleBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
  },
  lockToggleText: { color: colors.textSecondary, fontSize: 12, fontWeight: '800' },
  rsvpLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: colors.textSecondary,
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  rsvpRow: { flexDirection: 'row', gap: spacing.sm },
  rsvpBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface,
  },
  rsvpBtnActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  rsvpBtnText: { fontWeight: '800', fontSize: 13, color: colors.text },
  rsvpBtnTextActive: { color: colors.brandInverse },
  registerBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  registerText: { color: '#fff', fontWeight: '900', fontSize: 16 },
  attendanceSection: { marginTop: spacing.lg },
  noteInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    color: colors.text,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  confirmAbsentBtn: {
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  confirmAbsentText: { color: colors.brandInverse, fontWeight: '800', fontSize: 13 },
  myNote: { fontSize: 12, color: colors.textMuted, marginTop: spacing.xs, fontStyle: 'italic' },
});
