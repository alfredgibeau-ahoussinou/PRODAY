import React, { useMemo } from 'react';
import { Image, Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import type { UnifiedLineupPlayer } from '../../../services/supporterFootball/types';
import {
  SUPPORTER_SPACE_COPY,
  SUPPORTER_SPACE_MATCH,
} from '../theme/supporterSpaceTheme';
import { MatchStatGauge } from './MatchStatGauge';

type Props = {
  player: UnifiedLineupPlayer;
  onClose: () => void;
};

type Chip = { label: string; value: string };
type Gauge = {
  key: string;
  label: string;
  display: string;
  progress: number;
  color: string;
};

function buildChips(player: UnifiedLineupPlayer): Chip[] {
  const chips: Chip[] = [];
  if (player.number != null) chips.push({ label: 'N°', value: String(player.number) });
  if (player.minutes != null) chips.push({ label: 'Minutes', value: `${player.minutes}'` });
  if (player.goals != null) chips.push({ label: 'Buts', value: String(player.goals) });
  if (player.shots != null) chips.push({ label: 'Tirs', value: String(player.shots) });
  if (player.xg != null) chips.push({ label: 'xG', value: formatXg(player.xg) });
  return chips.slice(0, 3);
}

function formatXg(v: number): string {
  return Number.isInteger(v) ? String(v) : v.toFixed(2);
}

/**
 * Gauges from real Sportmonks fields only — never invents Pace/Shooting FIFA.
 */
function buildGauges(player: UnifiedLineupPlayer): Gauge[] {
  const gauges: Gauge[] = [];
  if (player.rating != null && Number.isFinite(player.rating)) {
    gauges.push({
      key: 'rating',
      label: 'Note',
      display: player.rating.toFixed(1),
      progress: Math.min(1, Math.max(0, player.rating / 10)),
      color: SUPPORTER_SPACE_MATCH.gaugeBlue,
    });
  }
  if (player.minutes != null && Number.isFinite(player.minutes)) {
    gauges.push({
      key: 'minutes',
      label: 'Minutes',
      display: String(Math.round(player.minutes)),
      progress: Math.min(1, Math.max(0, player.minutes / 90)),
      color: SUPPORTER_SPACE_MATCH.gaugeCyan,
    });
  }
  if (player.goals != null && Number.isFinite(player.goals)) {
    gauges.push({
      key: 'goals',
      label: 'Buts',
      display: String(player.goals),
      progress: Math.min(1, Math.max(0, player.goals / 3)),
      color: SUPPORTER_SPACE_MATCH.gaugeGreen,
    });
  }
  if (player.shots != null && Number.isFinite(player.shots)) {
    gauges.push({
      key: 'shots',
      label: 'Tirs',
      display: String(player.shots),
      progress: Math.min(1, Math.max(0, player.shots / 8)),
      color: SUPPORTER_SPACE_MATCH.gaugeOrange,
    });
  }
  if (player.xg != null && Number.isFinite(player.xg)) {
    gauges.push({
      key: 'xg',
      label: 'xG',
      display: formatXg(player.xg),
      progress: Math.min(1, Math.max(0, player.xg / 1.5)),
      color: SUPPORTER_SPACE_MATCH.gaugeYellow,
    });
  }
  return gauges;
}

function positionLine(player: UnifiedLineupPlayer): string | null {
  if (player.position) {
    return `${SUPPORTER_SPACE_COPY.positionLabel} : ${player.position}`;
  }
  if (player.role === 'bench') return 'Remplaçant';
  if (player.role === 'starter') return 'Titulaire';
  return null;
}

export const MatchPlayerSheet: React.FC<Props> = ({ player, onClose }) => {
  const chips = useMemo(() => buildChips(player), [player]);
  const gauges = useMemo(() => buildGauges(player), [player]);
  const position = positionLine(player);
  const hasAnyStat =
    player.rating != null ||
    player.minutes != null ||
    player.goals != null ||
    player.shots != null ||
    player.xg != null;

  return (
    <View style={styles.sheet}>
      <View style={styles.handle} />
      <View style={styles.topBar}>
        <View style={{ flex: 1 }} />
        <Pressable onPress={onClose} hitSlop={12} style={styles.close}>
          <Icon name="close" size={22} color={SUPPORTER_SPACE_MATCH.foreground} />
        </Pressable>
      </View>
      <View style={styles.head}>
        <View style={styles.headText}>
          <ProDayText variant="hero" style={styles.name} numberOfLines={2}>
            {player.captain ? `(C) ${player.name}` : player.name}
          </ProDayText>
          {position ? (
            <ProDayText variant="caption" style={styles.position}>
              {position}
            </ProDayText>
          ) : null}
        </View>
        {player.photoUrl ? (
          <Image source={{ uri: player.photoUrl }} style={styles.photo} />
        ) : (
          <View style={[styles.photo, styles.photoPh]} />
        )}
      </View>

      {chips.length ? (
        <View style={styles.chips}>
          {chips.map((chip) => (
            <View key={chip.label} style={styles.chip}>
              <ProDayText variant="caption" style={styles.chipLabel}>
                {chip.label}
              </ProDayText>
              <ProDayText variant="title" style={styles.chipValue}>
                {chip.value}
              </ProDayText>
            </View>
          ))}
        </View>
      ) : null}

      {gauges.length ? (
        <View style={styles.ratingCard}>
          <ProDayText variant="body" style={styles.sectionTitle}>
            {SUPPORTER_SPACE_COPY.playerRatingSection}
          </ProDayText>
          <View style={styles.gaugeGrid}>
            {gauges.map((g) => (
              <MatchStatGauge
                key={g.key}
                label={g.label}
                display={g.display}
                progress={g.progress}
                color={g.color}
              />
            ))}
          </View>
        </View>
      ) : null}

      {!hasAnyStat ? (
        <ProDayText variant="body" style={styles.empty}>
          {SUPPORTER_SPACE_COPY.noPlayerStats}
        </ProDayText>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  sheet: {
    backgroundColor: SUPPORTER_SPACE_MATCH.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 18,
    paddingBottom: 28,
    paddingTop: 10,
    gap: 16,
    maxHeight: '92%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    marginBottom: 4,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: -4,
  },
  close: { padding: 4 },
  head: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  headText: { flex: 1, gap: 6, paddingTop: 4 },
  name: {
    color: SUPPORTER_SPACE_MATCH.foreground,
    fontWeight: '800',
    fontSize: 28,
    lineHeight: 32,
  },
  position: { color: SUPPORTER_SPACE_MATCH.muted, fontWeight: '500' },
  photo: {
    width: 96,
    height: 112,
    borderRadius: 16,
    backgroundColor: SUPPORTER_SPACE_MATCH.elevated,
  },
  photoPh: {},
  chips: { flexDirection: 'row', gap: 10 },
  chip: {
    flex: 1,
    backgroundColor: SUPPORTER_SPACE_MATCH.surface,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    gap: 4,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SPACE_MATCH.border,
  },
  chipLabel: { color: SUPPORTER_SPACE_MATCH.muted, fontWeight: '600' },
  chipValue: {
    color: SUPPORTER_SPACE_MATCH.foreground,
    fontWeight: '800',
    fontSize: 20,
  },
  ratingCard: {
    backgroundColor: SUPPORTER_SPACE_MATCH.surface,
    borderRadius: 20,
    padding: 16,
    gap: 14,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: SUPPORTER_SPACE_MATCH.border,
  },
  sectionTitle: {
    color: SUPPORTER_SPACE_MATCH.foreground,
    fontWeight: '700',
    fontSize: 17,
  },
  gaugeGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
    rowGap: 16,
  },
  empty: { color: SUPPORTER_SPACE_MATCH.muted },
});
