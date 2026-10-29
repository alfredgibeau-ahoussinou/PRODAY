import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Alert,
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
  const isDesktop = winWidth >= 900;

  // ——— Core Drill State ———
  const [drill, setDrill] = useState<Drill>(() => {
    if (initialDrill) return initialDrill;
    return PRELOADED_DRILLS[0];
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

  const handleSelectObject = useCallback((id: string, type: 'player' | 'equipment' | 'drawing' | 'zone') => {
    setSelectedObjectId(id);
    setSelectedObjectType(type);
  }, []);

  const addPlayerToken = useCallback(
    (label: string, team: TeamSide, roleNum?: number) => {
      pushHistory();
      const id = generateTokenId(team);
      const calculatedNum = roleNum ?? (team === 'gk' ? 1 : currentFrame.players.filter((p) => p.team === team).length + 2);
      const newPlayer: PlayerToken = {
        id,
        team,
        num: calculatedNum,
        label: `${label} ${calculatedNum}`,
        x: Math.round(44 + (Math.random() * 12 - 6)),
        y: Math.round(26 + (Math.random() * 12 - 6)),
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
    (type: EquipmentType, color?: string) => {
      pushHistory();
      const id = generateTokenId(`equip-${type}`);
      const newEquip: EquipmentToken = {
        id,
        type,
        color: color || (type === 'cone' ? '#F97316' : type === 'ladder' ? '#EAB308' : '#3B82F6'),
        x: Math.round(44 + (Math.random() * 14 - 7)),
        y: Math.round(24 + (Math.random() * 14 - 7)),
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

  // Dimensions of floating pitch
  const pitchWidth = Math.min(winWidth - (isDesktop ? 220 : 40), 960);
  const pitchHeight = Math.round(pitchWidth * 0.64);

  return (
    <View style={styles.workspaceRoot}>
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

      {/* Main Tactical Pitch Workspace */}
      <View style={styles.centerPitchWrapper}>
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

      {/* Left Floating Dock — Inspired by Tacticslate */}
      <View style={styles.leftFloatingDock}>
        <View style={styles.dockColumn}>
          {/* 3D Pro */}
          <TouchableOpacity
            onPress={() => setViewMode('3d')}
            style={[styles.toolCircle, viewMode === '3d' && styles.toolCircleActive]}
          >
            <Text style={styles.tool3dText}>3D</Text>
            <View style={styles.goldBadge}><Text style={styles.goldBadgeText}>Pro</Text></View>
          </TouchableOpacity>

          {/* 3D 360 */}
          <TouchableOpacity
            onPress={() => {
              setViewMode('3d');
              setCameraPreset((p) => (p === 'isometric' ? 'side' : 'isometric'));
            }}
            style={styles.toolCircle}
          >
            <MaterialCommunityIcons name="axis-z-rotate-clockwise" size={17} color="#FFFFFF" />
            <View style={styles.goldBadge}><Text style={styles.goldBadgeText}>Pro</Text></View>
          </TouchableOpacity>

          {/* 2D Mode */}
          <TouchableOpacity
            onPress={() => setViewMode('2d')}
            style={[styles.toolCircle, viewMode === '2d' && styles.toolCircleActive]}
          >
            <Text style={styles.tool2dText}>2D</Text>
          </TouchableOpacity>

          {/* Clapboard Animation */}
          <TouchableOpacity
            onPress={() => setIsPlaying((p) => !p)}
            style={[styles.toolCircle, isPlaying && styles.toolCircleCyan]}
          >
            <MaterialCommunityIcons name="movie-play" size={18} color={isPlaying ? '#38BDF8' : '#FFFFFF'} />
          </TouchableOpacity>

          {/* Folders / Project */}
          <TouchableOpacity onPress={() => setLibraryModalVisible(true)} style={styles.toolCircle}>
            <Ionicons name="folder-outline" size={17} color="#FBBF24" />
          </TouchableOpacity>

          {/* Pitch Grid / Layout switcher */}
          <TouchableOpacity onPress={() => setConfigsModalVisible(true)} style={styles.toolCircle}>
            <MaterialCommunityIcons name="grid" size={17} color="#94A3B8" />
          </TouchableOpacity>

          {/* Zoom % pill */}
          <View style={styles.zoomPill}>
            <Text style={styles.zoomPillText}>70%</Text>
          </View>
        </View>

        <View style={styles.dockColumn}>
          {/* Draw pencil */}
          <TouchableOpacity
            onPress={() => setActiveTool((t) => (t === 'draw_run' ? 'select' : 'draw_run'))}
            style={[styles.toolCircle, activeTool === 'draw_run' && styles.toolCircleActive]}
          >
            <Ionicons name="pencil" size={17} color="#F59E0B" />
          </TouchableOpacity>

          {/* Pan / Move tool */}
          <TouchableOpacity
            onPress={() => setActiveTool('select')}
            style={[styles.toolCircle, activeTool === 'select' && styles.toolCircleActive]}
          >
            <MaterialCommunityIcons name="cursor-move" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Broom / Clear */}
          <TouchableOpacity onPress={handleClearPitch} style={styles.toolCircle}>
            <MaterialCommunityIcons name="broom" size={17} color="#F87171" />
          </TouchableOpacity>

          {/* AI Generator Box */}
          <TouchableOpacity onPress={() => setAiModalVisible(true)} style={styles.toolCircle}>
            <Ionicons name="sparkles" size={17} color="#00E676" />
          </TouchableOpacity>

          {/* Undo */}
          <TouchableOpacity onPress={handleUndo} disabled={history.length === 0} style={[styles.toolCircle, history.length === 0 && { opacity: 0.35 }]}>
            <Ionicons name="arrow-undo" size={17} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Redo */}
          <TouchableOpacity onPress={handleRedo} disabled={redoStack.length === 0} style={[styles.toolCircle, redoStack.length === 0 && { opacity: 0.35 }]}>
            <Ionicons name="arrow-redo" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Right Floating Dock — Equipment & Tokens Palette */}
      <View style={styles.rightFloatingDock}>
        <View style={styles.dockColumn}>
          {/* Coach Token */}
          <TouchableOpacity onPress={() => addPlayerToken('Coach', 'coach')} style={styles.toolCircle}>
            <MaterialCommunityIcons name="account-tie" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Red Player 2 */}
          <TouchableOpacity onPress={() => addPlayerToken('Player', 'teamB', 2)} style={styles.toolCircle}>
            <View style={[styles.playerMiniCircle, { backgroundColor: '#EF4444' }]}>
              <Text style={styles.playerMiniText}>2</Text>
            </View>
          </TouchableOpacity>

          {/* Yellow Joker */}
          <TouchableOpacity onPress={() => addPlayerToken('Joker', 'neutral')} style={styles.toolCircle}>
            <View style={[styles.playerMiniCircle, { backgroundColor: '#EAB308' }]}>
              <Text style={[styles.playerMiniText, { color: '#000000' }]}>J</Text>
            </View>
          </TouchableOpacity>

          {/* Blue Player 1 */}
          <TouchableOpacity onPress={() => addPlayerToken('Player', 'teamA', 1)} style={styles.toolCircle}>
            <View style={[styles.playerMiniCircle, { backgroundColor: '#3B82F6' }]}>
              <Text style={styles.playerMiniText}>1</Text>
            </View>
          </TouchableOpacity>

          {/* Match Ball */}
          <TouchableOpacity onPress={() => addEquipmentToken('ball')} style={styles.toolCircle}>
            <Ionicons name="football" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* 3D Orange Cone */}
          <TouchableOpacity onPress={() => addEquipmentToken('cone', '#F97316')} style={styles.toolCircle}>
            <MaterialCommunityIcons name="cone" size={18} color="#F97316" />
          </TouchableOpacity>

          {/* Agility Ladder */}
          <TouchableOpacity onPress={() => addEquipmentToken('ladder')} style={styles.toolCircle}>
            <MaterialCommunityIcons name="ladder" size={18} color="#EAB308" />
          </TouchableOpacity>

          {/* Blue Rebounder / Mini Goal */}
          <TouchableOpacity onPress={() => addEquipmentToken('mini_goal')} style={styles.toolCircle}>
            <MaterialCommunityIcons name="soccer-field" size={18} color="#3B82F6" />
          </TouchableOpacity>

          {/* Runner */}
          <TouchableOpacity onPress={() => addPlayerToken('Player', 'teamA')} style={styles.toolCircle}>
            <MaterialCommunityIcons name="run-fast" size={18} color="#38BDF8" />
          </TouchableOpacity>

          {/* Library Book */}
          <TouchableOpacity onPress={() => setLibraryModalVisible(true)} style={styles.toolCircle}>
            <Ionicons name="book-outline" size={17} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.dockColumn}>
          {/* Strategy */}
          <TouchableOpacity onPress={() => setConfigsModalVisible(true)} style={styles.toolCircle}>
            <MaterialCommunityIcons name="strategy" size={17} color="#A78BFA" />
          </TouchableOpacity>

          {/* Half / Full pitch toggle */}
          <TouchableOpacity
            onPress={() => setActivePitchConfig((c) => (c === 'full' ? 'half' : 'full'))}
            style={styles.toolCircle}
          >
            <MaterialCommunityIcons name="circle-half-full" size={17} color="#38BDF8" />
          </TouchableOpacity>

          {/* Fullscreen */}
          <TouchableOpacity onPress={() => {}} style={styles.toolCircle}>
            <MaterialCommunityIcons name="fullscreen" size={18} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Help ? */}
          <TouchableOpacity onPress={() => setHelpModalVisible(true)} style={styles.toolCircleRed}>
            <Text style={styles.helpQuestionText}>?</Text>
          </TouchableOpacity>

          {/* Pro Gold */}
          <View style={styles.proGoldChip}>
            <Text style={styles.proGoldChipText}>Pro</Text>
          </View>

          {/* Staff */}
          <TouchableOpacity onPress={() => addPlayerToken('Staff', 'coach')} style={styles.toolCircle}>
            <Ionicons name="person" size={16} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Curve drawing */}
          <TouchableOpacity
            onPress={() => setActiveTool((t) => (t === 'draw_pass' ? 'select' : 'draw_pass'))}
            style={[styles.toolCircle, activeTool === 'draw_pass' && styles.toolCircleActive]}
          >
            <MaterialCommunityIcons name="vector-curve" size={17} color="#4ADE80" />
          </TouchableOpacity>

          {/* Dummy Mannequin */}
          <TouchableOpacity onPress={() => addEquipmentToken('mannequin')} style={styles.toolCircle}>
            <MaterialCommunityIcons name="human" size={18} color="#94A3B8" />
          </TouchableOpacity>

          {/* More menu */}
          <TouchableOpacity onPress={() => setHelpModalVisible(true)} style={styles.toolCircle}>
            <Ionicons name="ellipsis-horizontal" size={18} color="#60A5FA" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Bottom Floating Timeline Dock — Exact Tacticslate Architecture */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  workspaceRoot: {
    flex: 1,
    backgroundColor: '#ABB5A3', // Exact soft matte sage green canvas from Tacticslate
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
    left: 20,
    top: '18%',
    backgroundColor: '#1C222E', // Floating dark pill from Tacticslate
    borderRadius: 28,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  rightFloatingDock: {
    position: 'absolute',
    right: 20,
    top: '14%',
    backgroundColor: '#1C222E', // Floating dark pill from Tacticslate
    borderRadius: 28,
    padding: 10,
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
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
  tool3dText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  tool2dText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
  },
  goldBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    backgroundColor: '#F59E0B',
    borderRadius: 4,
    paddingHorizontal: 3,
    paddingVertical: 1,
  },
  goldBadgeText: {
    fontSize: 7,
    fontWeight: '900',
    color: '#000000',
  },
  proGoldChip: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proGoldChipText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#000000',
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
});
