import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import type { MotmStanding } from '../../../models/MotmVote';
import { motmVotesService } from '../../../services/motmVotes.service';
import { ProDaySurface } from '../../ui/ProDaySurface';
import { ProDayText } from '../../ui/ProDayText';
import { PressableSpring } from '../../motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing, radius } from '../../../theme/designTokens';

interface MotmVotePanelProps {
  teamEventId: string;
  voterUid: string;
  nominees: { uid: string; name: string }[];
}

export const MotmVotePanel: React.FC<MotmVotePanelProps> = ({
  teamEventId,
  voterUid,
  nominees,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [standings, setStandings] = useState<MotmStanding[]>([]);
  const [myNominee, setMyNominee] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const [next, mine] = await Promise.all([
      motmVotesService.standings(teamEventId),
      motmVotesService.getMyVote(teamEventId, voterUid),
    ]);
    setStandings(next);
    setMyNominee(mine?.nominee_uid ?? null);
  }, [teamEventId, voterUid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const vote = async (nominee: { uid: string; name: string }) => {
    if (busy || nominee.uid === voterUid) return;
    setBusy(true);
    try {
      await motmVotesService.vote({
        team_event_id: teamEventId,
        voter_uid: voterUid,
        nominee_uid: nominee.uid,
        nominee_name: nominee.name,
      });
      await refresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    } finally {
      setBusy(false);
    }
  };

  const options = nominees.filter((n) => n.uid !== voterUid);
  if (options.length === 0) return null;

  return (
    <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
      <ProDayText variant="section">{t('pulse.motm.title')}</ProDayText>
      <ProDayText variant="caption" muted style={styles.sub}>
        {t('pulse.motm.subtitle')}
      </ProDayText>
      <View style={styles.list}>
        {options.map((n) => {
          const votes = standings.find((s) => s.uid === n.uid)?.votes ?? 0;
          const selected = myNominee === n.uid;
          return (
            <PressableSpring
              key={n.uid}
              onPress={() => void vote(n)}
              disabled={busy}
              scaleTo={0.97}
              haptic
              style={[
                styles.row,
                {
                  borderColor: selected ? colors.accent : colors.border,
                  backgroundColor: selected ? colors.accentSoft : colors.surfaceMuted,
                },
              ]}
            >
              <ProDayText variant="caption" style={{ fontWeight: '700', flex: 1 }}>
                {n.name}
              </ProDayText>
              <ProDayText variant="caption" accent={selected}>
                {votes} {t('pulse.motm.votes')}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>
    </ProDaySurface>
  );
};

const styles = StyleSheet.create({
  card: { marginTop: spacing.md, padding: spacing.md, borderWidth: 1, borderRadius: radius.lg },
  sub: { marginBottom: spacing.sm },
  list: { gap: spacing.xs },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});
