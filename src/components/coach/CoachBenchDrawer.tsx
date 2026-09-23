import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion/PressableSpring';
import {
  COACH_COMPONENT_FALLBACK,
  type CoachComponentTokens,
} from '../../features/coach/theme/coachPitchTokens';
import { availabilityTone } from './CoachFutPlayerCard';
import { availabilityLabel, type SquadPlayer } from '../../utils/coachSquadRoster';
import { proCard, proRadius, proSpace, proType } from '../../theme/professionalDesign';

interface CoachBenchDrawerProps {
  subs: SquadPlayer[];
  unselected: SquadPlayer[];
  selectedStarterId: string | null;
  selectedBenchId: string | null;
  onSelectBenchPlayer: (player: SquadPlayer) => void;
  /** Ouvrir la fiche complète depuis le banc. */
  onOpenPlayer?: (player: SquadPlayer) => void;
  tokens?: CoachComponentTokens;
}

type BenchTab = 'subs' | 'unavailable';

/**
 * Banc des remplaçants — **liste verticale lisible**, pas un carrousel.
 *
 * Le banc est un espace à part du terrain (exigence du brief) : une seule
 * carte, un seul sélecteur (disponibles / indisponibles), des lignes de hauteur
 * identique. Les indisponibles restent visibles mais ne sont plus confondus
 * avec les remplaçants valides.
 */
export const CoachBenchDrawer: React.FC<CoachBenchDrawerProps> = ({
  subs,
  unselected,
  selectedStarterId,
  selectedBenchId,
  onSelectBenchPlayer,
  onOpenPlayer,
  tokens = COACH_COMPONENT_FALLBACK,
}) => {
  const [tab, setTab] = useState<BenchTab>('subs');

  const list = tab === 'subs' ? subs : unselected;
  const awaitingSwap = selectedStarterId !== null;

  return (
    <View style={[proCard(tokens), styles.card]}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: tokens.foreground }]}>Banc</Text>
          <Text style={[styles.caption, { color: tokens.muted }]} numberOfLines={2}>
            {awaitingSwap
              ? 'Touchez un remplaçant pour le faire entrer à la place du titulaire sélectionné.'
              : 'Touchez un joueur pour ouvrir sa fiche ou l’aligner.'}
          </Text>
        </View>
        <View style={[styles.count, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
          <Text style={[styles.countText, { color: tokens.foreground }]}>{subs.length}</Text>
        </View>
      </View>

      <View style={[styles.segment, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
        <BenchTabButton
          label={`Disponibles ${subs.length}`}
          active={tab === 'subs'}
          tokens={tokens}
          onPress={() => setTab('subs')}
        />
        <BenchTabButton
          label={`Indisponibles ${unselected.length}`}
          active={tab === 'unavailable'}
          tokens={tokens}
          onPress={() => setTab('unavailable')}
        />
      </View>

      {list.length === 0 ? (
        <Text style={[styles.empty, { color: tokens.muted }]}>
          {tab === 'subs' ? 'Aucun remplaçant disponible.' : 'Aucun joueur indisponible.'}
        </Text>
      ) : (
        <View>
          {list.map((player, index) => {
            const selected = selectedBenchId === player.id;
            const tone = availabilityTone(player.availability);
            return (
              <PressableSpring
                key={player.id}
                onPress={() => onSelectBenchPlayer(player)}
                onLongPress={
                  onOpenPlayer
                    ? () => {
                        onOpenPlayer(player);
                      }
                    : undefined
                }
                scaleTo={0.98}
                accessibilityRole="button"
                accessibilityLabel={`${player.name}${player.num != null ? ` (n° ${player.num})` : ''}, ${availabilityLabel(
                  player.availability,
                )}`}
                style={[
                  styles.row,
                  index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tokens.border },
                  selected && { backgroundColor: tokens.soft },
                ]}
              >
                <View
                  style={[
                    styles.rowAvatar,
                    {
                      borderColor: selected ? tokens.accent : tokens.border,
                      backgroundColor: tokens.elevated,
                    },
                  ]}
                >
                  <Text style={[styles.rowNumber, { color: tokens.foreground }]}>{player.num ?? '—'}</Text>
                </View>

                <View style={styles.rowBody}>
                  <Text style={[styles.rowName, { color: tokens.foreground }]} numberOfLines={1}>
                    {player.name}
                  </Text>
                  <Text style={[styles.rowMeta, { color: tokens.muted }]} numberOfLines={1}>
                    {player.pos ?? 'Poste non renseigné'} · {availabilityLabel(player.availability)}
                  </Text>
                </View>

                <View style={[styles.dot, { backgroundColor: tone }]} />
                <Icon name="chevron-forward" size={16} color={tokens.muted} />
              </PressableSpring>
            );
          })}
        </View>
      )}
    </View>
  );
};

function BenchTabButton({
  label,
  active,
  tokens = COACH_COMPONENT_FALLBACK,
  onPress,
}: {
  label: string;
  active: boolean;
  tokens?: CoachComponentTokens;
  onPress: () => void;
}) {
  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.97}
      haptic
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      style={[
        styles.segmentBtn,
        active && { backgroundColor: tokens.surface, borderColor: tokens.accent },
      ]}
    >
      <Text
        style={[
          styles.segmentText,
          { color: active ? tokens.accent : tokens.muted, fontWeight: active ? '700' : '600' },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: proSpace.md,
    overflow: 'hidden',
    paddingBottom: proSpace.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: proSpace.sm,
  },
  headerText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  title: {
    ...proType.h3,
  },
  caption: {
    ...proType.caption,
  },
  count: {
    minWidth: 30,
    height: 30,
    borderRadius: proRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: proSpace.sm,
  },
  countText: {
    ...proType.caption,
    fontWeight: '800',
  },
  segment: {
    flexDirection: 'row',
    borderRadius: proRadius.pill,
    borderWidth: 1,
    padding: 3,
    gap: 3,
  },
  segmentBtn: {
    flex: 1,
    minHeight: 36,
    borderRadius: proRadius.pill,
    borderWidth: 1,
    borderColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: proSpace.sm,
  },
  segmentText: {
    ...proType.caption,
  },
  empty: {
    ...proType.caption,
    paddingVertical: proSpace.lg,
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: proSpace.md,
    minHeight: 56,
    paddingHorizontal: proSpace.sm,
  },
  rowAvatar: {
    width: 34,
    height: 34,
    borderRadius: proRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowNumber: {
    ...proType.caption,
    fontWeight: '800',
  },
  rowBody: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  rowName: {
    ...proType.body,
    fontWeight: '600',
  },
  rowMeta: {
    ...proType.caption,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: proRadius.pill,
  },
});
