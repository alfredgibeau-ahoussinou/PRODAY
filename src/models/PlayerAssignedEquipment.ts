/**
 * Modèle pour les équipements et dotations assignés à un joueur par son club.
 */

export type AssignedEquipmentStatus =
  | 'allocated' // Dotation attribuée par le club
  | 'received' // Réception confirmée par le joueur
  | 'return_pending' // Demande de restitution en cours de validation staff
  | 'returned'; // Restitution validée par le staff

export type EquipmentExchangeStatus =
  | 'none'
  | 'size_exchange_requested'
  | 'issue_reported'
  | 'resolved';

export interface PlayerAssignedEquipment {
  id: string;
  club_id: string;
  player_uid: string;
  player_name: string;

  item_name: string; // ex: 'Maillot domicile officiel', 'Survêtement club', 'Chasuble d\'entraînement'
  category: 'kit' | 'match_kit' | 'warmup' | 'training_gear' | 'balls' | 'accessories' | 'medical';
  size?: string;
  barcode_or_ref?: string;

  assigned_date: Date;
  status: AssignedEquipmentStatus;
  received_at?: Date;

  // Demandes joueur (soumises à validation staff)
  exchange_status: EquipmentExchangeStatus;
  exchange_requested_size?: string;
  exchange_reason?: string;
  exchange_requested_at?: Date;

  issue_description?: string;
  issue_reported_at?: Date;

  return_requested_at?: Date;
  return_validated_at?: Date;
  return_validated_by?: string;

  staff_notes?: string;

  created_at: Date;
  updated_at: Date;
}

export interface AllocateEquipmentInput {
  club_id: string;
  player_uid: string;
  player_name: string;
  item_name: string;
  category: PlayerAssignedEquipment['category'];
  size?: string;
  barcode_or_ref?: string;
}
