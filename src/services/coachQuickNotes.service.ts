import AsyncStorage from '@react-native-async-storage/async-storage';

export interface CoachQuickNote {
  id: string;
  coachUid: string;
  clubId: string;
  teamId?: string;
  playerUid?: string;
  playerName?: string;
  eventId?: string;
  sessionTitle?: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface CoachQuickNotesFilter {
  coachUid?: string;
  clubId?: string;
  teamId?: string;
  playerUid?: string;
  eventId?: string;
  tag?: string;
  search?: string;
}

export const COACH_QUICK_NOTE_DEFAULT_TAGS = [
  '#tactique',
  '#effort',
  '#attitude',
  '#technique',
  '#blessure',
] as const;

export const COACH_QUICK_NOTE_SUGGESTIONS = [
  'Excellent pressing haut',
  'Baisse de régime physique',
  'Prise d’information remarquable',
  'Gêne musculaire signalée',
  'Très bonne implication et écoute',
  'Replacement défensif à corriger',
  'Excellente orientation du corps',
  'Manque d’intensité dans les duels',
] as const;

const STORAGE_KEY = '@proday_coach_quick_notes';

function generateNoteId(): string {
  return `cqn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

export const coachQuickNotesService = {
  /**
   * Récupère la liste de toutes les notes avec filtrage optionnel
   */
  async listNotes(filter?: CoachQuickNotesFilter): Promise<CoachQuickNote[]> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const notes: CoachQuickNote[] = JSON.parse(raw);
      if (!Array.isArray(notes)) return [];

      let filtered = notes;

      if (filter) {
        if (filter.coachUid) {
          filtered = filtered.filter((n) => n.coachUid === filter.coachUid);
        }
        if (filter.clubId) {
          filtered = filtered.filter((n) => n.clubId === filter.clubId);
        }
        if (filter.teamId) {
          filtered = filtered.filter((n) => n.teamId === filter.teamId);
        }
        if (filter.playerUid) {
          filtered = filtered.filter((n) => n.playerUid === filter.playerUid);
        }
        if (filter.eventId) {
          filtered = filtered.filter((n) => n.eventId === filter.eventId);
        }
        if (filter.tag) {
          const targetTag = filter.tag.toLowerCase();
          filtered = filtered.filter((n) =>
            Array.isArray(n.tags) && n.tags.some((t) => t.toLowerCase() === targetTag)
          );
        }
        if (filter.search) {
          const query = filter.search.toLowerCase().trim();
          filtered = filtered.filter(
            (n) =>
              n.content.toLowerCase().includes(query) ||
              (n.playerName && n.playerName.toLowerCase().includes(query)) ||
              (n.sessionTitle && n.sessionTitle.toLowerCase().includes(query)) ||
              (Array.isArray(n.tags) && n.tags.some((t) => t.toLowerCase().includes(query)))
          );
        }
      }

      // Tri par date de création décroissante (plus récente en premier)
      return filtered.sort((a, b) => {
        const timeA = new Date(a.createdAt).getTime();
        const timeB = new Date(b.createdAt).getTime();
        return timeB - timeA;
      });
    } catch (err) {
      console.warn('[coachQuickNotesService] Erreur lors de la lecture des notes:', err);
      return [];
    }
  },

  /**
   * Récupère une note spécifique par son ID
   */
  async getNote(id: string): Promise<CoachQuickNote | null> {
    if (!id) return null;
    const notes = await this.listNotes();
    return notes.find((n) => n.id === id) || null;
  },

  /**
   * Crée ou met à jour une note rapide
   */
  async saveNote(
    noteInput: Omit<CoachQuickNote, 'id' | 'createdAt'> & { id?: string; createdAt?: string }
  ): Promise<CoachQuickNote> {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      let notes: CoachQuickNote[] = [];
      if (raw) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            notes = parsed;
          }
        } catch {
          notes = [];
        }
      }
      const now = new Date().toISOString();

      let savedNote: CoachQuickNote;

      if (noteInput.id) {
        // Mise à jour
        const index = notes.findIndex((n) => n.id === noteInput.id);
        if (index >= 0) {
          savedNote = {
            ...notes[index],
            ...noteInput,
            id: noteInput.id,
            createdAt: noteInput.createdAt || notes[index].createdAt || now,
            updatedAt: now,
          };
          notes[index] = savedNote;
        } else {
          // Si l'ID est fourni mais non trouvé dans la liste, on crée
          savedNote = {
            ...noteInput,
            id: noteInput.id,
            createdAt: noteInput.createdAt || now,
            updatedAt: now,
          };
          notes.push(savedNote);
        }
      } else {
        // Nouvelle note
        savedNote = {
          ...noteInput,
          id: generateNoteId(),
          createdAt: noteInput.createdAt || now,
          tags: Array.isArray(noteInput.tags) ? noteInput.tags : [],
        };
        notes.push(savedNote);
      }

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notes));
      return savedNote;
    } catch (err) {
      console.warn('[coachQuickNotesService] Erreur lors de la sauvegarde de la note:', err);
      throw err;
    }
  },

  /**
   * Supprime une note par son identifiant
   */
  async deleteNote(id: string): Promise<boolean> {
    try {
      if (!id) return false;
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) return false;
      let notes: CoachQuickNote[] = [];
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          notes = parsed;
        }
      } catch {
        return false;
      }

      const initialLength = notes.length;
      const filtered = notes.filter((n) => n.id !== id);

      if (filtered.length !== initialLength) {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
        return true;
      }
      return false;
    } catch (err) {
      console.warn('[coachQuickNotesService] Erreur lors de la suppression de la note:', err);
      return false;
    }
  },

  /**
   * Vide l'intégralité des notes (utilitaire / tests)
   */
  async clearAllNotes(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (err) {
      console.warn('[coachQuickNotesService] Erreur lors du nettoyage des notes:', err);
    }
  },
};
