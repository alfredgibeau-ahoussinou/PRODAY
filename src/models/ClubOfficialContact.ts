export type ClubOfficialContactKind = 'arbitre' | 'dirigeant';

export interface ClubOfficialContact {
  id: string;
  kind: ClubOfficialContactKind;
  name: string;
  role_label?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: Date;
  updated_at: Date;
}

export const CLUB_OFFICIAL_CONTACT_KIND_LABELS: Record<ClubOfficialContactKind, string> = {
  arbitre: 'Arbitre',
  dirigeant: 'Dirigeant',
};
