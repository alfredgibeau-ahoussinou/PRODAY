import React, { useMemo, useRef, useState } from 'react';
import { View, StyleSheet, PanResponder } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import type {
  Camera3DPreset,
  DrawingObject,
  EquipmentToken,
  NormalizedPoint,
  PitchConfiguration,
  PlayerToken,
  TacticalZone,
  ViewMode,
} from './trainingWorkspaceModel';
import { EQUIPMENT_PRESET_COLORS, TEAM_PRESET_COLORS } from './trainingWorkspaceModel';
import { prodayHaptics } from '../../../../utils/prodayHaptics';

interface Props {
  pitchConfig: PitchConfiguration;
  viewMode: ViewMode;
  cameraPreset?: Camera3DPreset;
  players: PlayerToken[];
  equipment: EquipmentToken[];
  drawings: DrawingObject[];
  zones?: TacticalZone[];
  ghostPlayers?: PlayerToken[];
  ghostEquipment?: EquipmentToken[];
  selectedId?: string | null;
  onSelectObject?: (id: string | null, type: 'player' | 'equipment' | 'drawing' | 'zone' | null) => void;
  onMovePlayer?: (id: string, x: number, y: number) => void;
  onMoveEquipment?: (id: string, x: number, y: number) => void;
  onPlayerMovedWithTrail?: (id: string, from: { x: number; y: number }, to: { x: number; y: number }) => void;
  onDragEnd?: () => void;
  activeStamp?: { kind: 'player' | 'equipment'; label: string } | null;
  onStampPlace?: (x: number, y: number) => void;
  interactive?: boolean;
  width?: number | string;
  height?: number | string;
  turfTheme?: 'tactical_blue' | 'classic_green';
  showCornerHandles?: boolean;
  onPitchLayout?: (layout: { width: number; height: number; x: number; y: number }) => void;
}

// Projection perspective 3D pour les coordonnées tactiques normalisées [0..100] -> [0..100, 0..64]
function project3D(
  pt: NormalizedPoint,
  preset: Camera3DPreset = 'isometric',
): { x: number; y: number; scale: number; opacity: number } {
  // Centrage autour de (0,0)
  const normX = (pt.x - 50) / 50; // [-1..1]
  const normY = (pt.y - 32) / 32; // [-1..1]
  const normZ = (pt.z ?? 0) / 100; // [0..1] hauteur

  let pitchAngle = 0.78; // angle d'élévation
  let yawAngle = 0.52;   // rotation azimutale

  if (preset === 'top') {
    pitchAngle = 1.35;
    yawAngle = 0;
  } else if (preset === 'front') {
    pitchAngle = 0.65;
    yawAngle = 0;
  } else if (preset === 'side') {
    pitchAngle = 0.70;
    yawAngle = 1.57;
  } else {
    // isometric
    pitchAngle = 0.82;
    yawAngle = 0.62;
  }

  // Rotation Yaw
  const rx = normX * Math.cos(yawAngle) - normY * Math.sin(yawAngle);
  const ry = normX * Math.sin(yawAngle) + normY * Math.cos(yawAngle);

  // Projection perspective avec angle d'élévation
  const dist = 2.4 - ry * Math.cos(pitchAngle);
  const factor = 1.7 / Math.max(0.4, dist);

  const screenX = 50 + rx * 44 * factor;
  const screenY = 32 + ry * 24 * Math.sin(pitchAngle) * factor - normZ * 36 * factor;

  return {
    x: Math.max(1, Math.min(99, screenX)),
    y: Math.max(1, Math.min(63, screenY)),
    scale: Math.max(0.65, Math.min(1.4, factor * 0.9)),
    opacity: Math.max(0.4, Math.min(1.0, factor * 0.9)),
  };
}

export function toScreenPixels(pt: { x: number; y: number }, width: number, height: number): { x: number; y: number } {
  return {
    x: (pt.x / 100) * width,
    y: (pt.y / 100) * height,
  };
}

export function fromScreenPixels(pt: { x: number; y: number }, width: number, height: number): { x: number; y: number } {
  return {
    x: Math.max(0, Math.min(100, (pt.x / width) * 100)),
    y: Math.max(0, Math.min(100, (pt.y / height) * 100)),
  };
}

export function projectToScreen(
  pt: NormalizedPoint,
  viewMode: ViewMode,
  cameraPreset: Camera3DPreset = 'isometric',
  width: number = 100,
  height: number = 100,
): { x: number; y: number; scale: number; depthOpacity: number } {
  if (viewMode === '2d') {
    return {
      x: (pt.x / 100) * width,
      y: (pt.y / 100) * height,
      scale: 1,
      depthOpacity: 1,
    };
  }
  const p3 = project3D(pt, cameraPreset);
  return {
    x: (p3.x / 100) * width,
    y: (p3.y / 64) * height,
    scale: p3.scale,
    depthOpacity: p3.opacity,
  };
}

