import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import Svg, {
  Rect,
  Circle,
  Line,
  Path,
  Defs,
  Marker,
  G,
  Text as SvgText,
} from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type BoardMode = '2d' | '3d' | 'cpa';
type TacticalTool = 'select' | 'pass' | 'run' | 'press' | 'cone';
type SetPieceType = 'corner_off' | 'corner_def' | 'freekick_direct' | 'freekick_wide';

interface TacticalPlayer {
  id: string;
  num: number;
  name: string;
  x: number; // 0-100
  y: number; // 0-100
  team: 'home' | 'away';
  role: string;
}

const INITIAL_PLAYERS: TacticalPlayer[] = [
  // Home Team (Blue / Gold) - 4-3-3
  { id: 'h1', num: 1, name: 'Hugo L.', x: 50, y: 92, team: 'home', role: 'GB' },
  { id: 'h2', num: 2, name: 'Malik B.', x: 82, y: 76, team: 'home', role: 'LD' },
  { id: 'h3', num: 4, name: 'Axel P.', x: 62, y: 80, team: 'home', role: 'DC' },
  { id: 'h4', num: 5, name: 'Kévin D.', x: 38, y: 80, team: 'home', role: 'DC' },
  { id: 'h5', num: 3, name: 'Enzo S.', x: 18, y: 76, team: 'home', role: 'LG' },
  { id: 'h6', num: 6, name: 'Thomas D.', x: 50, y: 64, team: 'home', role: 'MDC' },
  { id: 'h7', num: 8, name: 'Mathis R.', x: 68, y: 52, team: 'home', role: 'MC' },
  { id: 'h8', num: 10, name: 'Rayan K.', x: 32, y: 52, team: 'home', role: 'MO' },
  { id: 'h9', num: 7, name: 'Lucas M.', x: 82, y: 32, team: 'home', role: 'AD' },
  { id: 'h10', num: 9, name: 'Yanis B.', x: 50, y: 26, team: 'home', role: 'BU' },
  { id: 'h11', num: 11, name: 'Sofiane T.', x: 18, y: 32, team: 'home', role: 'AG' },

  // Opponent (Red) - 3-5-2
  { id: 'a9', num: 9, name: 'Adv 9', x: 42, y: 68, team: 'away', role: 'BU' },
  { id: 'a10', num: 10, name: 'Adv 10', x: 58, y: 68, team: 'away', role: 'BU' },
  { id: 'a6', num: 6, name: 'Adv 6', x: 50, y: 48, team: 'away', role: 'MC' },
  { id: 'a4', num: 4, name: 'Adv 4', x: 50, y: 16, team: 'away', role: 'DC' },
];

