import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import type { PlayerPulseEntry } from '../../models/PlayerPulse';
import { playerPulseLeaderboardService } from '../../services/playerPulseLeaderboard.service';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { formatPulseRating } from '../../utils/prodayMatchRating';
import { spacing, radius } from '../../theme/designTokens';

interface PulseLeaderboardCardProps {
  city?: string;
  level?: string;
}

export const PulseLeaderboardCard: React.FC<PulseLeaderboardCardProps> = ({ city, level }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [tab, setTab] = useState<'board' | 'totw'>('board');
  const [rows, setRows] = useState<PlayerPulseEntry[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const next =
        tab === 'totw'
          ? await playerPulseLeaderboardService.teamOfTheWeek(11)
          : await playerPulseLeaderboardService.listTop(12, { city, level });
      setRows(next);
    } finally {
      setLoading(false);
    }
  }, [city, level, tab]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return (
    <GlassCard variant="default" style={styles.card}>
      <View style={styles.header}>
        <ProDayText variant="section">{t('pulse.leaderboard.title')}</ProDayText>
        <View style={styles.tabs}>
          {(['board', 'totw'] as const).map((id) => (
            <PressableSpring
              key={id}
              onPress={() => setTab(id)}
              scaleTo={0.96}
              style={[
                styles.tab,
                {
                  backgroundColor: tab === id ? colors.accentSoft : colors.surfaceMuted,
                  borderColor: tab === id ? colors.accent : colors.border,
                },
              ]}
            >
              <ProDayText variant="caption" accent={tab === id}>
                {id === 'board' ? t('pulse.leaderboard.tab') : t('pulse.totw.tab')}
              </ProDayText>
            </PressableSpring>
          ))}
        </View>
      </View>
      <ProDayText variant="caption" muted style={styles.sub}>
        {tab === 'totw' ? t('pulse.totw.subtitle') : t('pulse.leaderboard.subtitle')}
      </ProDayText>
      {loading ? (
        <ProDayText variant="body" muted>
          {t('common.loading')}
        </ProDayText>
      ) : rows.length === 0 ? (
        <ProDayText variant="body" muted>
          {t('pulse.leaderboard.empty')}
        </ProDayText>
      ) : (
        rows.map((row, index) => (
          <View
            key={row.uid}
            style={[styles.row, { borderBottomColor: colors.border }]}
          >
            <ProDayText variant="caption" accent style={styles.rank}>
              {index + 1}
            </ProDayText>
            <View style={styles.copy}>
              <ProDayText variant="caption" style={{ fontWeight: '700' }}>
                {row.display_name}
              </ProDayText>
              <ProDayText variant="caption" muted>
                {[row.city, row.level, `${row.matches_count} matchs`]
                  .filter(Boolean)
                  .join(' · ')}
              </ProDayText>
            </View>
            <ProDayText variant="section" accent>
              {formatPulseRating(row.pulse_avg)}
            </ProDayText>
          </View>
        ))
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  header: { gap: spacing.sm, marginBottom: spacing.xs },
  tabs: { flexDirection: 'row', gap: spacing.xs },
  tab: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  sub: { marginBottom: spacing.sm },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rank: { width: 22, fontWeight: '800' },
  copy: { flex: 1, gap: 2 },
});
