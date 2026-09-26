/**
 * Modèle pour la checklist d'équipement par événement (match ou entraînement).
 * Combine les éléments obligatoires publiés par le coach et les affaires personnelles du joueur.
 * Les états cochés restent strictement privés pour chaque joueur.
 */

export interface ChecklistItem {
  id: string;
  label: string;
  is_required_by_coach: boolean;
  added_by_player: boolean;
  category?: 'gear' | 'clothes' | 'hygiene' | 'documents' | 'food_drink';
}

export interface PlayerEventChecklistState {
  id: string; // composite key: `${eventId}_${playerUid}`
  event_id: string;
  player_uid: string;

  // IDs des items cochés par le joueur
  checked_item_ids: string[];

  // Items personnalisés ajoutés par ce joueur pour cet événement
  personal_items: ChecklistItem[];

  updated_at: Date;
}
