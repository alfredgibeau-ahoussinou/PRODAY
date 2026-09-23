import AsyncStorage from '@react-native-async-storage/async-storage';

export type IntensityRealVsPlanned = 'lower' | 'as_expected' | 'higher';

export interface CoachSessionDebrief {
  id: string;
  eventId: string;
  coachUid: string;
  rpeScore: number; // 1 à 10, échelle de Borg
  intensityRealVsPlanned: IntensityRealVsPlanned;
  groupEngagement: number; // 1 à 5 étoiles
  keyTakeaways: string;
  fatiguedPlayerUids: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CoachSessionDebriefFilter {
  coachUid?: string;
  eventId?: string;
  minRpe?: number;
  maxRpe?: number;
  intensityRealVsPlanned?: IntensityRealVsPlanned;
}

export interface BorgRpeInfo {
  score: number;
  label: string;
  description: string;
  color: string;
}

export const BORG_RPE_SCALE: Record<number, BorgRpeInfo> = {
  1: { score: 1, label: 'Très très facile', description: 'Récupération active, effort imperceptible', color: '#10B981' },
  2: { score: 2, label: 'Très facile', description: 'Échauffement très doux, conversation aisée', color: '#10B981' },
  3: { score: 3, label: 'Facile / Modéré', description: 'Rythme aérobie de croisière', color: '#059669' },
  4: { score: 4, label: 'Modéré', description: 'Respiration accélérée, aisance respiratoire', color: '#0284C7' },
  5: { score: 5, label: 'Un peu dur', description: 'Rythme soutenu, début de fatigue musculaire', color: '#2563EB' },
  6: { score: 6, label: 'Dur', description: 'Effort soutenu et exigeant, concentration requise', color: '#D97706' },
  7: { score: 7, label: 'Très dur', description: 'Haute intensité, essoufflement marqué', color: '#EA580C' },
  8: { score: 8, label: 'Très très dur', description: 'Proche du seuil d’épuisement', color: '#DC2626' },
  9: { score: 9, label: 'Extrêmement dur', description: 'Effort quasi maximal, grande pénibilité', color: '#B91C1C' },
  10: { score: 10, label: 'Épuisement maximal', description: 'Incapacité à poursuivre, effort total', color: '#7F1D1D' },
};

export function getBorgRpeInfo(score: number): BorgRpeInfo {
  const clamped = Math.min(10, Math.max(1, Math.round(score)));
  return BORG_RPE_SCALE[clamped] || BORG_RPE_SCALE[5];
}

export const INTENSITY_OPTIONS: Array<{
  value: IntensityRealVsPlanned;
  label: string;
  shortLabel: string;
  icon: string;
  description: string;
}> = [
  {
    value: 'lower',
    label: 'Plus léger que prévu',
    shortLabel: 'Plus léger',
    icon: 'trending-down-outline',
    description: 'Rythme en deçà de la charge cible planifiée',
  },
  {
    value: 'as_expected',
    label: 'Conforme aux attentes',
    shortLabel: 'Conforme',
    icon: 'checkmark-circle-outline',
    description: 'Volume et intensité parfaitement alignés',
  },
  {
    value: 'higher',
    label: 'Plus dur que prévu',
    shortLabel: 'Plus dur',
    icon: 'flame-outline',
    description: 'Effort supérieur ou fatigue accrue du groupe',
  },
];

export const DEBRIEF_TAKEAWAY_PRESETS = [
  'Bonne intensité générale et forte implication',
  'Objectifs technico-tactiques atteints',
  'Baisse de lucidité physique en seconde partie',
  'Manque de communication entre les lignes',
  'Séance plus exigeante physiquement que prévu',
  'Plusieurs alertes musculaires à surveiller',
] as const;

const STORAGE_KEY = '@proday_coach_session_debriefs';

function generateDebriefId(): string {
  return `csd_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

function clampRpe(score: number): number {
  if (isNaN(score)) return 5;
  return Math.min(10, Math.max(1, Math.round(score)));
}

function clampEngagement(stars: number): number {
  if (isNaN(stars)) return 3;
  return Math.min(5, Math.max(1, Math.round(stars)));
}

export const coachSessionDebriefService = {
  /**
   * Récupère le débrief associé à une séance spécifique
   */
  async getDebriefForEvent(eventId: string): Promise<CoachSessionDebrief | null> {
    if (!eventId) return null;
    const all = await this.listDebriefs();
    return all.find((d) => d.eventId === eventId) || null;
  },

  /**
   * Récupère la liste de tous les débriefs enregistrés avec filtre optionnel
   */
  async listDebriefs(filter?: CoachSessionDebriefFilter): Promise<CoachSessionDebrief[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      let debriefs: CoachSessionDebrief[] = [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          debriefs = parsed;
        }
      } catch {
        return [];
      }

      let filtered = debriefs;

      if (filter) {
        if (filter.coachUid) {
          filtered = filtered.filter((d) => d.coachUid === filter.coachUid);
        }
        if (filter.eventId) {
          filtered = filtered.filter((d) => d.eventId === filter.eventId);
        }
        if (filter.intensityRealVsPlanned) {
          filtered = filtered.filter((d) => d.intensityRealVsPlanned === filter.intensityRealVsPlanned);
        }
        if (typeof filter.minRpe === 'number') {
          filtered = filtered.filter((d) => d.rpeScore >= filter.minRpe!);
        }
        if (typeof filter.maxRpe === 'number') {
          filtered = filtered.filter((d) => d.rpeScore <= filter.maxRpe!);
        }
      }

      return filtered.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
    } catch (err) {
      console.warn('[coachSessionDebriefService] Erreur lors de la lecture des débriefs:', err);
      return [];
    }
  },

  /**
   * Enregistre un nouveau débrief ou met à jour celui existant pour l'événement
   */
  async saveDebrief(
    input: Omit<CoachSessionDebrief, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
  ): Promise<CoachSessionDebrief> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      let debriefs: CoachSessionDebrief[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            debriefs = parsed;
          }
        } catch {
          debriefs = [];
        }
      }

      const now = new Date().toISOString();
      const rpeScore = clampRpe(input.rpeScore);
      const groupEngagement = clampEngagement(input.groupEngagement);
      const fatiguedPlayerUids = Array.isArray(input.fatiguedPlayerUids)
        ? Array.from(new Set(input.fatiguedPlayerUids))
        : [];

      // Recherche par id ou par eventId pour éviter les doublons sur la même séance
      const existingIndex = debriefs.findIndex(
        (d) => (input.id && d.id === input.id) || (input.eventId && d.eventId === input.eventId)
      );

      let saved: CoachSessionDebrief;

      if (existingIndex >= 0) {
        const existing = debriefs[existingIndex];
        saved = {
          ...existing,
          ...input,
          id: existing.id,
          rpeScore,
          groupEngagement,
          fatiguedPlayerUids,
          createdAt: input.createdAt || existing.createdAt || now,
          updatedAt: now,
        };
        debriefs[existingIndex] = saved;
      } else {
        saved = {
          ...input,
          id: input.id || generateDebriefId(),
          rpeScore,
          groupEngagement,
          fatiguedPlayerUids,
          createdAt: input.createdAt || now,
        };
        debriefs.push(saved);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(debriefs));
      return saved;
    } catch (err) {
      console.warn('[coachSessionDebriefService] Erreur lors de la sauvegarde du débrief:', err);
      throw err;
    }
  },

  /**
   * Supprime un débrief par son id ou par eventId
   */
  async deleteDebrief(idOrEventId: string): Promise<boolean> {
    try {
      if (!idOrEventId) return false;
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      let debriefs: CoachSessionDebrief[] = [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          debriefs = parsed;
        }
      } catch {
        return false;
      }

      const prevLen = debriefs.length;
      const filtered = debriefs.filter((d) => d.id !== idOrEventId && d.eventId !== idOrEventId);

      if (filtered.length !== prevLen) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[coachSessionDebriefService] Erreur lors de la suppression du débrief:', err);
      return false;
    }
  },

  /**
   * Vide l'ensemble des débriefs (utilitaire / tests)
   */
  async clearAllDebriefs(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('[coachSessionDebriefService] Erreur lors du nettoyage des débriefs:', err);
    }
  },
};
