/**
 * Modèle et configuration d'export pour le profil sportif partageable (PDF).
 * Permet au joueur de sélectionner délibérément les champs à inclure.
 * Exclut formellement les notes privées, données médicales et brouillons non publiés.
 */

export interface ExportProfileFieldsSelection {
  include_full_name: boolean;
  include_photo: boolean;
  include_birth_date: boolean; // Ou seulement l'année pour les mineurs
  include_nationality: boolean;
  include_positions: boolean; // Principale et secondaire
  include_strong_foot: boolean;
  include_height_weight: boolean;
  include_current_club: boolean;
  include_sporting_history: boolean;
  include_verified_stats: boolean; // Stats de match réelles validées
  include_contact_details: boolean; // Téléphone, email (ou coordonnées tuteur si mineur)
  custom_bio?: string;
}

export interface VerifiedSeasonStats {
  season_label: string;
  source: string; // ex: 'Feuilles de match officielles FFF / Club'
  matches_played: number;
  matches?: number;
  goals: number;
  assists: number;
  clean_sheets?: number;
  minutes_played?: number;
}

export interface SportingHistoryEntry {
  season: string;
  club_name: string;
  category_level: string; // ex: 'U18 Régional 1'
  achievements?: string;
}

export interface ShareableSportsProfileData {
  display_name: string;
  avatar_url?: string;
  age?: number;
  birth_year?: number;
  nationality?: string;
  primary_position: string;
  secondary_position?: string;
  strong_foot?: string;
  height_cm?: number;
  weight_kg?: number;
  club_name?: string;
  history: SportingHistoryEntry[];
  stats: VerifiedSeasonStats[];
  contact_email?: string;
  contact_phone?: string;
  guardian_contact?: string; // Coordonnées parentales si mineur
  is_minor: boolean;
  bio?: string;
  generated_at: Date;
}
