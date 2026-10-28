/**
 * Terrain d'atelier — **un seul** moteur de rendu pour tout l'Entraînement
 * (§21-§22, §26 ; doublon B-6 de `docs/coach/training-audit-doublons.md`).
 *
 * Avant : ce fichier portait **deux** moteurs concurrents — les schémas Proday
 * (`ExerciseDiagram` → `CoachExerciseDiagramRenderer`) quand l'atelier avait un
 * schéma enregistré, et un tracé SVG écrit à la main par type d'atelier (rondo,
 * circuit, finition, pressing, possession — ~300 lignes) sinon. Un atelier sans
 * schéma enregistré n'avait donc pas le même visage selon l'écran qui
 * l'affichait (§57).
 *
 * Après : **une** source de vérité. Un atelier sans schéma enregistré reçoit le
 * schéma Proday de son type (`createPresetDiagram`), puis **le** renderer
 * partagé dessine — la même grille, les mêmes couleurs, la même légende partout
 * (bibliothèque, builder, mode terrain, visualiseur).
 *
 * Animation (§21, §22) : elle vient du **modèle** (`ExerciseDiagramAnimation`)
 * et est jouée par `useDiagramAnimationPlayback` — le seul moteur de lecture du
 * pôle. `animate` demande la lecture sur place (mode terrain, plein écran) ;
 * sans animation enregistrée, le schéma statique s'affiche simplement, sans
 * trou ni placeholder (aucune animation n'est inventée).
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COACH_SITE } from '../../content/coachPageIdentity';
import { attachPresetAnimation, createPresetDiagram, type ExerciseDiagramData } from '../../models/ExerciseDiagram';
import { proSemantic } from '../../theme/professionalDesign';
import { useDiagramAnimationPlayback } from '../../hooks/useDiagramAnimationPlayback';
import { CoachExerciseDiagramRenderer } from './diagram/CoachExerciseDiagramRenderer';

const tokens = COACH_SITE;

export type DrillType = 'rondo' | 'circuit' | 'finishing' | 'possession' | 'pressing' | 'generic';

export interface CoachTrainingDrillDiagramProps {
  drillType?: DrillType;
  /** Schéma réellement enregistré pour cet atelier (prioritaire sur le preset). */
  diagramData?: ExerciseDiagramData;
  title?: string;
  width?: number;
  height?: number;
  onPress?: () => void;
  showBadge?: boolean;
  /** Mode vignette compacte (uniquement le terrain, sans en-tête ni légende). */
  compact?: boolean;
  /**
   * Rend l'animation **disponible sur place** (mode terrain, plein écran) : le
   * schéma reste statique et se lit au clic sur ▶. Sans animation enregistrée,
   * le bouton n'apparaît pas — rien n'est simulé.
   */
  animate?: boolean;
  /**
   * Taille du bouton ▶/⏸ posé sur le terrain. Le mode terrain l'agrandit : un
   * coach téléphone à la main (§82) ne visait pas une cible de 34 px au coin du
   * terrain, sous son pouce.
   */
  playToggleSize?: number;
}

/** Libellé honnête quand l'atelier n'a pas de nom : le type réel de l'atelier. */
const DRILL_LABELS: Record<DrillType, string> = {
  rondo: 'Rondo & Conservation',
  finishing: 'Finition & Centres',
  circuit: 'Circuit Technique',
  possession: 'Jeu de Position & Transition',
  pressing: 'Bloc & Déclenchement Pressing',
  generic: 'Atelier Tactique',
};

