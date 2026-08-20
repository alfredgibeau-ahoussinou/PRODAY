import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import type {
  UnifiedLineupPlayer,
  UnifiedLineupSide,
} from '../../../services/supporterFootball/types';
import { parseFormationLines } from '../../../utils/formationPitch';
import { SUPPORTER_SPACE } from '../theme/supporterSpaceTheme';

type Props = {
  side: UnifiedLineupSide | null | undefined;
  title: string;
  emptyLabel?: string;
  onPlayerPress?: (player: UnifiedLineupPlayer) => void;
};

/**
 * Visual pitch from API lineup + formation_field.
 * Never invents players — empty state if API did not publish XI.
 */
export const LineupPitch: React.FC<Props> = ({
  side,
  title,
  emptyLabel = 'Composition non publiée par l’API.',
  onPlayerPress,
}) => {
  const starters = useMemo(() => {
    if (!side?.players?.length) return [];
    return side.players
      .filter((p) => p.role === 'starter')
      .slice()
      .sort((a, b) => {
        if (a.pitchRow != null && b.pitchRow != null && a.pitchRow !== b.pitchRow) {
          return a.pitchRow - b.pitchRow;
        }
        if (a.pitchCol != null && b.pitchCol != null && a.pitchCol !== b.pitchCol) {
          return a.pitchCol - b.pitchCol;
        }
        return (a.formationPosition ?? 99) - (b.formationPosition ?? 99);
      });
  }, [side]);

  const bench = useMemo(() => {
    if (!side?.players?.length) return [];
    return side.players.filter((p) => p.role === 'bench');
  }, [side]);

  const fieldPlaced = useMemo(
    () => starters.filter((p) => p.pitchRow != null && p.pitchCol != null),
    [starters],
  );

  const fallbackLines = useMemo(() => {
    if (fieldPlaced.length > 0) return null;
    const formation = side?.formation || '4-3-3';
    const counts = parseFormationLines(formation);
    const buckets: UnifiedLineupPlayer[][] = counts.map(() => []);
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
  }, [fieldPlaced.length, side?.formation, starters]);

  const absTokens = useMemo(() => {
    if (!fieldPlaced.length) return [];
    const maxRow = Math.max(...fieldPlaced.map((p) => p.pitchRow!));
    return fieldPlaced.map((p) => {
      const colsInRow = fieldPlaced.filter((x) => x.pitchRow === p.pitchRow);
      const maxCol = Math.max(...colsInRow.map((x) => x.pitchCol!));
      // Row 1 = GK en bas ; rows croissantes vers l’attaque (haut).
      const y =
        maxRow <= 1 ? 0.85 : 0.88 - ((p.pitchRow! - 1) / (maxRow - 1)) * 0.76;
      const x = maxCol <= 1 ? 0.5 : 0.12 + ((p.pitchCol! - 1) / (maxCol - 1)) * 0.76;
      return { player: p, x, y };
    });
  }, [fieldPlaced]);

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

  const renderToken = (p: UnifiedLineupPlayer, key: string) => (
    <Pressable
      key={key}
      onPress={onPlayerPress ? () => onPlayerPress(p) : undefined}
      style={styles.token}
      accessibilityRole="button"
      accessibilityLabel={p.name}
    >
      {p.photoUrl ? (
        <Image source={{ uri: p.photoUrl }} style={styles.photo} />
      ) : (
        <View style={styles.circle}>
          <ProDayText variant="caption" style={styles.num}>
            {p.number ?? '·'}
          </ProDayText>
        </View>
      )}
      <ProDayText variant="caption" style={styles.name} numberOfLines={1}>
        {p.captain ? `(C) ${p.name}` : p.name}
      </ProDayText>
    </Pressable>
  );

  return (
    <View style={styles.wrap}>
      <ProDayText variant="section" style={styles.title}>
        {title}
        {side.formation ? ` · ${side.formation}` : ''}
      </ProDayText>
      <View style={styles.pitch}>
        {absTokens.length > 0
          ? absTokens.map(({ player, x, y }) => (
              <View
                key={player.id}
                style={[
                  styles.absSlot,
                  {
                    left: `${x * 100}%`,
                    top: `${y * 100}%`,
                  },
                ]}
              >
                {renderToken(player, player.id)}
              </View>
            ))
          : (fallbackLines ?? []).map((line, li) => (
              <View key={`line-${li}`} style={styles.line}>
                {line.map((p) => renderToken(p, p.id))}
              </View>
            ))}
      </View>

      <ProDayText variant="caption" style={styles.listTitle}>
        Titulaires
      </ProDayText>
      {starters.map((p) => (
        <Pressable
          key={`st-${p.id}`}
          onPress={onPlayerPress ? () => onPlayerPress(p) : undefined}
          style={styles.listRow}
        >
          <ProDayText variant="caption" style={styles.listNum}>
            {p.number ?? '–'}
          </ProDayText>
          <ProDayText variant="body" style={styles.listName} numberOfLines={1}>
            {p.captain ? `(C) ${p.name}` : p.name}
          </ProDayText>
          {p.rating != null ? (
            <ProDayText variant="caption" style={styles.listMeta}>
              {p.rating}
            </ProDayText>
          ) : null}
        </Pressable>
      ))}

      {bench.length > 0 ? (
        <>
          <ProDayText variant="caption" style={[styles.listTitle, { marginTop: 12 }]}>
            Remplaçants
          </ProDayText>
          {bench.map((p) => (
            <Pressable
              key={`bn-${p.id}`}
              onPress={onPlayerPress ? () => onPlayerPress(p) : undefined}
              style={styles.listRow}
            >
              <ProDayText variant="caption" style={styles.listNum}>
                {p.number ?? '–'}
              </ProDayText>
              <ProDayText variant="body" style={styles.listName} numberOfLines={1}>
                {p.name}
              </ProDayText>
              {p.minutes != null ? (
                <ProDayText variant="caption" style={styles.listMeta}>
                  {p.minutes}'
                </ProDayText>
              ) : null}
            </Pressable>
          ))}
        </>
      ) : null}
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
    minHeight: 260,
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: 4,
  },
  absSlot: {
    position: 'absolute',
    width: 64,
    marginLeft: -32,
    marginTop: -20,
    alignItems: 'center',
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
  photo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginBottom: 2,
    backgroundColor: SUPPORTER_SPACE.elevated,
  },
  num: { color: '#fff', fontSize: 11 },
  name: { color: '#E8FFE8', fontSize: 10, textAlign: 'center' },
  listTitle: {
    color: SUPPORTER_SPACE.bright,
    marginTop: 10,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: SUPPORTER_SPACE.border,
  },
  listNum: { color: SUPPORTER_SPACE.muted, width: 28, textAlign: 'center' },
  listName: { color: SUPPORTER_SPACE.foreground, flex: 1 },
  listMeta: { color: SUPPORTER_SPACE.bright },
});
