export interface ParentalContact {
  uid: string;
  name: string;
  role: string;
  approved: boolean;
}

export type ParentalUnlockRequestStatus = 'pending' | 'approved' | 'denied';

export interface ParentalUnlockRequest {
  requested_at: string;
  minutes: number;
  status: ParentalUnlockRequestStatus;
}

export type ParentalJournalEntryType = 'login' | 'message_sent' | 'section_time';

export interface ParentalJournalEntry {
  id: string;
  at: string;
  type: ParentalJournalEntryType;
  label: string;
  section?: string;
  minutes?: number;
}

export interface ParentalSettings {
  /** Compte enregistré comme mineur (< 18 ans) */
  is_minor?: boolean;
  guardian_name?: string;
  guardian_email?: string;
  /** Co-tuteur (second email autorisé) */
  guardian_email_secondary?: string;
  /** Code à 6 chiffres pour lier un co-tuteur */
  guardian_invite_code?: string;
  guardian_consent?: boolean;
  supervision_enabled: boolean;
  contacts_filter_enabled: boolean;
  screen_time_enabled: boolean;
  daily_limit_minutes: number;
  active_days: string[];
  approved_contacts?: ParentalContact[];
  /** Minutes bonus accordées par le tuteur (valables le jour `screen_time_bonus_day`) */
  screen_time_bonus_minutes?: number;
  screen_time_bonus_day?: string;
  /** Demande de déblocage exceptionnel */
  unlock_request?: ParentalUnlockRequest;
  /** Journal d'activité simplifié (sans contenu des messages) */
  activity_journal?: ParentalJournalEntry[];
}

/** Usage temps d’écran synchronisé depuis l’appareil du mineur (lecture tuteur). */
export interface ParentalRuntime {
  date: string;
  minutes_used: number;
}

export const DEFAULT_PARENTAL_SETTINGS: ParentalSettings = {
  supervision_enabled: true,
  contacts_filter_enabled: true,
  screen_time_enabled: true,
  daily_limit_minutes: 90,
  active_days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
  approved_contacts: [],
};
