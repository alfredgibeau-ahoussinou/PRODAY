import React, { useMemo, useState } from 'react';
import { useTranslation } from '../../../context/LocaleContext';
import { tStatic } from '../../../i18n/tStatic';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import Svg, { Circle, Defs, G, Line, LinearGradient, Path, Rect, Stop, Text as SvgText } from 'react-native-svg';
import { TrainingText as CoachText, useCoachTrainingTheme } from './coachTrainingTheme';
import { spacing } from '../../../theme/designTokens';
import {
  createTacticalEditorState,
  emptyTacticalScene,
  reduceTacticalEditor,
  type TacticalEditorCommand,
  type TacticalEditorState,
} from '../../tactics/engine/tacticalEditor';
import {
  TACTICAL_PITCH,
  compileTacticalScene,
  sampleTacticalScene,
  validateTacticalScene,
  type TacticalEntity,
  type TacticalPoint,
  type TacticalScene,
} from '../../tactics/engine/tacticalTimeline';
import { TacticalSchemaPreview } from './TacticalSchemaPreview';

/** Rayon de capture autour d'un élément, en unités de terrain. */
const HIT_RADIUS = 4;
const NUDGE_MS = 200;
const DURATION_STEP_MS = 500;

const TOOLS = [
  { id: 'select', label: tStatic('hc.coach.coachtacticalschemaeditor.selection.ac0002') },
  { id: 'player', label: 'Joueur' },
  { id: 'goalkeeper', label: 'Gardien' },
  { id: 'opponent', label: 'Adversaire' },
  { id: 'cone', label: 'Plot' },
  { id: 'place', label: tStatic('hc.coach.coachtacticalschemaeditor.position.de.depart.3d3a23') },
  { id: 'carrier', label: tStatic('hc.coach.coachtacticalschemaeditor.porteur.du.ballon.014225') },
  { id: 'run', label: 'Course' },
  { id: 'dribble', label: 'Conduite' },
  { id: 'pass', label: 'Passe' },
] as const;

type Tool = (typeof TOOLS)[number]['id'];

const ELEMENT_TOOLS: Tool[] = ['player', 'goalkeeper', 'opponent', 'cone'];

type Props = {
  /** Schéma existant à modifier ; sans lui, l'éditeur part d'un terrain vide. */
  initialScene?: TacticalScene;
  onSave: (scene: TacticalScene) => void;
  onCancel: () => void;
};

function displayName(entity: TacticalEntity): string {
  return entity.label ?? entity.id;
}

/** Élément le plus proche d'un point, dans le rayon de capture ; `null` si le toucher tombe dans le vide. */
function nearestEntityAt(
  entities: TacticalEntity[],
  positionOf: (entity: TacticalEntity) => TacticalPoint,
  point: TacticalPoint,
): TacticalEntity | null {
  let best: TacticalEntity | null = null;
  let bestDistance = HIT_RADIUS;
  for (const entity of entities) {
    const position = positionOf(entity);
    const distance = Math.hypot(position.x - point.x, position.y - point.y);
    if (distance <= bestDistance) {
      best = entity;
      bestDistance = distance;
    }
  }
  return best;
}

/**
 * Éditeur de schéma tactique : on pose les joueurs, on choisit le porteur, puis on trace
 * courses, conduites et passes phase par phase. Chaque geste est une commande du
 * réducteur ; l'annulation et le rétablissement suivent donc les mêmes règles partout.
 */
