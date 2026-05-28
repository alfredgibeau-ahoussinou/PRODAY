import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import type { TeamEvent, AttendanceMark, RsvpStatus } from '../../models/TeamEvent';
import { userRsvp } from '../../models/TeamEvent';
import type { User } from '../../models/User';
import { usersService } from '../../services/users.service';
import { teamEventsService } from '../../services/teamEvents.service';
import { colors, spacing, radius } from '../../theme/designTokens';

const RSVP_LABELS: Record<RsvpStatus, string> = {
  yes: 'Oui',
  no: 'Non',
  maybe: 'Peut-être',
  pending: 'En attente',
};

const MARKS: { mark: AttendanceMark; label: string }[] = [
  { mark: 'present', label: 'Présent' },
  { mark: 'late', label: 'Retard' },
  { mark: 'excused', label: 'Excusé' },
  { mark: 'absent', label: 'Absent' },
];

interface EventAttendancePanelProps {
  event: TeamEvent;
  isStaff: boolean;
  onUpdated: () => void;
}

export const EventAttendancePanel: React.FC<EventAttendancePanelProps> = ({
  event,
  isStaff,
  onUpdated,
}) => {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      const map: Record<string, string> = {};
      for (const uid of event.invitee_uids) {
        const u = await usersService.getById(uid);
        map[uid] = u?.display_name ?? uid.slice(0, 8);
      }
      setNames(map);
    })();
  }, [event.invitee_uids]);

  const markAttendance = async (uid: string, mark: AttendanceMark) => {
    await teamEventsService.markAttendance(event.id, uid, mark);
    onUpdated();
  };

  if (event.invitee_uids.length === 0) {
    return <Text style={styles.empty}>Aucun joueur convoqué sur cet événement.</Text>;
  }

  return (
    <ScrollView style={styles.list} nestedScrollEnabled>
      {event.invitee_uids.map((uid) => {
        const rsvp = userRsvp(event, uid);
        const note = event.rsvp_notes?.[uid];
        const mark = event.attendance_marks?.[uid];
        return (
          <View key={uid} style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.name}>{names[uid] ?? '…'}</Text>
              <Text style={styles.rsvp}>
                RSVP : {RSVP_LABELS[rsvp]}
                {note ? ` · ${note}` : ''}
              </Text>
              {mark ? <Text style={styles.mark}>Pointage : {mark}</Text> : null}
            </View>
            {isStaff ? (
              <View style={styles.markRow}>
                {MARKS.map((m) => (
                  <TouchableOpacity
                    key={m.mark}
                    style={[styles.markBtn, mark === m.mark && styles.markBtnOn]}
                    onPress={() => void markAttendance(uid, m.mark)}
                  >
                    <Text
                      style={[styles.markBtnText, mark === m.mark && styles.markBtnTextOn]}
                    >
                      {m.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  list: { maxHeight: 320 },
  empty: { fontSize: 12, color: colors.textMuted },
  row: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
    backgroundColor: colors.surface,
  },
  rowHead: { marginBottom: spacing.xs },
  name: { fontSize: 13, fontWeight: '800', color: colors.text },
  rsvp: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  mark: { fontSize: 11, color: colors.accent, marginTop: 2, fontWeight: '700' },
  markRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  markBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceMuted,
  },
  markBtnOn: { backgroundColor: colors.ink, borderColor: colors.ink },
  markBtnText: { fontSize: 9, fontWeight: '700', color: colors.textSecondary },
  markBtnTextOn: { color: colors.brandInverse },
});
