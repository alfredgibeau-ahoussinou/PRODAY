import type { GeoPoint } from './User';

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
}
