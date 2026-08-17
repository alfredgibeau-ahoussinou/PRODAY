import React, { useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { AttendanceMark, TeamEvent } from '../../../models/TeamEvent';
import { RSVP_STATUS_LABELS, userRsvp } from '../../../models/TeamEvent';
import type { User } from '../../../models/User';
import { usersService } from '../../../services/users.service';
import { teamEventsService } from '../../../services/teamEvents.service';
import { CoachText } from '../coachPortalUi';
import { radius, spacing } from '../../../theme/designTokens';
import { useCoachThemedStyles } from '../../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../../utils/coachTeamTheme';

const MARKS: { mark: AttendanceMark; label: string }[] = [
  { mark: 'present', label: 'Présent' },
  { mark: 'late', label: 'Retard' },
  { mark: 'excused', label: 'Excusé' },
  { mark: 'absent', label: 'Absent' },
];

type Props = {
  event: TeamEvent;
  profile: User;
  onUpdated: () => void;
};

export function CoachEventAttendanceList({ event, profile, onUpdated }: Props) {
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
  }, [event.id, event.invitee_uids.join(',')]);

  const styles = useCoachThemedStyles(createStyles);

  const markAttendance = async (uid: string, mark: AttendanceMark) => {
    await teamEventsService.markAttendance(event.id, uid, mark, { user: profile });
    onUpdated();
  };

  if (event.invitee_uids.length === 0) {
    return (
      <CoachText variant="body" muted>
        Aucun joueur convoqué sur cet événement.
      </CoachText>
    );
  }

  return (
    <View style={styles.root}>
      <CoachText variant="caption" muted style={styles.header}>
        {event.invitee_uids.length} convoqué{event.invitee_uids.length > 1 ? 's' : ''}
      </CoachText>
      <View style={styles.list}>
        {event.invitee_uids.map((uid, index) => {
          const rsvp = userRsvp(event, uid);
          const note = event.rsvp_notes?.[uid];
          const mark = event.attendance_marks?.[uid];
          const rsvpLabel = RSVP_STATUS_LABELS[rsvp];
          return (
            <View
              key={uid}
              style={[styles.row, index < event.invitee_uids.length - 1 && styles.rowBorder]}
            >
              <View style={styles.rowHead}>
                <CoachText variant="section" numberOfLines={1} style={styles.name}>
                  {names[uid] ?? '…'}
                </CoachText>
                <CoachText variant="caption" muted numberOfLines={1}>
                  Réponse : {rsvpLabel}
                  {note ? ` · ${note}` : ''}
                </CoachText>
              </View>
              <View style={styles.markRow}>
                {MARKS.map((m) => {
                  const active = mark === m.mark;
                  return (
                    <Pressable
                      key={m.mark}
                      onPress={() => void markAttendance(uid, m.mark)}
                      style={({ pressed }) => [
                        styles.markBtn,
                        active && styles.markBtnOn,
                        pressed && { opacity: 0.7 },
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`${m.label} pour ${names[uid] ?? 'joueur'}`}
                    >
                      <CoachText
                        variant="caption"
                        style={[styles.markBtnText, active && styles.markBtnTextOn]}
                      >
                        {m.label}
                      </CoachText>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    root: { gap: spacing.sm },
    header: {
      paddingHorizontal: spacing.md,
      fontWeight: '600',
      letterSpacing: 0.6,
      textTransform: 'uppercase',
      fontSize: 11,
    },
    list: {
      backgroundColor: tokens.surface,
      borderRadius: radius.lg,
      overflow: 'hidden',
    },
    row: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      gap: spacing.sm,
    },
    rowBorder: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    rowHead: { gap: 2 },
    name: { fontWeight: '600', fontSize: 17 },
    markRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    markBtn: {
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: radius.pill,
      backgroundColor: tokens.elevated,
    },
    markBtnOn: { backgroundColor: tokens.accent },
    markBtnText: { fontWeight: '600', fontSize: 12, color: tokens.muted },
    markBtnTextOn: { color: '#fff', fontWeight: '700' },
  });
}
