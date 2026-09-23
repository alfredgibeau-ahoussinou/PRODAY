import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  cloneDiagram,
  createPresetDiagram,
  normalizeDiagramData,
  canViewDiagram,
  canEditDiagram,
  type ExerciseDiagramData,
  type UserContextForDiagramPermissions,
} from '../models/ExerciseDiagram';

export const COACH_DIAGRAMS_STORAGE_KEY = '@proday_coach_diagrams_v1';

export const SYSTEM_PRESET_DRILL_TYPES = [
  'rondo',
  'finishing',
  'circuit',
  'pressing',
  'possession',
] as const;

/**
 * Service de gestion et de persistance des schémas d'exercice d'entraînement du coach.
 * Assure la sauvegarde locale persistante, la séparation des copies et le respect des permissions.
 */
export const coachDiagramsService = {
  /**
   * Retourne tous les schémas accessibles à l'utilisateur :
   * 1. Les gabarits officiels intégrés (Rondo, Finition, Circuit, etc.)
   * 2. Les schémas créés par le coach dans son espace
   * 3. Les schémas partagés avec l'équipe ou le club du coach
   */
  async listDiagrams(user: UserContextForDiagramPermissions): Promise<ExerciseDiagramData[]> {
    try {
      const raw = await AsyncStorage.getItem(COACH_DIAGRAMS_STORAGE_KEY);
      const storedList: ExerciseDiagramData[] = raw
        ? (JSON.parse(raw) as unknown[]).map(normalizeDiagramData)
        : [];

      // Filtre selon les permissions de consultation
      const userAccessible = storedList.filter((d) => canViewDiagram(d, user));

      // Ajoute les gabarits de référence s'ils ne sont pas déjà personnalisés
      const presets = SYSTEM_PRESET_DRILL_TYPES.map((dt) => createPresetDiagram(dt));

      return [...presets, ...userAccessible];
    } catch {
      // En cas d'erreur de lecture, retour des gabarits par défaut
      return SYSTEM_PRESET_DRILL_TYPES.map((dt) => createPresetDiagram(dt));
    }
  },

  /**
   * Récupère un schéma par son identifiant unique.
   */
  async getDiagramById(id: string): Promise<ExerciseDiagramData | null> {
    if (!id) return null;

    // Vérifie s'il s'agit d'un gabarit de base
    const matchedPreset = SYSTEM_PRESET_DRILL_TYPES.find((dt) => id.includes(dt));
    if (id.startsWith('preset-') && matchedPreset) {
      return createPresetDiagram(matchedPreset);
    }

    try {
      const raw = await AsyncStorage.getItem(COACH_DIAGRAMS_STORAGE_KEY);
      if (!raw) return null;
      const list: ExerciseDiagramData[] = (JSON.parse(raw) as unknown[]).map(normalizeDiagramData);
      const found = list.find((d) => d.id === id);
      return found ?? null;
    } catch {
      return null;
    }
  },

  /**
   * Enregistre un schéma dans la bibliothèque du coach.
   * Si le schéma existe déjà, il est mis à jour ; sinon il est ajouté.
   */
  async saveDiagram(
    diagram: ExerciseDiagramData,
    user?: UserContextForDiagramPermissions,
  ): Promise<ExerciseDiagramData> {
    if (user && !canEditDiagram(diagram, user)) {
      throw new Error('Vous n’avez pas l’autorisation de modifier ce schéma.');
    }

    const normalized = normalizeDiagramData({
      ...diagram,
      updatedAt: new Date().toISOString(),
    });

    try {
      const raw = await AsyncStorage.getItem(COACH_DIAGRAMS_STORAGE_KEY);
      const list: ExerciseDiagramData[] = raw
        ? (JSON.parse(raw) as unknown[]).map(normalizeDiagramData)
        : [];

      const existingIndex = list.findIndex((d) => d.id === normalized.id);
      let nextList: ExerciseDiagramData[];

      if (existingIndex >= 0) {
        nextList = [...list];
        nextList[existingIndex] = normalized;
      } else {
        nextList = [normalized, ...list];
      }

      await AsyncStorage.setItem(COACH_DIAGRAMS_STORAGE_KEY, JSON.stringify(nextList));
      return normalized;
    } catch (e) {
      throw new Error(
        `Impossible d’enregistrer le schéma : ${e instanceof Error ? e.message : 'erreur de stockage'}`,
      );
    }
  },

  /**
   * Duplique un schéma existant pour créer une variante autonome, sans risque
   * de modifier l'original (indispensable pour réutiliser sans altérer les séances passées).
   */
  async duplicateDiagram(
    id: string,
    newName?: string,
    user?: UserContextForDiagramPermissions,
  ): Promise<ExerciseDiagramData> {
    let source = await this.getDiagramById(id);
    if (!source) {
      const matched = SYSTEM_PRESET_DRILL_TYPES.find((dt) => id.includes(dt));
      source = createPresetDiagram(matched || 'generic');
    }

    const cloned = cloneDiagram(source, newName, user?.uid);
    if (user?.clubId) cloned.clubId = user.clubId;
    if (user?.teamId) cloned.teamId = user.teamId;

    return this.saveDiagram(cloned, user);
  },

  /**
   * Supprime un schéma de la bibliothèque.
   */
  async deleteDiagram(id: string, user: UserContextForDiagramPermissions): Promise<boolean> {
    const raw = await AsyncStorage.getItem(COACH_DIAGRAMS_STORAGE_KEY);
    if (!raw) return false;
    const list: ExerciseDiagramData[] = (JSON.parse(raw) as unknown[]).map(normalizeDiagramData);
    const target = list.find((d) => d.id === id);

    if (!target) return false;
    if (!canEditDiagram(target, user)) {
      throw new Error('Vous n’avez pas les droits pour supprimer ce schéma.');
    }

    const filtered = list.filter((d) => d.id !== id);
    await AsyncStorage.setItem(COACH_DIAGRAMS_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  },
};