export const CoachTacticalBoardScreen: React.FC = () => {
  const [boardMode, setBoardMode] = useState<BoardMode>('2d');
  const [selectedTool, setSelectedTool] = useState<TacticalTool>('select');
  const [activeSetPiece, setActiveSetPiece] = useState<SetPieceType>('corner_off');
  const [players, setPlayers] = useState<TacticalPlayer[]>(INITIAL_PLAYERS);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<TacticalPlayer | null>(null);

  const pitchWidth = SCREEN_WIDTH - 32;
  const pitchHeight = pitchWidth * 1.35;

  const toggleAnimation = () => {
    setIsPlaying(!isPlaying);
    if (!isPlaying) {
      setActivePhase((p) => ((p % 3) + 1) as 1 | 2 | 3);
    }
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
      {/* 1. Header with Mode Switcher (2D / 3D Isométrique / CPA) */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <MaterialCommunityIcons name="soccer-field" size={20} color="#C5A059" />
          <View>
            <Text style={styles.headerTitle}>Tableau Noir & Laboratoire CPA</Text>
            <Text style={styles.headerSubtitle}>Ardoise Tactique Vectorielle & 3D</Text>
          </View>
        </View>

        <View style={styles.modeTabs}>
          <TouchableOpacity
            style={[styles.modeTab, boardMode === '2d' && styles.modeTabActive]}
            onPress={() => setBoardMode('2d')}
          >
            <Text style={[styles.modeTabText, boardMode === '2d' && styles.modeTabTextActive]}>2D Plat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, boardMode === '3d' && styles.modeTabActive]}
            onPress={() => setBoardMode('3d')}
          >
            <Text style={[styles.modeTabText, boardMode === '3d' && styles.modeTabTextActive]}>3D Iso</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeTab, boardMode === 'cpa' && styles.modeTabActive]}
            onPress={() => setBoardMode('cpa')}
          >
            <Text style={[styles.modeTabText, boardMode === 'cpa' && styles.modeTabTextActive]}>Labo CPA</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Vector Toolkit & Drawing Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolBtn, selectedTool === 'select' && styles.toolBtnActive]}
          onPress={() => setSelectedTool('select')}
        >
          <MaterialCommunityIcons name="cursor-default" size={16} color={selectedTool === 'select' ? '#C5A059' : '#8B8B9A'} />
          <Text style={[styles.toolBtnText, selectedTool === 'select' && styles.toolBtnTextActive]}>Sélecteur</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, selectedTool === 'pass' && styles.toolBtnActive]}
          onPress={() => setSelectedTool('pass')}
        >
          <MaterialCommunityIcons name="vector-line" size={16} color={selectedTool === 'pass' ? '#30D158' : '#8B8B9A'} />
          <Text style={[styles.toolBtnText, selectedTool === 'pass' && styles.toolBtnTextActive]}>Passe</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, selectedTool === 'run' && styles.toolBtnActive]}
          onPress={() => setSelectedTool('run')}
        >
          <MaterialCommunityIcons name="ray-start-arrow" size={16} color={selectedTool === 'run' ? '#0A84FF' : '#8B8B9A'} />
          <Text style={[styles.toolBtnText, selectedTool === 'run' && styles.toolBtnTextActive]}>Course</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, selectedTool === 'press' && styles.toolBtnActive]}
          onPress={() => setSelectedTool('press')}
        >
          <MaterialCommunityIcons name="radar" size={16} color={selectedTool === 'press' ? '#FF453A' : '#8B8B9A'} />
          <Text style={[styles.toolBtnText, selectedTool === 'press' && styles.toolBtnTextActive]}>Pressing</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, selectedTool === 'cone' && styles.toolBtnActive]}
          onPress={() => setSelectedTool('cone')}
        >
          <MaterialCommunityIcons name="cone" size={16} color={selectedTool === 'cone' ? '#FF9F0A' : '#8B8B9A'} />
          <Text style={[styles.toolBtnText, selectedTool === 'cone' && styles.toolBtnTextActive]}>Plots</Text>
        </TouchableOpacity>
      </View>

      {/* CPA Sub-Toolbar (When in CPA mode) */}
      {boardMode === 'cpa' && (
        <View style={styles.cpaSubBar}>
          <TouchableOpacity
            style={[styles.cpaPill, activeSetPiece === 'corner_off' && styles.cpaPillActive]}
            onPress={() => setActiveSetPiece('corner_off')}
          >
            <Text style={[styles.cpaPillText, activeSetPiece === 'corner_off' && styles.cpaPillTextActive]}>Corner Offensif</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cpaPill, activeSetPiece === 'corner_def' && styles.cpaPillActive]}
            onPress={() => setActiveSetPiece('corner_def')}
          >
            <Text style={[styles.cpaPillText, activeSetPiece === 'corner_def' && styles.cpaPillTextActive]}>Corner Défensif (Mixte)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.cpaPill, activeSetPiece === 'freekick_direct' && styles.cpaPillActive]}
            onPress={() => setActiveSetPiece('freekick_direct')}
          >
            <Text style={[styles.cpaPillText, activeSetPiece === 'freekick_direct' && styles.cpaPillTextActive]}>Coup Franc Direct</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 3. The Interactive Tactical Pitch Canvas */}
      <View
        style={[
          styles.pitchWrapper,
          boardMode === '3d' && styles.pitchWrapper3D,
          { width: pitchWidth, height: pitchHeight },
        ]}
      >
        <Svg width="100%" height="100%" viewBox="0 0 100 135">
          <Defs>
            <Marker id="arrowPass" viewBox="0 0 10 10" refX={6} refY={5} markerWidth={4} markerHeight={4} orient="auto">
              <Path d="M 0 2 L 8 5 L 0 8 z" fill="#30D158" />
            </Marker>
            <Marker id="arrowRun" viewBox="0 0 10 10" refX={6} refY={5} markerWidth={4} markerHeight={4} orient="auto">
              <Path d="M 0 2 L 8 5 L 0 8 z" fill="#0A84FF" />
            </Marker>
          </Defs>

          {/* Grass Background with dark gradient look */}
          <Rect x="0" y="0" width="100" height="135" rx="6" fill="#0D2416" />

          {/* Alternating lawn mow stripes */}
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
            <Rect
              key={i}
              x="0"
              y={i * (135 / 8)}
              width="100"
              height={135 / 16}
              fill="#12301D"
              opacity={0.6}
            />
          ))}

          {/* Outer Touchlines */}
          <Rect x="5" y="5" width="90" height="125" rx="3" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />

          {/* Halfway Line & Center Circle */}
          <Line x1="5" y1="67.5" x2="95" y2="67.5" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
          <Circle cx="50" cy="67.5" r="10" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
          <Circle cx="50" cy="67.5" r="0.8" fill="#FFFFFF" />

          {/* Top Penalty Box (Away side) */}
          <Rect x="25" y="5" width="50" height="20" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
          <Rect x="36" y="5" width="28" height="7" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
          <Circle cx="50" cy="16" r="0.8" fill="#FFFFFF" />

          {/* Bottom Penalty Box (Home side) */}
          <Rect x="25" y="110" width="50" height="20" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
          <Rect x="36" y="123" width="28" height="7" fill="none" stroke="rgba(255, 255, 255, 0.4)" strokeWidth="0.8" />
          <Circle cx="50" cy="119" r="0.8" fill="#FFFFFF" />

          {/* Tactical Overlay: Pressing Zone Highlight */}
          <Rect
            x="15"
            y="25"
            width="70"
            height="35"
            rx="4"
            fill="rgba(255, 69, 58, 0.12)"
            stroke="#FF453A"
            strokeWidth="0.6"
            strokeDasharray="2,2"
          />
          <SvgText x="50" y="30" fill="#FF453A" fontSize="3" fontWeight="bold" textAnchor="middle">
            ZONE DE PRESSING HAUT DÉCLENCHÉ
          </SvgText>

          {/* Animated Tactical Passing Vectors */}
          <Line
            x1="50"
            y1="64"
            x2="82"
            y2="34"
            stroke="#30D158"
            strokeWidth="0.9"
            strokeDasharray="2,1"
            markerEnd="url(#arrowPass)"
          />
          <Path
            d="M 82 32 Q 65 20 50 26"
            fill="none"
            stroke="#0A84FF"
            strokeWidth="0.9"
            strokeDasharray="2,1"
            markerEnd="url(#arrowRun)"
          />

          {/* Render Active Player Tokens */}
          {players.map((p) => {
            const isHome = p.team === 'home';
            const isSelected = selectedPlayer?.id === p.id;

            return (
              <G
                key={p.id}
                onPress={() => setSelectedPlayer(p)}
              >
                {/* Glow ring if selected */}
                {isSelected && (
                  <Circle
                    cx={p.x}
                    cy={p.y}
                    r={5.2}
                    fill="none"
                    stroke="#C5A059"
                    strokeWidth="1"
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

      {/* 4. Playback & Animated Sequence Controls */}
      <View style={styles.playbackControls}>
        <View style={styles.phasePills}>
          <TouchableOpacity
            style={[styles.phasePill, activePhase === 1 && styles.phasePillActive]}
            onPress={() => setActivePhase(1)}
          >
            <Text style={[styles.phasePillText, activePhase === 1 && styles.phasePillTextActive]}>Phase 1 : Relance</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.phasePill, activePhase === 2 && styles.phasePillActive]}
            onPress={() => setActivePhase(2)}
          >
            <Text style={[styles.phasePillText, activePhase === 2 && styles.phasePillTextActive]}>Phase 2 : Progression</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.phasePill, activePhase === 3 && styles.phasePillActive]}
            onPress={() => setActivePhase(3)}
          >
            <Text style={[styles.phasePillText, activePhase === 3 && styles.phasePillTextActive]}>Phase 3 : Finition</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.playbackBtnRow}>
          <TouchableOpacity
            style={styles.playbackBtn}
            onPress={() => setActivePhase(1)}
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
            onPress={() => setActivePhase((p) => ((p % 3) + 1) as 1 | 2 | 3)}
          >
            <MaterialCommunityIcons name="skip-forward" size={20} color="#8B8B9A" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.syncSquadBtn}
            onPress={() => alert('Schéma synchronisé en direct avec les vestiaires !')}
          >
            <MaterialCommunityIcons name="broadcast" size={16} color="#C5A059" />
            <Text style={styles.syncSquadText}>Diffuser aux Vestiaires</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 5. Selected Player Details or Set-Piece Blueprint Card */}
      {boardMode === 'cpa' ? (
        <View style={styles.cpaBlueprintCard}>
          <View style={styles.cpaBlueprintHeader}>
            <MaterialCommunityIcons name="target" size={18} color="#C5A059" />
            <Text style={styles.cpaBlueprintTitle}>Protocole CPA : Corner Sortant 1er Poteau</Text>
          </View>
          <Text style={styles.cpaBlueprintBody}>
            • Tireur : Rayan K. (Pied droit, rentrant brossé).{'\n'}
            • Déviation 1er poteau : Yanis B. (Course coupée à 9m).{'\n'}
            • Finition 2nd poteau : Axel P. (Attaque de l’angle mort).{'\n'}
            • Sécurité transition adverse : 2 défenseurs en couverture ligne médiane.
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
            <TouchableOpacity style={styles.roleActionBtn}>
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
  toolbar: {
    flexDirection: 'row',
    backgroundColor: '#141418',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: 6,
    marginBottom: 10,
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
