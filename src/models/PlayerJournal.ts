/**
 * Modèle pour le journal personnel de football du joueur.
 * Strictement privé par défaut : non accessible aux clubs, parents, autres joueurs ou IA.
 */

export type JournalMood = 'great' | 'good' | 'neutral' | 'frustrated' | 'tired';

export interface PlayerJournalEntry {
  id: string;
  player_uid: string;

  title: string;
  content: string; // réflexions, sensations, auto-critique
  mood?: JournalMood;
  energy_rating?: number; // 1 à 5

  // Événement lié optionnel
  event_id?: string;
  event_title?: string;
  event_date?: Date;

  // Tags personnels (ex: 'tactique', 'mental', 'physique', 'gardien')
  tags?: string[];

  // Partage délibéré avec un coach spécifique
  is_shared: boolean;
  shared_with_coach_uid?: string;
  shared_with_coach_name?: string;
  shared_at?: Date;
  withdrawn_at?: Date; // Si le joueur a retiré le partage

  created_at: Date;
  updated_at: Date;
}

export interface CreatePlayerJournalInput {
  player_uid: string;
  title: string;
  content: string;
  mood?: PlayerJournalEntry['mood'];
  energy_rating?: number;
  event_id?: string;
  event_title?: string;
  event_date?: Date;
  tags?: string[];
}
