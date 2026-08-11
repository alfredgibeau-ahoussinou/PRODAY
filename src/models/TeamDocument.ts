export type TeamDocumentKind = 'tactics' | 'rules' | 'medical_form' | 'other';

/** Document partagé équipe (hors vault médical). */
export interface TeamDocument {
  id: string;
  club_id: string;
  team_id?: string;
  title: string;
  kind: TeamDocumentKind;
  storage_path: string;
  download_url?: string;
  mime_type?: string;
  uploaded_by: string;
  uploaded_by_name: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateTeamDocumentInput {
  club_id: string;
  team_id?: string;
  title: string;
  kind: TeamDocumentKind;
  storage_path: string;
  download_url?: string;
  mime_type?: string;
}
