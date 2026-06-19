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
import { buildConvocationShareMessage } from '../utils/teamEventShare';
import { EventLineupScreen } from './EventLineupScreen';
import { EventLiveStatsScreen } from './EventLiveStatsScreen';
import { EventAttendancePanel } from '../components/team/EventAttendancePanel';
import { EventCarpoolPanel } from '../components/team/EventCarpoolPanel';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';

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
  const { colors: c, rootStyle } = useThemedScreen();
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

  if (loading) {
    return (
      <View style={[styles.centered, rootStyle]}>
        <ActivityIndicator color={c.brand} size="large" />
      </View>
    );
  }

  if (!event) {
    return (
      <View style={rootStyle}>
        <ScreenHeader title="Événement" onBack={onBack} centered />
        <Text style={[styles.missing, { color: c.textMuted }]}>Événement introuvable.</Text>
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
    profile?.role === 'agent' ||
    profile?.role === 'club';
  const canManageFinalizedReport = isStaff;
  const reportLocked = Boolean(event.match_report_finalized_at) && !canManageFinalizedReport;

  const toggleReportLock = async () => {
    if (!canManageFinalizedReport || !profile) return;
    await teamEventsService.setMatchReportFinalized(
      event.id,
      !event.match_report_finalized_at,
      { user: profile, isAdmin },
    );
    await load();
  };

  const surfaceCard = {
    backgroundColor: c.surface,
    borderColor: c.border,
  };

  return (
    <View style={rootStyle}>
      <ScreenHeader title="Convocation" onBack={onBack} centered />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.badge, { backgroundColor: c.accentSoft }]}>
          <Text style={[styles.badgeText, { color: c.brand }]}>
            {EVENT_TYPE_LABELS[event.event_type]}
          </Text>
        </View>
        <Text style={[styles.title, { color: c.text }]}>{event.title}</Text>
        <Text style={[styles.meta, { color: c.textSecondary }]}>
          {formatCalendarDate(event.starts_at)}
        </Text>
        <Text style={[styles.meta, { color: c.textSecondary }]}>
          {event.city}
          {event.location_label ? ` · ${event.location_label}` : ''}
        </Text>
        <Text style={[styles.meta, { color: c.textSecondary }]}>Par {event.organizer_name}</Text>

        {event.event_type === 'detection' && event.max_participants ? (
          <Text style={[styles.stats, { color: c.brand }]}>
            {yesCount} / {event.max_participants} places confirmées
          </Text>
        ) : null}

        {event.categories && event.categories.length > 0 ? (
          <Text style={[styles.categories, { color: c.textMuted }]}>
            {event.categories.join(' · ')}
          </Text>
        ) : null}

        {event.description ? (
          <Text style={[styles.desc, { color: c.text }]}>{event.description}</Text>
        ) : null}

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

        {event.lineup && (
          <View style={[styles.lineupBox, surfaceCard]}>
            <Text style={[styles.lineupTitle, { color: c.text }]}>
              Composition · {event.lineup.formation}
            </Text>
            <Text style={[styles.lineupSub, { color: c.textMuted }]}>
              {event.lineup.slots.filter((s) => s.role === 'starter').length} titulaires ·{' '}
              {event.lineup.slots.filter((s) => s.role === 'sub').length} remplaçants
            </Text>
          </View>
        )}

        {isOrganizer && (
          <>
            <View style={[styles.summary, surfaceCard]}>
              <Text style={[styles.summaryTitle, { color: c.text }]}>Réponses</Text>
              {(['yes', 'maybe', 'no', 'pending'] as RsvpStatus[]).map((st) => {
                const n = Object.values(event.rsvps).filter((s) => s === st).length;
                const labels: Record<RsvpStatus, string> = {
                  yes: 'Présents',
                  maybe: 'Peut-être',
                  no: 'Absents',
                  pending: 'En attente',
                };
                return (
                  <Text key={st} style={[styles.summaryLine, { color: c.textSecondary }]}>
                    {labels[st]} : {n}
                  </Text>
                );
              })}
            </View>

            <View style={styles.organizerRow}>
              {pendingCount > 0 && (
                <TouchableOpacity
                  style={[styles.orgBtn, { backgroundColor: c.brand }]}
                  onPress={handleReminder}
                  disabled={saving}
                >
                  <Text style={[styles.orgBtnText, { color: c.brandInverse }]}>
                    Relancer ({pendingCount})
                  </Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.orgBtnSecondary, surfaceCard]}
                onPress={shareConvocation}
              >
                <Text style={[styles.orgBtnSecondaryText, { color: c.text }]}>Partager</Text>
              </TouchableOpacity>
            </View>

            {event.last_reminder_at && (
              <Text style={[styles.reminderMeta, { color: c.textMuted }]}>
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
                  style={[styles.toolCard, surfaceCard, reportLocked && styles.toolCardMuted]}
                  onPress={() => setSubView('lineup')}
                >
                  <Text style={[styles.toolTitle, { color: c.text }]}>Composition</Text>
                  <Text style={[styles.toolSub, { color: c.textMuted }]}>Tactique & titulaires</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.toolCard, surfaceCard, reportLocked && styles.toolCardMuted]}
                  onPress={() => setSubView('live')}
                  disabled={reportLocked}
                >
                  <Text style={[styles.toolTitle, { color: c.text }]}>Live Stats</Text>
                  <Text style={[styles.toolSub, { color: c.textMuted }]}>
                    {reportLocked
                      ? 'Lecture seule (rapport validé)'
                      : `${event.live_actions?.length ?? 0} action(s)`}
                  </Text>
                </TouchableOpacity>
              </View>
            )}

            {event.match_report_finalized_at ? (
              <Text style={[styles.reportLockInfo, { color: c.textMuted }]}>
                Rapport validé le{' '}
                {event.match_report_finalized_at.toLocaleDateString('fr-FR')}.
              </Text>
            ) : null}
            {canManageFinalizedReport ? (
              <TouchableOpacity
                style={[styles.lockToggleBtn, surfaceCard]}
                onPress={() => void toggleReportLock()}
              >
                <Text style={[styles.lockToggleText, { color: c.textSecondary }]}>
                  {event.match_report_finalized_at
                    ? 'Déverrouiller le rapport'
                    : 'Valider et verrouiller le rapport'}
                </Text>
              </TouchableOpacity>
            ) : null}

            {event.invitee_uids.length > 0 ? (
              <View style={styles.attendanceSection}>
                <Text style={[styles.summaryTitle, { color: c.text }]}>Présences & pointage</Text>
                <EventAttendancePanel
                  event={event}
                  profile={profile}
                  isStaff={isStaff}
                  onUpdated={load}
                />
              </View>
            ) : null}
          </>
        )}

        {canRespond && (
          <>
            <Text style={[styles.rsvpLabel, { color: c.textSecondary }]}>Votre réponse</Text>
            <View style={styles.rsvpRow}>
              {RSVP_OPTIONS.map((opt) => {
                const active = myStatus === opt.status;
                return (
                  <TouchableOpacity
                    key={opt.status}
                    style={[
                      styles.rsvpBtn,
                      {
                        backgroundColor: active ? c.brand : c.surface,
                        borderColor: active ? c.brand : c.border,
                      },
                    ]}
                    onPress={() => handleRsvp(opt.status)}
                    disabled={saving}
                  >
                    <Text
                      style={[
                        styles.rsvpBtnText,
                        { color: active ? c.brandInverse : c.text },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {showAbsenceNote ? (
              <>
                <Text style={[styles.rsvpLabel, { color: c.textSecondary }]}>
                  Motif d&apos;absence (optionnel)
                </Text>
                <TextInput
                  style={[
                    styles.noteInput,
                    {
                      backgroundColor: c.surface,
                      borderColor: c.border,
                      color: c.text,
                    },
                  ]}
                  placeholder="Ex. blessure, examen, déplacement…"
                  placeholderTextColor={c.textMuted}
                  value={absenceNote}
                  onChangeText={setAbsenceNote}
                  multiline
                />
                <TouchableOpacity
                  style={[styles.confirmAbsentBtn, { backgroundColor: c.brand }]}
                  onPress={() => void handleRsvp('no')}
                  disabled={saving}
                >
                  <Text style={[styles.confirmAbsentText, { color: c.brandInverse }]}>
                    Confirmer l&apos;absence
                  </Text>
                </TouchableOpacity>
              </>
            ) : null}
            {profile && event.rsvp_notes?.[profile.uid] ? (
              <Text style={[styles.myNote, { color: c.textMuted }]}>
                Votre motif : {event.rsvp_notes[profile.uid]}
              </Text>
            ) : null}
          </>
        )}

        {event.event_type === 'detection' &&
          profile &&
          !event.invitee_uids.includes(profile.uid) && (
            <TouchableOpacity
              style={[styles.registerBtn, { backgroundColor: c.brand }]}
              onPress={() => handleRsvp('yes')}
              disabled={saving}
            >
              <Text style={[styles.registerText, { color: c.brandInverse }]}>
                S&apos;inscrire à la détection
              </Text>
            </TouchableOpacity>
          )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  missing: { textAlign: 'center', marginTop: 40 },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.sm,
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  title: { fontSize: 22, fontWeight: '900', marginBottom: spacing.sm },
  meta: { fontSize: 14, marginBottom: 4 },
  stats: { fontSize: 15, fontWeight: '800', marginTop: spacing.md },
  categories: { fontSize: 13, marginTop: spacing.xs },
  desc: { fontSize: 15, lineHeight: 22, marginTop: spacing.lg },
  lineupBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  lineupTitle: { fontWeight: '900' },
  lineupSub: { fontSize: 12, marginTop: 4 },
  summary: {
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  summaryTitle: { fontWeight: '900', marginBottom: spacing.sm },
  summaryLine: { fontSize: 13, marginBottom: 4 },
  organizerRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  orgBtn: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  orgBtnText: { fontWeight: '900', fontSize: 13 },
  orgBtnSecondary: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  orgBtnSecondaryText: { fontWeight: '800' },
  reminderMeta: { fontSize: 11, marginTop: spacing.xs },
  toolRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.lg },
  toolCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  toolCardMuted: { opacity: 0.6 },
  toolTitle: { fontWeight: '900', fontSize: 14 },
  toolSub: { fontSize: 11, marginTop: 4 },
  exportBtn: {
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  exportBtnText: { fontWeight: '800', fontSize: 13 },
  reportLockInfo: { marginTop: spacing.sm, fontSize: 12 },
  lockToggleBtn: {
    marginTop: spacing.sm,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  lockToggleText: { fontSize: 12, fontWeight: '800' },
  rsvpLabel: {
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing.xl,
    marginBottom: spacing.sm,
  },
  rsvpRow: { flexDirection: 'row', gap: spacing.sm },
  rsvpBtn: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: 'center',
  },
  rsvpBtnText: { fontWeight: '800', fontSize: 13 },
  registerBtn: {
    marginTop: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  registerText: { fontWeight: '900', fontSize: 16 },
  attendanceSection: { marginTop: spacing.lg },
  noteInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: 14,
    minHeight: 72,
    textAlignVertical: 'top',
    marginBottom: spacing.sm,
  },
  confirmAbsentBtn: {
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  confirmAbsentText: { fontWeight: '800', fontSize: 13 },
  myNote: { fontSize: 12, marginTop: spacing.xs, fontStyle: 'italic' },
});