export function CoachTacticalSchemaEditor({ initialScene, onSave, onCancel }: Props) {
  const { t } = useTranslation();
  const { tokens } = useCoachTrainingTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const [state, setState] = useState<TacticalEditorState>(() =>
    createTacticalEditorState(initialScene ?? emptyTacticalScene()),
  );
  const [tool, setTool] = useState<Tool>('select');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const [titleDraft, setTitleDraft] = useState(state.scene.title);
  const [notice, setNotice] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [pitchWidth, setPitchWidth] = useState(0);
  const [pitchHeight, setPitchHeight] = useState(0);

  const { scene } = state;
  const activeIndex = Math.min(phaseIndex, scene.phases.length - 1);
  const activePhase = scene.phases[activeIndex];

  const compiled = useMemo(() => {
    const result = compileTacticalScene(scene);
    return result.ok ? result.scene : null;
  }, [scene]);
  const issues = useMemo(() => validateTacticalScene(scene), [scene]);

  // Positions réelles au début et à la fin de la phase active. Si la scène est incomplète,
  // on retombe sur les positions de départ : rien n'est inventé.
  const startFrame = compiled ? sampleTacticalScene(compiled, compiled.phases[activeIndex]?.startMs ?? 0) : null;
  const endFrame = compiled ? sampleTacticalScene(compiled, compiled.phases[activeIndex]?.endMs ?? 0) : null;
  const startOf = (entity: TacticalEntity) => startFrame?.positions[entity.id] ?? entity.position;
  const endOf = (entity: TacticalEntity) => endFrame?.positions[entity.id] ?? entity.position;

  const apply = (command: TacticalEditorCommand) => {
    const next = reduceTacticalEditor(state, command);
    if (next === state) {
      setNotice(t('hc.coach.coachtacticalschemaeditor.action.impossible.a.cet.endroit.9f45d4'));
      return;
    }
    setNotice(null);
    setState(next);
  };

  const selected = scene.entities.find((entity) => entity.id === selectedId) ?? null;

  const pitchRef = React.useRef<View>(null);

  const handlePitchPress = (event: any) => {
    let clickX: number | undefined;
    let clickY: number | undefined;
    let width = pitchWidth;
    let height = pitchHeight;

    // Sur Web, récupération absolue et précise via getBoundingClientRect
    if (typeof window !== 'undefined' && event?.nativeEvent) {
      const e = event.nativeEvent;
      const target = event.currentTarget || e.currentTarget || e.target;
      if (target && typeof target.getBoundingClientRect === 'function') {
        const rect = target.getBoundingClientRect();
        width = rect.width;
        height = rect.height;
        if (typeof e.clientX === 'number' && typeof e.clientY === 'number') {
          clickX = e.clientX - rect.left;
          clickY = e.clientY - rect.top;
        }
      }
    }

    // Fallback React Native standard (Mobile / Tablette)
    if (clickX === undefined || clickY === undefined) {
      clickX = event.nativeEvent.locationX;
      clickY = event.nativeEvent.locationY;
    }

    if (!width || !height || width <= 0 || height <= 0 || clickX === undefined || clickY === undefined) {
      return;
    }

    // Clamping dans les limites du terrain
    const normalizedX = Math.max(0, Math.min(width, clickX));
    const normalizedY = Math.max(0, Math.min(height, clickY));

    const point: TacticalPoint = {
      x: (normalizedX / width) * TACTICAL_PITCH.maxX,
      y: (normalizedY / height) * TACTICAL_PITCH.maxY,
    };
    const hit = nearestEntityAt(scene.entities, startOf, point);

    if (ELEMENT_TOOLS.includes(tool)) {
      if (hit) {
        setSelectedId(hit.id);
        return;
      }
      apply({ type: 'addEntity', kind: tool as 'player' | 'goalkeeper' | 'opponent' | 'cone', position: point });
      return;
    }

    switch (tool) {
      case 'select':
        setSelectedId(hit?.id ?? null);
        return;
      case 'place':
        if (selected) apply({ type: 'moveEntity', entityId: selected.id, position: point });
        return;
      case 'carrier':
        if (!hit) return;
        if (hit.kind === 'opponent' || hit.kind === 'cone') {
          setNotice(t('hc.coach.coachtacticalschemaeditor.seuls.les.joueurs.de.ton.equipe.peuvent.porter.l.6c2f59'));
          return;
        }
        apply({ type: 'setBallCarrier', entityId: hit.id });
        return;
      case 'run':
      case 'dribble':
        if (hit) {
          setSelectedId(hit.id);
          return;
        }
        if (!selected) {
          setNotice(t('hc.coach.coachtacticalschemaeditor.selectionne.d.abord.un.joueur.a.faire.courir.10eb8e'));
          return;
        }
        apply({
          type: 'addMove',
          phaseId: activePhase.id,
          entityId: selected.id,
          mode: tool === 'dribble' ? 'dribble' : 'run',
          to: point,
        });
        return;
      case 'pass':
        if (!hit) return;
        if (selected && hit.id !== selected.id) {
          apply({ type: 'addPass', phaseId: activePhase.id, fromEntityId: selected.id, toEntityId: hit.id });
          setSelectedId(null);
          return;
        }
        setSelectedId(hit.id);
        return;
    }
  };

  const saveScene = () => {
    // Si des entités ont été placées sans porteur, on assigne automatiquement le premier joueur
    let safeScene = { ...scene };
    if (!safeScene.ball.carrierId && safeScene.entities.some((e) => e.kind === 'player')) {
      const firstPlayer = safeScene.entities.find((e) => e.kind === 'player');
      if (firstPlayer) {
        safeScene = {
          ...safeScene,
          ball: { carrierId: firstPlayer.id, position: { ...firstPlayer.position } },
        };
      }
    }
    onSave({ ...safeScene, id: initialScene?.id ?? `custom-${Date.now()}` });
  };

  const commitTitle = () => {
    if (titleDraft.trim() !== scene.title) apply({ type: 'setSceneTitle', title: titleDraft });
  };

  const previewKey = JSON.stringify(scene);
  const actionLabel = (entityId: string) => {
    const entity = scene.entities.find((item) => item.id === entityId);
    return entity ? displayName(entity) : entityId;
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.header}>
        <TextInput
          value={titleDraft}
          onChangeText={setTitleDraft}
          onEndEditing={commitTitle}
          accessibilityLabel={t('hc.coach.coachtacticalschemaeditor.titre.du.schema.59a1f0')}style={styles.titleInput}
        />
        <Pressable
          onPress={() => apply({ type: 'undo' })}
          disabled={state.past.length === 0}
          accessibilityRole="button"
          accessibilityLabel="Annuler"
          style={[styles.chip, state.past.length === 0 && styles.disabled]}
        >
          <CoachText style={styles.chipText}>Annuler</CoachText>
        </Pressable>
        <Pressable
          onPress={() => apply({ type: 'redo' })}
          disabled={state.future.length === 0}
          accessibilityRole="button"
          accessibilityLabel={t('hc.coach.coachtacticalschemaeditor.retablir.91f08e')}style={[styles.chip, state.future.length === 0 && styles.disabled]}
        >
          <CoachText style={styles.chipText}>Rétablir</CoachText>
        </Pressable>
      </View>

      <View style={styles.chips}>
        {TOOLS.map((item) => (
          <Chip
            key={item.id}
            label={item.label}
            selected={tool === item.id}
            onPress={() => {
              setTool(item.id);
              setNotice(null);
            }}
            styles={styles}
          />
        ))}
      </View>
      <CoachText variant="caption" muted>
        {selected ? `Sélectionné : ${displayName(selected)}` : t('hc.coach.coachtacticalschemaeditor.touche.un.joueur.pour.le.selectionner.90ef26')}
      </CoachText>

      <Pressable
        ref={pitchRef}
        onPress={handlePitchPress}
        onLayout={(event) => {
          setPitchWidth(event.nativeEvent.layout.width);
          setPitchHeight(event.nativeEvent.layout.height);
        }}
        accessibilityRole="image"
        accessibilityLabel={t('hc.coach.coachtacticalschemaeditor.terrain.du.schema.f749d1')}style={styles.pitch}
      >
        <Svg width="100%" height="100%" viewBox={`0 0 ${TACTICAL_PITCH.maxX} ${TACTICAL_PITCH.maxY}`} pointerEvents="none">
          <Defs>
            <LinearGradient id="editorPitchGrad" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0%" stopColor="#135223" />
              <Stop offset="100%" stopColor="#0E3D1A" />
            </LinearGradient>
          </Defs>

          {/* Grass lawn stripes */}
          <Rect x={0} y={0} width={100} height={70} fill="url(#editorPitchGrad)" />
          {Array.from({ length: 10 }).map((_, i) => (
            <Rect
              key={i}
              x={0}
              y={i * 7}
              width={100}
              height={7}
              fill={i % 2 === 0 ? 'rgba(255, 255, 255, 0.04)' : 'transparent'}
            />
          ))}

          {/* FIFA Pitch Markings */}
          <Rect
            x={2}
            y={2}
            width={96}
            height={66}
            fill="none"
            stroke="rgba(255, 255, 255, 0.85)"
            strokeWidth={0.55}
          />
          {/* Halfway line */}
          <Line x1={50} y1={2} x2={50} y2={68} stroke="rgba(255, 255, 255, 0.85)" strokeWidth={0.5} />
          {/* Center circle & spot */}
          <Circle cx={50} cy={35} r={9.15} fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth={0.5} />
          <Circle cx={50} cy={35} r={0.7} fill="rgba(255, 255, 255, 0.9)" />

          {/* Left Penalty Area */}
          <Rect x={2} y={15} width={16.5} height={40} fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth={0.5} />
          <Rect x={2} y={24} width={5.5} height={22} fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth={0.5} />
          <Circle cx={13} cy={35} r={0.65} fill="rgba(255, 255, 255, 0.9)" />
          <Path d="M 18.5 29 A 9.15 9.15 0 0 1 18.5 41" fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth={0.5} />

          {/* Right Penalty Area */}
          <Rect x={81.5} y={15} width={16.5} height={40} fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth={0.5} />
          <Rect x={92.5} y={24} width={5.5} height={22} fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth={0.5} />
          <Circle cx={87} cy={35} r={0.65} fill="rgba(255, 255, 255, 0.9)" />
          <Path d="M 81.5 29 A 9.15 9.15 0 0 0 81.5 41" fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth={0.5} />

          {/* Corner Arcs */}
          <Path d="M 2 4 A 2 2 0 0 0 4 2" fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth={0.5} />
          <Path d="M 96 2 A 2 2 0 0 0 98 4" fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth={0.5} />
          <Path d="M 2 66 A 2 2 0 0 1 4 68" fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth={0.5} />
          <Path d="M 96 68 A 2 2 0 0 1 98 66" fill="none" stroke="rgba(255, 255, 255, 0.85)" strokeWidth={0.5} />

          {/* Goals */}
          <Rect x={0} y={30} width={2} height={10} fill="none" stroke="#FFFFFF" strokeWidth={0.6} />
          <Rect x={98} y={30} width={2} height={10} fill="none" stroke="#FFFFFF" strokeWidth={0.6} />

          {/* Phase Actions (Arrows) */}
          {activePhase.actions.map((action) => {
            if (action.type === 'move') {
              const entity = scene.entities.find((item) => item.id === action.entityId);
              if (!entity) return null;
              const from = startOf(entity);
              return (
                <Line
                  key={action.id}
                  x1={from.x}
                  y1={from.y}
                  x2={action.to.x}
                  y2={action.to.y}
                  stroke="#00E676"
                  strokeWidth={0.9}
                  strokeDasharray={action.mode === 'dribble' ? '1.5 1' : undefined}
                />
              );
            }
            const passer = scene.entities.find((item) => item.id === action.fromEntityId);
            const receiver = scene.entities.find((item) => item.id === action.toEntityId);
            if (!passer || !receiver) return null;
            const from = startOf(passer);
            const to = endOf(receiver);
            return (
              <Line
                key={action.id}
                x1={from.x}
                y1={from.y}
                x2={to.x}
                y2={to.y}
                stroke="#FFEB3B"
                strokeWidth={0.7}
                strokeDasharray="1.2 1"
              />
            );
          })}

          {/* Entities (Players & Equipment) */}
          {scene.entities.map((entity) => {
            const position = startOf(entity);
            if (entity.kind === 'cone') {
              return (
                <G key={entity.id}>
                  {/* Real Football Cone */}
                  <Circle cx={position.x} cy={position.y + 0.3} r={1.6} fill="rgba(0,0,0,0.3)" />
                  <Circle
                    cx={position.x}
                    cy={position.y}
                    r={1.5}
                    fill="#FF6D00"
                    stroke={entity.id === selectedId ? '#FFFFFF' : '#E65100'}
                    strokeWidth={entity.id === selectedId ? 0.6 : 0.25}
                  />
                  <Circle cx={position.x} cy={position.y} r={0.7} fill="#FFFFFF" />
                  <Circle cx={position.x} cy={position.y} r={0.3} fill="#FF6D00" />
                </G>
              );
            }
            const own = entity.kind !== 'opponent';
            const isGk = entity.kind === 'goalkeeper';
            const fillColor = isGk ? '#FFAB00' : own ? '#2979FF' : '#FF1744';
            return (
              <G key={entity.id}>
                <Circle cx={position.x} cy={position.y + 0.4} r={3.2} fill="rgba(0,0,0,0.35)" />
                <Circle
                  cx={position.x}
                  cy={position.y}
                  r={3.1}
                  fill={fillColor}
                  stroke={entity.id === selectedId ? '#00E676' : '#FFFFFF'}
                  strokeWidth={entity.id === selectedId ? 0.9 : 0.6}
                />
                <SvgText
                  x={position.x}
                  y={position.y + 1}
                  fontSize={2.5}
                  fontWeight="bold"
                  fill="#FFFFFF"
                  textAnchor="middle"
                >
                  {displayName(entity)}
                </SvgText>
              </G>
            );
          })}

          {/* Match Ball */}
          <G>
            <Circle
              cx={(startFrame?.ball.x ?? scene.ball.position.x) + 0.3}
              cy={(startFrame?.ball.y ?? scene.ball.position.y) + 0.3}
              r={1.5}
              fill="rgba(0,0,0,0.4)"
            />
            <Circle
              cx={startFrame?.ball.x ?? scene.ball.position.x}
              cy={startFrame?.ball.y ?? scene.ball.position.y}
              r={1.5}
              fill="#FFFFFF"
              stroke="#222222"
              strokeWidth={0.4}
            />
            <Circle
              cx={startFrame?.ball.x ?? scene.ball.position.x}
              cy={startFrame?.ball.y ?? scene.ball.position.y}
              r={0.6}
              fill="#222222"
            />
          </G>
        </Svg>
      </Pressable>

      <Section title="Phases" styles={styles}>
        <View style={styles.chips}>
          {scene.phases.map((phase, index) => (
            <Chip
              key={phase.id}
              label={phase.label}
              selected={index === activeIndex}
              onPress={() => setPhaseIndex(index)}
              styles={styles}
            />
          ))}
        </View>
        <View style={styles.chips}>
          <Chip label="+ Phase" selected={false} onPress={() => apply({ type: 'addPhase' })} styles={styles} />
          <Chip
            label="Dupliquer"
            selected={false}
            onPress={() => apply({ type: 'duplicatePhase', phaseId: activePhase.id })}
            styles={styles}
          />
          <Chip
            label={t('hc.coach.coachtacticalschemaeditor.supprimer.la.phase.e26b7b')}selected={false}
            onPress={() => apply({ type: 'removePhase', phaseId: activePhase.id })}
            styles={styles}
          />
        </View>
        <View style={styles.chips}>
          <CoachText variant="caption" muted>
            Durée : {((activePhase.durationMs ?? 0) / 1000).toFixed(1)} s
          </CoachText>
          <Chip
            label={`−${DURATION_STEP_MS} ms`}
            selected={false}
            onPress={() =>
              apply({ type: 'setPhaseDuration', phaseId: activePhase.id, durationMs: (activePhase.durationMs ?? 0) - DURATION_STEP_MS })
            }
            styles={styles}
          />
          <Chip
            label={`+${DURATION_STEP_MS} ms`}
            selected={false}
            onPress={() =>
              apply({ type: 'setPhaseDuration', phaseId: activePhase.id, durationMs: (activePhase.durationMs ?? 0) + DURATION_STEP_MS })
            }
            styles={styles}
          />
        </View>
      </Section>

      <Section title={t('hc.coach.coachtacticalschemaeditor.actions.de.la.phase.ee04b6')}styles={styles}>
        {activePhase.actions.length === 0 ? (
          <CoachText variant="caption" muted>
            Aucune action. Choisis « Course », « Conduite » ou « Passe », puis touche le terrain.
          </CoachText>
        ) : (
          activePhase.actions.map((action) => {
            const description =
              action.type === 'move'
                ? `${actionLabel(action.entityId)} ${action.mode === 'dribble' ? 'conduit' : 'court'}`
                : `Passe ${actionLabel(action.fromEntityId)} → ${actionLabel(action.toEntityId)}`;
            return (
              <View key={action.id} style={styles.actionRow}>
                <CoachText style={styles.actionText}>
                  {description} · {action.startMs}–{action.startMs + action.durationMs} ms
                </CoachText>
                <Chip
                  label={`+${NUDGE_MS}`}
                  selected={false}
                  onPress={() => apply({ type: 'setActionTiming', actionId: action.id, durationMs: action.durationMs + NUDGE_MS })}
                  styles={styles}
                />
                <Chip
                  label={`−${NUDGE_MS}`}
                  selected={false}
                  onPress={() => apply({ type: 'setActionTiming', actionId: action.id, durationMs: action.durationMs - NUDGE_MS })}
                  styles={styles}
                />
                <Chip label="Retirer" selected={false} onPress={() => apply({ type: 'removeAction', actionId: action.id })} styles={styles} />
              </View>
            );
          })
        )}
        {selected ? (
          <Chip label={`Retirer ${displayName(selected)}`} selected={false} onPress={() => apply({ type: 'removeEntity', entityId: selected.id })} styles={styles} />
        ) : null}
      </Section>

      {issues.length > 0 ? (
        <Section title={t('hc.coach.coachtacticalschemaeditor.a.corriger.4e4cde')}styles={styles}>
          {issues.slice(0, 5).map((issue, index) => (
            <CoachText key={`${issue.code}-${index}`} variant="caption" style={styles.issue}>
              {issue.message}
            </CoachText>
          ))}
        </Section>
      ) : null}

      {notice ? (
        <CoachText variant="caption" style={styles.error}>
          {notice}
        </CoachText>
      ) : null}

      <View style={styles.chips}>
        <Chip label={showPreview ? t('hc.coach.coachtacticalschemaeditor.masquer.l.apercu.205612') : t('hc.coach.coachtacticalschemaeditor.voir.l.apercu.anime.a07abe')} selected={showPreview} onPress={() => setShowPreview((value) => !value)} styles={styles} />
        <Chip label={t('hc.coach.coachtacticalschemaeditor.annuler.l.edition.572766')}selected={false} onPress={onCancel} styles={styles} />
        <Pressable onPress={saveScene} accessibilityRole="button" accessibilityLabel={t('hc.coach.coachtacticalschemaeditor.enregistrer.le.schema.669029')}style={styles.primary}>
          <CoachText style={styles.primaryText}>Enregistrer le schéma</CoachText>
        </Pressable>
      </View>

      {showPreview ? <TacticalSchemaPreview key={previewKey} scene={scene} /> : null}
    </ScrollView>
  );
}