export const CoachPitchEngine: React.FC<Props> = ({
  pitchConfig,
  viewMode,
  cameraPreset = 'isometric',
  players,
  equipment,
  drawings,
  zones = [],
  ghostPlayers = [],
  ghostEquipment = [],
  selectedId,
  onSelectObject,
  onMovePlayer,
  onMoveEquipment,
  onPlayerMovedWithTrail,
  onDragEnd,
  activeStamp = null,
  onStampPlace,
  interactive = true,
  width = '100%',
  height = '100%',
  turfTheme = 'tactical_blue',
  showCornerHandles = true,
  onPitchLayout,
}) => {
  const vbW = 100;
  const vbH = 64;

  const [pitchLayout, setPitchLayout] = useState<{ width: number; height: number; x: number; y: number }>({
    width: typeof width === 'number' ? width : 800,
    height: typeof height === 'number' ? height : 512,
    x: 0,
    y: 0,
  });

  // Trajectoire animée en direct pendant le glissement d'un joueur (style Tactical Slate)
  const [liveDragMotion, setLiveDragMotion] = useState<{
    id: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
    color: string;
  } | null>(null);

  const activeDragRef = useRef<{
    id: string;
    type: 'player' | 'equipment';
    startNormX: number;
    startNormY: number;
    currentX: number;
    currentY: number;
    color: string;
    moved: boolean;
  } | null>(null);

  const lastStampPosRef = useRef<{ x: number; y: number } | null>(null);

  // Latest props refs to avoid stale closures in PanResponder
  const playersRef = useRef(players);
  playersRef.current = players;
  const equipmentRef = useRef(equipment);
  equipmentRef.current = equipment;
  const onMovePlayerRef = useRef(onMovePlayer);
  onMovePlayerRef.current = onMovePlayer;
  const onMoveEquipmentRef = useRef(onMoveEquipment);
  onMoveEquipmentRef.current = onMoveEquipment;
  const onPlayerMovedWithTrailRef = useRef(onPlayerMovedWithTrail);
  onPlayerMovedWithTrailRef.current = onPlayerMovedWithTrail;
  const onSelectObjectRef = useRef(onSelectObject);
  onSelectObjectRef.current = onSelectObject;
  const onDragEndRef = useRef(onDragEnd);
  onDragEndRef.current = onDragEnd;
  const activeStampRef = useRef(activeStamp);
  activeStampRef.current = activeStamp;
  const onStampPlaceRef = useRef(onStampPlace);
  onStampPlaceRef.current = onStampPlace;
  const pitchLayoutRef = useRef(pitchLayout);
  pitchLayoutRef.current = pitchLayout;

  const panResponder = useMemo(() => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => interactive,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return interactive && (Math.hypot(gestureState.dx, gestureState.dy) > 3 || !!activeStampRef.current);
      },
      onPanResponderGrant: (evt) => {
        if (!interactive) return;
        const curLayout = pitchLayoutRef.current;
        const locX = evt.nativeEvent.locationX;
        const locY = evt.nativeEvent.locationY;
        const normX = Math.round(Math.max(2, Math.min(vbW - 2, (locX / curLayout.width) * vbW)));
        const normY = Math.round(Math.max(2, Math.min(vbH - 2, (locY / curLayout.height) * vbH)));

        // Mode Pose Continue / Stamp actif : pose immédiate au clic
        if (activeStampRef.current) {
          onStampPlaceRef.current?.(normX, normY);
          lastStampPosRef.current = { x: normX, y: normY };
          prodayHaptics.confirm();
          return;
        }

        const TOUCH_RADIUS = 6.0; // units de terrain

        // Hit-test joueurs
        let hitPlayer: PlayerToken | undefined;
        let minPlayerDist = Infinity;
        for (const p of playersRef.current) {
          const d = Math.hypot(p.x - normX, p.y - normY);
          if (d < TOUCH_RADIUS && d < minPlayerDist) {
            hitPlayer = p;
            minPlayerDist = d;
          }
        }

        // Hit-test équipements (plots, ballons, échelles, etc.)
        let hitEquip: EquipmentToken | undefined;
        let minEquipDist = Infinity;
        for (const eq of equipmentRef.current) {
          const d = Math.hypot(eq.x - normX, eq.y - normY);
          if (d < TOUCH_RADIUS && d < minEquipDist) {
            hitEquip = eq;
            minEquipDist = d;
          }
        }

        if (hitPlayer && (!hitEquip || minPlayerDist <= minEquipDist)) {
          const pColor = hitPlayer.color || (hitPlayer.team === 'teamB' ? '#EF4444' : hitPlayer.team === 'neutral' ? '#EAB308' : '#3B82F6');
          activeDragRef.current = {
            id: hitPlayer.id,
            type: 'player',
            startNormX: hitPlayer.x,
            startNormY: hitPlayer.y,
            currentX: hitPlayer.x,
            currentY: hitPlayer.y,
            color: pColor,
            moved: false,
          };
          onSelectObjectRef.current?.(hitPlayer.id, 'player');
          prodayHaptics.press();
        } else if (hitEquip) {
          activeDragRef.current = {
            id: hitEquip.id,
            type: 'equipment',
            startNormX: hitEquip.x,
            startNormY: hitEquip.y,
            currentX: hitEquip.x,
            currentY: hitEquip.y,
            color: hitEquip.color || '#F97316',
            moved: false,
          };
          onSelectObjectRef.current?.(hitEquip.id, 'equipment');
          prodayHaptics.press();
        } else {
          activeDragRef.current = null;
          onSelectObjectRef.current?.(null, null);
        }
      },
      onPanResponderMove: (evt, gestureState) => {
        const curLayout = pitchLayoutRef.current;
        const locX = evt.nativeEvent.locationX;
        const locY = evt.nativeEvent.locationY;
        const normX = Math.round(Math.max(2, Math.min(vbW - 2, (locX / curLayout.width) * vbW)));
        const normY = Math.round(Math.max(2, Math.min(vbH - 2, (locY / curLayout.height) * vbH)));

        // Mode Pose Continue / Stamp : déposer le long du tracé du doigt
        if (activeStampRef.current) {
          const last = lastStampPosRef.current;
          if (!last || Math.hypot(normX - last.x, normY - last.y) >= 8.5) {
            onStampPlaceRef.current?.(normX, normY);
            lastStampPosRef.current = { x: normX, y: normY };
            prodayHaptics.press();
          }
          return;
        }

        const drag = activeDragRef.current;
        if (!drag) return;

        const deltaNormX = (gestureState.dx / curLayout.width) * vbW;
        const deltaNormY = (gestureState.dy / curLayout.height) * vbH;

        const newX = Math.round(Math.max(2, Math.min(vbW - 2, drag.startNormX + deltaNormX)));
        const newY = Math.round(Math.max(2, Math.min(vbH - 2, drag.startNormY + deltaNormY)));

        drag.moved = true;
        drag.currentX = newX;
        drag.currentY = newY;

        if (drag.type === 'player') {
          onMovePlayerRef.current?.(drag.id, newX, newY);
          // Affiche la flèche animée reliant la position de départ à la position d'avancée
          setLiveDragMotion({
            id: drag.id,
            from: { x: drag.startNormX, y: drag.startNormY },
            to: { x: newX, y: newY },
            color: drag.color,
          });
        } else if (drag.type === 'equipment') {
          onMoveEquipmentRef.current?.(drag.id, newX, newY);
        }
      },
      onPanResponderRelease: () => {
        const drag = activeDragRef.current;
        if (drag && drag.moved) {
          const dist = Math.hypot(drag.currentX - drag.startNormX, drag.currentY - drag.startNormY);
          if (drag.type === 'player' && dist >= 3.5) {
            // Création automatique de la phase animée et du vecteur de course
            onPlayerMovedWithTrailRef.current?.(
              drag.id,
              { x: drag.startNormX, y: drag.startNormY },
              { x: drag.currentX, y: drag.currentY },
            );
          } else {
            onDragEndRef.current?.();
          }
        }
        setLiveDragMotion(null);
        activeDragRef.current = null;
        lastStampPosRef.current = null;
      },
      onPanResponderTerminate: () => {
        setLiveDragMotion(null);
        activeDragRef.current = null;
        lastStampPosRef.current = null;
      },
    });
  }, [interactive, vbW, vbH]);

  // Calcul des bandes de pelouse (thème Bleu Tactique ou Vert Stade Classique)
  const isBlue = turfTheme === 'tactical_blue';
  const lawnStripes = useMemo(() => {
    const stripesCount = 10;
    const stripeW = vbW / stripesCount;
    return Array.from({ length: stripesCount }, (_, i) => ({
      x: i * stripeW,
      y: 0,
      width: stripeW,
      height: vbH,
      fill: isBlue
        ? i % 2 === 0 ? '#336E97' : '#2A5D82'
        : i % 2 === 0 ? '#14532D' : '#166534',
    }));
  }, [vbW, vbH, isBlue]);

  // Points projetés 2D ou 3D
  const getCoords = (pt: NormalizedPoint) => {
    if (viewMode === '3d') {
      return project3D(pt, cameraPreset);
    }
    return { x: pt.x, y: pt.y, scale: 1.0, opacity: 1.0 };
  };

  // Rendu du marquage selon la configuration choisie
  const renderMarkings = () => {
    switch (pitchConfig) {
      case 'full':
        return (
          <G>
            {/* Ligne médiane & Rond central */}
            <Line x1={vbW / 2} y1={2} x2={vbW / 2} y2={vbH - 2} stroke="#FFFFFF" strokeWidth={0.8} strokeOpacity={0.9} />
            <Circle cx={vbW / 2} cy={vbH / 2} r={9.15} fill="none" stroke="#FFFFFF" strokeWidth={0.8} strokeOpacity={0.9} />
            <Circle cx={vbW / 2} cy={vbH / 2} r={0.8} fill="#FFFFFF" />

            {/* Surface de réparation gauche (16.5m) */}
            <Rect x={2} y={vbH / 2 - 18} width={16.5} height={36} fill="none" stroke="#FFFFFF" strokeWidth={0.8} strokeOpacity={0.9} />
            {/* Surface de but gauche (5.5m) */}
            <Rect x={2} y={vbH / 2 - 9} width={5.5} height={18} fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.85} />
            {/* Point de penalty gauche & arc de cercle (D) */}
            <Circle cx={11} cy={vbH / 2} r={0.8} fill="#FFFFFF" />
            <Path d={`M 18.5 ${vbH / 2 - 7.5} A 9.15 9.15 0 0 1 18.5 ${vbH / 2 + 7.5}`} fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.9} />
            {/* But gauche & filet */}
            <Rect x={0.4} y={vbH / 2 - 5} width={1.6} height={10} fill="rgba(255,255,255,0.2)" stroke="#FFFFFF" strokeWidth={1} />

            {/* Surface de réparation droite (16.5m) */}
            <Rect x={vbW - 18.5} y={vbH / 2 - 18} width={16.5} height={36} fill="none" stroke="#FFFFFF" strokeWidth={0.8} strokeOpacity={0.9} />
            {/* Surface de but droite (5.5m) */}
            <Rect x={vbW - 7.5} y={vbH / 2 - 9} width={5.5} height={18} fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.85} />
            {/* Point de penalty droit & arc de cercle (D) */}
            <Circle cx={vbW - 11} cy={vbH / 2} r={0.8} fill="#FFFFFF" />
            <Path d={`M ${vbW - 18.5} ${vbH / 2 - 7.5} A 9.15 9.15 0 0 0 ${vbW - 18.5} ${vbH / 2 + 7.5}`} fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.9} />
            {/* But droit & filet */}
            <Rect x={vbW - 2} y={vbH / 2 - 5} width={1.6} height={10} fill="rgba(255,255,255,0.2)" stroke="#FFFFFF" strokeWidth={1} />

            {/* 4 Arcs de corner */}
            <Path d="M 2 4 A 2 2 0 0 0 4 2" fill="none" stroke="#FFFFFF" strokeWidth={0.7} />
            <Path d={`M 2 ${vbH - 4} A 2 2 0 0 1 4 ${vbH - 2}`} fill="none" stroke="#FFFFFF" strokeWidth={0.7} />
            <Path d={`M ${vbW - 2} 4 A 2 2 0 0 1 ${vbW - 4} 2`} fill="none" stroke="#FFFFFF" strokeWidth={0.7} />
            <Path d={`M ${vbW - 2} ${vbH - 4} A 2 2 0 0 0 ${vbW - 4} ${vbH - 2}`} fill="none" stroke="#FFFFFF" strokeWidth={0.7} />
          </G>
        );

      case 'half':
        return (
          <G>
            {/* Demi-terrain grand format */}
            <Rect x={22} y={2} width={56} height={25} fill="none" stroke="#FFFFFF" strokeWidth={0.8} strokeOpacity={0.9} />
            <Rect x={36} y={2} width={28} height={9} fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.85} />
            <Circle cx={50} cy={16} r={0.8} fill="#FFFFFF" />
            <Path d="M 38 27 A 9.15 9.15 0 0 0 62 27" fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.9} />
            {/* But haut */}
            <Rect x={38} y={0.5} width={24} height={2} fill="rgba(255,255,255,0.2)" stroke="#FFFFFF" strokeWidth={1} />
            {/* Ligne médiane et arc du rond central */}
            <Line x1={2} y1={vbH - 2} x2={vbW - 2} y2={vbH - 2} stroke="#FFFFFF" strokeWidth={0.8} />
            <Path d={`M 40.85 ${vbH - 2} A 9.15 9.15 0 0 1 59.15 ${vbH - 2}`} fill="none" stroke="#FFFFFF" strokeWidth={0.7} />
          </G>
        );

      case 'attacking_third':
        return (
          <G>
            {/* Dernier tiers offensif avec surface et couloirs latéraux délimités */}
            <Rect x={18} y={2} width={64} height={32} fill="none" stroke="#FFFFFF" strokeWidth={0.8} strokeOpacity={0.9} />
            <Rect x={34} y={2} width={32} height={11} fill="none" stroke="#FFFFFF" strokeWidth={0.7} strokeOpacity={0.85} />
            <Circle cx={50} cy={18} r={0.8} fill="#FFFFFF" />
            <Path d="M 36 34 A 9.15 9.15 0 0 0 64 34" fill="none" stroke="#FFFFFF" strokeWidth={0.7} />
            {/* But haut */}
            <Rect x={37} y={0.5} width={26} height={2.2} fill="rgba(255,255,255,0.2)" stroke="#FFFFFF" strokeWidth={1} />
            {/* Lignes de couloirs latéraux (tactique offensive) */}
            <Line x1={25} y1={2} x2={25} y2={vbH - 2} stroke="#FFFFFF" strokeWidth={0.5} strokeDasharray="2,2" strokeOpacity={0.6} />
            <Line x1={75} y1={2} x2={75} y2={vbH - 2} stroke="#FFFFFF" strokeWidth={0.5} strokeDasharray="2,2" strokeOpacity={0.6} />
          </G>
        );

      case 'box':
        return (
          <G>
            {/* Zone de rondo / surface réduite */}
            <Rect x={8} y={6} width={vbW - 16} height={vbH - 12} rx={2} fill="none" stroke="#FFFFFF" strokeWidth={0.8} strokeOpacity={0.9} />
            <Line x1={vbW / 2} y1={6} x2={vbW / 2} y2={vbH - 6} stroke="#FFFFFF" strokeWidth={0.5} strokeDasharray="2,2" strokeOpacity={0.6} />
            <Line x1={8} y1={vbH / 2} x2={vbW - 8} y2={vbH / 2} stroke="#FFFFFF" strokeWidth={0.5} strokeDasharray="2,2" strokeOpacity={0.6} />
            <Circle cx={vbW / 2} cy={vbH / 2} r={7} fill="none" stroke="#FFFFFF" strokeWidth={0.5} strokeDasharray="2,2" strokeOpacity={0.6} />
            <Circle cx={vbW / 2} cy={vbH / 2} r={0.8} fill="#FFFFFF" />
          </G>
        );

      case 'small_sided':
        return (
          <G>
            {/* Terrain réduit (Foot à 8 / 7) */}
            <Rect x={2} y={2} width={vbW - 4} height={vbH - 4} rx={2} fill="none" stroke="#FFFFFF" strokeWidth={0.8} strokeOpacity={0.9} />
            <Line x1={vbW / 2} y1={2} x2={vbW / 2} y2={vbH - 2} stroke="#FFFFFF" strokeWidth={0.7} />
            <Circle cx={vbW / 2} cy={vbH / 2} r={6.5} fill="none" stroke="#FFFFFF" strokeWidth={0.7} />
            {/* Surfaces réduites (13m) */}
            <Rect x={2} y={vbH / 2 - 14} width={13} height={28} fill="none" stroke="#FFFFFF" strokeWidth={0.7} />
            <Rect x={vbW - 15} y={vbH / 2 - 14} width={13} height={28} fill="none" stroke="#FFFFFF" strokeWidth={0.7} />
            {/* Buts réduits */}
            <Rect x={0.6} y={vbH / 2 - 4.5} width={1.6} height={9} fill="rgba(255,255,255,0.2)" stroke="#FFFFFF" strokeWidth={1} />
            <Rect x={vbW - 2.2} y={vbH / 2 - 4.5} width={1.6} height={9} fill="rgba(255,255,255,0.2)" stroke="#FFFFFF" strokeWidth={1} />
          </G>
        );

      case 'futsal':
        return (
          <G>
            {/* Terrain Futsal officiel avec surface en arc de 6m */}
            <Rect x={2} y={2} width={vbW - 4} height={vbH - 4} rx={1} fill="none" stroke="#FFFFFF" strokeWidth={0.8} strokeOpacity={0.95} />
            <Line x1={vbW / 2} y1={2} x2={vbW / 2} y2={vbH - 2} stroke="#FFFFFF" strokeWidth={0.8} />
            <Circle cx={vbW / 2} cy={vbH / 2} r={5} fill="none" stroke="#FFFFFF" strokeWidth={0.8} />
            {/* Arcs de surface Futsal 6m */}
            <Path d={`M 2 ${vbH / 2 - 9} A 6 6 0 0 1 8 ${vbH / 2 - 3} L 8 ${vbH / 2 + 3} A 6 6 0 0 1 2 ${vbH / 2 + 9}`} fill="none" stroke="#FFFFFF" strokeWidth={0.7} />
            <Circle cx={8} cy={vbH / 2} r={0.7} fill="#FFFFFF" />
            <Path d={`M ${vbW - 2} ${vbH / 2 - 9} A 6 6 0 0 0 ${vbW - 8} ${vbH / 2 - 3} L ${vbW - 8} ${vbH / 2 + 3} A 6 6 0 0 0 ${vbW - 2} ${vbH / 2 + 9}`} fill="none" stroke="#FFFFFF" strokeWidth={0.7} />
            <Circle cx={vbW - 8} cy={vbH / 2} r={0.7} fill="#FFFFFF" />
            {/* Buts Futsal 3x2m */}
            <Rect x={0.6} y={vbH / 2 - 4} width={1.4} height={8} fill="rgba(255,255,255,0.25)" stroke="#FFFFFF" strokeWidth={1} />
            <Rect x={vbW - 2} y={vbH / 2 - 4} width={1.4} height={8} fill="rgba(255,255,255,0.25)" stroke="#FFFFFF" strokeWidth={1} />
          </G>
        );

      default:
        return null;
    }
  };

  return (
    <View
      style={[
        styles.container,
        typeof width === 'number' && typeof height === 'number' ? { width, height } : null,
      ]}
      onLayout={(e) => {
        const { width: w, height: h, x, y } = e.nativeEvent.layout;
        setPitchLayout({ width: w, height: h, x, y });
        onPitchLayout?.({ width: w, height: h, x, y });
      }}
      {...(interactive ? panResponder.panHandlers : {})}
    >
      <Svg width={width} height={height} viewBox={`0 0 ${vbW} ${vbH}`} pointerEvents="none">
        <Defs>
          <LinearGradient id="pitchGrass" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={isBlue ? '#356F98' : '#14532D'} />
            <Stop offset="100%" stopColor={isBlue ? '#275778' : '#0B3E1F'} />
          </LinearGradient>
          {/* Marqueur de flèche pour les passes et tirs */}
          <Path id="arrowHead" d="M 0 0 L 3 -1.5 L 2.2 0 L 3 1.5 Z" fill="#FFFFFF" />
        </Defs>

        {/* Pelouse de base */}
        <Rect x={0} y={0} width={vbW} height={vbH} fill="url(#pitchGrass)" />

        {/* Bandes de tonte réalistes (stadium mower stripes) */}
        {lawnStripes.map((stripe, idx) => (
          <Rect key={`lawn-${idx}`} x={stripe.x} y={stripe.y} width={stripe.width} height={stripe.height} fill={stripe.fill} opacity={0.65} />
        ))}

        {/* Lignes périphériques du terrain */}
        <Rect x={2} y={2} width={vbW - 4} height={vbH - 4} fill="none" stroke="#FFFFFF" strokeWidth={0.85} strokeOpacity={0.95} />

        {/* Poignées de coin blanches de cadrage */}
        {showCornerHandles && (
          <G pointerEvents="none">
            <Circle cx={2} cy={2} r={0.9} fill="#FFFFFF" stroke="#000000" strokeWidth={0.25} />
            <Circle cx={vbW - 2} cy={2} r={0.9} fill="#FFFFFF" stroke="#000000" strokeWidth={0.25} />
            <Circle cx={2} cy={vbH - 2} r={0.9} fill="#FFFFFF" stroke="#000000" strokeWidth={0.25} />
            <Circle cx={vbW - 2} cy={vbH - 2} r={0.9} fill="#FFFFFF" stroke="#000000" strokeWidth={0.25} />
          </G>
        )}

        {/* Marquages géométriques selon la configuration */}
        {renderMarkings()}

        {/* Zones tactiques éditables */}
        {zones.map((zone) => {
          if (!zone.points || zone.points.length < 3) return null;
          const ptsStr = zone.points.map((p) => {
            const c = getCoords(p);
            return `${c.x},${c.y}`;
          }).join(' ');
          const isSelected = selectedId === zone.id;
          return (
            <G key={zone.id} onPress={() => interactive && onSelectObject?.(zone.id, 'zone')}>
              <Polygon
                points={ptsStr}
                fill={zone.fillColor || 'rgba(59, 130, 246, 0.2)'}
                stroke={zone.strokeColor || '#3B82F6'}
                strokeWidth={isSelected ? 1.2 : 0.8}
                strokeDasharray={zone.strokeStyle === 'dashed' ? '2,2' : undefined}
                opacity={zone.fillOpacity || 0.35}
              />
              {zone.label ? (
                <SvgText
                  x={getCoords(zone.points[0]).x + 2}
                  y={getCoords(zone.points[0]).y + 3}
                  fontSize={2.4}
                  fontWeight="800"
                  fill="#FFFFFF"
                >
                  {zone.label}
                </SvgText>
              ) : null}
            </G>
          );
        })}

        {/* Flèches et tracés tactiques */}
        {drawings.map((draw) => {
          const from = getCoords(draw.from);
          const to = getCoords(draw.to);
          const isSelected = selectedId === draw.id;
          const stroke = draw.color || (draw.type === 'pass' ? '#38BDF8' : draw.type === 'dribble' ? '#F59E0B' : '#4ADE80');
          const isDashed = draw.type === 'pass';
          const isDribble = draw.type === 'dribble';

          return (
            <G key={draw.id} onPress={() => interactive && onSelectObject?.(draw.id, 'drawing')}>
              {draw.controlPoint ? (
                <Path
                  d={`M ${from.x} ${from.y} Q ${getCoords(draw.controlPoint).x} ${getCoords(draw.controlPoint).y} ${to.x} ${to.y}`}
                  fill="none"
                  stroke={stroke}
                  strokeWidth={isSelected ? 1.4 : 0.9}
                  strokeDasharray={isDashed ? '2,1.5' : isDribble ? '1,1' : undefined}
                />
              ) : (
                <Line
                  x1={from.x}
                  y1={from.y}
                  x2={to.x}
                  y2={to.y}
                  stroke={stroke}
                  strokeWidth={isSelected ? 1.4 : 0.9}
                  strokeDasharray={isDashed ? '2,1.5' : isDribble ? '1,1' : undefined}
                />
              )}
              {/* Flèche d'arrivée */}
              <Circle cx={to.x} cy={to.y} r={1.0} fill={stroke} />
            </G>
          );
        })}

        {/* Trajectoire animée en temps réel pendant le déplacement d'un joueur */}
        {liveDragMotion && (
          <G pointerEvents="none">
            {/* Silhouette fantôme au point de départ */}
            <Circle
              cx={liveDragMotion.from.x}
              cy={liveDragMotion.from.y}
              r={2.9}
              fill="none"
              stroke={liveDragMotion.color}
              strokeWidth={0.8}
              strokeDasharray="1.5,1.5"
              opacity={0.85}
            />
            {/* Ligne pointillée de trajectoire avec halo lumineux */}
            <Line
              x1={liveDragMotion.from.x}
              y1={liveDragMotion.from.y}
              x2={liveDragMotion.to.x}
              y2={liveDragMotion.to.y}
              stroke="rgba(255, 255, 255, 0.4)"
              strokeWidth={2.4}
            />
            <Line
              x1={liveDragMotion.from.x}
              y1={liveDragMotion.from.y}
              x2={liveDragMotion.to.x}
              y2={liveDragMotion.to.y}
              stroke={liveDragMotion.color}
              strokeWidth={1.2}
              strokeDasharray="2,1.5"
            />
            {/* Flèche d'orientation à l'arrivée */}
            <Circle cx={liveDragMotion.to.x} cy={liveDragMotion.to.y} r={1.6} fill={liveDragMotion.color} stroke="#FFFFFF" strokeWidth={0.3} />
          </G>
        )}

        {/* Positions Fantômes (Ghosting des frames précédentes) */}
        {ghostPlayers.map((gp) => {
          const c = getCoords(gp);
          const r = c.scale;
          const ghostColor = gp.team === 'teamB' ? '#991B1B' : '#1E40AF';
          return (
            <G key={`ghost-p-${gp.id}`} opacity={0.45}>
              <Circle
                cx={c.x}
                cy={c.y}
                r={2.8 * r}
                fill={ghostColor}
                stroke="#FFFFFF"
                strokeWidth={0.6 * r}
                strokeDasharray="1.2,1.2"
              />
              {gp.num != null ? (
                <SvgText x={c.x} y={c.y + 1.0 * r} fontSize={2.6 * r} fontWeight="800" fill="#FFFFFF" textAnchor="middle">
                  {gp.num}
                </SvgText>
              ) : null}
              <SvgText x={c.x} y={c.y - 3.8 * r} fontSize={2.1 * r} fontWeight="700" fill={ghostColor} textAnchor="middle">
                {gp.label || `Player ${gp.num || ''}`}
              </SvgText>
            </G>
          );
        })}

        {ghostEquipment.map((ge) => {
          const c = getCoords(ge);
          return (
            <G key={`ghost-eq-${ge.id}`} opacity={0.35}>
              <Circle cx={c.x} cy={c.y} r={2.5 * c.scale} fill={ge.color || EQUIPMENT_PRESET_COLORS[ge.type] || '#F97316'} stroke="#FFFFFF" strokeWidth={0.5} strokeDasharray="1,1" />
            </G>
          );
        })}

        {/* Équipements posés */}
        {equipment.map((eq) => {
          const c = getCoords(eq);
          const isSelected = selectedId === eq.id;
          const color = eq.color || EQUIPMENT_PRESET_COLORS[eq.type] || '#F97316';
          const r = c.scale;

          return (
            <G key={eq.id} onPress={() => interactive && onSelectObject?.(eq.id, 'equipment')}>
              {/* Halo de sélection */}
              {isSelected ? (
                <Circle cx={c.x} cy={c.y} r={4.8 * r} fill="none" stroke="#FFFFFF" strokeWidth={0.8} strokeDasharray="1.5,1.5" />
              ) : null}

              {/* Cône 3D avec bande réfléchissante (Fidélité TacticalSlate) */}
              {eq.type === 'cone' && (
                <G>
                  <Ellipse cx={c.x + 1.2 * r} cy={c.y + 2.8 * r} rx={3.0 * r} ry={1.3 * r} fill="rgba(0,0,0,0.38)" />
                  <Ellipse cx={c.x} cy={c.y + 2.1 * r} rx={2.8 * r} ry={1.2 * r} fill="#E65100" />
                  <Ellipse cx={c.x} cy={c.y + 1.8 * r} rx={2.4 * r} ry={1.0 * r} fill="#FB8C00" />
                  <Polygon points={`${c.x},${c.y - 4.6 * r} ${c.x - 2.2 * r},${c.y + 1.8 * r} ${c.x + 2.2 * r},${c.y + 1.8 * r}`} fill="#FB8C00" />
                  <Polygon points={`${c.x},${c.y - 4.6 * r} ${c.x},${c.y + 1.8 * r} ${c.x + 2.2 * r},${c.y + 1.8 * r}`} fill="#F57C00" />
                  <Polygon points={`${c.x - 1.0 * r},${c.y - 1.2 * r} ${c.x + 1.0 * r},${c.y - 1.2 * r} ${c.x + 1.5 * r},${c.y + 0.5 * r} ${c.x - 1.5 * r},${c.y + 0.5 * r}`} fill="#FFFFFF" opacity={0.96} />
                  <Circle cx={c.x} cy={c.y - 4.4 * r} r={0.5 * r} fill="#FFA726" />
                </G>
              )}

              {/* Coupelle plate */}
              {eq.type === 'disc_cone' && (
                <G>
                  <Ellipse cx={c.x} cy={c.y + 0.6 * r} rx={2.2 * r} ry={1 * r} fill="rgba(0,0,0,0.3)" />
                  <Ellipse cx={c.x} cy={c.y} rx={2.2 * r} ry={1.3 * r} fill={color} stroke="#FFFFFF" strokeWidth={0.3} />
                  <Ellipse cx={c.x} cy={c.y - 0.2 * r} rx={1.5 * r} ry={0.8 * r} fill={color} />
                  <Circle cx={c.x} cy={c.y - 0.2 * r} r={0.45 * r} fill="#052E16" />
                </G>
              )}

              {/* Ballon de match */}
              {eq.type === 'ball' && (
                <G>
                  <Ellipse cx={c.x + 0.6 * r} cy={c.y + 1.4 * r} rx={1.6 * r} ry={0.9 * r} fill="rgba(0,0,0,0.45)" />
                  <Circle cx={c.x} cy={c.y} r={1.8 * r} fill="#FFFFFF" stroke="#000000" strokeWidth={0.45} />
                  <Polygon points={`${c.x},${c.y - 0.7 * r} ${c.x + 0.7 * r},${c.y - 0.2 * r} ${c.x + 0.4 * r},${c.y + 0.6 * r} ${c.x - 0.4 * r},${c.y + 0.6 * r} ${c.x - 0.7 * r},${c.y - 0.2 * r}`} fill="#0F172A" />
                </G>
              )}

              {/* Piquet d'agilité */}
              {eq.type === 'pole' && (
                <G>
                  <Ellipse cx={c.x} cy={c.y + 0.8 * r} rx={1.2 * r} ry={0.6 * r} fill="rgba(0,0,0,0.3)" />
                  <Line x1={c.x} y1={c.y + 0.8 * r} x2={c.x} y2={c.y - 4.5 * r} stroke={color} strokeWidth={0.9 * r} />
                  <Circle cx={c.x} cy={c.y - 4.5 * r} r={0.6 * r} fill="#FFFFFF" />
                </G>
              )}

              {/* Haie de saut */}
              {eq.type === 'hurdle' && (
                <G>
                  <Rect x={c.x - 3 * r} y={c.y - 1.5 * r} width={6 * r} height={3 * r} rx={0.6} fill="none" stroke={color} strokeWidth={0.8 * r} />
                  <Line x1={c.x - 3 * r} y1={c.y + 1.5 * r} x2={c.x - 3 * r} y2={c.y + 3 * r} stroke={color} strokeWidth={0.9 * r} />
                  <Line x1={c.x + 3 * r} y1={c.y + 1.5 * r} x2={c.x + 3 * r} y2={c.y + 3 * r} stroke={color} strokeWidth={0.9 * r} />
                </G>
              )}

              {/* Échelle de rythme horizontale jaune/noire (Fidélité TacticalSlate) */}
              {eq.type === 'ladder' && (
                <G>
                  <Ellipse cx={c.x} cy={c.y + 2.2 * r} rx={6.2 * r} ry={1.6 * r} fill="rgba(0,0,0,0.3)" />
                  <Line x1={c.x - 6 * r} y1={c.y - 1.8 * r} x2={c.x + 6 * r} y2={c.y - 1.8 * r} stroke="#EAB308" strokeWidth={0.9 * r} />
                  <Line x1={c.x - 6 * r} y1={c.y + 1.8 * r} x2={c.x + 6 * r} y2={c.y + 1.8 * r} stroke="#EAB308" strokeWidth={0.9 * r} />
                  {[-5, -3, -1, 1, 3, 5].map((off, idx) => (
                    <Line key={`rung-${idx}`} x1={c.x + off * r} y1={c.y - 1.8 * r} x2={c.x + off * r} y2={c.y + 1.8 * r} stroke="#1E293B" strokeWidth={0.65 * r} />
                  ))}
                </G>
              )}

              {/* Mannequin de coup franc */}
              {eq.type === 'mannequin' && (
                <G>
                  <Circle cx={c.x} cy={c.y - 2 * r} r={1.2 * r} fill="#E2E8F0" stroke="#000000" strokeWidth={0.3} />
                  <Rect x={c.x - 1.8 * r} y={c.y} width={3.6 * r} height={4.5 * r} rx={0.8} fill="#E2E8F0" stroke="#000000" strokeWidth={0.3} />
                  <Line x1={c.x - 1.8 * r} y1={c.y + 1.5 * r} x2={c.x + 1.8 * r} y2={c.y + 1.5 * r} stroke="#64748B" strokeWidth={0.4} />
                  <Line x1={c.x - 1.8 * r} y1={c.y + 3 * r} x2={c.x + 1.8 * r} y2={c.y + 3 * r} stroke="#64748B" strokeWidth={0.4} />
                </G>
              )}

              {/* Mini-but / Bownet Rebondeur Bleu (Fidélité TacticalSlate) */}
              {(eq.type === 'mini_goal' || eq.type === 'bownet') && (
                <G>
                  <Rect x={c.x - 3.8 * r} y={c.y - 2.0 * r} width={7.6 * r} height={4.0 * r} rx={0.4 * r} fill="rgba(0,0,0,0.25)" />
                  <Rect x={c.x - 3.6 * r} y={c.y - 2.2 * r} width={7.2 * r} height={4.4 * r} rx={0.6 * r} fill="#1D4ED8" stroke="#3B82F6" strokeWidth={0.65 * r} />
                  <Rect x={c.x - 3.0 * r} y={c.y - 1.6 * r} width={6.0 * r} height={3.2 * r} fill="rgba(255,255,255,0.15)" stroke="#93C5FD" strokeWidth={0.35 * r} strokeDasharray="1,1" />
                </G>
              )}

              {/* Grand but officiel */}
              {eq.type === 'goal' && (
                <G>
                  <Rect x={c.x - 9 * r} y={c.y - 2 * r} width={18 * r} height={4 * r} fill="rgba(255,255,255,0.2)" stroke="#FFFFFF" strokeWidth={1.2 * r} />
                  <Line x1={c.x - 9 * r} y1={c.y} x2={c.x + 9 * r} y2={c.y} stroke="#FFFFFF" strokeWidth={0.5 * r} strokeDasharray="1,1" />
                </G>
              )}
            </G>
          );
        })}

        {/* Joueurs et Staff (Tokens vectoriels HD avec contour noir et label au-dessus) */}
        {players.map((p) => {
          const c = getCoords(p);
          const isSelected = selectedId === p.id;
          const teamTheme = TEAM_PRESET_COLORS[p.team] || TEAM_PRESET_COLORS.teamA;
          const fill = p.color || teamTheme.fill;
          const r = c.scale;

          return (
            <G key={p.id} onPress={() => interactive && onSelectObject?.(p.id, 'player')}>
              {/* Ombre portée */}
              <Ellipse cx={c.x} cy={c.y + 2.5 * r} rx={3.2 * r} ry={1.3 * r} fill="rgba(0,0,0,0.38)" />

              {/* Halo de sélection pulsé */}
              {isSelected ? (
                <Circle cx={c.x} cy={c.y} r={4.6 * r} fill="none" stroke="#FFFFFF" strokeWidth={0.9} strokeDasharray="1.5,1.5" />
              ) : null}

              {/* Corps du pion avec contour noir épais TacticalSlate */}
              <Circle cx={c.x} cy={c.y} r={2.9 * r} fill={fill} stroke="#000000" strokeWidth={0.8 * r} />

              {/* Numéro de maillot */}
              {p.num != null ? (
                <SvgText x={c.x} y={c.y + 1.1 * r} fontSize={2.7 * r} fontWeight="800" fill="#FFFFFF" textAnchor="middle">
                  {p.num}
                </SvgText>
              ) : null}

              {/* Label au-dessus du joueur (ex: "Player 1", "Player 2" en couleur d'équipe) */}
              <SvgText x={c.x} y={c.y - 3.8 * r} fontSize={2.2 * r} fontWeight="700" fill={fill} textAnchor="middle">
                {p.label || `Player ${p.num || ''}`}
              </SvgText>

              {/* Témoin de porteur de balle */}
              {p.hasBall ? (
                <Circle cx={c.x + 2.5 * r} cy={c.y - 2.5 * r} r={1.2 * r} fill="#FFFFFF" stroke="#000000" strokeWidth={0.4} />
              ) : null}
            </G>
          );
        })}
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
