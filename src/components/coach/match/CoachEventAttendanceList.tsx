import React, { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, View } from 'react-native';
import type { AttendanceMark, TeamEvent } from '../../../models/TeamEvent';
import { RSVP_STATUS_LABELS, userRsvp } from '../../../models/TeamEvent';
import type { User } from '../../../models/User';
import { usersService } from '../../../services/users.service';
import { teamEventsService } from '../../../services/teamEvents.service';
import { CoachText } from '../coachPortalUi';
import { radius, spacing } from '../../../theme/designTokens';
import { useCoachTheme, useCoachThemedStyles } from '../../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../../utils/coachTeamTheme';
import { executeBulkRsvpReminders } from '../../../utils/coachRsvpReminders';
import { prodayHaptics } from '../../../utils/prodayHaptics';
import { PressableSpring } from '../../motion';
import { Icon } from '../../ui/Icon';

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
  const [reminding, setReminding] = useState(false);
  const { tokens } = useCoachTheme();

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

  const confirmedUids = useMemo(
    () => event.invitee_uids.filter((uid) => userRsvp(event, uid) === 'yes'),
    [event],
  );
  const pendingUids = useMemo(
    () => event.invitee_uids.filter((uid) => userRsvp(event, uid) === 'pending'),
    [event],
  );
  const declinedUids = useMemo(
    () => event.invitee_uids.filter((uid) => userRsvp(event, uid) === 'no'),
    [event],
  );

  const markAttendance = async (uid: string, mark: AttendanceMark) => {
    await teamEventsService.markAttendance(event.id, uid, mark, { user: profile });
    onUpdated();
  };

  const handleRemindPending = async () => {
    if (pendingUids.length === 0) return;
    setReminding(true);
    try {
      const res = await executeBulkRsvpReminders([event], { user: profile });
      prodayHaptics.confirm();
      Alert.alert(
        'Relance transmise',
        `${res.remindedCount || pendingUids.length} rappel(s) de convocation envoyé(s) avec succès.`,
      );
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Erreur lors de la relance.');
    } finally {
      setReminding(false);
    }
  };

  if (event.invitee_uids.length === 0) {
    return (
      <CoachText variant="body" muted>
        Aucun joueur convoqué sur cet événement.
      </CoachText>
    );
  }

  const renderGroup = (
    title: string,
    uids: string[],
    dotColor: string,
    badgeBg: string,
  ) => {
    if (uids.length === 0) return null;
    return (
      <View style={styles.groupSection}>
        <View style={styles.groupHeader}>
          <View style={[styles.statusDot, { backgroundColor: dotColor }]} />
          <CoachText variant="caption" style={styles.groupTitle}>
            {title} ({uids.length})
          </CoachText>
        </View>

        <View style={styles.list}>
          {uids.map((uid, index) => {
            const rsvp = userRsvp(event, uid);
            const note = event.rsvp_notes?.[uid];
            const mark = event.attendance_marks?.[uid];
            const rsvpLabel = RSVP_STATUS_LABELS[rsvp];
            return (
              <View
                key={uid}
                style={[styles.row, index < uids.length - 1 && styles.rowBorder]}
              >
                <View style={styles.rowHead}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <CoachText variant="section" numberOfLines={1} style={styles.name}>
                      {names[uid] ?? '…'}
                    </CoachText>
                    <View style={[styles.rsvpPill, { backgroundColor: badgeBg }]}>
                      <CoachText variant="caption" style={{ color: dotColor, fontWeight: '700', fontSize: 11 }}>
                        {rsvpLabel}
                      </CoachText>
                    </View>
                  </View>
                  {note ? (
                    <CoachText variant="caption" muted numberOfLines={2}>
                      Motif : {note}
                    </CoachText>
                  ) : null}
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
  };

  return (
    <View style={styles.root}>
      {/* 1. Bandeau Relance en 1 Tap pour les joueurs en attente */}
      {pendingUids.length > 0 ? (
        <View style={styles.remindBanner}>
          <View style={{ flex: 1 }}>
            <CoachText variant="section" style={{ fontWeight: '700' }}>
              {pendingUids.length} convocation{pendingUids.length > 1 ? 's' : ''} en attente
            </CoachText>
            <CoachText variant="caption" muted>
              Relancez les joueurs n’ayant pas encore confirmé leur présence.
            </CoachText>
          </View>
          <PressableSpring
            onPress={() => void handleRemindPending()}
            style={[styles.remindBtn, { backgroundColor: tokens.accent }]}
            scaleTo={0.97}
            disabled={reminding}
          >
            {reminding ? (
              <ActivityIndicator size="small" color={tokens.onAccent} />
            ) : (
              <>
                <Icon name="mail" size={14} color={tokens.onAccent} />
                <CoachText variant="caption" style={[styles.remindBtnText, { color: tokens.onAccent }]}>
                  Relancer (1 tap)
                </CoachText>
              </>
            )}
          </PressableSpring>
        </View>
      ) : null}

      {/* 2. Groupes par statut : Confirmé, En attente, Décliné */}
      {renderGroup('Confirmés / Présents', confirmedUids, '#10B981', 'rgba(16, 185, 129, 0.15)')}
      {renderGroup('En attente de confirmation', pendingUids, '#F59E0B', 'rgba(245, 158, 11, 0.15)')}
      {renderGroup('Déclinés / Absents', declinedUids, '#EF4444', 'rgba(239, 68, 68, 0.15)')}
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
    markBtnTextOn: { color: tokens.onAccent, fontWeight: '700' },
    remindBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      backgroundColor: tokens.surface,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: tokens.border,
      padding: spacing.md,
      marginBottom: 6,
    },
    remindBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.pill,
    },
    remindBtnText: {
      fontWeight: '700',
      fontSize: 12,
    },
    groupSection: {
      gap: 6,
      marginBottom: spacing.sm,
    },
    groupHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: spacing.sm,
    },
    statusDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    groupTitle: {
      fontWeight: '700',
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      fontSize: 11,
      color: tokens.foreground,
    },
    rsvpPill: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
  });
}