function Section({
  title,
  children,
  styles,
}: {
  title: string;
  children: React.ReactNode;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <View style={styles.section}>
      <CoachText variant="section">{title}</CoachText>
      {children}
    </View>
  );
}

function Chip({
  label,
  selected,
  onPress,
  styles,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={[styles.chip, selected && styles.chipSelected]}
    >
      <CoachText style={selected ? styles.chipTextSelected : styles.chipText}>{label}</CoachText>
    </Pressable>
  );
}

function createStyles(tokens: ReturnType<typeof useCoachTrainingTheme>['tokens']) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0 },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xl },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    titleInput: {
      flex: 1,
      minHeight: 40,
      borderWidth: 1,
      borderColor: tokens.border,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      color: tokens.foreground,
      backgroundColor: tokens.bg,
    },
    chips: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.sm },
    chip: {
      minHeight: 40,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    chipSelected: { backgroundColor: 'transparent', borderColor: tokens.accent },
    chipText: { color: tokens.foreground },
    chipTextSelected: { color: tokens.accent, fontWeight: '700' },
    pitch: {
      width: '100%',
      aspectRatio: TACTICAL_PITCH.maxX / TACTICAL_PITCH.maxY,
      borderRadius: 12,
      overflow: 'hidden',
    },
    section: {
      gap: spacing.sm,
      padding: spacing.md,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.elevated,
    },
    actionRow: { gap: spacing.xs },
    actionText: { color: tokens.foreground },
    issue: { color: tokens.foreground },
    primary: {
      minHeight: 48,
      paddingHorizontal: spacing.lg,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 12,
      backgroundColor: tokens.accent,
    },
    primaryText: { color: tokens.onAccent, fontWeight: '800' },
    disabled: { opacity: 0.5 },
    error: { color: tokens.foreground, fontWeight: '700' },
  });
}
