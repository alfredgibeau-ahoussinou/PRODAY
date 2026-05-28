export interface ParentalContact {
  uid: string;
  name: string;
  role: string;
  approved: boolean;
}

export interface ParentalSettings {
  /** Compte enregistré comme mineur (< 18 ans) */
  is_minor?: boolean;
  guardian_name?: string;
  guardian_email?: string;
  guardian_consent?: boolean;
  supervision_enabled: boolean;
  contacts_filter_enabled: boolean;
  screen_time_enabled: boolean;
  daily_limit_minutes: number;
  active_days: string[];
  approved_contacts?: ParentalContact[];
}

export const DEFAULT_PARENTAL_SETTINGS: ParentalSettings = {
  supervision_enabled: true,
  contacts_filter_enabled: true,
  screen_time_enabled: true,
  daily_limit_minutes: 90,
  active_days: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven'],
  approved_contacts: [],
};
