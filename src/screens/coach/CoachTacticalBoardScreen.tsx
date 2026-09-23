import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  type GestureResponderEvent,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Svg, {
  Circle,
  G,
  Line,
  Marker,
  Path,
  Polygon,
  Text as SvgText,
} from 'react-native-svg';

import { CoachPitchSurface } from '../../components/coach/CoachPitchSurface';
import { PressableSpring } from '../../components/motion/PressableSpring';
import { AppBackButton } from '../../components/ui/AppBackButton';
import { coachChipContainerStyle } from '../../utils/coachChipUi';
import { COACH_PITCH } from '../../features/coach/theme/coachPitchTokens';
import { coachLayout } from '../../features/coach/theme/coachDesignSystem';
import {
  useCoachTheme,
  useCoachThemedStyles,
} from '../../features/coach/shell/CoachThemeContext';
import {
  proCard,
  proForm,
  proRadius,
  proSemantic,
  proSpace,
  proType,
} from '../../theme/professionalDesign';
import {
  ALL_FORMATION_COORDINATES,
  MATCH_FORMATS_CONFIG,
  type MatchFormatKey,
} from '../../constants/tacticalMatrix';
import {
  TACTICAL_BOARD_BOUNDS,
  TACTICAL_BOARD_STORAGE_KEY,
  normalizeTacticalBoardState,
  type TacticalBoardMode,
  type TacticalBoardTool,
  type TacticalCone,
  type TacticalPhase,
  type TacticalPlayer,
  type TacticalVector,
} from '../../utils/coachTacticalBoard';

export type TacticalFormat = MatchFormatKey;
type SetPieceType = 'corner_off' | 'corner_def' | 'freekick_direct';

/** Repère normalisé du terrain : 0-100 en largeur, 0-135 en hauteur. */
const PITCH_VIEWBOX = { width: TACTICAL_BOARD_BOUNDS.maxX, height: TACTICAL_BOARD_BOUNDS.maxY };
/** Même largeur maximale que le terrain de composition — un seul gabarit de pelouse. */
const MAX_PITCH_WIDTH = 520;
const TOKEN_RADIUS = 4.2;
/** Cible tactile du jeton : bien plus large que le disque dessiné. */
const TOKEN_HIT_RADIUS = 7.5;
const NUMBER_FONT_SIZE = 3.2;
/** Deux crans voisins ne se recouvrent jamais : 11 caractères ≈ 15 unités sur 100. */
const NAME_FONT_SIZE = 2.5;

const FORMAT_CHIPS: { key: TacticalFormat; label: string }[] = [
  { key: '11v11', label: 'Foot à 11' },
  { key: '8v8', label: 'Foot à 8' },
  { key: '5v5', label: 'Foot à 5' },
  { key: 'futsal', label: 'Futsal' },
  { key: '4v4', label: 'Animation 4v4' },
  { key: '3v3', label: 'Animation 3v3' },
];

const TOOL_CHIPS: { id: TacticalBoardTool; icon: string; label: string }[] = [
  { id: 'select', icon: 'cursor-default', label: 'Sélecteur' },
  { id: 'pass', icon: 'vector-line', label: 'Passe' },
  { id: 'run', icon: 'ray-start-arrow', label: 'Course' },
  { id: 'cone', icon: 'cone', label: 'Plots' },
];

const PHASE_CHIPS: { id: TacticalPhase; label: string }[] = [
  { id: 1, label: 'Relance' },
  { id: 2, label: 'Progression' },
  { id: 3, label: 'Finition' },
];

