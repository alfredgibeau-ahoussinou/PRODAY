import React, { useMemo, useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { PressableSpring } from '../motion/PressableSpring';
import {
  COACH_COMPONENT_FALLBACK,
  type CoachComponentTokens,
} from '../../features/coach/theme/coachPitchTokens';
import type { SquadPlayer } from '../../utils/coachSquadRoster';
import { CoachPitchView } from './CoachPitchView';
import { CoachPlayerPicker } from './CoachPlayerPicker';
import type { MatchFormatKey, PitchSlot } from '../../constants/tacticalMatrix';
import {
  COACH_LINEUP_STEPS,
  coachLineupProgress,
  nextCoachLineupStep,
  previousCoachLineupStep,
  type CoachLineupStepId,
} from '../../utils/coachLineupGuide';
import { coachLayout } from '../../features/coach/theme/coachDesignSystem';
import {
  proForm,
  proRadius,
  proSpace,
  proType,
} from '../../theme/professionalDesign';

type Props = {
  visible: boolean;
  onClose: () => void;
  formation: string;
  format: MatchFormatKey;
  pitchSlots: PitchSlot[];
  /** Onze positionnel — index de cran → joueur ou cran libre. */
  starters: (SquadPlayer | null)[];
  bench: SquadPlayer[];
  unavailable: SquadPlayer[];
  /** Pose un joueur sur un cran (déplace automatiquement s'il est déjà aligné). */
  onAssignToSlot: (slotIndex: number, player: SquadPlayer) => void;
  onClearSlot: (slotIndex: number) => void;
  /** Fait entrer un remplaçant à la place du titulaire du cran. */
  onSwapBenchWithSlot: (slotIndex: number, benchPlayer: SquadPlayer) => void;
  /** Glisser-déposer d'un jeton — alternative au sélecteur de poste. */
  onMovePlayer?: (player: SquadPlayer, toSlotIndex: number) => void;
  /** Annulation de session, partagée avec l'écran qui porte la composition. */
  onUndo?: () => void;
  canUndo?: boolean;
  onSaveDraft: () => void;
  onPublish: () => void;
  saving?: boolean;
  publishLabel: string;
  tokens?: CoachComponentTokens;
};

function slotLabel(slot: PitchSlot | undefined, index: number): string {
  if (!slot) return `Poste ${index + 1}`;
  return `Poste ${slot.defaultPos}`;
}

/**
 * Composition guidée — **Attaquants → Milieux → Défenseurs → Gardien →
 * Remplaçants → Vue complète**.
 *
 * Le coach ne voit qu'une ligne à la fois (cadrage doux, pas d'animation
 * spectaculaire), peut ouvrir n'importe quel poste via le sélecteur, corriger et
 * déplacer sans perdre ses choix précédents, puis relire l'ensemble et
 * enregistrer un brouillon ou publier.
 */
export function CoachLineupGuide({
  visible,
  onClose,
  formation,
  format,
  pitchSlots,
  starters,
  bench,
  unavailable,
  onAssignToSlot,
  onClearSlot,
  onSwapBenchWithSlot,
  onMovePlayer,
  onUndo,
  canUndo = false,
  onSaveDraft,
  onPublish,
  saving = false,
  publishLabel,
  tokens = COACH_COMPONENT_FALLBACK,
}: Props) {
  const { width } = useWindowDimensions();
  const wide = width >= 900;

  const [stepId, setStepId] = useState<CoachLineupStepId>('att');
  const [pickerSlot, setPickerSlot] = useState<number | null>(null);
  const [pendingBenchId, setPendingBenchId] = useState<string | null>(null);

  const step = COACH_LINEUP_STEPS.find((entry) => entry.id === stepId) ?? COACH_LINEUP_STEPS[0]!;
  const progress = coachLineupProgress(step.id);
  const isLast = progress.index === progress.total;

  const candidates = useMemo(() => {
    const seen = new Set<string>();
    const out: SquadPlayer[] = [];
    for (const player of [...starters, ...bench, ...unavailable]) {
      if (!player || seen.has(player.id)) continue;
      seen.add(player.id);
      out.push(player);
    }
    return out;
  }, [starters, bench, unavailable]);

  const usedIds = useMemo(
    () => new Set(starters.filter((p): p is SquadPlayer => !!p).map((p) => p.id)),
    [starters],
  );

  const filledCount = starters.filter(Boolean).length;

  const handleSlotPress = (slotIndex: number) => {
    if (pendingBenchId) {
      const benchPlayer = bench.find((p) => p.id === pendingBenchId);
      if (benchPlayer) {
        onSwapBenchWithSlot(slotIndex, benchPlayer);
        setPendingBenchId(null);
        return;
      }
    }
    setPickerSlot(slotIndex);
  };

  const handleBenchPress = (player: SquadPlayer) => {
    setPendingBenchId((current) => (current === player.id ? null : player.id));
  };

  /**
   * Un jeton déposé ailleurs est un geste complet : il remplace le choix en
   * attente du banc, qui n'a plus de sens une fois le poste changé.
   */
  const handleSlotDrag = (player: SquadPlayer, toSlotIndex: number) => {
    setPendingBenchId(null);
    onMovePlayer?.(player, toSlotIndex);
  };

  const goNext = () => setStepId(nextCoachLineupStep(step.id) as CoachLineupStepId);
  const goBack = () => {
    setPendingBenchId(null);
    setStepId(previousCoachLineupStep(step.id) as CoachLineupStepId);
  };

  const showBench = step.id === 'subs' || step.id === 'review';
  const pickerTargetSlot = pickerSlot !== null ? pitchSlots[pickerSlot] : undefined;
  const pickerCurrent = pickerSlot !== null ? starters[pickerSlot] ?? null : null;

  return (
    <Modal visible={visible} animationType="fade" onRequestClose={onClose}>
      <View style={[styles.root, { backgroundColor: tokens.bg }]}>
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={[styles.kicker, { color: tokens.accent }]}>COMPOSITION GUIDÉE</Text>
            <Text style={[styles.title, { color: tokens.foreground }]} numberOfLines={1}>
              {step.label}
            </Text>
            <Text style={[styles.subtitle, { color: tokens.muted }]} numberOfLines={2}>
              {step.hint}
            </Text>
          </View>
          {/*
           * Annulation de session dans l'en-tête : le pied reste dédié à la
           * progression et à Retour / Suivant, comme prévu par la séquence.
           */}
          {canUndo && onUndo ? (
            <PressableSpring
              onPress={onUndo}
              scaleTo={0.96}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Annuler la dernière modification"
              style={[styles.undoBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
            >
              <Icon name="refresh" size={15} color={tokens.muted} />
              <Text style={[styles.undoBtnText, { color: tokens.foreground }]}>Annuler</Text>
            </PressableSpring>
          ) : null}

          <PressableSpring
            onPress={onClose}
            scaleTo={0.94}
            accessibilityRole="button"
            accessibilityLabel="Fermer la composition guidée"
            style={[styles.closeBtn, { backgroundColor: tokens.surface, borderColor: tokens.border }]}
          >
            <Icon name="close" size={18} color={tokens.foreground} />
          </PressableSpring>
        </View>

        {/* Progression : six étapes nommées, une seule rangée. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.steps}
          style={styles.stepsScroll}
        >
          {COACH_LINEUP_STEPS.map((entry) => {
            const index = COACH_LINEUP_STEPS.indexOf(entry);
            const active = entry.id === step.id;
            const done = index < progress.index - 1;
            return (
              <PressableSpring
                key={entry.id}
                onPress={() => {
                  setPendingBenchId(null);
                  setStepId(entry.id);
                }}
                scaleTo={0.97}
                haptic
                accessibilityRole="tab"
                accessibilityState={{ selected: active }}
                style={[
                  styles.stepChip,
                  { borderColor: active ? tokens.accent : tokens.border },
                  done && { borderColor: tokens.accent },
                ]}
              >
                <Text
                  style={[
                    styles.stepChipText,
                    { color: active ? tokens.accent : tokens.muted },
                    done && { color: tokens.accent },
                  ]}
                  numberOfLines={1}
                >
                  {`${index + 1}. ${entry.shortLabel}`}
                </Text>
              </PressableSpring>
            );
          })}
        </ScrollView>

        <ScrollView
          style={styles.body}
          contentContainerStyle={[styles.bodyContent, wide && styles.bodyContentWide]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.pitchBlock}>
            <CoachPitchView
              slots={starters}
              format={format}
              formation={formation}
              tokens={tokens}
              selectedSlotIndex={pickerSlot}
              highlightLine={step.line}
              onSelectSlot={handleSlotPress}
              onMovePlayer={onMovePlayer ? handleSlotDrag : undefined}
            />
            {onMovePlayer ? (
              <Text style={[styles.dragHint, { color: tokens.muted }]}>
                Touchez un poste pour choisir un joueur, ou maintenez-en un pour le glisser sur un
                autre poste.
              </Text>
            ) : null}
          </View>

          {pendingBenchId ? (
            <View style={[styles.notice, { borderColor: tokens.accent, backgroundColor: tokens.soft }]}>
              <Icon name="swap-horizontal" size={16} color={tokens.accent} />
              <Text style={[styles.noticeText, { color: tokens.foreground }]}>
                Touchez un titulaire sur le terrain pour faire entrer ce remplaçant.
              </Text>
            </View>
          ) : null}

          {showBench ? (
            <View style={[styles.benchCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <View style={styles.benchHeader}>
                <Text style={[styles.benchTitle, { color: tokens.foreground }]}>Banc</Text>
                <Text style={[styles.benchCount, { color: tokens.muted }]}>
                  {bench.length} remplaçant{bench.length > 1 ? 's' : ''}
                </Text>
              </View>
              {bench.length === 0 ? (
                <Text style={[styles.benchEmpty, { color: tokens.muted }]}>
                  Aucun remplaçant disponible pour ce format.
                </Text>
              ) : (
                bench.map((player, index) => {
                  const pending = pendingBenchId === player.id;
                  return (
                    <PressableSpring
                      key={player.id}
                      onPress={() => handleBenchPress(player)}
                      scaleTo={0.98}
                      haptic
                      accessibilityRole="button"
                      accessibilityLabel={`${player.name}${
                        player.num != null ? ` (n° ${player.num})` : ''
                      }${player.pos ? `, ${player.pos}` : ''}`}
                      style={[
                        styles.benchRow,
                        index > 0 && { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: tokens.border },
                        pending && { backgroundColor: tokens.soft },
                      ]}
                    >
                      <View style={[styles.benchAvatar, { backgroundColor: tokens.elevated, borderColor: tokens.border }]}>
                        <Text style={[styles.benchAvatarText, { color: tokens.foreground }]}>
                          {player.num ?? '—'}
                        </Text>
                      </View>
                      <Text style={[styles.benchName, { color: tokens.foreground }]} numberOfLines={1}>
                        {player.name}
                      </Text>
                      <Text style={[styles.benchPos, { color: tokens.muted }]}>
                        {player.pos ?? '—'}
                      </Text>
                      <Text style={[styles.benchAction, { color: pending ? tokens.muted : tokens.accent }]}>
                        {pending ? 'Annuler' : 'Faire entrer'}
                      </Text>
                    </PressableSpring>
                  );
                })
              )}
            </View>
          ) : null}

          {step.id === 'review' ? (
            <View style={[styles.recap, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <RecapRow label="Titulaires alignés" value={`${filledCount}/${pitchSlots.length}`} tokens={tokens} />
              <RecapRow label="Indisponibles" value={String(unavailable.length)} tokens={tokens} />
              <RecapRow label="Système" value={formation} tokens={tokens} />
              <RecapRow label="Remplaçants" value={String(bench.length)} tokens={tokens} />
            </View>
          ) : null}
        </ScrollView>

        {/* Commandes simples, hors pelouse. */}
        <View style={[styles.footer, { backgroundColor: tokens.surface, borderTopColor: tokens.border }]}>
          <Text style={[styles.progressText, { color: tokens.muted }]}>
            {`Étape ${progress.index}/${progress.total} · ${step.label}`}
          </Text>
          <View style={styles.footerActions}>
            <PressableSpring
              onPress={goBack}
              disabled={progress.index === 1}
              scaleTo={0.97}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Étape précédente"
              style={[
                styles.secondaryBtn,
                { borderColor: tokens.border },
                progress.index === 1 && styles.disabled,
              ]}
            >
              <Text style={[styles.secondaryText, { color: tokens.foreground }]}>Retour</Text>
            </PressableSpring>

            {isLast ? (
              <>
                <PressableSpring
                  onPress={onSaveDraft}
                  scaleTo={0.97}
                  haptic
                  accessibilityRole="button"
                  accessibilityLabel="Enregistrer le brouillon"
                  style={[styles.secondaryBtn, { borderColor: tokens.border }]}
                >
                  <Text style={[styles.secondaryText, { color: tokens.foreground }]}>
                    {saving ? '…' : 'Brouillon'}
                  </Text>
                </PressableSpring>
                <PressableSpring
                  onPress={onPublish}
                  scaleTo={0.97}
                  haptic
                  accessibilityRole="button"
                  accessibilityLabel={publishLabel}
                  style={[styles.primaryBtn, { backgroundColor: tokens.accent }]}
                >
                  <Text style={[styles.primaryText, { color: tokens.onAccent }]}>{publishLabel}</Text>
                </PressableSpring>
              </>
            ) : (
              <PressableSpring
                onPress={goNext}
                scaleTo={0.97}
                haptic
                accessibilityRole="button"
                accessibilityLabel="Étape suivante"
                style={[styles.primaryBtn, { backgroundColor: tokens.accent }]}
              >
                <Text style={[styles.primaryText, { color: tokens.onAccent }]}>
                  {`Suivant · ${COACH_LINEUP_STEPS[progress.index]?.shortLabel ?? ''}`}
                </Text>
              </PressableSpring>
            )}
          </View>
        </View>

        <CoachPlayerPicker
          visible={pickerSlot !== null}
          tokens={tokens}
          targetLabel={pickerTargetSlot ? slotLabel(pickerTargetSlot, pickerSlot ?? 0) : undefined}
          candidates={candidates}
          currentPlayerId={pickerCurrent?.id ?? null}
          isPlayerUsed={(playerId) => usedIds.has(playerId)}
          onSelect={(player) => {
            if (pickerSlot !== null) onAssignToSlot(pickerSlot, player);
            setPickerSlot(null);
          }}
          onClear={
            pickerCurrent && pickerSlot !== null
              ? () => {
                  onClearSlot(pickerSlot);
                  setPickerSlot(null);
                }
              : undefined
          }
          onClose={() => setPickerSlot(null)}
        />
      </View>
    </Modal>
  );
}

function RecapRow({
  label,
  value,
  tokens,
}: {
  label: string;
  value: string;
  tokens: CoachComponentTokens;
}) {
  return (
    <View style={[styles.recapRow, { borderTopColor: tokens.border }]}>
      <Text style={[styles.recapLabel, { color: tokens.muted }]}>{label}</Text>
      <Text style={[styles.recapValue, { color: tokens.foreground }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: proSpace.md,
    paddingHorizontal: coachLayout.pageGutter,
    paddingTop: proSpace.xxl,
    paddingBottom: proSpace.md,
  },
  headerText: { flex: 1, minWidth: 0, gap: 3 },
  kicker: { ...proType.label },
  title: { ...proType.h1 },
  subtitle: { ...proType.caption, lineHeight: 17 },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: proRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: proSpace.xs,
    height: 40,
    paddingHorizontal: proSpace.md,
    borderRadius: proRadius.pill,
    borderWidth: 1,
  },
  undoBtnText: { ...proType.caption, fontWeight: '700' },
  stepsScroll: { flexGrow: 0 },
  steps: {
    flexDirection: 'row',
    gap: proForm.chipGap,
    paddingHorizontal: coachLayout.pageGutter,
    paddingBottom: proSpace.md,
  },
  stepChip: {
    minHeight: 36,
    borderRadius: proForm.chipRadius,
    borderWidth: 1,
    paddingHorizontal: proSpace.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepChipText: { ...proType.caption, fontWeight: '700' },
  body: { flex: 1 },
  bodyContent: {
    paddingHorizontal: coachLayout.pageGutter,
    paddingBottom: proSpace.xl,
    gap: proSpace.lg,
  },
  bodyContentWide: {
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  pitchBlock: { width: '100%', gap: proSpace.sm },
  dragHint: { ...proType.caption, textAlign: 'center' },
  notice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: proSpace.sm,
    borderRadius: proRadius.md,
    borderWidth: 1,
    padding: proSpace.md,
  },
  noticeText: { ...proType.caption, flex: 1 },
  benchCard: {
    borderRadius: proRadius.lg,
    borderWidth: 1,
    padding: proSpace.lg,
    gap: proSpace.sm,
    overflow: 'hidden',
  },
  benchHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between' },
  benchTitle: { ...proType.h3 },
  benchCount: { ...proType.caption },
  benchEmpty: { ...proType.caption, paddingVertical: proSpace.md },
  benchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: proSpace.md,
    minHeight: 56,
  },
  benchAvatar: {
    width: 32,
    height: 32,
    borderRadius: proRadius.pill,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  benchAvatarText: { ...proType.caption, fontWeight: '800' },
  benchName: { ...proType.body, fontWeight: '600', flex: 1, minWidth: 0 },
  benchPos: { ...proType.caption },
  benchAction: { ...proType.caption, fontWeight: '700' },
  recap: {
    borderRadius: proRadius.lg,
    borderWidth: 1,
    paddingHorizontal: proSpace.lg,
  },
  recapRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: proForm.rowMinHeight,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  recapLabel: { ...proType.body },
  recapValue: { ...proType.body, fontWeight: '700' },
  footer: {
    borderTopWidth: 1,
    paddingHorizontal: coachLayout.pageGutter,
    paddingTop: proSpace.md,
    paddingBottom: coachLayout.dockClearance,
    gap: proSpace.sm,
  },
  progressText: { ...proType.caption },
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: proSpace.sm,
  },
  secondaryBtn: {
    minHeight: proForm.actionMinHeight,
    borderRadius: proForm.actionRadius,
    borderWidth: 1,
    paddingHorizontal: proSpace.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryText: { ...proType.nav, fontWeight: '600' },
  primaryBtn: {
    flex: 1,
    minHeight: proForm.actionMinHeight,
    borderRadius: proForm.actionRadius,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: proSpace.lg,
  },
  primaryText: { ...proType.nav, fontWeight: '700' },
  disabled: { opacity: 0.4 },
});