export function CoachTrainingDrillDiagram({
  drillType = 'generic',
  diagramData,
  title,
  width = 300,
  height = 170,
  onPress,
  showBadge = true,
  compact = false,
  animate = false,
  playToggleSize = 34,
}: CoachTrainingDrillDiagramProps) {
  /** Le schéma affiché : celui de l'atelier enrichi de sa lecture animée. */
  const diagram = React.useMemo<ExerciseDiagramData>(() => {
    const base = diagramData ?? createPresetDiagram(drillType, title);
    return attachPresetAnimation(base);
  }, [diagramData, drillType, title]);

  const hasAnimation = Boolean(diagram?.animation?.stages?.length);
  const [playbackState, playbackControls] = useDiagramAnimationPlayback(diagram, {
    autoPlay: animate,
  });
  const canPlay = hasAnimation && (animate || (!compact && width >= 180));
  const isCompact = compact || (!showBadge && width < 150);

  const pitch = (
    <CoachExerciseDiagramRenderer
      diagram={diagram}
      width="100%"
      height="100%"
      activeElements={playbackState.isPlaying || animate ? playbackState.interpolatedElements : undefined}
      activeMovements={playbackState.isPlaying || animate ? playbackState.activeMovements : undefined}
    />
  );

  const pitchCanvas = (
    <View style={[styles.pitchCanvasWrap, { width, height }]}>
      {pitch}
      {canPlay ? (
        <Pressable
          onPress={playbackControls.togglePlay}
          style={[
            styles.playToggle,
            {
              width: playToggleSize,
              height: playToggleSize,
              borderRadius: playToggleSize / 2,
              bottom: Math.round(playToggleSize / 4),
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            playbackState.isPlaying ? 'Mettre l’animation en pause' : 'Lire l’animation'
          }
        >
          <Ionicons
            name={playbackState.isPlaying ? 'pause' : 'play'}
            size={Math.round(playToggleSize * 0.47)}
            color={tokens.foreground}
          />
        </Pressable>
      ) : null}
    </View>
  );

  if (isCompact) {
    if (onPress) {
      return (
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={title ? `Agrandir le schéma ${title}` : 'Agrandir le schéma'}
        >
          {pitchCanvas}
        </Pressable>
      );
    }
    return pitchCanvas;
  }

  /** Légende réelle du schéma quand il en porte une ; sinon la lecture par équipe. */
  const legend =
    diagram?.legend && diagram.legend.length > 0
      ? diagram.legend.map((item) => ({ id: item.id, label: item.label, color: item.color }))
      : [
          { id: 'home', label: 'Attaque / Porteurs', color: proSemantic.info },
          { id: 'away', label: 'Défense / Pressing', color: proSemantic.danger },
          { id: 'equipment', label: 'Plots & Cones', color: proSemantic.warning },
        ];

  const content = (
    <View style={styles.container}>
      {showBadge ? (
        <View style={styles.headerRow}>
          <View
            style={[
              styles.tagBadge,
              hasAnimation
                ? {
                    backgroundColor: tokens.elevated,
                    borderColor: proSemantic.info,
                  }
                : undefined,
            ]}
          >
            <Text
              style={[styles.tagText, hasAnimation ? { color: proSemantic.info } : undefined]}
            >
              {hasAnimation ? '▶ SCHÉMA ANIMÉ' : 'SCHÉMA TERRAIN'}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.titleText}>
            {title || diagram?.name || DRILL_LABELS[drillType]}
          </Text>
          {onPress ? (
            <Ionicons name="expand" size={14} color={tokens.muted} style={styles.expandIcon} />
          ) : null}
        </View>
      ) : null}

      {pitchCanvas}

      <View style={styles.footerRow}>
        {legend.slice(0, 3).map((item) => (
          <View key={item.id} style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: item.color }]} />
            <Text numberOfLines={1} style={styles.legendText}>
              {item.label}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={title ? `Agrandir le schéma ${title}` : 'Agrandir le schéma'}
      >
        {content}
      </Pressable>
    );
  }

  return content;
}

/**
 * Type d'atelier déduit du nom réel de l'atelier — utilisé par la bibliothèque
 * et par les séances enregistrées qui ne portent pas encore de schéma.
 */
export function inferDrillType(name: string, description?: string): DrillType {
  const text = `${name} ${description || ''}`.toLowerCase();
  if (
    text.includes('rondo') ||
    text.includes('conservation') ||
    text.includes('taureau') ||
    text.includes('toro')
  ) {
    return 'rondo';
  }
  if (
    text.includes('finition') ||
    text.includes('frappe') ||
    text.includes('tir') ||
    text.includes('centre') ||
    text.includes('but')
  ) {
    return 'finishing';
  }
  if (
    text.includes('circuit') ||
    text.includes('slalom') ||
    text.includes('coordination') ||
    text.includes('échelle')
  ) {
    return 'circuit';
  }
  if (
    text.includes('pressing') ||
    text.includes('bloc') ||
    text.includes('déclenchement') ||
    text.includes('récupération')
  ) {
    return 'pressing';
  }
  if (
    text.includes('possession') ||
    text.includes('conservation collective') ||
    text.includes('jeu de position') ||
    text.includes('8v8') ||
    text.includes('opposition')
  ) {
    return 'possession';
  }
  return 'generic';
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    backgroundColor: tokens.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: tokens.border,
    padding: 10,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  tagBadge: {
    backgroundColor: tokens.elevated,
    borderColor: tokens.border,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: tokens.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  titleText: {
    color: tokens.foreground,
    fontSize: 12,
    fontWeight: '700',
    flex: 1,
  },
  expandIcon: {
    marginLeft: 'auto',
  },
  pitchCanvasWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: tokens.border,
  },
  playToggle: {
    position: 'absolute',
    right: 8,
    bottom: 8,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: tokens.elevated,
    borderWidth: 1,
    borderColor: tokens.border,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: tokens.border,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexShrink: 1,
    minWidth: 0,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: tokens.muted,
    flexShrink: 1,
  },
});