const SET_PIECE_CHIPS: { id: SetPieceType; label: string }[] = [
  { id: 'corner_off', label: 'Corner offensif' },
  { id: 'corner_def', label: 'Corner défensif' },
  { id: 'freekick_direct', label: 'Coup franc direct' },
];

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

    // Adversaires — repères de placement, jamais des joueurs réels.
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

    { id: 'a9', num: 9, name: 'Adv 9', x: 50, y: 74, team: 'away', role: 'PIV' },
    { id: 'a4', num: 4, name: 'Adv 4', x: 50, y: 22, team: 'away', role: 'FIX' },
  ],
  futsal: [
    { id: 'h1', num: 1, name: 'Hugo L.', x: 50, y: 120, team: 'home', role: 'GB' },
    { id: 'h3', num: 4, name: 'Axel P.', x: 50, y: 92, team: 'home', role: 'FIX' },
    { id: 'h8', num: 10, name: 'Rayan K.', x: 24, y: 64, team: 'home', role: 'AL' },
    { id: 'h9', num: 7, name: 'Lucas M.', x: 76, y: 64, team: 'home', role: 'AD' },
    { id: 'h10', num: 9, name: 'Yanis B.', x: 50, y: 32, team: 'home', role: 'PIV' },

    { id: 'a9', num: 9, name: 'Adv 9', x: 50, y: 74, team: 'away', role: 'PIV' },
    { id: 'a4', num: 4, name: 'Adv 4', x: 50, y: 22, team: 'away', role: 'FIX' },
  ],
  '4v4': [
    { id: 'h1', num: 1, name: 'Hugo L.', x: 50, y: 120, team: 'home', role: 'GB' },
    { id: 'h3', num: 4, name: 'Axel P.', x: 50, y: 88, team: 'home', role: 'DEF' },
    { id: 'h8', num: 10, name: 'Rayan K.', x: 30, y: 40, team: 'home', role: 'ATT' },
    { id: 'h10', num: 9, name: 'Yanis B.', x: 70, y: 40, team: 'home', role: 'ATT' },

    { id: 'a9', num: 9, name: 'Adv 9', x: 50, y: 68, team: 'away', role: 'ATT' },
    { id: 'a4', num: 4, name: 'Adv 4', x: 50, y: 24, team: 'away', role: 'DEF' },
  ],
  '3v3': [
    { id: 'h1', num: 1, name: 'Hugo L.', x: 50, y: 110, team: 'home', role: 'DEF' },
    { id: 'h8', num: 10, name: 'Rayan K.', x: 30, y: 40, team: 'home', role: 'ATT' },
    { id: 'h10', num: 9, name: 'Yanis B.', x: 70, y: 40, team: 'home', role: 'ATT' },

    { id: 'a9', num: 9, name: 'Adv 9', x: 50, y: 68, team: 'away', role: 'ATT' },
    { id: 'a4', num: 4, name: 'Adv 4', x: 50, y: 24, team: 'away', role: 'DEF' },
  ],
};

/** Ré-export : la clé vit avec le modèle (`utils/coachTacticalBoard`). */
export { TACTICAL_BOARD_STORAGE_KEY };

/** Libellé court du jeton : les initiales de civilité ne prennent pas la place du nom. */
function playerShortName(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const significant = parts.filter((part) => part.replace(/\./g, '').length > 1);
  const label = significant[significant.length - 1] ?? parts[0] ?? '';
  return label.length > 11 ? `${label.slice(0, 10)}…` : label;
}

