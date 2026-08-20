import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import type { UnifiedLineupSide } from '../../../services/supporterFootball/types';
import { parseFormationLines } from '../../../utils/formationPitch';
import { SUPPORTER_SPACE } from '../theme/supporterSpaceTheme';

type Props = {
  side: UnifiedLineupSide | null | undefined;
  title: string;
  emptyLabel?: string;
};

/**
 * Visual pitch from API lineup + formation. Never invents players —
 * empty state if API did not publish XI.
 */
export const LineupPitch: React.FC<Props> = ({
  side,
  title,
  emptyLabel = 'Composition non publiée par l’API.',
}) => {
  const starters = useMemo(() => {
    if (!side?.players?.length) return [];
    const withPos = side.players
      .filter((p) => p.role === 'starter' || (p.formationPosition != null && p.formationPosition > 0))
      .slice()
      .sort((a, b) => (a.formationPosition ?? 99) - (b.formationPosition ?? 99));
    if (withPos.length) return withPos;
    return side.players.filter((p) => p.role === 'starter');
  }, [side]);

  const lines = useMemo(() => {
    const formation = side?.formation || '4-3-3';
    const counts = parseFormationLines(formation);
    const buckets: typeof starters[] = counts.map(() => []);
    let idx = 0;
    for (let li = 0; li < counts.length; li++) {
      for (let s = 0; s < counts[li] && idx < starters.length; s++) {
        buckets[li].push(starters[idx++]);
      }
    }
    while (idx < starters.length) {
      buckets[buckets.length - 1]?.push(starters[idx++]);
    }
    return buckets;
  }, [side?.formation, starters]);

  if (!side || starters.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <ProDayText variant="section" style={styles.title}>
          {title}
        </ProDayText>
        <ProDayText variant="body" style={styles.empty}>
          {emptyLabel}
        </ProDayText>
      </View>
    );
  }

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section" style={styles.title}>
        {title}
        {side.formation ? ` · ${side.formation}` : ''}
      </ProDayText>
      <View style={styles.pitch}>
        {lines.map((line, li) => (
          <View key={`line-${li}`} style={styles.line}>
            {line.map((p) => (
              <View key={p.id} style={styles.token}>
                <View style={styles.circle}>
                  <ProDayText variant="caption" style={styles.num}>
                    {p.number ?? '·'}
                  </ProDayText>
                </View>
                <ProDayText variant="caption" style={styles.name} numberOfLines={1}>
                  {p.name}
                </ProDayText>
              </View>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  emptyWrap: { marginBottom: 16, padding: 12 },
  title: { color: SUPPORTER_SPACE.foreground, marginBottom: 8, fontSize: 15 },
  empty: { color: SUPPORTER_SPACE.muted },
  pitch: {
    backgroundColor: '#0F3D24',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.12)',
    paddingVertical: 16,
    paddingHorizontal: 8,
    minHeight: 220,
    justifyContent: 'space-between',
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: 4,
  },
  token: { alignItems: 'center', width: 64 },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: SUPPORTER_SPACE.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  num: { color: '#fff', fontSize: 11 },
  name: { color: '#E8FFE8', fontSize: 10, textAlign: 'center' },
});
