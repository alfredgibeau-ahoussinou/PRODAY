import React from 'react';
import { PRO_DATA_VIOLET, proSemantic } from '../../theme/professionalDesign';
import { withAlpha } from '../../utils/coachTeamTheme';
import { COACH_SITE } from '../../content/coachPageIdentity';

const tokens = COACH_SITE;
import { StyleSheet, Text, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  Line,
  Marker,
  Path,
  Polygon,
  Rect,
} from 'react-native-svg';
import { Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { ExerciseDiagramData } from '../../models/ExerciseDiagram';
import { CoachExerciseDiagramRenderer } from './diagram/CoachExerciseDiagramRenderer';

export type DrillType = 'rondo' | 'circuit' | 'finishing' | 'possession' | 'pressing' | 'generic';

export interface CoachTrainingDrillDiagramProps {
  drillType?: DrillType;
  diagramData?: ExerciseDiagramData;
  title?: string;
  intensity?: 'low' | 'medium' | 'high';
  width?: number;
  height?: number;
  onPress?: () => void;
  showBadge?: boolean;
  /** Mode vignette compacte (uniquement le terrain, sans en-tête ni légende externe) */
  compact?: boolean;
}

/**
 * Visual tactical exercise board for coach training drills (Rondo, Circuit, Finition, etc.)
 * Inspired by professional boards (TacticalPad, MyCoach, SportEasy Coach).
 */
export function CoachTrainingDrillDiagram({
  drillType = 'generic',
  diagramData,
  title,
  width = 300,
  height = 170,
  onPress,
  showBadge = true,
  compact = false,
}: CoachTrainingDrillDiagramProps) {
  const vbW = 100;
  const vbH = 60;

  const renderDrillGraphics = () => {
    switch (drillType) {
      case 'rondo':
        return (
          <G>
            {/* Exercise zone: Box in center */}
            <Rect
              x={22}
              y={10}
              width={56}
              height={40}
              rx={2}
              fill={withAlpha('10B981', 0.08)}
              stroke={proSemantic.success}
              strokeWidth={0.8}
              strokeDasharray="2,2"
            />
            {/* 4 Cones on corners */}
            <Polygon points="22,10 20.5,13 23.5,13" fill={proSemantic.warning} />
            <Polygon points="78,10 76.5,13 79.5,13" fill={proSemantic.warning} />
            <Polygon points="22,50 20.5,53 23.5,53" fill={proSemantic.warning} />
            <Polygon points="78,50 76.5,53 79.5,53" fill={proSemantic.warning} />

            {/* Ball passing dashed lines */}
            <Line x1={26} y1={30} x2={48} y2={18} stroke={proSemantic.success} strokeWidth={0.7} strokeDasharray="1.5,1.5" />
            <Line x1={52} y1={18} x2={74} y2={30} stroke={proSemantic.success} strokeWidth={0.7} strokeDasharray="1.5,1.5" />
            <Line x1={74} y1={30} x2={50} y2={42} stroke={proSemantic.success} strokeWidth={0.7} strokeDasharray="1.5,1.5" />

            {/* 4 Outer Possession Players (Blue / White) */}
            <Circle cx={26} cy={30} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />
            <Circle cx={50} cy={16} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />
            <Circle cx={74} cy={30} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />
            <Circle cx={50} cy={44} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />

            {/* 2 Defenders in center (Red/Orange pressing) */}
            <Circle cx={44} cy={28} r={2.8} fill={proSemantic.danger} stroke={tokens.foreground} strokeWidth={0.6} />
            <Circle cx={56} cy={32} r={2.8} fill={proSemantic.danger} stroke={tokens.foreground} strokeWidth={0.6} />
            {/* Pressing arrows */}
            <Line x1={44} y1={28} x2={34} y2={29} stroke={proSemantic.danger} strokeWidth={0.8} markerEnd="url(#drillArrowRed)" />
            <Line x1={56} y1={32} x2={66} y2={31} stroke={proSemantic.danger} strokeWidth={0.8} markerEnd="url(#drillArrowRed)" />

            {/* Football */}
            <Circle cx={29} cy={27} r={1.3} fill={tokens.foreground} stroke={tokens.bg} strokeWidth={0.4} />
          </G>
        );

      case 'finishing':
        return (
          <G>
            {/* Goal at top */}
            <Rect x={38} y={3} width={24} height={4} fill="none" stroke={tokens.foreground} strokeWidth={1.2} />
            <Line x1={38} y1={3} x2={38} y2={7} stroke={tokens.foreground} strokeWidth={1} />
            <Line x1={62} y1={3} x2={62} y2={7} stroke={tokens.foreground} strokeWidth={1} />

            {/* Penalty box outline */}
            <Rect x={20} y={3} width={60} height={25} fill="none" stroke={withAlpha('FFFFFF', 0.4)} strokeWidth={0.6} />
            {/* Penalty spot */}
            <Circle cx={50} cy={18} r={0.7} fill={tokens.foreground} />

            {/* Goalkeeper */}
            <Circle cx={50} cy={6.5} r={2.6} fill={proSemantic.warning} stroke={tokens.foreground} strokeWidth={0.6} />

            {/* Mannequins / Cones */}
            <Polygon points="40,24 38.5,27 41.5,27" fill={proSemantic.warning} />
            <Polygon points="60,24 58.5,27 61.5,27" fill={proSemantic.warning} />

            {/* Winger player left cross */}
            <Circle cx={18} cy={35} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />
            <Path d="M 21 33 Q 32 20 47 15" fill="none" stroke={proSemantic.info} strokeWidth={0.8} strokeDasharray="1.5,1.5" />

            {/* Striker run into the box */}
            <Circle cx={48} cy={45} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />
            <Path d="M 48 42 L 48 18" fill="none" stroke={proSemantic.success} strokeWidth={0.9} markerEnd="url(#drillArrowGreen)" />

            {/* Trajectory toward bottom corner */}
            <Line x1={48} y1={16} x2={41} y2={4.5} stroke={tokens.foreground} strokeWidth={0.9} strokeDasharray="1,1" markerEnd="url(#drillArrowWhite)" />
            {/* Football */}
            <Circle cx={45} cy={16} r={1.3} fill={tokens.foreground} stroke={tokens.bg} strokeWidth={0.4} />
          </G>
        );

      case 'circuit':
        return (
          <G>
            {/* Slalom cones */}
            <Polygon points="25,25 23.5,28 26.5,28" fill={proSemantic.warning} />
            <Polygon points="35,35 33.5,38 36.5,38" fill={proSemantic.warning} />
            <Polygon points="45,25 43.5,28 46.5,28" fill={proSemantic.warning} />
            <Polygon points="55,35 53.5,38 56.5,38" fill={proSemantic.warning} />

            {/* Slalom run dashed line */}
            <Path
              d="M 16 30 Q 25 18 30 30 T 45 20 T 58 35 L 75 35"
              fill="none"
              stroke={proSemantic.success}
              strokeWidth={0.9}
              strokeDasharray="2,1.5"
              markerEnd="url(#drillArrowGreen)"
            />

            {/* Starting Player */}
            <Circle cx={14} cy={30} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />
            {/* Receiving Player at outlet */}
            <Circle cx={82} cy={35} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />

            {/* Small training mini-goal */}
            <Rect x={88} y={28} width={4} height={14} fill="none" stroke={tokens.foreground} strokeWidth={1} />
            <Line x1={80} y1={35} x2={88} y2={35} stroke={tokens.foreground} strokeWidth={0.8} strokeDasharray="1,1" markerEnd="url(#drillArrowWhite)" />
          </G>
        );

      case 'possession':
      case 'pressing':
      default:
        return (
          <G>
            {/* Half pitch tactical grid */}
            <Rect
              x={15}
              y={10}
              width={70}
              height={40}
              rx={3}
              fill={withAlpha('FFFFFF', 0.03)}
              stroke={withAlpha('FFFFFF', 0.25)}
              strokeWidth={0.7}
            />
            <Line x1={50} y1={10} x2={50} y2={50} stroke={withAlpha('FFFFFF', 0.2)} strokeWidth={0.6} strokeDasharray="2,2" />

            {/* Blue Team (In possession) */}
            <Circle cx={22} cy={20} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />
            <Circle cx={22} cy={40} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />
            <Circle cx={42} cy={30} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />
            <Circle cx={78} cy={20} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />
            <Circle cx={78} cy={40} r={2.8} fill={proSemantic.info} stroke={tokens.foreground} strokeWidth={0.6} />

            {/* Red Team (Block / Pressing) */}
            <Circle cx={34} cy={26} r={2.8} fill={proSemantic.danger} stroke={tokens.foreground} strokeWidth={0.6} />
            <Circle cx={36} cy={34} r={2.8} fill={proSemantic.danger} stroke={tokens.foreground} strokeWidth={0.6} />
            <Circle cx={58} cy={30} r={2.8} fill={proSemantic.danger} stroke={tokens.foreground} strokeWidth={0.6} />

            {/* Ball vector & tactical pressing motion */}
            <Line x1={24} y1={21} x2={39} y2={28} stroke={proSemantic.success} strokeWidth={0.7} strokeDasharray="1.5,1.5" />
            <Line x1={36} y1={34} x2={40} y2={32} stroke={proSemantic.danger} strokeWidth={0.8} markerEnd="url(#drillArrowRed)" />
            <Circle cx={40} cy={29} r={1.3} fill={tokens.foreground} stroke={tokens.bg} strokeWidth={0.4} />
          </G>
        );
    }
  };

  const getLabel = () => {
    switch (drillType) {
      case 'rondo':
        return 'Rondo & Conservation (Conservation 4v2 / 5v3)';
      case 'finishing':
        return 'Finition & Centres (Attaque Rapide & Face au but)';
      case 'circuit':
        return 'Circuit Technique & Dribbles (Slalom & Passe courte)';
      case 'possession':
        return 'Jeu de Position & Transition (Supériorité numérique)';
      case 'pressing':
        return 'Bloc & Déclenchement Pressing (Fermeture des axes)';
      default:
        return 'Atelier Tactique & Schéma de Jeu';
    }
  };

  const isCompact = compact || (!showBadge && width < 150);

  const pitchCanvas = (
    <View style={[styles.pitchCanvasWrap, { width, height }]}>
      {diagramData ? (
        <CoachExerciseDiagramRenderer
          diagram={diagramData}
          width="100%"
          height="100%"
        />
      ) : (
        <Svg width="100%" height="100%" viewBox={`0 0 ${vbW} ${vbH}`}>
          <Defs>
            {/* Arrow markers */}
            <Marker id="drillArrowGreen" viewBox="0 0 10 10" refX={6} refY={5} markerWidth={4} markerHeight={4} orient="auto-start-reverse">
              <Path d="M 0 1 L 10 5 L 0 9 z" fill={proSemantic.success} />
            </Marker>
            <Marker id="drillArrowRed" viewBox="0 0 10 10" refX={6} refY={5} markerWidth={4} markerHeight={4} orient="auto-start-reverse">
              <Path d="M 0 1 L 10 5 L 0 9 z" fill={proSemantic.danger} />
            </Marker>
            <Marker id="drillArrowWhite" viewBox="0 0 10 10" refX={6} refY={5} markerWidth={4} markerHeight={4} orient="auto-start-reverse">
              <Path d="M 0 1 L 10 5 L 0 9 z" fill={tokens.foreground} />
            </Marker>
          </Defs>

          {/* Grass Background with stripes */}
          <Rect x={0} y={0} width={vbW} height={vbH} rx={4} fill={COACH_SITE.pitchDeep} />
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <Rect
              key={i}
              x={i * (vbW / 6)}
              y={0}
              width={vbW / 12}
              height={vbH}
              fill={withAlpha(COACH_SITE.pitchLight, 0.45)}
              opacity={0.7}
            />
          ))}

          {/* Pitch Outer Boundary line */}
          <Rect
            x={2}
            y={2}
            width={vbW - 4}
            height={vbH - 4}
            rx={3}
            fill="none"
            stroke={withAlpha('FFFFFF', 0.22)}
            strokeWidth={0.6}
          />

          {/* Center line and circle watermark */}
          <Line x1={vbW / 2} y1={2} x2={vbW / 2} y2={vbH - 2} stroke={withAlpha('FFFFFF', 0.12)} strokeWidth={0.5} />
          <Circle cx={vbW / 2} cy={vbH / 2} r={9} fill="none" stroke={withAlpha('FFFFFF', 0.12)} strokeWidth={0.5} />

          {/* Drill specific overlay */}
          {renderDrillGraphics()}
        </Svg>
      )}
    </View>
  );

  if (isCompact) {
    if (onPress) {
      return (
        <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title ? `Agrandir le schéma ${title}` : "Agrandir le schéma"}>
          {pitchCanvas}
        </Pressable>
      );
    }
    return pitchCanvas;
  }

  const content = (
    <View style={styles.container}>
      {showBadge ? (
        <View style={styles.headerRow}>
          <View
            style={[
              styles.tagBadge,
              diagramData?.animation?.stages?.length
                ? { backgroundColor: withAlpha('0A84FF', 0.15), borderColor: withAlpha('0A84FF', 0.45) }
                : undefined,
            ]}
          >
            <Text
              style={[
                styles.tagText,
                diagramData?.animation?.stages?.length ? { color: proSemantic.info } : undefined,
              ]}
            >
              {diagramData?.animation?.stages?.length ? 'SCHÉMA ANIMÉ' : 'SCHÉMA TERRAIN'}
            </Text>
          </View>
          <Text numberOfLines={1} style={styles.titleText}>
            {title || diagramData?.name || getLabel()}
          </Text>
          {onPress ? (
            <Ionicons name="expand" size={14} color={tokens.muted} style={{ marginLeft: 'auto' }} />
          ) : null}
        </View>
      ) : null}

      {pitchCanvas}

      <View style={styles.footerRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: proSemantic.info }]} />
          <Text style={styles.legendText}>Attaque / Porteurs</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: proSemantic.danger }]} />
          <Text style={styles.legendText}>Défense / Pressing</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: proSemantic.warning }]} />
          <Text style={styles.legendText}>Plots & Cones</Text>
        </View>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="Agrandir le schéma">
        {content}
      </Pressable>
    );
  }

  return content;
}

