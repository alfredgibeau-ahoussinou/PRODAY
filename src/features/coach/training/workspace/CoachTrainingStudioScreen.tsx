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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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
import { CoachAnimationTimeline } from './CoachAnimationTimeline';
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

type ActivePaletteTab = 'players' | 'equipment' | 'drawings';

export const CoachTrainingStudioScreen: React.FC<CoachTrainingStudioScreenProps> = ({
  initialDrill,
  onBack,
  onSave,
}) => {
  const { tokens } = useCoachTheme();
  const { width: winWidth } = useWindowDimensions();
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
  const [activePitchConfig, setActivePitchConfig] = useState<PitchConfiguration>(
    drill.pitchConfig || 'box',
  );

  // Selection & Tools
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [selectedObjectType, setSelectedObjectType] = useState<'player' | 'equipment' | 'drawing' | 'zone' | null>(null);
  const [activeDrawingTool, setActiveDrawingTool] = useState<DrawingType | null>(null);
  const [paletteTab, setPaletteTab] = useState<ActivePaletteTab>('players');
  const [selectedEquipmentColor, setSelectedEquipmentColor] = useState<string>('#F97316');

  // Animation Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackTimeMs, setPlaybackTimeMs] = useState<number>(0);
  const [playbackSpeed, setPlaybackSpeed] = useState<0.5 | 1.0 | 2.0>(1.0);
  const [showGhosts, setShowGhosts] = useState<boolean>(true);

  // Modals
  const [helpModalVisible, setHelpModalVisible] = useState<boolean>(false);
  const [aiModalVisible, setAiModalVisible] = useState<boolean>(false);
  const [libraryModalVisible, setLibraryModalVisible] = useState<boolean>(false);

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
          return 0; // loop
        }
        return next;
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [isPlaying, drill, playbackSpeed]);

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
    (label: string, team: TeamSide) => {
      pushHistory();
      const id = generateTokenId(team);
      const newPlayer: PlayerToken = {
        id,
        team,
        num: team === 'gk' ? 1 : currentFrame.players.filter((p) => p.team === team).length + 2,
        label,
        x: Math.round(45 + Math.random() * 10),
        y: Math.round(25 + Math.random() * 10),
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
    (type: EquipmentType, color: string = '#F97316') => {
      pushHistory();
      const id = generateTokenId(`equip-${type}`);
      const newEquip: EquipmentToken = {
        id,
        type,
        color,
        x: Math.round(40 + Math.random() * 15),
        y: Math.round(20 + Math.random() * 15),
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

  const handleDuplicateFrame = useCallback(
    (index: number) => {
      pushHistory();
      const source = drill.frames[index];
      const dup: DrillFrame = {
        ...JSON.parse(JSON.stringify(source)),
        id: generateTokenId('frame'),
        title: `${source.title || 'Phase'} (copie)`,
        order: drill.frames.length,
      };

      setDrill((prev) => ({
        ...prev,
        frames: [...prev.frames, dup],
      }));
      setActiveFrameIndex(drill.frames.length);
    },
    [pushHistory, drill.frames],
  );

  const handleDeleteFrame = useCallback(
    (index: number) => {
      if (drill.frames.length <= 1) {
        Alert.alert('Action impossible', 'Un exercice doit contenir au moins une phase tactique.');
        return;
      }
      pushHistory();
      setDrill((prev) => {
        const filtered = prev.frames.filter((_, idx) => idx !== index);
        const reindexed = filtered.map((f, i) => ({ ...f, order: i }));
        return { ...prev, frames: reindexed };
      });
      setActiveFrameIndex((curr) => Math.max(0, curr - 1));
    },
    [pushHistory, drill.frames.length],
  );

  const handleFrameDurationChange = useCallback(
    (index: number, deltaMs: number) => {
      pushHistory();
      setDrill((prev) => {
        const updated = prev.frames.map((f, idx) => {
          if (idx === index) {
            const newDur = Math.max(500, Math.min(15000, f.durationMs + deltaMs));
            return { ...f, durationMs: newDur };
          }
          return f;
        });
        return { ...prev, frames: updated };
      });
    },
    [pushHistory],
  );

  // Pitch configuration switcher
  const handlePitchConfigChange = useCallback(
    (config: PitchConfiguration) => {
      pushHistory();
      setActivePitchConfig(config);
      setDrill((prev) => ({ ...prev, pitchConfig: config }));
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
      Alert.alert('Exercice sauvegardé', `"${drill.name}" a été enregistré dans votre studio tactique.`);
    }
  }, [drill, onSave]);

  const canvasWidth = isDesktop ? Math.min(winWidth - 360, 920) : winWidth - 24;
  const canvasHeight = isDesktop ? 500 : 360;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Top Studio Action Bar */}
      <View style={styles.topBar}>
        <View style={styles.topLeftGroup}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.iconCircleBtn} accessibilityLabel="Retour">
              <Ionicons name="arrow-back" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          <TextInput
            value={drill.name}
            onChangeText={(text) => setDrill((prev) => ({ ...prev, name: text }))}
            placeholder="Titre de l’exercice"
            placeholderTextColor={tokens.muted}
            style={styles.drillTitleInput}
          />

          <View style={styles.saveStatusBadge}>
            <View
              style={[
                styles.saveDot,
                saveStatus === 'saved' ? styles.saveDotGreen : styles.saveDotOrange,
              ]}
            />
            <Text style={styles.saveStatusText}>
              {saveStatus === 'saved' ? 'Enregistré' : 'Enregistrement...'}
            </Text>
          </View>
        </View>

        <View style={styles.topRightGroup}>
          {/* 2D / 3D Mode Toggle */}
          <View style={styles.modeToggleGroup}>
            <TouchableOpacity
              onPress={() => setViewMode('2d')}
              style={[styles.modeToggleBtn, viewMode === '2d' && styles.modeToggleBtnActive]}
            >
              <Text style={[styles.modeToggleText, viewMode === '2d' && styles.modeToggleTextActive]}>
                2D
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setViewMode('3d')}
              style={[styles.modeToggleBtn, viewMode === '3d' && styles.modeToggleBtnActive]}
            >
              <Text style={[styles.modeToggleText, viewMode === '3d' && styles.modeToggleTextActive]}>
                3D Perspective
              </Text>
            </TouchableOpacity>
          </View>

          {/* 3D Camera Presets */}
          {viewMode === '3d' && (
            <View style={styles.cameraPresetsRow}>
              {(['top', 'front', 'side', 'isometric'] as Camera3DPreset[]).map((cam) => (
                <TouchableOpacity
                  key={cam}
                  onPress={() => setCameraPreset(cam)}
                  style={[styles.camChip, cameraPreset === cam && styles.camChipActive]}
                >
                  <Text style={[styles.camChipText, cameraPreset === cam && styles.camChipTextActive]}>
                    {cam === 'top' ? 'Haut' : cam === 'front' ? 'Face' : cam === 'side' ? 'Côté' : 'Iso'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Undo / Redo */}
          <TouchableOpacity
            onPress={handleUndo}
            disabled={history.length === 0}
            style={[styles.iconCircleBtn, history.length === 0 && styles.btnDisabled]}
          >
            <Ionicons name="arrow-undo" size={17} color={history.length > 0 ? '#FFFFFF' : tokens.muted} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleRedo}
            disabled={redoStack.length === 0}
            style={[styles.iconCircleBtn, redoStack.length === 0 && styles.btnDisabled]}
          >
            <Ionicons name="arrow-redo" size={17} color={redoStack.length > 0 ? '#FFFFFF' : tokens.muted} />
          </TouchableOpacity>

          {/* Modals & Actions */}
          <TouchableOpacity
            onPress={() => setAiModalVisible(true)}
            style={styles.aiBadgeBtn}
            accessibilityLabel="Générateur IA"
          >
            <Ionicons name="sparkles" size={14} color="#00E676" />
            <Text style={styles.aiBadgeBtnText}>Assistant</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setLibraryModalVisible(true)}
            style={styles.libBadgeBtn}
            accessibilityLabel="Bibliothèque"
          >
            <Ionicons name="book-outline" size={14} color="#FFFFFF" />
            <Text style={styles.libBadgeBtnText}>Bibliothèque</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleClearPitch}
            style={styles.iconCircleBtn}
            accessibilityLabel="Effacer"
          >
            <Ionicons name="trash-outline" size={17} color="#FF5252" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSaveDrill}
            style={styles.savePrimaryBtn}
            accessibilityLabel="Sauvegarder"
          >
            <Ionicons name="save" size={15} color="#000000" />
            <Text style={styles.savePrimaryBtnText}>Enregistrer</Text>
          </TouchableOpacity>

          {/* Help Button */}
          <TouchableOpacity
            onPress={() => setHelpModalVisible(true)}
            style={styles.helpBtn}
            accessibilityLabel="Aide"
          >
            <Text style={styles.helpBtnText}>?</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Workspace Layout */}
      <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
        {/* Canvas Area */}
        <View style={styles.canvasContainer}>
          {/* Pitch Configuration Quick Selector */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pitchSelectorScroll}
          >
            {PITCH_CONFIGURATIONS.map((p) => {
              const active = activePitchConfig === p.id;
              return (
                <TouchableOpacity
                  key={p.id}
                  onPress={() => handlePitchConfigChange(p.id)}
                  style={[styles.pitchConfigPill, active && styles.pitchConfigPillActive]}
                >
                  <Text
                    style={[
                      styles.pitchConfigPillText,
                      active && styles.pitchConfigPillTextActive,
                    ]}
                  >
                    {p.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Interactive Pitch Engine */}
          <View style={styles.pitchSurfaceWrapper}>
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
              interactive
              width={canvasWidth}
              height={canvasHeight}
            />

            {/* Contextual Inspector Floating Panel */}
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

          {/* Animation Timeline Bar */}
          <CoachAnimationTimeline
            drill={drill}
            activeFrameIndex={activeFrameIndex}
            onSelectFrame={setActiveFrameIndex}
            onAddFrame={handleAddFrame}
            onDuplicateFrame={handleDuplicateFrame}
            onDeleteFrame={handleDeleteFrame}
            onAdjustDuration={handleFrameDurationChange}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying((p) => !p)}
            onRestart={() => {
              setIsPlaying(false);
              setPlaybackTimeMs(0);
              setActiveFrameIndex(0);
            }}
            onStepFrame={(dir) => {
              if (dir === -1) setActiveFrameIndex((i) => Math.max(0, i - 1));
              else setActiveFrameIndex((i) => Math.min(drill.frames.length - 1, i + 1));
            }}
            playbackSpeed={playbackSpeed}
            onChangeSpeed={(spd) => setPlaybackSpeed(spd)}
            showGhosts={showGhosts}
            onToggleGhosts={() => setShowGhosts((g) => !g)}
            currentTimeMs={playbackTimeMs}
            onScrubTime={(timeMs: number) => {
              setIsPlaying(false);
              setPlaybackTimeMs(timeMs);
            }}
          />
        </View>

        {/* Tactical Palette Drawer */}
        <View style={[styles.paletteDrawer, isDesktop && styles.paletteDrawerDesktop]}>
          <View style={styles.paletteTabs}>
            {[
              { id: 'players', label: 'Joueurs', icon: 'account-group' },
              { id: 'equipment', label: 'Matériel', icon: 'soccer-field' },
              { id: 'drawings', label: 'Tracés', icon: 'vector-line' },
            ].map((t) => {
              const isAct = paletteTab === t.id;
              return (
                <TouchableOpacity
                  key={t.id}
                  onPress={() => setPaletteTab(t.id as any)}
                  style={[styles.paletteTabBtn, isAct && styles.paletteTabBtnActive]}
                >
                  <MaterialCommunityIcons
                    name={t.icon as any}
                    size={16}
                    color={isAct ? '#00E676' : tokens.muted}
                  />
                  <Text
                    style={[styles.paletteTabBtnText, isAct && styles.paletteTabBtnTextActive]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <ScrollView contentContainerStyle={styles.paletteContent}>
            {paletteTab === 'players' && (
              <View style={styles.paletteSection}>
                <Text style={styles.sectionTitle}>Équipe A (Bleus)</Text>
                <View style={styles.tokenGrid}>
                  {(['GK', 'DEF', 'MIL', 'ATT'] as const).map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => addPlayerToken(role, 'teamA')}
                      style={[styles.addTokenBtn, styles.teamABorder]}
                    >
                      <View style={[styles.tokenDot, styles.teamABg]}>
                        <Text style={styles.tokenDotText}>{role === 'GK' ? 'G' : 'A'}</Text>
                      </View>
                      <Text style={styles.tokenLabel}>{role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Équipe B (Rouges)</Text>
                <View style={styles.tokenGrid}>
                  {(['GK', 'DEF', 'MIL', 'ATT'] as const).map((role) => (
                    <TouchableOpacity
                      key={role}
                      onPress={() => addPlayerToken(role, 'teamB')}
                      style={[styles.addTokenBtn, styles.teamBBorder]}
                    >
                      <View style={[styles.tokenDot, styles.teamBBg]}>
                        <Text style={styles.tokenDotText}>{role === 'GK' ? 'G' : 'B'}</Text>
                      </View>
                      <Text style={styles.tokenLabel}>{role}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.sectionTitle}>Jokers & Staff</Text>
                <View style={styles.tokenGrid}>
                  <TouchableOpacity
                    onPress={() => addPlayerToken('Joker', 'neutral')}
                    style={[styles.addTokenBtn, styles.jokerBorder]}
                  >
                    <View style={[styles.tokenDot, styles.jokerBg]}>
                      <Text style={[styles.tokenDotText, { color: '#000' }]}>J</Text>
                    </View>
                    <Text style={styles.tokenLabel}>Joker</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => addPlayerToken('Coach', 'coach')}
                    style={styles.addTokenBtn}
                  >
                    <View style={[styles.tokenDot, { backgroundColor: '#333' }]}>
                      <Text style={styles.tokenDotText}>C</Text>
                    </View>
                    <Text style={styles.tokenLabel}>Coach</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {paletteTab === 'equipment' && (
              <View style={styles.paletteSection}>
                <Text style={styles.sectionTitle}>Couleur des plots & coupelles</Text>
                <View style={styles.colorPickerRow}>
                  {['#F97316', '#FACC15', '#2563EB', '#DC2626', '#FFFFFF'].map((col) => {
                    const sel = selectedEquipmentColor === col;
                    return (
                      <TouchableOpacity
                        key={col}
                        onPress={() => setSelectedEquipmentColor(col)}
                        style={[
                          styles.colorCircle,
                          { backgroundColor: col },
                          sel && styles.colorCircleSelected,
                        ]}
                      />
                    );
                  })}
                </View>

                <Text style={styles.sectionTitle}>Matériel d’entraînement</Text>
                <View style={styles.tokenGrid}>
                  {EQUIPMENT_PRESETS.map((eq: { type: EquipmentType; label: string; icon: string }) => (
                    <TouchableOpacity
                      key={eq.type}
                      onPress={() => addEquipmentToken(eq.type, selectedEquipmentColor)}
                      style={styles.addTokenBtn}
                    >
                      <Ionicons name={eq.icon as any} size={20} color="#00E676" />
                      <Text style={styles.tokenLabel}>{eq.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {paletteTab === 'drawings' && (
              <View style={styles.paletteSection}>
                <Text style={styles.sectionTitle}>Flèches & Trajectoires</Text>
                <View style={styles.drawingsList}>
                  <TouchableOpacity
                    onPress={() => setActiveDrawingTool((t) => (t === 'run' ? null : 'run'))}
                    style={[
                      styles.drawingToolBtn,
                      activeDrawingTool === 'run' && styles.drawingToolBtnActive,
                    ]}
                  >
                    <MaterialCommunityIcons name="ray-start-arrow" size={20} color="#00E676" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drawingToolTitle}>Course du joueur</Text>
                      <Text style={styles.drawingToolSub}>Flèche continue avec pointe</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveDrawingTool((t) => (t === 'pass' ? null : 'pass'))}
                    style={[
                      styles.drawingToolBtn,
                      activeDrawingTool === 'pass' && styles.drawingToolBtnActive,
                    ]}
                  >
                    <MaterialCommunityIcons name="vector-line" size={20} color="#FFEB3B" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drawingToolTitle}>Passe au sol</Text>
                      <Text style={styles.drawingToolSub}>Flèche en pointillés jaunes</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={() => setActiveDrawingTool((t) => (t === 'dribble' ? null : 'dribble'))}
                    style={[
                      styles.drawingToolBtn,
                      activeDrawingTool === 'dribble' && styles.drawingToolBtnActive,
                    ]}
                  >
                    <MaterialCommunityIcons name="sine-wave" size={20} color="#40C4FF" />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.drawingToolTitle}>Conduite de balle</Text>
                      <Text style={styles.drawingToolSub}>Ondulation serpentine</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>

      {/* Modals */}
      <CoachWorkspaceHelpModal
        visible={helpModalVisible}
        onClose={() => setHelpModalVisible(false)}
      />

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0A0A0C',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#111215',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  topLeftGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  topRightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconCircleBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.35,
  },
  drillTitleInput: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
    minWidth: 160,
    maxWidth: 260,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  saveStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
  },
  saveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  saveDotGreen: {
    backgroundColor: '#00E676',
  },
  saveDotOrange: {
    backgroundColor: '#FF9100',
  },
  saveStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  modeToggleGroup: {
    flexDirection: 'row',
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    padding: 2,
  },
  modeToggleBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  modeToggleBtnActive: {
    backgroundColor: '#00E676',
  },
  modeToggleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#8E8E93',
  },
  modeToggleTextActive: {
    color: '#000000',
  },
  cameraPresetsRow: {
    flexDirection: 'row',
    gap: 4,
  },
  camChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  camChipActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: '#00E676',
  },
  camChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A0A0A0',
  },
  camChipTextActive: {
    color: '#00E676',
  },
  aiBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 230, 118, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(0, 230, 118, 0.3)',
  },
  aiBadgeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#00E676',
  },
  libBadgeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  libBadgeBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  savePrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#00E676',
  },
  savePrimaryBtnText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#000000',
  },
  helpBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  helpBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  mainLayout: {
    flex: 1,
    flexDirection: 'column',
  },
  mainLayoutDesktop: {
    flexDirection: 'row',
  },
  canvasContainer: {
    flex: 1,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  pitchSelectorScroll: {
    gap: 8,
    paddingBottom: 8,
  },
  pitchConfigPill: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  pitchConfigPillActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.15)',
    borderWidth: 1,
    borderColor: '#00E676',
  },
  pitchConfigPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#9E9E9E',
  },
  pitchConfigPillTextActive: {
    color: '#00E676',
    fontWeight: '700',
  },
  pitchSurfaceWrapper: {
    position: 'relative',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    backgroundColor: '#0B2412',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paletteDrawer: {
    backgroundColor: '#111215',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  paletteDrawerDesktop: {
    width: 320,
    borderTopWidth: 0,
    borderLeftWidth: 1,
    borderLeftColor: 'rgba(255, 255, 255, 0.08)',
  },
  paletteTabs: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  paletteTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
  },
  paletteTabBtnActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#00E676',
  },
  paletteTabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#777777',
  },
  paletteTabBtnTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  paletteContent: {
    padding: 16,
  },
  paletteSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#9E9E9E',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tokenGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  addTokenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  teamABorder: {
    borderColor: 'rgba(41, 121, 255, 0.4)',
  },
  teamBBorder: {
    borderColor: 'rgba(255, 23, 68, 0.4)',
  },
  jokerBorder: {
    borderColor: 'rgba(255, 214, 0, 0.4)',
  },
  tokenDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  teamABg: {
    backgroundColor: '#2979FF',
  },
  teamBBg: {
    backgroundColor: '#FF1744',
  },
  jokerBg: {
    backgroundColor: '#FFD600',
  },
  tokenDotText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  tokenLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  colorPickerRow: {
    flexDirection: 'row',
    gap: 12,
  },
  colorCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorCircleSelected: {
    borderColor: '#FFFFFF',
    transform: [{ scale: 1.15 }],
  },
  drawingsList: {
    gap: 8,
  },
  drawingToolBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  drawingToolBtnActive: {
    backgroundColor: 'rgba(0, 230, 118, 0.1)',
    borderColor: '#00E676',
  },
  drawingToolTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  drawingToolSub: {
    fontSize: 11,
    color: '#8E8E93',
  },
});
