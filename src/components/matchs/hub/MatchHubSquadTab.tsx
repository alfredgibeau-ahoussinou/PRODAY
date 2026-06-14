import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { TeamEvent } from '../../../models/TeamEvent';
import type { User } from '../../../models/User';
import { userRsvp } from '../../../models/TeamEvent';
import { usersService } from '../../../services/users.service';
import { EventAttendancePanel } from '../../team/EventAttendancePanel';
import { ProDaySurface } from '../../ui/ProDaySurface';
import { ProDayText } from '../../ui/ProDayText';
import { useAppTheme } from '../../../context/ProductLineContext';
import { spacing } from '../../../theme/designTokens';

const RSVP_LABEL = {
  yes: 'Présent',
  maybe: 'Peut-être',
  no: 'Absent',
  pending: 'En attente',
} as const;

interface MatchHubSquadTabProps {
  event: TeamEvent;
  profile: User;
  isStaff: boolean;
  onUpdated: () => void;
}

export const MatchHubSquadTab: React.FC<MatchHubSquadTabProps> = ({
  event,
  profile,
  isStaff,
  onUpdated,
}) => {
  const { colors } = useAppTheme();
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
  }, [event.id, event.invitee_uids.join(',')]);

  const groups = (['yes', 'maybe', 'no', 'pending'] as const).map((status) => ({
    status,
    uids: event.invitee_uids.filter((uid) => userRsvp(event, uid) === status),
  }));

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section">
        Convoqués ({event.invitee_uids.length})
      </ProDayText>

      {groups.map(
        (g) =>
          g.uids.length > 0 && (
            <ProDaySurface
              key={g.status}
              variant="module"
              style={[styles.group, { borderColor: colors.border }]}
            >
              <ProDayText variant="eyebrow" accent>
                {RSVP_LABEL[g.status]} ({g.uids.length})
              </ProDayText>
              {g.uids.map((uid) => {
                const note = event.rsvp_notes?.[uid];
                const mark = event.attendance_marks?.[uid];
                return (
                  <View key={uid} style={styles.row}>
                    <ProDayText variant="body">{names[uid] ?? '…'}</ProDayText>
                    {note ? (
                      <ProDayText variant="caption" muted numberOfLines={1}>
                        {note}
                      </ProDayText>
                    ) : null}
                    {mark ? (
                      <ProDayText variant="caption" accent>
                        {mark}
                      </ProDayText>
                    ) : null}
                  </View>
                );
              })}
            </ProDaySurface>
          )
      )}

      {isStaff && event.invitee_uids.length > 0 ? (
        <View style={styles.attendance}>
          <ProDayText variant="section">Pointage final</ProDayText>
          <EventAttendancePanel
            event={event}
            profile={profile}
            isStaff={isStaff}
            onUpdated={onUpdated}
          />
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  group: { borderWidth: 1, gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
    paddingVertical: 4,
  },
  attendance: { gap: spacing.sm },
});
