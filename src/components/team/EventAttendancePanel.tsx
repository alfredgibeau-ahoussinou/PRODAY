import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PressableSpring, StaggerReveal } from '../motion';
import type { TeamEvent, AttendanceMark, RsvpStatus } from '../../models/TeamEvent';
import { isLateRsvp, RSVP_STATUS_LABELS, userRsvp } from '../../models/TeamEvent';
import type { User } from '../../models/User';
import { usersService } from '../../services/users.service';
import { teamEventsService } from '../../services/teamEvents.service';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { spacing, radius } from '../../theme/designTokens';

function presenceDot(rsvp: RsvpStatus, mark?: AttendanceMark): { color: string; label: string } {
  if (mark === 'present') return { color: '#10B981', label: 'Présent' };
  if (mark === 'absent') return { color: '#EF4444', label: 'Absent' };
  if (mark === 'excused') return { color: '#94A3B8', label: 'Excusé' };
  if (mark === 'late') return { color: '#F59E0B', label: 'Retard (pointé)' };
  if (rsvp === 'late_under_10') return { color: '#EAB308', label: 'Retard < 10 min' };
  if (rsvp === 'late_over_10') return { color: '#F59E0B', label: 'Retard ≥ 10 min' };
  if (rsvp === 'late_unknown') return { color: '#F59E0B', label: 'Retard' };
  if (rsvp === 'yes') return { color: '#10B981', label: 'Présent (annoncé)' };
  if (rsvp === 'no') return { color: '#EF4444', label: 'Absent' };
  if (rsvp === 'maybe') return { color: '#94A3B8', label: 'Peut-être' };
  return { color: '#64748B', label: 'En attente' };
}

const MARKS: { mark: AttendanceMark; label: string }[] = [
  { mark: 'present', label: 'Présent' },
  { mark: 'late', label: 'Retard' },
  { mark: 'excused', label: 'Excusé' },
  { mark: 'absent', label: 'Absent' },
];

interface EventAttendancePanelProps {
  event: TeamEvent;
  profile: User;
  isStaff: boolean;
  onUpdated: () => void;
}

export const EventAttendancePanel: React.FC<EventAttendancePanelProps> = ({
  event,
  profile,
  isStaff,
  onUpdated,
}) => {
  const { colors: c, isWoman } = useAppTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    void (async () => {
      const map: Record<string, string> = {};
      for (const uid of event.invitee_uids) {
        const u = await usersService.getPublicById(uid);
        map[uid] = u?.display_name ?? uid.slice(0, 8);
      }
      setNames(map);
    })();
  }, [event.invitee_uids]);

  const markAttendance = async (uid: string, mark: AttendanceMark) => {
    await teamEventsService.markAttendance(event.id, uid, mark, { user: profile });
    onUpdated();
  };

  if (event.invitee_uids.length === 0) {
    return (
      <Text style={styles.empty}>
        {isWoman
          ? 'Aucune joueuse convoquée sur cet événement.'
          : 'Aucun joueur convoqué sur cet événement.'}
      </Text>
    );
  }

  return (
    <ScrollView style={styles.list} nestedScrollEnabled>
      {event.invitee_uids.map((uid, index) => {
        const rsvp = userRsvp(event, uid);
        const note = event.rsvp_notes?.[uid];
        const mark = event.attendance_marks?.[uid];
        return (
          <StaggerReveal key={uid} index={index} delayStep={40}>
          <View style={styles.row}>
            <View style={styles.rowHead}>
              <Text style={styles.name}>{names[uid] ?? '…'}</Text>
              {(() => {
                const info = presenceDot(rsvp, mark);
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: info.color }} />
                    <Text style={styles.rsvp}>
                      {info.label}
                      {isLateRsvp(rsvp) || note ? ` · ${note ?? RSVP_STATUS_LABELS[rsvp]}` : ''}
                    </Text>
                  </View>
                );
              })()}
              {mark ? <Text style={styles.mark}>Pointage : {mark}</Text> : null}
            </View>
            {isStaff ? (
              <View style={styles.markRow}>
                {MARKS.map((m) => {
                  const active = mark === m.mark;
                  return (
                    <PressableSpring
                      key={m.mark}
                      style={[styles.markBtn, active && styles.markBtnOn]}
                      onPress={() => void markAttendance(uid, m.mark)}
                      scaleTo={0.94}
                      haptic
                    >
                      <Text style={[styles.markBtnText, active && styles.markBtnTextOn]}>
                        {m.label}
                      </Text>
                    </PressableSpring>
                  );
                })}
              </View>
            ) : null}
          </View>
          </StaggerReveal>
        );
      })}
    </ScrollView>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    list: { maxHeight: 320 },
    empty: { fontSize: 12, color: c.textMuted },
    row: {
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.sm,
      backgroundColor: c.surface,
    },
    rowHead: { marginBottom: spacing.xs },
    name: { fontSize: 13, fontWeight: '800', color: c.text },
    rsvp: { fontSize: 11, color: c.textSecondary, marginTop: 2 },
    mark: { fontSize: 11, color: c.brand, marginTop: 2, fontWeight: '700' },
    markRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
    markBtn: {
      paddingHorizontal: 8,
      paddingVertical: 5,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surfaceMuted,
    },
    markBtnOn: { backgroundColor: c.brand, borderColor: c.brand },
    markBtnText: { fontSize: 9, fontWeight: '700', color: c.textSecondary },
    markBtnTextOn: { color: c.brandInverse },
  });
}
