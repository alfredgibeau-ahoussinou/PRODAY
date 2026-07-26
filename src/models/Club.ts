import type { GeoPoint } from './User';
import type { ClubOfficialContact } from './ClubOfficialContact';

export interface Club {
  id: string;
  name: string;
  city: string;
  department?: string;
  location: GeoPoint;
  logo_url?: string;
  verified: boolean;
  categories: string[];
  sponsor_ids: string[];
  owner_uid: string;
  created_at: Date;
  /** Contacts utiles (arbitres, dirigeants) — pôle Club. */
  official_contacts?: ClubOfficialContact[];
}
