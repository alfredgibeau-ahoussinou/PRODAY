import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, View } from 'react-native';
import type { RsvpStatus, TeamEvent } from '../../models/TeamEvent';
import { isComingRsvp, userRsvp } from '../../models/TeamEvent';
import { teamEventsService } from '../../services/teamEvents.service';
import { useTranslation } from '../../context/LocaleContext';
import type { User } from '../../models/User';
import { useCoachTheme, useCoachThemedStyles } from '../../features/coach/shell/CoachThemeContext';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { PressableSpring } from '../motion';
import { CoachText } from './coachPortalUi';
import { radius, spacing } from '../../theme/designTokens';

const STAFF_RSVP_CYCLE: RsvpStatus[] = ['pending', 'yes', 'no', 'maybe'];

type Props = {
  event: TeamEvent;
  profile: User;
  teamMembers: User[];
  teamName: string;
  canManage: boolean;
  onUpdated: () => void;
};

function jerseyOf(user: User, index: number): number {
  const n = user.profile?.jersey_number;
  return typeof n === 'number' && n > 0 ? n : index + 1;
}

function rsvpDotColor(status: RsvpStatus, tokens: CoachThemeTokens): string {
  if (status === 'yes') return tokens.accent;
  if (status === 'no') return '#FF375F';
  if (status === 'maybe') return '#FF9F0A';
  return tokens.muted;
}

function nextStaffRsvp(current: RsvpStatus): RsvpStatus {
  const idx = STAFF_RSVP_CYCLE.indexOf(current);
  if (idx === -1) return 'yes';
  return STAFF_RSVP_CYCLE[(idx + 1) % STAFF_RSVP_CYCLE.length] ?? 'yes';
}

export function TrainingRosterPreview({
  event,
  teamMembers,
}: {
  event: TeamEvent;
  teamMembers: User[];
}) {
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createPreviewStyles);

  if (teamMembers.length === 0) return null;

  return (
    <View style={styles.root}>
      {teamMembers.map((member) => {
        const rsvp = userRsvp(event, member.uid);
        return (
          <View key={member.uid} style={styles.chip}>
            <View style={[styles.dot, { backgroundColor: rsvpDotColor(rsvp, tokens) }]} />
            <CoachText variant="caption" muted numberOfLines={1} style={styles.name}>
              {member.display_name}
            </CoachText>
          </View>
        );
      })}
    </View>
  );
}