function formatClock(iso: string | null): string | null {
  if (!iso) return null;
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return null;
  const pad = (value: number) => String(value).padStart(2, '0');
  return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Tableau tactique — **tableau plat et laboratoire CPA**, rien d'autre.
 *
 * Ce qui a été retiré : le mode « 3D isométrique » (une rotation `rotateX` qui
 * ne changeait pas les coordonnées, seulement la lisibilité), le décor de stade
 * (dégradés empilés, damier de tontes à fort contraste, zone de pressing
 * dessinée en dur et non pilotée par un état) et les confirmations inventées
 * (« diffusé aux vestiaires » alors que rien n'était diffusé).
 *
 * Ce qui reste : le tracé, les jetons, les vecteurs, les plots et les séquences.
 * Toutes les couleurs viennent des jetons du socle professionnel partagé
 * (`professionalDesign` + `coachPitchTokens`), et la pelouse est dessinée par
 * `CoachPitchSurface` — **le même composant que le terrain de composition**.
 */
export const CoachTacticalBoardScreen: React.FC = () => {
  const { width: windowWidth } = useWindowDimensions();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const wide = windowWidth >= 900;

  const [selectedFormat, setSelectedFormat] = useState<TacticalFormat>('11v11');
  const [boardMode, setBoardMode] = useState<TacticalBoardMode>('2d');
  const [selectedTool, setSelectedTool] = useState<TacticalBoardTool>('select');
  const [activeSetPiece, setActiveSetPiece] = useState<SetPieceType>('corner_off');
  const [players, setPlayers] = useState<TacticalPlayer[]>(INITIAL_PLAYERS_BY_FORMAT['11v11']);
  const [vectors, setVectors] = useState<TacticalVector[]>([
    { id: 'v1', fromX: 50, fromY: 80, toX: 82, toY: 40, type: 'pass', phase: 1 },
    { id: 'v2', fromX: 82, fromY: 40, toX: 50, toY: 30, type: 'run', phase: 2 },
  ]);
  const [cones, setCones] = useState<TacticalCone[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activePhase, setActivePhase] = useState<TacticalPhase>(1);
  const [selectedPlayer, setSelectedPlayer] = useState<TacticalPlayer | null>(null);
  const [activeFormation, setActiveFormation] = useState<string>('4-3-3');
  const [isHydrated, setIsHydrated] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);

  // Reprise du schéma enregistré — normalisée, jamais réinjectée telle quelle.
  useEffect(() => {
    let isMounted = true;
    const hydrateTacticalBoard = async () => {
      try {
        const raw = await AsyncStorage.getItem(TACTICAL_BOARD_STORAGE_KEY);
        if (raw && isMounted) {
          const restored = normalizeTacticalBoardState(JSON.parse(raw));
          if (restored.selectedFormat) setSelectedFormat(restored.selectedFormat);
          if (restored.boardMode) setBoardMode(restored.boardMode);
          if (restored.activeFormation) setActiveFormation(restored.activeFormation);
          if (restored.players?.length) setPlayers(restored.players);
          if (restored.vectors) setVectors(restored.vectors);
          if (restored.cones) setCones(restored.cones);
        }
      } catch {
        // Schéma illisible : on repart du repère par défaut, sans écraser le reste.
      } finally {
        if (isMounted) setIsHydrated(true);
      }
    };
    void hydrateTacticalBoard();
    return () => {
      isMounted = false;
    };
  }, []);

  // Enregistrement automatique : le schéma survit à la fermeture de l'écran.
  useEffect(() => {
    if (!isHydrated) return;
    const stamp = new Date().toISOString();
    const persistTacticalBoard = async () => {
      try {
        await AsyncStorage.setItem(
          TACTICAL_BOARD_STORAGE_KEY,
          JSON.stringify({
            selectedFormat,
            boardMode,
            activeFormation,
            players,
            vectors,
            cones,
            savedAt: stamp,
          }),
        );
        setSavedAt(stamp);
      } catch {
        // Écriture impossible : l'écran reste utilisable, sans fausse confirmation.
      }
    };
    void persistTacticalBoard();
  }, [isHydrated, selectedFormat, boardMode, activeFormation, players, vectors, cones]);

  const isFutsal = MATCH_FORMATS_CONFIG[selectedFormat]?.isFutsal === true;
  const isCpa = boardMode === 'cpa';
  const pitchWidth = Math.min(
    Math.max(240, windowWidth - coachLayout.pageGutter * 2),
    MAX_PITCH_WIDTH,
  );
  const pitchHeight = Math.round((pitchWidth * PITCH_VIEWBOX.height) / PITCH_VIEWBOX.width);
  const savedClock = formatClock(savedAt);

  const triggerHaptic = () => {
    try {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } catch {
      // Retour haptique indisponible sur cet appareil.
    }
  };

  const handleFormatChange = (format: TacticalFormat) => {
    triggerHaptic();
    setSelectedFormat(format);
    setPlayers(INITIAL_PLAYERS_BY_FORMAT[format]);
    setSelectedPlayer(null);
    setVectors([]);
    setCones([]);
    setActiveFormation(MATCH_FORMATS_CONFIG[format]?.defaultFormation ?? '4-3-3');
  };

  const handleFormationSelect = (formationKey: string) => {
    triggerHaptic();
    setActiveFormation(formationKey);
    const slots = ALL_FORMATION_COORDINATES[formationKey];
    if (!slots) return;
    setPlayers((previous) => {
      const home = previous.filter((player) => player.team === 'home');
      const away = previous.filter((player) => player.team === 'away');
      const repositioned = home.map((player, index) => {
        const slot = slots[index];
        if (!slot) return player;
        return {
          ...player,
          x: Math.round(slot.x * TACTICAL_BOARD_BOUNDS.maxX),
          y: Math.round(slot.y * TACTICAL_BOARD_BOUNDS.maxY),
          role: slot.defaultPos,
        };
      });
      return [...repositioned, ...away];
    });
    setVectors([]);
    setSelectedPlayer(null);
  };

  const handleResetBoard = () => {
    triggerHaptic();
    setPlayers(INITIAL_PLAYERS_BY_FORMAT[selectedFormat]);
    setSelectedPlayer(null);
    setVectors([]);
    setCones([]);
    setSavedAt(null);
    void AsyncStorage.removeItem(TACTICAL_BOARD_STORAGE_KEY).catch(() => {});
  };

  const toggleAnimation = useCallback(() => {
    triggerHaptic();
    setIsPlaying((playing) => !playing);
  }, []);

  /**
   * Lecture de la séquence : trois temps, trois passes de tracés. Le bouton fait
   * donc ce qu'il annonce — la phase active avance d'elle-même.
   */
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setActivePhase((current) => (((current % 3) + 1) as TacticalPhase));
    }, 2400);
    return () => clearInterval(timer);
  }, [isPlaying]);

  const handlePitchTouch = (event: GestureResponderEvent) => {
    const { locationX, locationY } = event.nativeEvent;
    const maxX = TACTICAL_BOARD_BOUNDS.maxX;
    const maxY = TACTICAL_BOARD_BOUNDS.maxY;
    const normX = Math.round(Math.max(6, Math.min(maxX - 6, (locationX / pitchWidth) * maxX)));
    const normY = Math.round(Math.max(6, Math.min(maxY - 6, (locationY / pitchHeight) * maxY)));

    if (selectedTool === 'select') {
      if (!selectedPlayer) return;
      triggerHaptic();
      setPlayers((previous) =>
        previous.map((player) =>
          player.id === selectedPlayer.id ? { ...player, x: normX, y: normY } : player,
        ),
      );
      setSelectedPlayer((current) => (current ? { ...current, x: normX, y: normY } : null));
      return;
    }

    if (selectedTool === 'cone') {
      triggerHaptic();
      setCones((previous) => [...previous, { id: `${Date.now()}`, x: normX, y: normY }]);
      return;
    }

    if (!selectedPlayer) return;
    triggerHaptic();
    const type = selectedTool === 'pass' ? 'pass' : 'run';
    setVectors((previous) => [
      ...previous,
      {
        id: `${Date.now()}`,
        fromX: selectedPlayer.x,
        fromY: selectedPlayer.y,
        toX: normX,
        toY: normY,
        type,
        /** Le tracé appartient à la phase affichée au moment où on le dessine. */
        phase: activePhase,
      },
    ]);
  };

  /** Couleurs du schéma — un seul jeu, dérivé des jetons partagés. */
  const board = useMemo(
    () => ({
      homeFill: tokens.accent,
      homeText: tokens.onAccent,
      awayFill: tokens.elevated,
      awayStroke: tokens.muted,
      awayText: tokens.foreground,
      selection: tokens.foreground,
      pass: tokens.foreground,
      run: tokens.accent,
      cone: proSemantic.warning,
      coneStroke: tokens.foreground,
      marker: tokens.onAccent,
    }),
    [tokens],
  );

  const formationKeys = MATCH_FORMATS_CONFIG[selectedFormat]?.formations ?? [];
  const hint = selectedPlayer
    ? `#${selectedPlayer.num} ${selectedPlayer.name} sélectionné — touchez le terrain pour le déplacer, ou tracez avec un outil.`
    : 'Touchez un joueur pour le sélectionner. Les outils tracent ensuite passes, courses et plots.';

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: tokens.bg }]}
      contentContainerStyle={[styles.content, wide && styles.contentWide]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.header}>
        <AppBackButton fallbackNavId="plus" style={{ marginBottom: 10 }} />
        <Text style={styles.kicker}>Tableau tactique</Text>
        <Text style={styles.title}>{MATCH_FORMATS_CONFIG[selectedFormat]?.name ?? 'Foot à 11'}</Text>
        <Text style={styles.subtitle}>
          {isFutsal ? 'Salle · secteur des 6 m' : 'Pelouse · surfaces et rond central'}
        </Text>

        <View style={styles.modeRow}>
          {(
            [
              { id: '2d' as TacticalBoardMode, label: 'Tableau' },
              { id: 'cpa' as TacticalBoardMode, label: 'Coups de pied arrêtés' },
            ] as const
          ).map((mode) => {
            const active = boardMode === mode.id;
            return (
              <PressableSpring
                key={mode.id}
                onPress={() => {
                  triggerHaptic();
                  setBoardMode(mode.id);
                }}
                scaleTo={0.97}
                accessibilityRole="button"
                accessibilityState={{ selected: active }}
                style={[styles.modeChip, coachChipContainerStyle(active, tokens)]}
              >
                <Text style={[styles.chipText, active ? styles.chipTextOn : styles.chipTextOff]}>
                  {mode.label}
                </Text>
              </PressableSpring>
            );
          })}
        </View>
      </View>

      {/* Un seul encart de réglages : format puis système, deux rangées. */}
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <Text style={styles.rowLabel}>Format</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rowScroll}
            contentContainerStyle={styles.chips}
          >
            {FORMAT_CHIPS.map((chip) => {
              const active = selectedFormat === chip.key;
              return (
                <PressableSpring
                  key={chip.key}
                  onPress={() => handleFormatChange(chip.key)}
                  scaleTo={0.97}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={coachChipContainerStyle(active, tokens)}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextOn : styles.chipTextOff]}>
                    {chip.label}
                  </Text>
                </PressableSpring>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.settingRow}>
          <Text style={styles.rowLabel}>Système</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rowScroll}
            contentContainerStyle={styles.chips}
          >
            {formationKeys.map((key) => {
              const active = activeFormation === key;
              return (
                <PressableSpring
                  key={key}
                  onPress={() => handleFormationSelect(key)}
                  scaleTo={0.97}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={coachChipContainerStyle(active, tokens)}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextOn : styles.chipTextOff]}>
                    {key}
                  </Text>
                </PressableSpring>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* Outils : une seule rangée, hors pelouse. */}
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <Text style={styles.rowLabel}>Outils</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rowScroll}
            contentContainerStyle={styles.chips}
          >
            {TOOL_CHIPS.map((tool) => {
              const active = selectedTool === tool.id;
              return (
                <PressableSpring
                  key={tool.id}
                  onPress={() => {
                    triggerHaptic();
                    setSelectedTool(tool.id);
                  }}
                  scaleTo={0.97}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={[styles.toolChip, coachChipContainerStyle(active, tokens)]}
                >
                  <MaterialCommunityIcons
                    name={tool.icon as never}
                    size={16}
                    color={active ? tokens.accent : tokens.muted}
                  />
                  <Text style={[styles.chipText, active ? styles.chipTextOn : styles.chipTextOff]}>
                    {tool.label}
                  </Text>
                </PressableSpring>
              );
            })}
          </ScrollView>
          <PressableSpring
            onPress={handleResetBoard}
            scaleTo={0.97}
            accessibilityRole="button"
            accessibilityLabel="Réinitialiser le schéma"
            style={styles.resetBtn}
          >
            <MaterialCommunityIcons name="restore" size={16} color={tokens.muted} />
            <Text style={styles.resetText}>Réinit.</Text>
          </PressableSpring>
        </View>
      </View>

      {isCpa ? (
        <View style={styles.card}>
          <Text style={styles.rowLabel}>Coup de pied arrêté</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.rowScroll}
            contentContainerStyle={styles.chips}
          >
            {SET_PIECE_CHIPS.map((piece) => {
              const active = activeSetPiece === piece.id;
              return (
                <PressableSpring
                  key={piece.id}
                  onPress={() => {
                    triggerHaptic();
                    setActiveSetPiece(piece.id);
                  }}
                  scaleTo={0.97}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={coachChipContainerStyle(active, tokens)}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextOn : styles.chipTextOff]}>
                    {piece.label}
                  </Text>
                </PressableSpring>
              );
            })}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.hint}>
        <MaterialCommunityIcons name="information-outline" size={15} color={tokens.accent} />
        <Text style={styles.hintText}>{hint}</Text>
      </View>

      {/* Le terrain : le tracé vient de CoachPitchSurface, le même que la composition. */}
      <View
        style={[
          styles.pitchFrame,
          { width: pitchWidth, height: pitchHeight, borderColor: tokens.border },
        ]}
        onTouchEnd={handlePitchTouch}
      >
        <Svg
          width="100%"
          height="100%"
          viewBox={`0 0 ${PITCH_VIEWBOX.width} ${PITCH_VIEWBOX.height}`}
        >
          <CoachPitchSurface
            width={PITCH_VIEWBOX.width}
            height={PITCH_VIEWBOX.height}
            isFutsal={isFutsal}
            strokeWidth={0.45}
            gradientId="coachBoardTurf"
          />

          <Marker id="boardArrowPass" viewBox="0 0 10 10" refX={6} refY={5} markerWidth={6} markerHeight={6} orient="auto">
            <Path d="M 0 2 L 8 5 L 0 8 z" fill={board.pass} />
          </Marker>
          <Marker id="boardArrowRun" viewBox="0 0 10 10" refX={6} refY={5} markerWidth={6} markerHeight={6} orient="auto">
            <Path d="M 0 2 L 8 5 L 0 8 z" fill={board.run} />
          </Marker>

          {/* Vecteurs : la passe est pointillée, la course est pleine ; les tracés
              des autres phases restent visibles, mais s'effacent. */}
          {vectors.map((vector) => (
            <Line
              key={vector.id}
              x1={vector.fromX}
              y1={vector.fromY}
              x2={vector.toX}
              y2={vector.toY}
              stroke={vector.type === 'pass' ? board.pass : board.run}
              strokeWidth="0.9"
              strokeDasharray={vector.type === 'pass' ? '2.5,1.5' : undefined}
              markerEnd={vector.type === 'pass' ? 'url(#boardArrowPass)' : 'url(#boardArrowRun)'}
              opacity={vector.phase === activePhase ? 1 : 0.25}
            />
          ))}

          {cones.map((cone) => (
            <Polygon
              key={cone.id}
              points={`${cone.x},${cone.y - 2.2} ${cone.x - 1.9},${cone.y + 1.9} ${
                cone.x + 1.9
              },${cone.y + 1.9}`}
              fill={board.cone}
              stroke={board.coneStroke}
              strokeWidth="0.3"
            />
          ))}

          {players.map((player) => {
            const isHome = player.team === 'home';
            const isSelected = selectedPlayer?.id === player.id;
            return (
              <G
                key={player.id}
                onPress={() => {
                  triggerHaptic();
                  setSelectedPlayer(isSelected ? null : player);
                }}
              >
                {/* Cible tactile large : le disque dessiné reste fin. */}
                <Circle
                  cx={player.x}
                  cy={player.y}
                  r={TOKEN_HIT_RADIUS}
                  fill="transparent"
                />
                {isSelected ? (
                  <Circle
                    cx={player.x}
                    cy={player.y}
                    r={TOKEN_RADIUS + 1.6}
                    fill="none"
                    stroke={board.selection}
                    strokeWidth="0.7"
                  />
                ) : null}
                <Circle
                  cx={player.x}
                  cy={player.y}
                  r={TOKEN_RADIUS}
                  fill={isHome ? board.homeFill : board.awayFill}
                  stroke={isHome ? board.homeFill : board.awayStroke}
                  strokeWidth="0.6"
                />
                <SvgText
                  x={player.x}
                  y={player.y + 1.2}
                  fill={isHome ? board.homeText : board.awayText}
                  fontSize={NUMBER_FONT_SIZE}
                  fontWeight="700"
                  textAnchor="middle"
                >
                  {player.num}
                </SvgText>
                {/* Pas de libellé côté adversaire : le numéro suffit, le nom est inconnu. */}
                {isHome ? (
                  <SvgText
                    x={player.x}
                    y={player.y + TOKEN_RADIUS + 2.8}
                    fill={board.marker}
                    fontSize={NAME_FONT_SIZE}
                    fontWeight="600"
                    textAnchor="middle"
                  >
                    {playerShortName(player.name)}
                  </SvgText>
                ) : null}
              </G>
            );
          })}
        </Svg>
      </View>

      {/* Séquences : lecture simple, aucune promesse de diffusion. */}
      <View style={styles.card}>
        <View style={styles.settingRow}>
          <Text style={styles.rowLabel}>Séquence</Text>
          <View style={styles.chips}>
            {PHASE_CHIPS.map((phase) => {
              const active = activePhase === phase.id;
              return (
                <PressableSpring
                  key={phase.id}
                  onPress={() => {
                    triggerHaptic();
                    setActivePhase(phase.id);
                  }}
                  scaleTo={0.97}
                  accessibilityRole="button"
                  accessibilityState={{ selected: active }}
                  style={coachChipContainerStyle(active, tokens)}
                >
                  <Text style={[styles.chipText, active ? styles.chipTextOn : styles.chipTextOff]}>
                    {phase.label}
                  </Text>
                </PressableSpring>
              );
            })}
          </View>
        </View>

        <View style={styles.transport}>
          <PressableSpring
            onPress={() => {
              triggerHaptic();
              setActivePhase(1);
            }}
            scaleTo={0.94}
            accessibilityRole="button"
            accessibilityLabel="Revenir à la première phase"
            style={styles.transportBtn}
          >
            <MaterialCommunityIcons name="skip-backward" size={20} color={tokens.muted} />
          </PressableSpring>

          <PressableSpring
            onPress={toggleAnimation}
            scaleTo={0.94}
            haptic
            accessibilityRole="button"
            accessibilityLabel={isPlaying ? 'Mettre en pause' : 'Lire la séquence'}
            style={[styles.transportBtn, styles.transportBtnPrimary]}
          >
            <MaterialCommunityIcons
              name={isPlaying ? 'pause' : 'play'}
              size={20}
              color={tokens.onAccent}
            />
          </PressableSpring>

          <PressableSpring
            onPress={() => {
              triggerHaptic();
              setActivePhase((current) => (((current % 3) + 1) as TacticalPhase));
            }}
            scaleTo={0.94}
            accessibilityRole="button"
            accessibilityLabel="Phase suivante"
            style={styles.transportBtn}
          >
            <MaterialCommunityIcons name="skip-forward" size={20} color={tokens.muted} />
          </PressableSpring>

          <Text style={styles.savedText}>
            {savedClock ? `Schéma enregistré sur cet appareil · ${savedClock}` : 'Schéma non enregistré'}
          </Text>
        </View>
        <Text style={styles.cardMeta}>
          Les tracés sont rangés par phase : la lecture met en avant la phase affichée.
        </Text>
      </View>

      {/* Détail : fiche du joueur sélectionné, ou rappel du protocole CPA. */}
      {isCpa ? (
        <View style={styles.card}>
          <Text style={styles.kicker}>Rappel de protocole</Text>
          <Text style={styles.cardTitle}>
            {isFutsal
              ? 'Rentrée de touche / coup franc — bloc futsal'
              : 'Corner sortant — premier poteau'}
          </Text>
          <Text style={styles.protocol}>
            {isFutsal
              ? '• Rentrée de touche dans les quatre secondes.\n• Bloc écran du pivot pour libérer la frappe rasante de l’ailier opposé.\n• Couverture défensive assurée par le fixe en retrait.'
              : '• Tireur pied droit, ballon brossé rentrant.\n• Déviation au premier poteau par un joueur à la course coupée.\n• Finition au second poteau, dans l’angle mort.\n• Deux défenseurs en couverture sur la ligne médiane.'}
          </Text>
          <Text style={styles.cardMeta}>
            Repères de travail, à réassigner aux joueurs du match.
          </Text>
        </View>
      ) : selectedPlayer ? (
        <View style={styles.card}>
          <View style={styles.focusHead}>
            <View style={styles.numBadge}>
              <Text style={styles.numBadgeText}>{selectedPlayer.num}</Text>
            </View>
            <View style={styles.focusText}>
              <Text style={styles.cardTitle}>{selectedPlayer.name}</Text>
              <Text style={styles.cardMeta}>
                {selectedPlayer.team === 'home' ? 'Notre équipe' : 'Adversaire'} · rôle{' '}
                {selectedPlayer.role}
              </Text>
            </View>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
};

function createStyles(tokens: ReturnType<typeof useCoachTheme>['tokens']) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: {
      paddingHorizontal: coachLayout.pageGutter,
      paddingTop: coachLayout.contentTop,
      paddingBottom: coachLayout.dockClearance,
      gap: proSpace.lg,
    },
    contentWide: { maxWidth: 720, width: '100%', alignSelf: 'center' },
    header: { gap: 2 },
    kicker: { ...proType.label, color: tokens.muted },
    title: { ...proType.h2, color: tokens.foreground },
    subtitle: { ...proType.caption, color: tokens.muted },
    modeRow: { flexDirection: 'row', gap: proForm.chipGap, marginTop: proSpace.md },
    modeChip: { flex: 1 },
    card: { ...proCard(tokens), padding: proSpace.lg, gap: proSpace.md },
    settingRow: { flexDirection: 'row', alignItems: 'center', gap: proSpace.md },
    rowLabel: { ...proType.label, color: tokens.muted, minWidth: 74 },
    rowScroll: { flexGrow: 0, flexShrink: 1 },
    chips: { flexDirection: 'row', alignItems: 'center', gap: proForm.chipGap },
    chipText: { ...proType.caption, fontWeight: '700' },
    chipTextOn: { color: tokens.accent },
    chipTextOff: { color: tokens.muted },
    toolChip: { flexDirection: 'row', gap: proSpace.xs },
    resetBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.xs,
      minHeight: proForm.chipHeight,
      paddingHorizontal: proSpace.md,
      borderRadius: proForm.chipRadius,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    resetText: { ...proType.caption, color: tokens.muted, fontWeight: '600' },
    hint: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: proSpace.sm,
      borderRadius: proRadius.md,
      borderWidth: 1,
      borderColor: tokens.border,
      backgroundColor: tokens.surface,
      paddingHorizontal: proSpace.md,
      paddingVertical: proSpace.sm,
    },
    hintText: { ...proType.caption, color: tokens.muted, flex: 1 },
    pitchFrame: {
      alignSelf: 'center',
      borderRadius: proRadius.lg,
      borderWidth: 1,
      overflow: 'hidden',
      backgroundColor: COACH_PITCH.canvas,
    },
    transport: { flexDirection: 'row', alignItems: 'center', gap: proSpace.sm },
    transportBtn: {
      width: proForm.chipHeight,
      height: proForm.chipHeight,
      borderRadius: proRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    transportBtnPrimary: { backgroundColor: tokens.accent, borderColor: tokens.accent },
    savedText: { ...proType.caption, color: tokens.muted, flex: 1, textAlign: 'right' },
    focusHead: { flexDirection: 'row', alignItems: 'center', gap: proSpace.md },
    focusText: { flex: 1, minWidth: 0 },
    numBadge: {
      width: 36,
      height: 36,
      borderRadius: proRadius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.accent,
    },
    numBadgeText: { ...proType.caption, color: tokens.onAccent, fontWeight: '800' },
    cardTitle: { ...proType.body, color: tokens.foreground, fontWeight: '700' },
    cardMeta: { ...proType.caption, color: tokens.muted },
    protocol: { ...proType.caption, color: tokens.foreground, lineHeight: 19 },
  });
}