/**
 * Utility helper to infer drill type from exercise name or description
 */
export function inferDrillType(name: string, description?: string): DrillType {
  const text = `${name} ${description || ''}`.toLowerCase();
  if (text.includes('rondo') || text.includes('conservation') || text.includes('taureau') || text.includes('toro')) {
    return 'rondo';
  }
  if (text.includes('tir') || text.includes('finition') || text.includes('frappe') || text.includes('but') || text.includes('centre')) {
    return 'finishing';
  }
  if (text.includes('circuit') || text.includes('slalom') || text.includes('conduite') || text.includes('coordination') || text.includes('technique')) {
    return 'circuit';
  }
  if (text.includes('pressing') || text.includes('cadrage') || text.includes('recup') || text.includes('bloc')) {
    return 'pressing';
  }
  if (text.includes('possession') || text.includes('position') || text.includes('attaque') || text.includes('transition')) {
    return 'possession';
  }
  return 'generic';
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 8,
    backgroundColor: COACH_SITE.surface,
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
    backgroundColor: proSemantic.successSoft,
    borderColor: withAlpha('10B981', 0.35),
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  tagText: {
    color: proSemantic.success,
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
  pitchCanvasWrap: {
    borderRadius: 8,
    overflow: 'hidden',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: withAlpha('FFFFFF', 0.12),
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    marginTop: 8,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: withAlpha('FFFFFF', 0.05),
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  legendText: {
    fontSize: 10,
    color: tokens.muted,
  },
});