export function CoachTrainingTeamRoster({
  event,
  profile,
  teamMembers,
  teamName,
  canManage,
  onUpdated,
}: Props) {
  const { t } = useTranslation();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const [syncing, setSyncing] = useState(false);
  const [updatingUid, setUpdatingUid] = useState<string | null>(null);

  const presentCount = useMemo(() => {
    return teamMembers.filter((m) => isComingRsvp(userRsvp(event, m.uid))).length;
  }, [event, teamMembers]);

  const missingUids = useMemo(() => {
    const invited = new Set(event.invitee_uids);
    return teamMembers.map((m) => m.uid).filter((uid) => !invited.has(uid));
  }, [event.invitee_uids, teamMembers]);

  const rsvpLabel = (status: RsvpStatus): string => {
    const key = `coach.portal.training.rsvp.${status}` as const;
    const translated = t(key);
    return translated !== key ? translated : status;
  };

  const updateRsvp = async (uid: string, status: RsvpStatus) => {
    setUpdatingUid(uid);
    try {
      await teamEventsService.updateRsvpAsStaff(event.id, uid, status, { user: profile });
      onUpdated();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    } finally {
      setUpdatingUid(null);
    }
  };

  const syncRoster = async () => {
    if (missingUids.length === 0) return;
    setSyncing(true);
    try {
      await teamEventsService.addInvitees(event.id, missingUids, { user: profile });
      onUpdated();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    } finally {
      setSyncing(false);
    }
  };

  if (teamMembers.length === 0) {
    return (
      <CoachText variant="caption" muted>
        {t('coach.portal.training.rosterEmpty')}
      </CoachText>
    );
  }

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <CoachText variant="caption" accent style={styles.headerTitle}>
          {t('coach.portal.training.roster', { team: teamName })}
        </CoachText>
        <CoachText variant="caption" muted>
          {t('coach.portal.training.rosterCount', {
            present: presentCount,
            total: teamMembers.length,
          })}
        </CoachText>
      </View>

      <View style={styles.list}>
        {teamMembers.map((member, index) => {
          const rsvp = userRsvp(event, member.uid);
          const invited = event.invitee_uids.includes(member.uid);
          const busy = updatingUid === member.uid;

          return (
            <View
              key={member.uid}
              style={[styles.row, index < teamMembers.length - 1 && styles.rowBorder]}
            >
              <View style={styles.jersey}>
                <CoachText variant="caption" accent style={styles.jerseyText}>
                  {jerseyOf(member, index)}
                </CoachText>
              </View>
              <View style={styles.rowBody}>
                <CoachText variant="section" numberOfLines={1} style={styles.playerName}>
                  {member.display_name}
                </CoachText>
                {!invited ? (
                  <CoachText variant="caption" muted>
                    {t('coach.portal.training.notInvited')}
                  </CoachText>
                ) : null}
              </View>
              {canManage ? (
                <Pressable
                  onPress={() => void updateRsvp(member.uid, nextStaffRsvp(rsvp))}
                  disabled={busy}
                  style={({ pressed }) => [
                    styles.rsvpChip,
                    { borderColor: rsvpDotColor(rsvp, tokens) },
                    pressed && { opacity: 0.7 },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`RSVP ${member.display_name}`}
                >
                  <View style={[styles.dot, { backgroundColor: rsvpDotColor(rsvp, tokens) }]} />
                  <CoachText variant="caption" style={styles.rsvpChipText}>
                    {rsvpLabel(rsvp)}
                  </CoachText>
                </Pressable>
              ) : (
                <View style={styles.rsvpReadOnly}>
                  <View style={[styles.dot, { backgroundColor: rsvpDotColor(rsvp, tokens) }]} />
                  <CoachText variant="caption" muted>
                    {rsvpLabel(rsvp)}
                  </CoachText>
                </View>
              )}
            </View>
          );
        })}
      </View>

      {canManage && missingUids.length > 0 ? (
        <PressableSpring
          onPress={() => void syncRoster()}
          disabled={syncing}
          scaleTo={0.97}
          haptic
          style={styles.syncBtn}
        >
          <CoachText variant="caption" accent style={styles.syncBtnText}>
            {syncing
              ? t('coach.portal.training.syncRosterBusy')
              : t('coach.portal.training.syncRoster', { count: missingUids.length })}
          </CoachText>
        </PressableSpring>
      ) : null}
    </View>
  );
}

function createPreviewStyles(_tokens: CoachThemeTokens) {
  return StyleSheet.create({
      root: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: spacing.xs,
        marginTop: spacing.xs,
      },
      chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        maxWidth: '48%',
      },
      dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
      },
      name: {
        flexShrink: 1,
        fontSize: 11,
      },
    });
}

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
      root: { gap: spacing.sm },
      header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: spacing.sm,
      },
      headerTitle: {
        fontWeight: '700',
        letterSpacing: 0.3,
        textTransform: 'uppercase',
        fontSize: 11,
        flex: 1,
      },
      list: {
        backgroundColor: tokens.elevated,
        borderRadius: radius.lg,
        overflow: 'hidden',
      },
      row: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.sm + 2,
      },
      rowBorder: {
        borderBottomWidth: StyleSheet.hairlineWidth,
        borderBottomColor: tokens.border,
      },
      jersey: {
        width: 32,
        height: 32,
        borderRadius: radius.pill,
        backgroundColor: tokens.soft,
        alignItems: 'center',
        justifyContent: 'center',
      },
      jerseyText: { fontWeight: '800', fontSize: 12 },
      rowBody: { flex: 1, gap: 2 },
      playerName: { fontWeight: '600', fontSize: 15 },
      dot: {
        width: 8,
        height: 8,
        borderRadius: 4,
      },
      rsvpChip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        borderWidth: 1,
        borderRadius: radius.pill,
        paddingHorizontal: 10,
        paddingVertical: 6,
        backgroundColor: tokens.surface,
      },
      rsvpChipText: { fontWeight: '600', fontSize: 11 },
      rsvpReadOnly: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
      },
      syncBtn: {
        alignSelf: 'flex-start',
        paddingVertical: spacing.xs,
      },
      syncBtnText: { fontWeight: '800' },
    });
}
