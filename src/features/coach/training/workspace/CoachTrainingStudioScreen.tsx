import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  Alert,
  PanResponder,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useCoachTheme } from '../../shell/CoachThemeContext';
import {
  type Camera3DPreset,
  type DrawingObject,
  type DrawingType,
  type Drill,
  type DrillFrame,
  type EquipmentToken,
  type EquipmentType,
  type PitchConfiguration,
  type PlayerToken,
  type TeamSide,
  type ViewMode,
  EQUIPMENT_PRESETS,
  PITCH_CONFIGURATIONS,
  clampPoint,
  generateTokenId,
  createEmptyDrill,
} from './trainingWorkspaceModel';
import { CoachPitchEngine } from './CoachPitchEngine';
import { CoachContextualInspector } from './CoachContextualInspector';
import { CoachWorkspaceHelpModal } from './CoachWorkspaceHelpModal';
import { CoachAiSessionWizardModal } from './CoachAiSessionWizardModal';
import { CoachDrillLibraryModal } from './CoachDrillLibraryModal';
import {
  createNextFrame,
  sampleDrillAtTime,
  calculateDrillTotalDurationMs,
} from './CoachDrillAnimationEngine';
import {
  saveDrillToWorkspace,
  autoSaveWorkspaceDrill,
} from './trainingPersistenceService';
import { PRELOADED_DRILLS } from './trainingLibraryData';
import {
  supportsOrientationLock,
  FULLSCREEN_ORIENTATION_LOCK,
  PORTRAIT_ORIENTATION_LOCK,
} from '../../../video/videoOrientation';
import { prodayHaptics } from '../../../../utils/prodayHaptics';

interface PaletteTokenButtonProps {
  onTap: () => void;
  onLongPress?: () => void;
  onDrop: (normX: number, normY: number) => void;
  accessibilityLabel: string;
  tokenInfo: {
    kind: 'player' | 'equipment';
    label?: string;
    team?: TeamSide;
    type?: EquipmentType;
    color?: string;
    num?: number;
    icon?: React.ReactNode;
  };
  pitchBounds: { left: number; top: number; width: number; height: number };
  onDragStateChange: (drag: { active: boolean; x: number; y: number; info?: any } | null) => void;
  isActiveStamp?: boolean;
  children: React.ReactNode;
  style?: any;
}

const PaletteTokenButton: React.FC<PaletteTokenButtonProps> = ({
  onTap,
  onLongPress,
  onDrop,
  accessibilityLabel,
  tokenInfo,
  pitchBounds,
  onDragStateChange,
  isActiveStamp,
  children,
  style,
}) => {
  const panResponder = useMemo(() => {
    let isDragging = false;
    let isLongPress = false;
    let timer: any = null;

    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.hypot(gestureState.dx, gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        isDragging = false;
        isLongPress = false;
        timer = setTimeout(() => {
          isLongPress = true;
          onLongPress?.();
          prodayHaptics.confirm();
        }, 380);
      },
      onPanResponderMove: (_, gestureState) => {
        if (Math.hypot(gestureState.dx, gestureState.dy) > 5) {
          if (timer) clearTimeout(timer);
          if (!isDragging) {
            isDragging = true;
            prodayHaptics.press();
          }
          onDragStateChange({
            active: true,
            x: gestureState.moveX,
            y: gestureState.moveY,
            info: tokenInfo,
          });
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (timer) clearTimeout(timer);
        if (isDragging) {
          onDragStateChange(null);
          const { moveX, moveY } = gestureState;
          if (
            pitchBounds.width > 0 &&
            moveX >= pitchBounds.left &&
            moveX <= pitchBounds.left + pitchBounds.width &&
            moveY >= pitchBounds.top &&
            moveY <= pitchBounds.top + pitchBounds.height
          ) {
            const normX = Math.round(
              Math.max(2, Math.min(98, ((moveX - pitchBounds.left) / pitchBounds.width) * 100)),
            );
            const normY = Math.round(
              Math.max(2, Math.min(62, ((moveY - pitchBounds.top) / pitchBounds.height) * 64)),
            );
            onDrop(normX, normY);
            prodayHaptics.confirm();
          }
        } else if (!isLongPress) {
          onTap();
          prodayHaptics.press();
        }
        isDragging = false;
        isLongPress = false;
      },
      onPanResponderTerminate: () => {
        if (timer) clearTimeout(timer);
        isDragging = false;
        isLongPress = false;
        onDragStateChange(null);
      },
    });
  }, [onTap, onLongPress, onDrop, pitchBounds, tokenInfo, onDragStateChange]);

  return (
    <View
      {...panResponder.panHandlers}
      style={[style, isActiveStamp && styles.toolCircleStampActive]}
      accessibilityLabel={accessibilityLabel}
    >
      {children}
    </View>
  );
};

interface CoachTrainingStudioScreenProps {
  initialDrill?: Drill | null;
  onBack?: () => void;
  onSave?: (savedDrill: Drill) => void;
}

