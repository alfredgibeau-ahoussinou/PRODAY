import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  GestureResponderEvent,
  Alert,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, {
  Rect,
  Circle,
  Line,
  Path,
  Defs,
  Marker,
  G,
  Polygon,
  Text as SvgText,
  LinearGradient,
  Stop,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type TacticalFormat = '11v11' | '8v8' | '5v5' | '4v4';
type BoardMode = '2d' | '3d' | 'cpa';
type TacticalTool = 'select' | 'pass' | 'run' | 'press' | 'cone';
type SetPieceType = 'corner_off' | 'corner_def' | 'freekick_direct' | 'freekick_wide';

interface TacticalPlayer {
  id: string;
  num: number;
  name: string;
  x: number; // 0-100
  y: number; // 0-135 normalized coordinates
  team: 'home' | 'away';
  role: string;
}

interface VectorItem {
  id: string;
  fromX: number;
  fromY: number;
  toX: number;
  toY: number;
  type: 'pass' | 'run';
}

interface ConeItem {
  id: string;
  x: number;
  y: number;
}

interface PressingZone {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

const INITIAL_PLAYERS_BY_FORMAT: Record<TacticalFormat, TacticalPlayer[]> = {
  '11v11': [
    { id: 'h1', num: 1, name: 'Hugo L.', x: 50, y: 122, team: 'home', role: 'GB' },
    { id: 'h2', num: 2, name: 'Malik B.', x: 84, y: 98, team: 'home', role: 'LD' },
    { id: 'h3', num: 4, name: 'Axel P.', x: 63, y: 104, team: 'home', role: 'DC' },
    { id: 'h4', num: 5, name: 'Kévin D.', x: 37, y: 104, team: 'home', role: 'DC' },
    { id: 'h5', num: 3, name: 'Enzo S.', x: 16, y: 98, team: 'home', role: 'LG' },
    { id: 'h6', num: 6, name: 'Thomas D.', x: 50, y: 80, team: 'home', role: 'MDC' },
    { id: 'h7', num: 8, name: 'Mathis R.', x: 68, y: 68, team: 'home', role: 'MC' },
    { id: 'h8', num: 10, name: 'Rayan K.', x: 32, y: 68, team: 'home', role: 'MO' },
    { id: 'h9', num: 7, name: 'Lucas M.', x: 82, y: 40, team: 'home', role: 'AD' },
    { id: 'h10', num: 9, name: 'Yanis B.', x: 50, y: 30, team: 'home', role: 'BU' },
    { id: 'h11', num: 11, name: 'Sofiane T.', x: 18, y: 40, team: 'home', role: 'AG' },

    // Opponents
    { id: 'a9', num: 9, name: 'Adv 9', x: 42, y: 88, team: 'away', role: 'BU' },
    { id: 'a10', num: 10, name: 'Adv 10', x: 58, y: 88, team: 'away', role: 'BU' },
    { id: 'a6', num: 6, name: 'Adv 6', x: 50, y: 62, team: 'away', role: 'MC' },
    { id: 'a4', num: 4, name: 'Adv 4', x: 50, y: 20, team: 'away', role: 'DC' },
  ],
  '8v8': [
    { id: 'h1', num: 1, name: 'Hugo L.', x: 50, y: 122, team: 'home', role: 'GB' },
    { id: 'h2', num: 2, name: 'Malik B.', x: 82, y: 98, team: 'home', role: 'LD' },
    { id: 'h3', num: 4, name: 'Axel P.', x: 50, y: 102, team: 'home', role: 'DC' },
    { id: 'h5', num: 3, name: 'Enzo S.', x: 18, y: 98, team: 'home', role: 'LG' },
    { id: 'h7', num: 8, name: 'Mathis R.', x: 22, y: 64, team: 'home', role: 'LM' },
    { id: 'h6', num: 6, name: 'Thomas D.', x: 50, y: 66, team: 'home', role: 'MC' },
    { id: 'h8', num: 10, name: 'Rayan K.', x: 78, y: 64, team: 'home', role: 'RM' },
    { id: 'h10', num: 9, name: 'Yanis B.', x: 50, y: 32, team: 'home', role: 'BU' },

    // Opponents
    { id: 'a9', num: 9, name: 'Adv 9', x: 50, y: 80, team: 'away', role: 'BU' },
    { id: 'a6', num: 6, name: 'Adv 6', x: 50, y: 56, team: 'away', role: 'MC' },
    { id: 'a4', num: 4, name: 'Adv 4', x: 50, y: 22, team: 'away', role: 'DC' },
  ],
  '5v5': [
    { id: 'h1', num: 1, name: 'Hugo L.', x: 50, y: 120, team: 'home', role: 'GB' },
    { id: 'h3', num: 4, name: 'Axel P.', x: 50, y: 92, team: 'home', role: 'FIX' },
    { id: 'h8', num: 10, name: 'Rayan K.', x: 24, y: 64, team: 'home', role: 'AL' },
    { id: 'h9', num: 7, name: 'Lucas M.', x: 76, y: 64, team: 'home', role: 'AD' },
    { id: 'h10', num: 9, name: 'Yanis B.', x: 50, y: 32, team: 'home', role: 'PIV' },

    // Opponents
    { id: 'a9', num: 9, name: 'Adv 9', x: 50, y: 74, team: 'away', role: 'PIV' },
    { id: 'a4', num: 4, name: 'Adv 4', x: 50, y: 22, team: 'away', role: 'FIX' },
  ],
  '4v4': [
    { id: 'h1', num: 1, name: 'Hugo L.', x: 50, y: 120, team: 'home', role: 'GB' },
    { id: 'h3', num: 4, name: 'Axel P.', x: 50, y: 88, team: 'home', role: 'DEF' },
    { id: 'h8', num: 10, name: 'Rayan K.', x: 30, y: 40, team: 'home', role: 'ATT' },
    { id: 'h10', num: 9, name: 'Yanis B.', x: 70, y: 40, team: 'home', role: 'ATT' },

    // Opponents
    { id: 'a9', num: 9, name: 'Adv 9', x: 50, y: 68, team: 'away', role: 'ATT' },
    { id: 'a4', num: 4, name: 'Adv 4', x: 50, y: 24, team: 'away', role: 'DEF' },
  ],
};

export const CoachTacticalBoardScreen: React.FC = () => {
  const [selectedFormat, setSelectedFormat] = useState<TacticalFormat>('11v11');
  const [boardMode, setBoardMode] = useState<BoardMode>('2d');
  const [selectedTool, setSelectedTool] = useState<TacticalTool>('select');
  const [activeSetPiece, setActiveSetPiece] = useState<SetPieceType>('corner_off');
  const [players, setPlayers] = useState<TacticalPlayer[]>(INITIAL_PLAYERS_BY_FORMAT['11v11']);
  const [vectors, setVectors] = useState<VectorItem[]>([
    { id: 'v1', fromX: 50, fromY: 80, toX: 82, toY: 40, type: 'pass' },
    { id: 'v2', fromX: 82, fromY: 40, toX: 50, toY: 30, type: 'run' },
  ]);
  const [cones, setCones] = useState<ConeItem[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<TacticalPlayer | null>(null);

  const pitchWidth = SCREEN_WIDTH - 32;
  const pitchHeight = pitchWidth * 1.35;
  const isFutsal = selectedFormat === '5v5';

  const triggerHaptic = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // ignore
    }
  };

  const handleFormatChange = (fmt: TacticalFormat) => {
    triggerHaptic();
    setSelectedFormat(fmt);
    setPlayers(INITIAL_PLAYERS_BY_FORMAT[fmt]);
    setSelectedPlayer(null);
    setVectors([]);
    setCones([]);
  };

  const handleResetBoard = () => {
    triggerHaptic();
    setPlayers(INITIAL_PLAYERS_BY_FORMAT[selectedFormat]);
    setSelectedPlayer(null);
    setVectors([]);
    setCones([]);
  };

  const toggleAnimation = () => {
    triggerHaptic();
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setActivePhase((p) => ((p % 3) + 1) as 1 | 2 | 3);
    }
  };

  const handlePitchTouch = (evt: GestureResponderEvent) => {
    const { locationX, locationY } = evt.nativeEvent;
    // Map touch to 0-100 x 0-135 normalized grid
    const normX = Math.round(Math.max(6, Math.min(94, (locationX / pitchWidth) * 100)));
    const normY = Math.round(Math.max(6, Math.min(129, (locationY / pitchHeight) * 135)));

    if (selectedTool === 'select') {
      if (selectedPlayer) {
        // Friction-free manual relocation: move selected player to tap location
        triggerHaptic();
        setPlayers((prev) =>
          prev.map((p) => (p.id === selectedPlayer.id ? { ...p, x: normX, y: normY } : p))
        );
        setSelectedPlayer((prev) => (prev ? { ...prev, x: normX, y: normY } : null));
      }
    } else if (selectedTool === 'cone') {
      triggerHaptic();
      setCones((prev) => [...prev, { id: Date.now().toString(), x: normX, y: normY }]);
    } else if (selectedTool === 'pass') {
      if (selectedPlayer) {
        triggerHaptic();
        setVectors((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            fromX: selectedPlayer.x,
            fromY: selectedPlayer.y,
            toX: normX,
            toY: normY,
            type: 'pass',
          },
        ]);
      }
    } else if (selectedTool === 'run') {
      if (selectedPlayer) {
        triggerHaptic();
        setVectors((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            fromX: selectedPlayer.x,
            fromY: selectedPlayer.y,
            toX: normX,
            toY: normY,
            type: 'run',
          },
        ]);
      }
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 1. Header with Mode Switcher & Club Identity */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="soccer-field" size={20} color="#C5A059" />
          <View>
            <Text style={styles.headerTitle}>Tableau Noir & Laboratoire CPA</Text>
            <Text style={styles.headerSubtitle}>
              {isFutsal ? 'Salle Futsal Officielle · 6m D-Arcs' : 'Pelouse Extérieure · Ardoise Vectorielle'}
            </Text>
          </View>
        </View>

        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, boardMode === '2d' && styles.modeTabActive]}
            onPress={() => {
              triggerHaptic();
              setBoardMode('2d');
            }}
          >
            <Text style={[styles.modeTabText, boardMode === '2d' && styles.modeTabTextActive]}>2D Plat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, boardMode === '3d' && styles.modeTabActive]}
            onPress={() => {
              triggerHaptic();
              setBoardMode('3d');
            }}
          >
            <Text style={[styles.modeTabText, boardMode === '3d' && styles.modeTabTextActive]}>3D Iso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, boardMode === 'cpa' && styles.modeTabActive]}
            onPress={() => {
              triggerHaptic();
              setBoardMode('cpa');
            }}
          >
            <Text style={[styles.modeTabText, boardMode === 'cpa' && styles.modeTabTextActive]}>Labo CPA</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. UNIVERSAL MULTI-FORMAT SELECTOR BAR */}
      <View style={styles.formatSelectorRow}>
        {(
          [
            { key: '11v11', label: 'Foot à 11' },
            { key: '8v8', label: 'Foot à 8' },
            { key: '5v5', label: 'Futsal 5v5' },
            { key: '4v4', label: 'Animation 4v4' },
          ] as const
        ).map((fmt) => {
          const isActive = selectedFormat === fmt.key;
          return (
            <TouchableOpacity
              key={fmt.key}
              style={[styles.formatChip, isActive && styles.formatChipActive]}
              activeOpacity={0.7}
              onPress={() => handleFormatChange(fmt.key)}
            >
              <Text style={[styles.formatChipText, isActive && styles.formatChipTextActive]}>
                {fmt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 3. Drawing Toolbar & Manual Reset */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolBtn, selectedTool === 'select' && styles.toolBtnActive]}
          onPress={() => {
            triggerHaptic();
            setSelectedTool('select');
          }}
        >
          <MaterialCommunityIcons
            name="cursor-default"
            size={16}
            color={selectedTool === 'select' ? '#C5A059' : '#8B8B9A'}
          />
          <Text style={[styles.toolBtnText, selectedTool === 'select' && styles.toolBtnTextActive]}>
            Sélecteur
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, selectedTool === 'pass' && styles.toolBtnActive]}
          onPress={() => {
            triggerHaptic();
            setSelectedTool('pass');
          }}
        >
          <MaterialCommunityIcons
            name="vector-line"
            size={16}
            color={selectedTool === 'pass' ? '#30D158' : '#8B8B9A'}
          />
          <Text style={[styles.toolBtnText, selectedTool === 'pass' && styles.toolBtnTextActive]}>
            Passe
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, selectedTool === 'run' && styles.toolBtnActive]}
          onPress={() => {
            triggerHaptic();
            setSelectedTool('run');
          }}
        >
          <MaterialCommunityIcons
            name="ray-start-arrow"
            size={16}
            color={selectedTool === 'run' ? '#0A84FF' : '#8B8B9A'}
          />
          <Text style={[styles.toolBtnText, selectedTool === 'run' && styles.toolBtnTextActive]}>
            Course
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, selectedTool === 'cone' && styles.toolBtnActive]}
          onPress={() => {
            triggerHaptic();
            setSelectedTool('cone');
          }}
        >
          <MaterialCommunityIcons
            name="cone"
            size={16}
            color={selectedTool === 'cone' ? '#FF9F0A' : '#8B8B9A'}
          />
          <Text style={[styles.toolBtnText, selectedTool === 'cone' && styles.toolBtnTextActive]}>
            Plots
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={handleResetBoard}>
          <Feather name="rotate-ccw" size={14} color="#8B8B9A" />
          <Text style={styles.resetBtnText}>Réinit</Text>
        </TouchableOpacity>
      </View>

      {/* Contextual User Tip */}
      <View style={styles.tipBanner}>
        <Feather name="info" size={13} color="#C5A059" />
        <Text style={styles.tipText}>
          {selectedPlayer
            ? `Joueur #${selectedPlayer.num} ${selectedPlayer.name} sélectionné. Touchez le terrain pour le déplacer ou tracer un vecteur.`
            : `Touchez un joueur pour le sélectionner, ou utilisez les outils pour enrichir le schéma.`}
        </Text>
      </View>

      {/* CPA Sub-Bar (When in CPA mode) */}
      {boardMode === 'cpa' && (
        <View style={styles.cpaSubBar}>
          <TouchableOpacity
            style={[styles.cpaPill, activeSetPiece === 'corner_off' && styles.cpaPillActive]}
            onPress={() => {
              triggerHaptic();
              setActiveSetPiece('corner_off');
            }}
          >
            <Text style={[styles.cpaPillText, activeSetPiece === 'corner_off' && styles.cpaPillTextActive]}>
              Corner Offensif
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cpaPill, activeSetPiece === 'corner_def' && styles.cpaPillActive]}
            onPress={() => {
              triggerHaptic();
              setActiveSetPiece('corner_def');
            }}
          >
            <Text style={[styles.cpaPillText, activeSetPiece === 'corner_def' && styles.cpaPillTextActive]}>
              Corner Défensif (Mixte)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cpaPill, activeSetPiece === 'freekick_direct' && styles.cpaPillActive]}
            onPress={() => {
              triggerHaptic();
              setActiveSetPiece('freekick_direct');
            }}
          >
            <Text style={[styles.cpaPillText, activeSetPiece === 'freekick_direct' && styles.cpaPillTextActive]}>
              Coup Franc Direct
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 4. THE INTERACTIVE TACTICAL CANVAS (TURF VS FUTSAL) */}
      <View
        style={[
          styles.pitchWrapper,
          boardMode === '3d' && styles.pitchWrapper3D,
          { width: pitchWidth, height: pitchHeight },
        ]}
        onTouchEnd={handlePitchTouch}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 135">
          <Defs>
            <Marker
              id="arrowPass"
              viewBox="0 0 10 10"
              refX={6}
              refY={5}
              markerWidth={4}
              markerHeight={4}
              orient="auto"
            >
              <Path d="M 0 2 L 8 5 L 0 8 z" fill="#30D158" />
            </Marker>
            <Marker
              id="arrowRun"
              viewBox="0 0 10 10"
              refX={6}
              refY={5}
              markerWidth={4}
              markerHeight={4}
              orient="auto"
            >
              <Path d="M 0 2 L 8 5 L 0 8 z" fill="#0A84FF" />
            </Marker>
            {isFutsal ? (
              <LinearGradient id="futsalGradTactical" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#0B1A30" />
                <Stop offset="50%" stopColor="#0F2548" />
                <Stop offset="100%" stopColor="#081426" />
              </LinearGradient>
            ) : (
              <LinearGradient id="turfGradTactical" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0%" stopColor="#0D2416" />
                <Stop offset="50%" stopColor="#12301D" />
                <Stop offset="100%" stopColor="#0A1E11" />
              </LinearGradient>
            )}
          </Defs>

          {/* Background Turf or Futsal Court */}
          <Rect
            x="0"
            y="0"
            width="100"
            height="135"
            rx="6"
            fill={isFutsal ? 'url(#futsalGradTactical)' : 'url(#turfGradTactical)'}
          />

          {/* Alternating lawn mow stripes (for outdoor formats) */}
          {!isFutsal &&
            [0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
              <Rect
                key={i}
                x="0"
                y={i * (135 / 8)}
                width="100"
                height={135 / 16}
                fill="#12301D"
                opacity={0.55}
              />
            ))}

          {/* Outer Boundary Touchlines */}
          <Rect
            x="5"
            y="5"
            width="90"
            height="125"
            rx={isFutsal ? 0 : 3}
            fill="none"
            stroke={isFutsal ? '#E5C07B' : 'rgba(255, 255, 255, 0.4)'}
            strokeWidth="0.8"
          />

          {/* Halfway Line & Center Circle */}
          <Line
            x1="5"
            y1="67.5"
            x2="95"
            y2="67.5"
            stroke={isFutsal ? '#E5C07B' : 'rgba(255, 255, 255, 0.4)'}
            strokeWidth="0.8"
          />
          <Circle
            cx="50"
            cy="67.5"
            r="10"
            fill="none"
            stroke={isFutsal ? '#E5C07B' : 'rgba(255, 255, 255, 0.4)'}
            strokeWidth="0.8"
          />
          <Circle cx="50" cy="67.5" r="0.8" fill={isFutsal ? '#E5C07B' : '#FFFFFF'} />

          {/* Specific Markings: Futsal 6m D-Arcs vs Outdoor Penalty Boxes */}
          {isFutsal ? (
            <>
              {/* Top 6m Futsal D-arc */}
              <Path
                d="M 28 5 A 22 22 0 0 0 72 5"
                fill="none"
                stroke="#E5C07B"
                strokeWidth="0.9"
              />
              <Circle cx="50" cy="20" r="0.8" fill="#E5C07B" />

              {/* Bottom 6m Futsal D-arc */}
              <Path
                d="M 28 130 A 22 22 0 0 1 72 130"
                fill="none"
                stroke="#E5C07B"
                strokeWidth="0.9"
              />
              <Circle cx="50" cy="115" r="0.8" fill="#E5C07B" />
            </>
          ) : (
            <>
              {/* Top Penalty Box (Away side) */}
              <Rect
                x="25"
                y="5"
                width="50"
                height="20"
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="0.8"
              />
              <Rect
                x="36"
                y="5"
                width="28"
                height="7"
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="0.8"
              />
              <Circle cx="50" cy="16" r="0.8" fill="#FFFFFF" />

              {/* Bottom Penalty Box (Home side) */}
              <Rect
                x="25"
                y="110"
                width="50"
                height="20"
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="0.8"
              />
              <Rect
                x="36"
                y="123"
                width="28"
                height="7"
                fill="none"
                stroke="rgba(255, 255, 255, 0.4)"
                strokeWidth="0.8"
              />
              <Circle cx="50" cy="119" r="0.8" fill="#FFFFFF" />
            </>
          )}

          {/* Tactical Overlay: Pressing Zone Highlight */}
          <Rect
            x="15"
            y="25"
            width="70"
            height="35"
            rx="4"
            fill="rgba(255, 69, 58, 0.10)"
            stroke="#FF453A"
            strokeWidth="0.6"
            strokeDasharray="2,2"
          />
          <SvgText x="50" y="30" fill="#FF453A" fontSize="2.8" fontWeight="bold" textAnchor="middle">
            {isFutsal ? 'BLOC CADRAGE HAUT 1-2-1' : 'ZONE DE PRESSING HAUT DÉCLENCHÉ'}
          </SvgText>

          {/* Render Drawn Vector Arrows (Pass & Run) */}
          {vectors.map((vec) => (
            <Line
              key={vec.id}
              x1={vec.fromX}
              y1={vec.fromY}
              x2={vec.toX}
              y2={vec.toY}
              stroke={vec.type === 'pass' ? '#30D158' : '#0A84FF'}
              strokeWidth="0.9"
              strokeDasharray="2,1"
              markerEnd={vec.type === 'pass' ? 'url(#arrowPass)' : 'url(#arrowRun)'}
            />
          ))}

          {/* Render Drawn Training Cones */}
          {cones.map((cone) => (
            <Polygon
              key={cone.id}
              points={`${cone.x},${cone.y - 2} ${cone.x - 1.8},${cone.y + 1.8} ${cone.x + 1.8},${cone.y + 1.8}`}
              fill="#FF9F0A"
              stroke="#FFFFFF"
              strokeWidth="0.3"
            />
          ))}

          {/* Render Active Player Tokens */}
          {players.map((p) => {
            const isHome = p.team === 'home';
            const isSelected = selectedPlayer?.id === p.id;

            return (
              <G
                key={p.id}
                onPress={() => {
                  triggerHaptic();
                  setSelectedPlayer(isSelected ? null : p);
                }}
              >
                {/* Glow ring if selected */}
                {isSelected && (
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={5.4}
                    fill="none"
                    stroke="#C5A059"
                    strokeWidth="1.2"
                  />
                )}
                {/* Player Token Circle */}
                <Circle
                  cx={p.x}
                  cy={p.y}
                  r={3.8}
                  fill={isHome ? '#0A84FF' : '#FF453A'}
                  stroke={isHome ? '#C5A059' : '#FFFFFF'}
                  strokeWidth="0.8"
                />
                {/* Jersey Number */}
                <SvgText
                  x={p.x}
                  y={p.y + 1.2}
                  fill="#FFFFFF"
                  fontSize="3"
                  fontWeight="bold"
                  textAnchor="middle"
                >
                  {p.num}
                </SvgText>
                {/* Name Label */}
                <SvgText
                  x={p.x}
                  y={p.y + 4.8}
                  fill="#FFFFFF"
                  fontSize="2.2"
                  fontWeight="600"
                  textAnchor="middle"
                >
                  {p.name.split(' ')[0]}
                </SvgText>
              </G>
            );
          })}
        </Svg>
      </View>

      {/* 5. Playback & Animated Sequence Controls */}
      <View style={styles.playbackControls}>
        <View style={styles.phasePills}>
          <TouchableOpacity
            style={[styles.phasePill, activePhase === 1 && styles.phasePillActive]}
            onPress={() => {
              triggerHaptic();
              setActivePhase(1);
            }}
          >
            <Text style={[styles.phasePillText, activePhase === 1 && styles.phasePillTextActive]}>
              Phase 1 : Relance
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.phasePill, activePhase === 2 && styles.phasePillActive]}
            onPress={() => {
              triggerHaptic();
              setActivePhase(2);
            }}
          >
            <Text style={[styles.phasePillText, activePhase === 2 && styles.phasePillTextActive]}>
              Phase 2 : Progression
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.phasePill, activePhase === 3 && styles.phasePillActive]}
            onPress={() => {
              triggerHaptic();
              setActivePhase(3);
            }}
          >
            <Text style={[styles.phasePillText, activePhase === 3 && styles.phasePillTextActive]}>
              Phase 3 : Finition
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playbackBtnRow}>
          <TouchableOpacity
            style={styles.playbackBtn}
            onPress={() => {
              triggerHaptic();
              setActivePhase(1);
            }}
          >
            <MaterialCommunityIcons name="skip-backward" size={20} color="#8B8B9A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.playbackBtn, styles.playbackPlayBtn]}
            onPress={toggleAnimation}
          >
            <Ionicons name={isPlaying ? 'pause' : 'play'} size={22} color="#000000" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.playbackBtn}
            onPress={() => {
              triggerHaptic();
              setActivePhase((p) => ((p % 3) + 1) as 1 | 2 | 3);
            }}
          >
            <MaterialCommunityIcons name="skip-forward" size={20} color="#8B8B9A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.syncSquadBtn}
            onPress={() => {
              triggerHaptic();
              Alert.alert('Schéma Synchronisé', 'Schéma tactique synchronisé en direct avec les vestiaires !');
            }}
          >
            <MaterialCommunityIcons name="broadcast" size={16} color="#C5A059" />
            <Text style={styles.syncSquadText}>Diffuser aux Vestiaires</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 6. Selected Player Focus or Set-Piece Blueprint Card */}
      {boardMode === 'cpa' ? (
        <View style={styles.cpaBlueprintCard}>
          <View style={styles.cpaBlueprintHeader}>
            <MaterialCommunityIcons name="target" size={18} color="#C5A059" />
            <Text style={styles.cpaBlueprintTitle}>
              {isFutsal
                ? 'Protocole CPA Futsal : Rentrée de Touche / Coup Franc Bloc'
                : 'Protocole CPA : Corner Sortant 1er Poteau'}
            </Text>
          </View>
          <Text style={styles.cpaBlueprintBody}>
            {isFutsal
              ? '• Rentrée de touche dans les 4 secondes obligatoires.\n• Bloc écran du pivot à 5m pour libérer la frappe rasante de l’ailier opposé.\n• Sécurité couverture défensive par le FIX en retrait.'
              : '• Tireur : Rayan K. (Pied droit, rentrant brossé).\n• Déviation 1er poteau : Yanis B. (Course coupée à 9m).\n• Finition 2nd poteau : Axel P. (Attaque de l’angle mort).\n• Sécurité transition adverse : 2 défenseurs en couverture ligne médiane.'}
          </Text>
        </View>
      ) : selectedPlayer ? (
        <View style={styles.playerFocusCard}>
          <View style={styles.playerFocusTop}>
            <View style={styles.playerBadge}>
              <Text style={styles.playerBadgeNum}>#{selectedPlayer.num}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.playerFocusName}>{selectedPlayer.name}</Text>
              <Text style={styles.playerFocusRole}>Rôle Tactique : {selectedPlayer.role}</Text>
            </View>
            <TouchableOpacity
              style={styles.roleActionBtn}
              onPress={() => {
                triggerHaptic();
                Alert.alert('Consigne Spécifique', `Consigne personnalisée assignée à ${selectedPlayer.name}`);
              }}
            >
              <Text style={styles.roleActionText}>Consigne Spécifique</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    flexWrap: 'wrap',
    gap: 8,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    fontFamily: '-apple-system',
  },
  headerSubtitle: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '500',
    fontFamily: '-apple-system',
  },
  modeTabs: {
    flexDirection: 'row',
    backgroundColor: '#1C1C22',
    borderRadius: 8,
    padding: 3,
    gap: 3,
  },
  modeTab: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  modeTabActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.25)',
  },
  modeTabText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  modeTabTextActive: {
    color: '#C5A059',
  },
  formatSelectorRow: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 4,
    marginBottom: 10,
    gap: 4,
  },
  formatChip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#1C1C22',
  },
  formatChipActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.22)',
    borderWidth: 1,
    borderColor: '#C5A059',
  },
  formatChipText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  formatChipTextActive: {
    color: '#C5A059',
  },
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 6,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  toolBtnActive: {
    backgroundColor: '#1C1C22',
  },
  toolBtnText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  toolBtnTextActive: {
    color: '#FFFFFF',
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#1C1C22',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
  },
  resetBtnText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.1)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 10,
  },
  tipText: {
    flex: 1,
    color: '#D1D1D6',
    fontSize: 10.5,
    lineHeight: 14,
    fontFamily: '-apple-system',
  },
  cpaSubBar: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 10,
  },
  cpaPill: {
    backgroundColor: '#1C1C22',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  cpaPillActive: {
    backgroundColor: 'rgba(197, 160, 89, 0.2)',
    borderColor: '#C5A059',
  },
  cpaPillText: {
    color: '#8B8B9A',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  cpaPillTextActive: {
    color: '#C5A059',
  },
  pitchWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignSelf: 'center',
    backgroundColor: '#0A1E11',
  },
  pitchWrapper3D: {
    transform: [{ perspective: 600 }, { rotateX: '18deg' }],
  },
  playbackControls: {
    backgroundColor: '#141418',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginTop: 12,
  },
  phasePills: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  phasePill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    marginHorizontal: 3,
    backgroundColor: '#1C1C22',
  },
  phasePillActive: {
    backgroundColor: 'rgba(10, 132, 255, 0.2)',
    borderWidth: 1,
    borderColor: '#0A84FF',
  },
  phasePillText: {
    color: '#8B8B9A',
    fontSize: 10,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
  phasePillTextActive: {
    color: '#0A84FF',
  },
  playbackBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  playbackBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1C1C22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playbackPlayBtn: {
    backgroundColor: '#C5A059',
    width: 44,
    height: 44,
    borderRadius: 12,
  },
  syncSquadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(197, 160, 89, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.4)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  syncSquadText: {
    color: '#C5A059',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  cpaBlueprintCard: {
    backgroundColor: '#141418',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(197, 160, 89, 0.25)',
    padding: 14,
    marginTop: 12,
  },
  cpaBlueprintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  cpaBlueprintTitle: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  cpaBlueprintBody: {
    color: '#D1D1D6',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: '-apple-system',
  },
  playerFocusCard: {
    backgroundColor: '#141418',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 12,
    marginTop: 12,
  },
  playerFocusTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  playerBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#0A84FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerBadgeNum: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  playerFocusName: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    fontFamily: '-apple-system',
  },
  playerFocusRole: {
    color: '#8B8B9A',
    fontSize: 11,
    fontFamily: '-apple-system',
  },
  roleActionBtn: {
    backgroundColor: '#1C1C22',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
  },
  roleActionText: {
    color: '#0A84FF',
    fontSize: 11,
    fontWeight: '600',
    fontFamily: '-apple-system',
  },
});

