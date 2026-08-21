import type { GeoPoint } from './User';

export interface Club {
  id: string;
  name: string;
  city: string;
  department?: string;
  location: GeoPoint;
  logo_url?: string;
  /** Couleur principale club (hex #RRGGBB). */
  primary_color?: string;
  /** Couleur secondaire club (hex #RRGGBB). */
  secondary_color?: string;
  verified: boolean;
  /** Suspension admin — le club reste en base mais est marqué hors service. */
  suspended?: boolean;
  /** Archivage soft (pas de suppression définitive). */
  archived?: boolean;
  /** Note interne admin (CRM). */
  admin_note?: string;
  categories: string[];
  sponsor_ids: string[];
  owner_uid: string;
  created_at: Date;
  updated_at?: Date;
}