export const CoachTrainingStudioScreen: React.FC<CoachTrainingStudioScreenProps> = ({
  initialDrill,
  onBack,
  onSave,
}) => {
  const { tokens } = useCoachTheme();
  const { width: winWidth, height: winHeight } = useWindowDimensions();
  const isLandscape = winWidth >= winHeight;
  const isDesktop = winWidth >= 900;
  const isMobile = !isDesktop;

  // Verrouillage de l'orientation en mode Paysage sur mobile (ex: tactical-slate)
  useEffect(() => {
    if (!supportsOrientationLock()) return;
    ScreenOrientation.lockAsync(FULLSCREEN_ORIENTATION_LOCK).catch((err) => {
      console.warn('[CoachTrainingStudioScreen] Orientation lock failed:', err);
    });
    return () => {
      ScreenOrientation.lockAsync(PORTRAIT_ORIENTATION_LOCK).catch((err) => {
        console.warn('[CoachTrainingStudioScreen] Orientation restore failed:', err);
      });
    };
  }, []);

  // Référence du conteneur du terrain pour le drop de pions
  const pitchWrapperRef = useRef<View>(null);
  const [pitchBounds, setPitchBounds] = useState<{ left: number; top: number; width: number; height: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
  });

  // État du glisser-déposer depuis la palette vers le terrain
  const [paletteDrag, setPaletteDrag] = useState<{
    active: boolean;
    x: number;
    y: number;
    info?: any;
  } | null>(null);

  // Mode Pose Continue (Stamp) activé par appui long sur un pion ou plot
  const [activeStamp, setActiveStamp] = useState<{
    kind: 'player' | 'equipment';
    type?: EquipmentType;
    team?: TeamSide;
    label: string;
    color?: string;
    roleNum?: number;
  } | null>(null);

  // Toast visuel lorsque le déplacement génère automatiquement l'animation d'avancée
  const [showAnimationToast, setShowAnimationToast] = useState<boolean>(false);

  // ——— Core Drill State (Starts 100% empty for clean coach setup) ———
  const [drill, setDrill] = useState<Drill>(() => {
    if (initialDrill) return initialDrill;
    return createEmptyDrill();
  });

  const [activeFrameIndex, setActiveFrameIndex] = useState<number>(0);

  // Undo / Redo history stacks
  const [history, setHistory] = useState<Drill[]>([]);
  const [redoStack, setRedoStack] = useState<Drill[]>([]);

  // View & Camera options
  const [viewMode, setViewMode] = useState<ViewMode>('2d');
  const [cameraPreset, setCameraPreset] = useState<Camera3DPreset>('top');
  const [turfTheme, setTurfTheme] = useState<'tactical_blue' | 'classic_green'>('tactical_blue');
  const [activePitchConfig, setActivePitchConfig] = useState<PitchConfiguration>(
    drill.pitchConfig || 'full',
  );

  // Selection & Tools
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<'player' | 'equipment' | 'drawing' | 'zone' | null>(null);
  const [activeTool, setActiveTool] = useState<'select' | 'draw_run' | 'draw_pass' | 'pan'>('select');

  // Animation Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTimeMs, setPlaybackTimeMs] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 1.0 | 2.0>(1.0);
  const [showGhosts, setShowGhosts] = useState<boolean>(true);
  const [isLooping, setIsLooping] = useState<boolean>(true);

  // Modals
  const [helpModalVisible, setHelpModalVisible] = useState<boolean>(false);
  const [aiModalVisible, setAiModalVisible] = useState<boolean>(false);
  const [libraryModalVisible, setLibraryModalVisible] = useState<boolean>(false);
  const [configsModalVisible, setConfigsModalVisible] = useState<boolean>(false);

  // Persistence status
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('saved');

  // Active frame reference
  const currentFrame = useMemo(() => {
    return drill.frames[activeFrameIndex] || drill.frames[0];
  }, [drill.frames, activeFrameIndex]);

  // Previous frame for ghost traces
  const previousFrame = useMemo(() => {
    if (activeFrameIndex === 0) return undefined;
    return drill.frames[activeFrameIndex - 1];
  }, [drill.frames, activeFrameIndex]);

  // Push current state to undo history before an edit
  const pushHistory = useCallback(() => {
    setHistory((prev) => [...prev.slice(-25), JSON.parse(JSON.stringify(drill))]);
    setRedoStack([]);
  }, [drill]);

  const handleUndo = useCallback(() => {
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    setRedoStack((prev) => [JSON.parse(JSON.stringify(drill)), ...prev]);
    setHistory((prev) => prev.slice(0, -1));
    setDrill(previous);
  }, [history, drill]);

  const handleRedo = useCallback(() => {
    if (redoStack.length === 0) return;
    const next = redoStack[0];
    setHistory((prev) => [...prev, JSON.parse(JSON.stringify(drill))]);
    setRedoStack((prev) => prev.slice(1));
    setDrill(next);
  }, [redoStack, drill]);

  // Auto-save drill draft periodically
  useEffect(() => {
    const timer = setTimeout(async () => {
      setSaveStatus('saving');
      await autoSaveWorkspaceDrill(drill);
      setSaveStatus('saved');
    }, 1200);
    return () => clearTimeout(timer);
  }, [drill]);

  // Animation frame loop
  useEffect(() => {
    if (!isPlaying) return;
    const totalMs = calculateDrillTotalDurationMs(drill);
    if (totalMs <= 0) return;

    let animId: any;
    let lastTs = Date.now();

    const loop = () => {
      const now = Date.now();
      const delta = (now - lastTs) * playbackSpeed;
      lastTs = now;

      setPlaybackTimeMs((curr) => {
        const next = curr + delta;
        if (next >= totalMs) {
          if (!isLooping) {
            setIsPlaying(false);
            return totalMs;
          }
          return 0; // loop
        }
        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, drill, playbackSpeed, isLooping]);

  // When scrubbing time or playing, sample the interpolated frame
  const displayFrame = useMemo(() => {
    if (!isPlaying && playbackTimeMs === 0) {
      return currentFrame;
    }
    const sampled = sampleDrillAtTime(drill, playbackTimeMs);
    return {
      ...currentFrame,
      players: sampled.players,
      equipment: sampled.equipment,
    };
  }, [isPlaying, playbackTimeMs, drill, currentFrame]);

  // ——— Object Placement Actions ———

  const handleSelectObject = useCallback((id: string | null, type: 'player' | 'equipment' | 'drawing' | 'zone' | null) => {
    setSelectedObjectId(id);
    setSelectedObjectType(type);
  }, []);

  const addPlayerToken = useCallback(
    (label: string, team: TeamSide, roleNum?: number, customX?: number, customY?: number) => {
      pushHistory();
      const id = generateTokenId(team);
      const calculatedNum = roleNum ?? (team === 'gk' ? 1 : currentFrame.players.filter((p) => p.team === team).length + 2);
      const targetX = customX != null ? customX : Math.round(46 + (Math.random() * 10 - 5));
      const targetY = customY != null ? customY : Math.round(28 + (Math.random() * 10 - 5));
      const newPlayer: PlayerToken = {
        id,
        team,
        num: calculatedNum,
        label: `${label} ${calculatedNum}`,
        x: targetX,
        y: targetY,
        rotation: team === 'teamB' ? 180 : 0,
        hasBall: false,
      };

      setDrill((prev) => {
        const updatedFrames = prev.frames.map((f, idx) => {
          if (idx === activeFrameIndex) {
            return { ...f, players: [...f.players, newPlayer] };
          }
          return f;
        });
        return { ...prev, frames: updatedFrames };
      });

      setSelectedObjectId(id);
      setSelectedObjectType('player');
    },
    [pushHistory, currentFrame.players, activeFrameIndex],
  );

  const addEquipmentToken = useCallback(
    (type: EquipmentType, color?: string, customX?: number, customY?: number) => {
      pushHistory();
      const id = generateTokenId(`equip-${type}`);
      const targetX = customX != null ? customX : Math.round(46 + (Math.random() * 12 - 6));
      const targetY = customY != null ? customY : Math.round(26 + (Math.random() * 12 - 6));
      const newEquip: EquipmentToken = {
        id,
        type,
        color: color || (type === 'cone' ? '#F97316' : type === 'ladder' ? '#EAB308' : '#3B82F6'),
        x: targetX,
        y: targetY,
        rotation: 0,
      };

      setDrill((prev) => {
        const updatedFrames = prev.frames.map((f, idx) => {
          if (idx === activeFrameIndex) {
            return { ...f, equipment: [...f.equipment, newEquip] };
          }
          return f;
        });
        return { ...prev, frames: updatedFrames };
      });

      setSelectedObjectId(id);
      setSelectedObjectType('equipment');
    },
    [pushHistory, activeFrameIndex],
  );

  // Déplacement direct en temps réel d'un joueur sur le terrain (comme sur Tactical Slate)
  const handleMovePlayer = useCallback((id: string, x: number, y: number) => {
    setDrill((prev) => {
      const updatedFrames = prev.frames.map((f, idx) => {
        if (idx !== activeFrameIndex) return f;
        return {
          ...f,
          players: f.players.map((p) => (p.id === id ? { ...p, x, y } : p)),
        };
      });
      return { ...prev, frames: updatedFrames };
    });
  }, [activeFrameIndex]);

  // Déplacement direct en temps réel d'un équipement (plot, ballon, échelle)
  const handleMoveEquipment = useCallback((id: string, x: number, y: number) => {
    setDrill((prev) => {
      const updatedFrames = prev.frames.map((f, idx) => {
        if (idx !== activeFrameIndex) return f;
        return {
          ...f,
          equipment: f.equipment.map((e) => (e.id === id ? { ...e, x, y } : e)),
        };
      });
      return { ...prev, frames: updatedFrames };
    });
  }, [activeFrameIndex]);

  // Fin de glissement sur le terrain -> enregistre dans l'historique d'annulation
  const handleDragEnd = useCallback(() => {
    pushHistory();
  }, [pushHistory]);

  // Mode Pose Continue (Stamp) : pose d'un élément au toucher ou glissé sur la pelouse
  const handleStampPlace = useCallback(
    (x: number, y: number) => {
      if (!activeStamp) return;
      if (activeStamp.kind === 'player') {
        addPlayerToken(activeStamp.label, activeStamp.team || 'teamA', activeStamp.roleNum, x, y);
      } else {
        addEquipmentToken(activeStamp.type || 'cone', activeStamp.color, x, y);
      }
    },
    [activeStamp, addPlayerToken, addEquipmentToken],
  );

  // Déplacement avec création automatique d'animation (Style Tactical Slate)
  const handlePlayerMovedWithTrail = useCallback(
    (id: string, from: { x: number; y: number }, to: { x: number; y: number }) => {
      pushHistory();
      const movedPlayer = currentFrame.players.find((p) => p.id === id);
      const strokeColor =
        movedPlayer?.color ||
        (movedPlayer?.team === 'teamB'
          ? '#EF4444'
          : movedPlayer?.team === 'neutral'
          ? '#EAB308'
          : movedPlayer?.team === 'gk'
          ? '#10B981'
          : '#3B82F6');

      const newDrawing: DrawingObject = {
        id: generateTokenId('draw-run'),
        type: 'run',
        from,
        to,
        color: strokeColor,
      };

      setDrill((prev) => {
        // Si l'atelier n'a qu'une seule frame, créer automatiquement la Phase 2 pour voir l'avancée !
        if (prev.frames.length <= 1) {
          const frame1: DrillFrame = {
            ...prev.frames[0],
            drawings: [...prev.frames[0].drawings, newDrawing],
          };
          const frame2: DrillFrame = {
            id: `frame-${Date.now()}-2`,
            order: 1,
            durationMs: 2000,
            title: 'Phase 2',
            players: prev.frames[0].players.map((p) => (p.id === id ? { ...p, x: to.x, y: to.y } : p)),
            equipment: prev.frames[0].equipment,
            drawings: [],
            zones: prev.frames[0].zones,
          };
          return {
            ...prev,
            frames: [frame1, frame2],
          };
        }

        // Si plusieurs frames existent déjà, mettre à jour la frame active
        const updatedFrames = prev.frames.map((f, idx) => {
          if (idx !== activeFrameIndex) return f;
          return {
            ...f,
            players: f.players.map((p) => (p.id === id ? { ...p, x: to.x, y: to.y } : p)),
            drawings: [...f.drawings, newDrawing],
          };
        });
        return { ...prev, frames: updatedFrames };
      });

      prodayHaptics.confirm();
      setShowAnimationToast(true);
      setTimeout(() => setShowAnimationToast(false), 3800);
    },
    [pushHistory, currentFrame.players, activeFrameIndex],
  );

  const handleUpdatePlayer = useCallback(
    (patch: Partial<PlayerToken>) => {
      if (!selectedObjectId) return;
      pushHistory();
      setDrill((prev) => {
        const updatedFrames = prev.frames.map((f, idx) => {
          if (idx !== activeFrameIndex) return f;
          return {
            ...f,
            players: f.players.map((p) => (p.id === selectedObjectId ? { ...p, ...patch } : p)),
          };
        });
        return { ...prev, frames: updatedFrames };
      });
    },
    [selectedObjectId, pushHistory, activeFrameIndex],
  );

  const handleUpdateEquipment = useCallback(
    (patch: Partial<EquipmentToken>) => {
      if (!selectedObjectId) return;
      pushHistory();
      setDrill((prev) => {
        const updatedFrames = prev.frames.map((f, idx) => {
          if (idx !== activeFrameIndex) return f;
          return {
            ...f,
            equipment: f.equipment.map((e) => (e.id === selectedObjectId ? { ...e, ...patch } : e)),
          };
        });
        return { ...prev, frames: updatedFrames };
      });
    },
    [selectedObjectId, pushHistory, activeFrameIndex],
  );

  const handleDeleteObject = useCallback(() => {
    if (!selectedObjectId) return;
    pushHistory();
    setDrill((prev) => {
      const updatedFrames = prev.frames.map((f, idx) => {
        if (idx !== activeFrameIndex) return f;
        return {
          ...f,
          players: f.players.filter((p) => p.id !== selectedObjectId),
          equipment: f.equipment.filter((e) => e.id !== selectedObjectId),
          drawings: f.drawings.filter((d) => d.id !== selectedObjectId),
          zones: (f.zones || []).filter((z) => z.id !== selectedObjectId),
        };
      });
      return { ...prev, frames: updatedFrames };
    });
    setSelectedObjectId(null);
    setSelectedObjectType(null);
  }, [selectedObjectId, pushHistory, activeFrameIndex]);

  const handleDuplicateObject = useCallback(() => {
    if (!selectedObjectId) return;
    pushHistory();
    const newId = generateTokenId('dup');

    setDrill((prev) => {
      const updatedFrames = prev.frames.map((f, idx) => {
        if (idx !== activeFrameIndex) return f;
        const player = f.players.find((p) => p.id === selectedObjectId);
        if (player) {
          const dup: PlayerToken = {
            ...player,
            id: newId,
            x: Math.min(95, player.x + 4),
            y: Math.min(95, player.y + 4),
            num: (player.num || 0) + 1,
            label: `${player.label || 'Player'} bis`,
          };
          return { ...f, players: [...f.players, dup] };
        }
        const equip = f.equipment.find((e) => e.id === selectedObjectId);
        if (equip) {
          const dup: EquipmentToken = {
            ...equip,
            id: newId,
            x: Math.min(95, equip.x + 4),
            y: Math.min(95, equip.y + 4),
          };
          return { ...f, equipment: [...f.equipment, dup] };
        }
        return f;
      });
      return { ...prev, frames: updatedFrames };
    });
    setSelectedObjectId(newId);
  }, [selectedObjectId, pushHistory, activeFrameIndex]);

  const handleRotateObject = useCallback(() => {
    if (!selectedObjectId) return;
    pushHistory();
    setDrill((prev) => {
      const updatedFrames = prev.frames.map((f, idx) => {
        if (idx !== activeFrameIndex) return f;
        return {
          ...f,
          players: f.players.map((p) =>
            p.id === selectedObjectId ? { ...p, rotation: ((p.rotation || 0) + 45) % 360 } : p,
          ),
          equipment: f.equipment.map((e) =>
            e.id === selectedObjectId ? { ...e, rotation: ((e.rotation || 0) + 45) % 360 } : e,
          ),
        };
      });
      return { ...prev, frames: updatedFrames };
    });
  }, [selectedObjectId, pushHistory, activeFrameIndex]);

  const handleNudgeObject = useCallback(
    (dx: number, dy: number) => {
      if (!selectedObjectId) return;
      pushHistory();
      setDrill((prev) => {
        const updatedFrames = prev.frames.map((f, idx) => {
          if (idx !== activeFrameIndex) return f;
          return {
            ...f,
            players: f.players.map((p) =>
              p.id === selectedObjectId
                ? { ...p, x: Math.max(0, Math.min(100, p.x + dx)), y: Math.max(0, Math.min(100, p.y + dy)) }
                : p,
            ),
            equipment: f.equipment.map((e) =>
              e.id === selectedObjectId
                ? { ...e, x: Math.max(0, Math.min(100, e.x + dx)), y: Math.max(0, Math.min(100, e.y + dy)) }
                : e,
            ),
          };
        });
        return { ...prev, frames: updatedFrames };
      });
    },
    [selectedObjectId, pushHistory, activeFrameIndex],
  );

  // Selected object references for inspector
  const selectedPlayer = useMemo(() => {
    if (selectedObjectType !== 'player' || !selectedObjectId) return null;
    return currentFrame.players.find((p) => p.id === selectedObjectId) || null;
  }, [selectedObjectType, selectedObjectId, currentFrame.players]);

  const selectedEquipment = useMemo(() => {
    if (selectedObjectType !== 'equipment' || !selectedObjectId) return null;
    return currentFrame.equipment.find((e) => e.id === selectedObjectId) || null;
  }, [selectedObjectType, selectedObjectId, currentFrame.equipment]);

  // Frame management
  const handleAddFrame = useCallback(() => {
    pushHistory();
    const lastFrame = drill.frames[drill.frames.length - 1];
    const newFrame = createNextFrame(lastFrame, drill.frames.length);

    setDrill((prev) => ({
      ...prev,
      frames: [...prev.frames, newFrame],
    }));
    setActiveFrameIndex(drill.frames.length);
  }, [pushHistory, drill.frames]);

  // Pitch configuration switcher
  const handlePitchConfigChange = useCallback(
    (config: PitchConfiguration) => {
      pushHistory();
      setActivePitchConfig(config);
      setDrill((prev) => ({ ...prev, pitchConfig: config }));
      setConfigsModalVisible(false);
    },
    [pushHistory],
  );

  // Clear workspace
  const handleClearPitch = useCallback(() => {
    Alert.alert(
      'Réinitialiser le terrain ?',
      'Tous les joueurs et le matériel de la phase actuelle seront effacés.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Effacer',
          style: 'destructive',
          onPress: () => {
            pushHistory();
            setDrill((prev) => {
              const updated = prev.frames.map((f, idx) => {
                if (idx === activeFrameIndex) {
                  return { ...f, players: [], equipment: [], drawings: [], zones: [] };
                }
                return f;
              });
              return { ...prev, frames: updated };
            });
            setSelectedObjectId(null);
            setSelectedObjectType(null);
          },
        },
      ],
    );
  }, [pushHistory, activeFrameIndex]);

  // Save drill
  const handleSaveDrill = useCallback(async () => {
    setSaveStatus('saving');
    await saveDrillToWorkspace(drill);
    setSaveStatus('saved');
    if (onSave) {
      onSave(drill);
    } else {
      Alert.alert('Exercice sauvegardé', `"${drill.name}" a été enregistré.`);
    }
  }, [drill, onSave]);

  // Format digital stopwatch (e.g. 00:00.00 / 00:02.00)
  const totalMs = calculateDrillTotalDurationMs(drill) || 2000;
  const currentSec = (playbackTimeMs / 1000).toFixed(2).padStart(5, '0');
  const totalSec = (totalMs / 1000).toFixed(2).padStart(5, '0');
  const timerString = `00:${currentSec} / 00:${totalSec}`;

  // Dimensions of floating pitch — adaptées au format horizontal mobile & desktop
  const verticalMargin = isMobile ? (isLandscape ? 58 : 100) : 74;
  const targetHeight = Math.min(winHeight - verticalMargin, isMobile ? 380 : 580);
  let targetWidth = Math.round(targetHeight / 0.64);
  const maxAllowedWidth = winWidth - (isMobile ? (isLandscape ? 116 : 30) : 210);
  if (targetWidth > maxAllowedWidth) {
    targetWidth = maxAllowedWidth;
  }
  const pitchWidth = Math.max(280, targetWidth);
  const pitchHeight = Math.round(pitchWidth * 0.64);

  return (
    <View style={styles.workspaceRoot}>
      {/* Bannière d'orientation si mobile tenu en portrait */}
      {isMobile && !isLandscape && (
        <View style={styles.rotatePromptBanner}>
          <MaterialCommunityIcons name="phone-rotate-landscape" size={16} color="#38BDF8" />
          <Text style={styles.rotatePromptText}>
            Mode Horizontal : pivotez votre appareil en paysage
          </Text>
        </View>
      )}

      {/* Top Floating Discreet Header */}
      <View style={styles.floatingTopBar}>
        <View style={styles.floatingTopLeft}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.topIconBtn} accessibilityLabel="Retour">
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <TextInput
            value={drill.name}
            onChangeText={(text) => setDrill((prev) => ({ ...prev, name: text }))}
            placeholder="Titre de l’exercice"
            placeholderTextColor="rgba(255,255,255,0.4)"
            style={styles.floatingTitleInput}
          />

          <View style={styles.autoSaveIndicator}>
            <View style={[styles.dot, saveStatus === 'saved' ? styles.dotGreen : styles.dotOrange]} />
            <Text style={styles.autoSaveText}>{saveStatus === 'saved' ? 'Enregistré' : 'Sauvegarde...'}</Text>
          </View>
        </View>

        <View style={styles.floatingTopRight}>
          {/* Turf Theme Switcher: Blue vs Green */}
          <TouchableOpacity
            onPress={() => setTurfTheme((t) => (t === 'tactical_blue' ? 'classic_green' : 'tactical_blue'))}
            style={styles.turfTogglePill}
          >
            <View
              style={[
                styles.turfSampleCircle,
                { backgroundColor: turfTheme === 'tactical_blue' ? '#336E97' : '#14532D' },
              ]}
            />
            <Text style={styles.turfToggleText}>
              {turfTheme === 'tactical_blue' ? 'Bleu Tactique' : 'Vert Stade'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={handleSaveDrill} style={styles.topSaveBtn}>
            <Ionicons name="save-outline" size={15} color="#FFFFFF" />
            <Text style={styles.topSaveBtnText}>Enregistrer</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Bandeau Mode Pose Continue (Stamp) */}
      {activeStamp && (
        <View style={styles.stampModeBanner}>
          <View style={[styles.stampPillDot, { backgroundColor: activeStamp.color || '#3B82F6' }]} />
          <Text style={styles.stampModeBannerText}>
            Mode Pose : {activeStamp.label} — Touchez le terrain pour poser au fur et à mesure
          </Text>
          <TouchableOpacity onPress={() => setActiveStamp(null)} style={styles.stampDoneBtn}>
            <Ionicons name="checkmark" size={15} color="#FFFFFF" />
            <Text style={styles.stampDoneText}>Terminé</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Toast d'avancée animée créée automatiquement lors du déplacement */}
      {showAnimationToast && (
        <View style={styles.animationCreatedToast}>
          <MaterialCommunityIcons name="movie-play" size={17} color="#38BDF8" />
          <Text style={styles.animationCreatedText}>Avancée animée enregistrée !</Text>
          <TouchableOpacity
            onPress={() => {
              setIsPlaying(true);
              setPlaybackTimeMs(0);
            }}
            style={styles.animationPlayNowBtn}
          >
            <Ionicons name="play" size={13} color="#FFFFFF" />
            <Text style={styles.animationPlayNowText}>Voir l'avancée</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Tactical Pitch Workspace */}
      <View
        ref={pitchWrapperRef}
        style={styles.centerPitchWrapper}
        onLayout={() => {
          pitchWrapperRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
            if (w > 0 && h > 0) {
              setPitchBounds({ left: pageX, top: pageY, width: w, height: h });
            }
          });
        }}
      >
        <CoachPitchEngine
          pitchConfig={activePitchConfig}
          viewMode={viewMode}
          cameraPreset={cameraPreset}
          players={displayFrame.players}
          equipment={displayFrame.equipment}
          drawings={displayFrame.drawings}
          zones={displayFrame.zones}
          ghostPlayers={showGhosts ? previousFrame?.players : undefined}
          ghostEquipment={showGhosts ? previousFrame?.equipment : undefined}
          selectedId={selectedObjectId}
          onSelectObject={handleSelectObject}
          onMovePlayer={handleMovePlayer}
          onMoveEquipment={handleMoveEquipment}
          onPlayerMovedWithTrail={handlePlayerMovedWithTrail}
          onDragEnd={handleDragEnd}
          activeStamp={activeStamp}
          onStampPlace={handleStampPlace}
          onPitchLayout={() => {
            pitchWrapperRef.current?.measure((_x, _y, w, h, pageX, pageY) => {
              if (w > 0 && h > 0) {
                setPitchBounds({ left: pageX, top: pageY, width: w, height: h });
              }
            });
          }}
          turfTheme={turfTheme}
          showCornerHandles={true}
          interactive
          width={pitchWidth}
          height={pitchHeight}
        />

        {/* Floating Contextual Inspector Overlay */}
        {selectedObjectId && (selectedPlayer || selectedEquipment) && (
          <CoachContextualInspector
            selectedPlayer={selectedPlayer}
            selectedEquipment={selectedEquipment}
            onUpdatePlayer={handleUpdatePlayer}
            onUpdateEquipment={handleUpdateEquipment}
            onUpdateDrawing={() => {}}
            onUpdateZone={() => {}}
            onDuplicate={handleDuplicateObject}
            onDelete={handleDeleteObject}
            onRotate={handleRotateObject}
            onNudge={handleNudgeObject}
            onClose={() => {
              setSelectedObjectId(null);
              setSelectedObjectType(null);
            }}
          />
        )}
      </View>

      {/* Left Floating Dock — Tactical Canvas Tools */}
      <View style={styles.leftFloatingDock}>
        <View style={styles.dockColumn}>
          {/* Pan / Move tool */}
          <TouchableOpacity
            onPress={() => setActiveTool('select')}
            style={[styles.toolCircle, activeTool === 'select' && styles.toolCircleActive]}
            accessibilityLabel="Sélectionner / Déplacer"
          >
            <MaterialCommunityIcons name="cursor-move" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Trace course avec flèche */}
          <TouchableOpacity
            onPress={() => setActiveTool((t) => (t === 'draw_run' ? 'select' : 'draw_run'))}
            style={[styles.toolCircle, activeTool === 'draw_run' && styles.toolCircleActive]}
            accessibilityLabel="Tracer une course"
          >
            <Ionicons name="pencil" size={17} color="#F59E0B" />
          </TouchableOpacity>

          {/* Trace passe / Trajectoire */}
          <TouchableOpacity
            onPress={() => setActiveTool((t) => (t === 'draw_pass' ? 'select' : 'draw_pass'))}
            style={[styles.toolCircle, activeTool === 'draw_pass' && styles.toolCircleActive]}
            accessibilityLabel="Tracer une passe"
          >
            <MaterialCommunityIcons name="vector-curve" size={17} color="#4ADE80" />
          </TouchableOpacity>

          {/* Zoom % pill */}
          <View style={styles.zoomPill}>
            <Text style={styles.zoomPillText}>100%</Text>
          </View>

          {/* Pitch Grid / Format du terrain */}
          <TouchableOpacity
            onPress={() => setConfigsModalVisible(true)}
            style={styles.toolCircle}
            accessibilityLabel="Format du terrain"
          >
            <MaterialCommunityIcons name="grid" size={17} color="#94A3B8" />
          </TouchableOpacity>

          {/* Folders / Bibliothèque d'ateliers */}
          <TouchableOpacity
            onPress={() => setLibraryModalVisible(true)}
            style={styles.toolCircle}
            accessibilityLabel="Bibliothèque d'ateliers"
          >
            <Ionicons name="folder-outline" size={17} color="#FBBF24" />
          </TouchableOpacity>
        </View>

        <View style={styles.dockColumn}>
          {/* Clapboard Animation Play */}
          <TouchableOpacity
            onPress={() => setIsPlaying((p) => !p)}
            style={[styles.toolCircle, isPlaying && styles.toolCircleCyan]}
            accessibilityLabel="Lecture de l'animation"
          >
            <MaterialCommunityIcons name="movie-play" size={18} color={isPlaying ? '#38BDF8' : '#FFFFFF'} />
          </TouchableOpacity>

          {/* Broom / Effacer le terrain */}
          <TouchableOpacity
            onPress={handleClearPitch}
            style={styles.toolCircle}
            accessibilityLabel="Effacer le terrain"
          >
            <MaterialCommunityIcons name="broom" size={17} color="#F87171" />
          </TouchableOpacity>

          {/* AI Generator Box */}
          <TouchableOpacity
            onPress={() => setAiModalVisible(true)}
            style={styles.toolCircle}
            accessibilityLabel="Assistant IA tactique"
          >
            <Ionicons name="sparkles" size={17} color="#00E676" />
          </TouchableOpacity>

          {/* Undo */}
          <TouchableOpacity
            onPress={handleUndo}
            disabled={history.length === 0}
            style={[styles.toolCircle, history.length === 0 && { opacity: 0.35 }]}
            accessibilityLabel="Annuler"
          >
            <Ionicons name="arrow-undo" size={17} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Redo */}
          <TouchableOpacity
            onPress={handleRedo}
            disabled={redoStack.length === 0}
            style={[styles.toolCircle, redoStack.length === 0 && { opacity: 0.35 }]}
            accessibilityLabel="Rétablir"
          >
            <Ionicons name="arrow-redo" size={17} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Aide */}
          <TouchableOpacity
            onPress={() => setHelpModalVisible(true)}
            style={styles.toolCircle}
            accessibilityLabel="Aide et raccourcis"
          >
            <Ionicons name="help-circle-outline" size={18} color="#94A3B8" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Right Floating Dock — Equipment & Tokens Palette (Tap-to-place ou Glisser-Déposer) */}
      <View style={styles.rightFloatingDock}>
        <View style={styles.dockColumn}>
          {/* Coach Token */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'player', label: 'Coach', team: 'coach', color: '#1E293B' }}
            pitchBounds={pitchBounds}
            onTap={() => addPlayerToken('Coach', 'coach')}
            onLongPress={() => setActiveStamp({ kind: 'player', label: 'Coach', team: 'coach', color: '#1E293B' })}
            onDrop={(x, y) => addPlayerToken('Coach', 'coach', undefined, x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.label === 'Coach'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Coach (clic ou appui long pour pose continue)"
          >
            <MaterialCommunityIcons name="account-tie" size={18} color="#FFFFFF" />
          </PaletteTokenButton>

          {/* Red Player 2 */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'player', label: 'Joueur Rouge', team: 'teamB', color: '#EF4444', num: 2 }}
            pitchBounds={pitchBounds}
            onTap={() => addPlayerToken('Player', 'teamB', 2)}
            onLongPress={() => setActiveStamp({ kind: 'player', label: 'Joueur Rouge', team: 'teamB', color: '#EF4444', roleNum: 2 })}
            onDrop={(x, y) => addPlayerToken('Player', 'teamB', 2, x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.team === 'teamB'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Joueur Rouge (clic ou appui long pour pose continue)"
          >
            <View style={[styles.playerMiniCircle, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.playerMiniText}>2</Text>
            </View>
          </PaletteTokenButton>

          {/* Yellow Joker */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'player', label: 'Joker Jaune', team: 'neutral', color: '#EAB308' }}
            pitchBounds={pitchBounds}
            onTap={() => addPlayerToken('Joker', 'neutral')}
            onLongPress={() => setActiveStamp({ kind: 'player', label: 'Joker Jaune', team: 'neutral', color: '#EAB308' })}
            onDrop={(x, y) => addPlayerToken('Joker', 'neutral', undefined, x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.team === 'neutral'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Joker Jaune (clic ou appui long pour pose continue)"
          >
            <View style={[styles.playerMiniCircle, { backgroundColor: '#EAB308' }]}>
              <Text style={[styles.playerMiniText, { color: '#000000' }]}>J</Text>
            </View>
          </PaletteTokenButton>

          {/* Blue Player 1 */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'player', label: 'Joueur Bleu', team: 'teamA', color: '#3B82F6', num: 1 }}
            pitchBounds={pitchBounds}
            onTap={() => addPlayerToken('Player', 'teamA', 1)}
            onLongPress={() => setActiveStamp({ kind: 'player', label: 'Joueur Bleu', team: 'teamA', color: '#3B82F6', roleNum: 1 })}
            onDrop={(x, y) => addPlayerToken('Player', 'teamA', 1, x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.team === 'teamA'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Joueur Bleu (clic ou appui long pour pose continue)"
          >
            <View style={[styles.playerMiniCircle, { backgroundColor: '#3B82F6' }]}>
              <Text style={styles.playerMiniText}>1</Text>
            </View>
          </PaletteTokenButton>

          {/* Gardien (GK) */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'player', label: 'Gardien Vert', team: 'gk', color: '#10B981', num: 1 }}
            pitchBounds={pitchBounds}
            onTap={() => addPlayerToken('Gardien', 'gk', 1)}
            onLongPress={() => setActiveStamp({ kind: 'player', label: 'Gardien Vert', team: 'gk', color: '#10B981', roleNum: 1 })}
            onDrop={(x, y) => addPlayerToken('Gardien', 'gk', 1, x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.team === 'gk'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Gardien (clic ou appui long pour pose continue)"
          >
            <View style={[styles.playerMiniCircle, { backgroundColor: '#10B981' }]}>
              <Text style={[styles.playerMiniText, { fontSize: 8 }]}>GK</Text>
            </View>
          </PaletteTokenButton>

          {/* Match Ball */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'equipment', type: 'ball', label: 'Ballon' }}
            pitchBounds={pitchBounds}
            onTap={() => addEquipmentToken('ball')}
            onLongPress={() => setActiveStamp({ kind: 'equipment', type: 'ball', label: 'Ballon' })}
            onDrop={(x, y) => addEquipmentToken('ball', undefined, x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.type === 'ball'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Ballon (clic ou appui long pour pose continue)"
          >
            <Ionicons name="football" size={18} color="#FFFFFF" />
          </PaletteTokenButton>

          {/* Plot / Cône orange */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'equipment', type: 'cone', color: '#F97316', label: 'Plot Cône' }}
            pitchBounds={pitchBounds}
            onTap={() => addEquipmentToken('cone', '#F97316')}
            onLongPress={() => setActiveStamp({ kind: 'equipment', type: 'cone', color: '#F97316', label: 'Plot Cône' })}
            onDrop={(x, y) => addEquipmentToken('cone', '#F97316', x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.type === 'cone'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Plot Cône (clic ou appui long pour pose continue)"
          >
            <MaterialCommunityIcons name="cone" size={18} color="#F97316" />
          </PaletteTokenButton>

          {/* Agility Ladder */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'equipment', type: 'ladder', color: '#EAB308', label: 'Échelle' }}
            pitchBounds={pitchBounds}
            onTap={() => addEquipmentToken('ladder')}
            onLongPress={() => setActiveStamp({ kind: 'equipment', type: 'ladder', color: '#EAB308', label: 'Échelle' })}
            onDrop={(x, y) => addEquipmentToken('ladder', undefined, x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.type === 'ladder'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Échelle (clic ou appui long pour pose continue)"
          >
            <MaterialCommunityIcons name="ladder" size={18} color="#EAB308" />
          </PaletteTokenButton>

          {/* Mini Goal */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'equipment', type: 'mini_goal', color: '#3B82F6', label: 'Mini-but' }}
            pitchBounds={pitchBounds}
            onTap={() => addEquipmentToken('mini_goal')}
            onLongPress={() => setActiveStamp({ kind: 'equipment', type: 'mini_goal', color: '#3B82F6', label: 'Mini-but' })}
            onDrop={(x, y) => addEquipmentToken('mini_goal', undefined, x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.type === 'mini_goal'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Mini-but (clic ou appui long pour pose continue)"
          >
            <MaterialCommunityIcons name="soccer-field" size={18} color="#3B82F6" />
          </PaletteTokenButton>

          {/* Dummy Mannequin */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'equipment', type: 'mannequin', color: '#94A3B8', label: 'Mannequin' }}
            pitchBounds={pitchBounds}
            onTap={() => addEquipmentToken('mannequin')}
            onLongPress={() => setActiveStamp({ kind: 'equipment', type: 'mannequin', color: '#94A3B8', label: 'Mannequin' })}
            onDrop={(x, y) => addEquipmentToken('mannequin', undefined, x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.type === 'mannequin'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Mannequin (clic ou appui long pour pose continue)"
          >
            <MaterialCommunityIcons name="human" size={18} color="#94A3B8" />
          </PaletteTokenButton>
        </View>

        <View style={styles.dockColumn}>
          {/* Strategy */}
          <TouchableOpacity onPress={() => setConfigsModalVisible(true)} style={styles.toolCircle} accessibilityLabel="Disposition tactique">
            <MaterialCommunityIcons name="strategy" size={17} color="#A78BFA" />
          </TouchableOpacity>

          {/* Half / Full pitch toggle */}
          <TouchableOpacity
            onPress={() => setActivePitchConfig((c) => (c === 'full' ? 'half' : 'full'))}
            style={styles.toolCircle}
            accessibilityLabel="Basculer Demi/Plein terrain"
          >
            <MaterialCommunityIcons name="circle-half-full" size={17} color="#38BDF8" />
          </TouchableOpacity>

          {/* Staff */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'player', label: 'Staff', team: 'coach', color: '#334155' }}
            pitchBounds={pitchBounds}
            onTap={() => addPlayerToken('Staff', 'coach')}
            onLongPress={() => setActiveStamp({ kind: 'player', label: 'Staff', team: 'coach', color: '#334155' })}
            onDrop={(x, y) => addPlayerToken('Staff', 'coach', undefined, x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.label === 'Staff'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Staff (clic ou appui long pour pose continue)"
          >
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </PaletteTokenButton>

          {/* Coupelle plate */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'equipment', type: 'disc_cone', color: '#EAB308', label: 'Coupelle' }}
            pitchBounds={pitchBounds}
            onTap={() => addEquipmentToken('disc_cone', '#EAB308')}
            onLongPress={() => setActiveStamp({ kind: 'equipment', type: 'disc_cone', color: '#EAB308', label: 'Coupelle' })}
            onDrop={(x, y) => addEquipmentToken('disc_cone', '#EAB308', x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.type === 'disc_cone'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Coupelle (clic ou appui long pour pose continue)"
          >
            <Ionicons name="disc-outline" size={17} color="#EAB308" />
          </PaletteTokenButton>

          {/* Piquet d'agilité */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'equipment', type: 'pole', color: '#EF4444', label: 'Piquet' }}
            pitchBounds={pitchBounds}
            onTap={() => addEquipmentToken('pole', '#EF4444')}
            onLongPress={() => setActiveStamp({ kind: 'equipment', type: 'pole', color: '#EF4444', label: 'Piquet' })}
            onDrop={(x, y) => addEquipmentToken('pole', '#EF4444', x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.type === 'pole'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Piquet (clic ou appui long pour pose continue)"
          >
            <Ionicons name="remove-outline" size={18} color="#EF4444" />
          </PaletteTokenButton>

          {/* Haie */}
          <PaletteTokenButton
            tokenInfo={{ kind: 'equipment', type: 'hurdle', color: '#38BDF8', label: 'Haie' }}
            pitchBounds={pitchBounds}
            onTap={() => addEquipmentToken('hurdle', '#38BDF8')}
            onLongPress={() => setActiveStamp({ kind: 'equipment', type: 'hurdle', color: '#38BDF8', label: 'Haie' })}
            onDrop={(x, y) => addEquipmentToken('hurdle', '#38BDF8', x, y)}
            onDragStateChange={setPaletteDrag}
            isActiveStamp={activeStamp?.type === 'hurdle'}
            style={styles.toolCircle}
            accessibilityLabel="Ajouter Haie (clic ou appui long pour pose continue)"
          >
            <MaterialCommunityIcons name="ray-start-arrow" size={17} color="#38BDF8" />
          </PaletteTokenButton>

          {/* Library Book */}
          <TouchableOpacity onPress={() => setLibraryModalVisible(true)} style={styles.toolCircle} accessibilityLabel="Bibliothèque d'exercices">
            <Ionicons name="book-outline" size={17} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Plus d'options / Guide */}
          <TouchableOpacity onPress={() => setHelpModalVisible(true)} style={styles.toolCircle} accessibilityLabel="Aide">
            <Ionicons name="ellipsis-horizontal" size={18} color="#60A5FA" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Floating Timeline Dock */}
      <View style={styles.bottomTimelineDock}>
        {/* Play / Pause circular button */}
        <TouchableOpacity
          onPress={() => setIsPlaying((p) => !p)}
          style={styles.bigPlayButton}
          accessibilityLabel={isPlaying ? 'Pause' : 'Lecture'}
        >
          <Ionicons name={isPlaying ? 'pause' : 'play'} size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* Digital StopWatch Timer */}
        <View style={styles.digitalTimerBox}>
          <Text style={styles.digitalTimerText}>{timerString}</Text>
        </View>

        {/* Loop toggle pill */}
        <TouchableOpacity
          onPress={() => setIsLooping((l) => !l)}
          style={[styles.loopPill, isLooping && styles.loopPillActive]}
        >
          <Text style={[styles.loopPillText, isLooping && styles.loopPillTextActive]}>Loop</Text>
        </TouchableOpacity>

        {/* Frame index indicator F1/1 and Add Frame Plus */}
        <View style={styles.frameCounterGroup}>
          <Text style={styles.frameCounterText}>F{activeFrameIndex + 1}/{drill.frames.length}</Text>
          <TouchableOpacity onPress={handleAddFrame} style={styles.addFramePlusBtn}>
            <Ionicons name="add" size={15} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        {/* Active Frame Pill: F1 2s */}
        <View style={styles.activeFramePill}>
          <Text style={styles.activeFramePillText}>F{activeFrameIndex + 1}  {(currentFrame.durationMs / 1000).toFixed(0)}s</Text>
        </View>

        {/* Animation mode indicator pill */}
        <TouchableOpacity
          onPress={() => setIsPlaying((p) => !p)}
          style={styles.animationModePill}
        >
          <View style={styles.squareIcon} />
          <Text style={styles.animationModeText}>Animation</Text>
        </TouchableOpacity>

        {/* 9-dots menu */}
        <TouchableOpacity onPress={() => setShowGhosts((g) => !g)} style={styles.nineDotsBtn}>
          <MaterialCommunityIcons name="dots-grid" size={18} color={showGhosts ? '#38BDF8' : '#94A3B8'} />
        </TouchableOpacity>
      </View>

      {/* Pitch Configurations Selector Modal */}
      {configsModalVisible && (
        <View style={styles.modalOverlay}>
          <View style={styles.configModalCard}>
            <View style={styles.configModalHeader}>
              <Text style={styles.configModalTitle}>Format du terrain</Text>
              <TouchableOpacity onPress={() => setConfigsModalVisible(false)}>
                <Ionicons name="close" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            <View style={styles.configList}>
              {PITCH_CONFIGURATIONS.map((cfg) => (
                <TouchableOpacity
                  key={cfg.id}
                  onPress={() => handlePitchConfigChange(cfg.id)}
                  style={[
                    styles.configRow,
                    activePitchConfig === cfg.id && styles.configRowActive,
                  ]}
                >
                  <MaterialCommunityIcons name="soccer-field" size={18} color={activePitchConfig === cfg.id ? '#38BDF8' : '#94A3B8'} />
                  <Text style={[styles.configRowText, activePitchConfig === cfg.id && styles.configRowTextActive]}>
                    {cfg.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Help Modal */}
      <CoachWorkspaceHelpModal visible={helpModalVisible} onClose={() => setHelpModalVisible(false)} />

      {/* AI Wizard Modal */}
      <CoachAiSessionWizardModal
        visible={aiModalVisible}
        onClose={() => setAiModalVisible(false)}
        onApplySession={(session) => {
          if (session.drills[0]) {
            setDrill(session.drills[0]);
            setActiveFrameIndex(0);
          }
        }}
        onOpenInStudio={(importedDrill) => {
          setDrill(importedDrill);
          setActiveFrameIndex(0);
        }}
      />

      {/* Library Modal */}
      <CoachDrillLibraryModal
        visible={libraryModalVisible}
        onClose={() => setLibraryModalVisible(false)}
        onSelectDrill={(selected) => {
          setDrill(selected);
          setActiveFrameIndex(0);
        }}
        onOpenInStudio={(selected) => {
          setDrill(selected);
          setActiveFrameIndex(0);
        }}
      />

      {/* Fantôme flottant lors du glisser-déposer depuis la palette */}
      {paletteDrag && (
        <View
          pointerEvents="none"
          style={[
            styles.floatingDragGhost,
            {
              left: paletteDrag.x - 22,
              top: paletteDrag.y - 22,
            },
          ]}
        >
          {paletteDrag.info?.kind === 'player' ? (
            <View
              style={[
                styles.ghostPlayerCircle,
                {
                  backgroundColor:
                    paletteDrag.info?.color ||
                    (paletteDrag.info?.team === 'teamB'
                      ? '#EF4444'
                      : paletteDrag.info?.team === 'neutral'
                      ? '#EAB308'
                      : paletteDrag.info?.team === 'gk'
                      ? '#10B981'
                      : '#3B82F6'),
                },
              ]}
            >
              <Text style={styles.ghostPlayerText}>
                {paletteDrag.info?.num != null
                  ? paletteDrag.info?.num
                  : paletteDrag.info?.team === 'coach'
                  ? 'C'
                  : ''}
              </Text>
            </View>
          ) : (
            <View style={styles.ghostEquipCircle}>
              {paletteDrag.info?.type === 'cone' ? (
                <MaterialCommunityIcons name="cone" size={24} color="#F97316" />
              ) : paletteDrag.info?.type === 'ball' ? (
                <Ionicons name="football" size={22} color="#FFFFFF" />
              ) : paletteDrag.info?.type === 'ladder' ? (
                <MaterialCommunityIcons name="ladder" size={24} color="#EAB308" />
              ) : paletteDrag.info?.type === 'mini_goal' ? (
                <MaterialCommunityIcons name="soccer-field" size={24} color="#3B82F6" />
              ) : paletteDrag.info?.type === 'mannequin' ? (
                <MaterialCommunityIcons name="human" size={24} color="#94A3B8" />
              ) : paletteDrag.info?.type === 'disc_cone' ? (
                <Ionicons name="disc-outline" size={24} color="#EAB308" />
              ) : paletteDrag.info?.type === 'pole' ? (
                <Ionicons name="remove-outline" size={24} color="#EF4444" />
              ) : paletteDrag.info?.type === 'hurdle' ? (
                <MaterialCommunityIcons name="ray-start-arrow" size={24} color="#38BDF8" />
              ) : (
                <Ionicons name="football" size={22} color="#FFFFFF" />
              )}
            </View>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  workspaceRoot: {
    flex: 1,
    backgroundColor: '#ABB5A3', // Soft matte sage green studio canvas
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTopBar: {
    position: 'absolute',
    top: 14,
    left: 20,
    right: 20,
    zIndex: 100,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    pointerEvents: 'box-none',
  },
  floatingTopLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(25, 33, 45, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  topIconBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingTitleInput: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    minWidth: 140,
    padding: 0,
  },
  autoSaveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotGreen: {
    backgroundColor: '#00E676',
  },
  dotOrange: {
    backgroundColor: '#F59E0B',
  },
  autoSaveText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
  },
  floatingTopRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  turfTogglePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(25, 33, 45, 0.88)',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  turfSampleCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  turfToggleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  topSaveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  topSaveBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  centerPitchWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 8,
  },
  leftFloatingDock: {
    position: 'absolute',
    left: 12,
    top: '12%',
    backgroundColor: '#1C222E',
    borderRadius: 24,
    padding: 6,
    flexDirection: 'row',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 90,
  },
  rightFloatingDock: {
    position: 'absolute',
    right: 12,
    top: '10%',
    backgroundColor: '#1C222E',
    borderRadius: 24,
    padding: 6,
    flexDirection: 'row',
    gap: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    zIndex: 90,
  },
  dockColumn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
  },
  toolCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#262F3F',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  toolCircleActive: {
    backgroundColor: '#3B82F6',
  },
  toolCircleCyan: {
    backgroundColor: '#0284C7',
  },
  toolCircleRed: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#991B1B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpQuestionText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  zoomPill: {
    backgroundColor: '#262F3F',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  zoomPillText: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '800',
  },
  playerMiniCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playerMiniText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '900',
  },
  bottomTimelineDock: {
    position: 'absolute',
    bottom: 24,
    alignSelf: 'center',
    backgroundColor: '#1C2331', // Floating dock centered at bottom
    borderRadius: 32,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  bigPlayButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  digitalTimerBox: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  digitalTimerText: {
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  loopPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  loopPillActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  loopPillText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  loopPillTextActive: {
    color: '#FFFFFF',
  },
  frameCounterGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  frameCounterText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  addFramePlusBtn: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#2563EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeFramePill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: 'rgba(37, 99, 235, 0.2)',
    borderWidth: 1,
    borderColor: '#2563EB',
  },
  activeFramePillText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  animationModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: '#2563EB',
  },
  squareIcon: {
    width: 8,
    height: 8,
    backgroundColor: '#FFFFFF',
  },
  animationModeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  nineDotsBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  configModalCard: {
    width: 320,
    backgroundColor: '#1E293B',
    borderRadius: 20,
    padding: 18,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  configModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  configModalTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
  configList: {
    gap: 8,
  },
  configRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  configRowActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    borderWidth: 1,
    borderColor: '#3B82F6',
  },
  configRowText: {
    color: '#94A3B8',
    fontSize: 13,
    fontWeight: '600',
  },
  configRowTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  floatingDragGhost: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 10,
    elevation: 16,
  },
  ghostPlayerCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  ghostPlayerText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 14,
  },
  ghostEquipCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(28, 34, 46, 0.95)',
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 8,
  },
  rotatePromptBanner: {
    position: 'absolute',
    top: 50,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.92)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(56, 189, 248, 0.4)',
    zIndex: 80,
  },
  rotatePromptText: {
    color: '#F0F9FF',
    fontSize: 11,
    fontWeight: '700',
  },
  toolCircleStampActive: {
    borderColor: '#38BDF8',
    borderWidth: 2,
    backgroundColor: 'rgba(56, 189, 248, 0.25)',
  },
  stampModeBanner: {
    position: 'absolute',
    top: 48,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    zIndex: 110,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 10,
  },
  stampPillDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stampModeBannerText: {
    color: '#F0F9FF',
    fontSize: 12,
    fontWeight: '700',
  },
  stampDoneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#0284C7',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  stampDoneText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  animationCreatedToast: {
    position: 'absolute',
    bottom: 64,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.95)',
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#38BDF8',
    zIndex: 110,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 12,
  },
  animationCreatedText: {
    color: '#F0F9FF',
    fontSize: 12,
    fontWeight: '800',
  },
  animationPlayNowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#2563EB',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  animationPlayNowText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
});
