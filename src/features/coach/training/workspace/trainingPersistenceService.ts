/**
 * Service de Persistance Offline-First pour l'Espace d'Entraînement Coach.
 * Conforme à la section 7 du Master Engineering Prompt.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Drill, TrainingSession } from './trainingWorkspaceModel';
import type { ExerciseDiagramData } from '../../../../models/ExerciseDiagram';
import { teamEventsService } from '../../../../services/teamEvents.service';

const STORAGE_KEYS = {
  ACTIVE_DRAFT_DRILL: 'proday_active_draft_drill_v1',
  ACTIVE_DRAFT_SESSION: 'proday_active_draft_session_v1',
  SAVED_DRILLS_LIBRARY: 'proday_saved_drills_library_v1',
};

export const trainingPersistenceService = {
  /** Sauvegarde locale d'un brouillon d'atelier avec horodatage */
  async saveDraftDrill(drill: Drill): Promise<void> {
    try {
      const payload = {
        ...drill,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT_DRILL, JSON.stringify(payload));
    } catch {
      // Ignoré si stockage restreint
    }
  },

  /** Récupération du dernier brouillon d'atelier sauvegardé */
  async loadDraftDrill(): Promise<Drill | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT_DRILL);
      if (!raw) return null;
      return JSON.parse(raw) as Drill;
    } catch {
      return null;
    }
  },

  /** Sauvegarde locale d'un brouillon de séance complète */
  async saveDraftSession(session: TrainingSession): Promise<void> {
    try {
      const payload = {
        ...session,
        updatedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_DRAFT_SESSION, JSON.stringify(payload));
    } catch {
      // Best-effort
    }
  },

  /** Récupération du dernier brouillon de séance */
  async loadDraftSession(): Promise<TrainingSession | null> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_DRAFT_SESSION);
      if (!raw) return null;
      return JSON.parse(raw) as TrainingSession;
    } catch {
      return null;
    }
  },

  /** Enregistre un atelier dans la bibliothèque personnelle du coach */
  async saveDrillToLibrary(drill: Drill): Promise<void> {
    try {
      const existingRaw = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_DRILLS_LIBRARY);
      const list: Drill[] = existingRaw ? JSON.parse(existingRaw) : [];
      const updated = [drill, ...list.filter((d) => d.id !== drill.id)];
      await AsyncStorage.setItem(STORAGE_KEYS.SAVED_DRILLS_LIBRARY, JSON.stringify(updated));
    } catch {
      // Best effort
    }
  },

  /** Liste les ateliers personnels enregistrés par le coach */
  async listSavedDrills(): Promise<Drill[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEYS.SAVED_DRILLS_LIBRARY);
      if (!raw) return [];
      return JSON.parse(raw) as Drill[];
    } catch {
      return [];
    }
  },

  /** Convertit un atelier Drill vers le format ExerciseDiagramData existant pour rétrocompatibilité */
  drillToLegacyDiagram(drill: Drill): ExerciseDiagramData {
    const f0 = drill.frames[0] || { players: [], equipment: [], drawings: [], zones: [] };
    return {
      id: drill.id,
      name: drill.name,
      width: 100,
      height: 100,
      pitchTemplate: drill.pitchConfig === 'full' ? 'full' : drill.pitchConfig === 'box' ? 'box' : 'half',
      elements: [
        ...f0.players.map((p) => ({
          id: p.id,
          type: 'player' as const,
          x: p.x,
          y: p.y,
          num: p.num,
          label: p.label,
          team: p.team === 'teamA' ? 'home' as const : p.team === 'teamB' ? 'away' as const : 'neutral' as const,
          color: p.color,
          hasBall: p.hasBall,
        })),
        ...f0.equipment.map((e) => ({
          id: e.id,
          type: 'equipment' as const,
          equipmentType: e.type as any,
          x: e.x,
          y: e.y,
          color: e.color,
          rotation: e.rotation,
        })),
        ...f0.drawings.map((d) => ({
          id: d.id,
          type: 'arrow' as const,
          kind: d.type === 'run' ? 'movement' as const : d.type === 'pass' ? 'pass' as const : 'dribble' as const,
          fromX: d.from.x,
          fromY: d.from.y,
          toX: d.to.x,
          toY: d.to.y,
          controlX: d.controlPoint?.x,
          controlY: d.controlPoint?.y,
          color: d.color,
        })),
      ],
      objective: drill.objective,
      instructions: drill.instructions,
      ownerUid: 'coach-local',
      createdAt: drill.createdAt,
      updatedAt: drill.updatedAt,
    };
  },
};

export const saveDrillToWorkspace = (drill: Drill) => trainingPersistenceService.saveDrillToLibrary(drill);
export const loadWorkspaceDrill = (_id?: string) => trainingPersistenceService.loadDraftDrill();
export const autoSaveWorkspaceDrill = (drill: Drill) => trainingPersistenceService.saveDraftDrill(drill);

export function convertDrillToScene(drill: Drill): any {
  return {
    id: drill.id,
    title: drill.name,
    entities: (drill.frames[0]?.players || []).map((p) => ({
      id: p.id,
      kind: p.team === 'gk' ? 'goalkeeper' : p.team === 'teamB' ? 'opponent' : 'player',
      label: p.label || String(p.num || ''),
      position: { x: p.x, y: p.y },
    })),
    ball: {
      position: drill.frames[0]?.equipment.find((e) => e.type === 'ball')
        ? { x: drill.frames[0].equipment.find((e) => e.type === 'ball')!.x, y: drill.frames[0].equipment.find((e) => e.type === 'ball')!.y }
        : { x: 50, y: 32 },
    },
    phases: drill.frames.map((f, i) => ({
      id: f.id || `phase-${i}`,
      label: f.title || `Phase ${i + 1}`,
      durationMs: f.durationMs,
      actions: f.drawings.map((d) => ({
        id: d.id,
        type: d.type === 'pass' ? 'pass' : 'move',
        mode: d.type === 'dribble' ? 'dribble' : 'run',
        to: d.to,
      })),
    })),
  };
}

export function convertSceneToDrill(scene: any): Drill {
  return {
    id: scene.id,
    name: scene.title || 'Exercice sans titre',
    category: 'rondo',
    objective: 'Atelier tactique',
    pitchConfig: 'full',
    durationMin: 15,
    playerCount: scene.entities?.length || 8,
    frames: (scene.phases || [{ id: 'f1', durationMs: 2500, label: 'Phase 1' }]).map((ph: any, idx: number) => ({
      id: ph.id || `f-${idx}`,
      order: idx,
      durationMs: ph.durationMs || 2500,
      title: ph.label,
      players: (scene.entities || []).map((e: any) => ({
        id: e.id,
        team: e.kind === 'goalkeeper' ? 'gk' : e.kind === 'opponent' ? 'teamB' : 'teamA',
        x: e.position?.x ?? 50,
        y: e.position?.y ?? 32,
        label: e.label,
      })),
      equipment: [
        { id: `ball-${idx}`, type: 'ball', x: scene.ball?.position?.x ?? 50, y: scene.ball?.position?.y ?? 32 },
      ],
      drawings: (ph.actions || []).map((act: any) => ({
        id: act.id,
        type: act.type === 'pass' ? 'pass' : act.mode === 'dribble' ? 'dribble' : 'run',
        from: { x: 50, y: 32 },
        to: act.to || { x: 50, y: 50 },
      })),
      zones: [],
    })),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
