export type MembershipStatus = 'pending' | 'active' | 'suspended' | 'left' | 'rejected';

export type MembershipRole = 'player' | 'coach' | 'parent';

/** Lien membre (joueur, coach, parent) <-> équipe / club (affiliation validée). */
export interface Membership {
  id: string;
  club_id: string;
  team_id: string;
  player_uid: string;
  player_name: string;
  role?: MembershipRole;
  category?: string;
  identity_document_name?: string;
  identity_document_url?: string;
  identity_document_type?: 'cni' | 'passport' | 'fff_license' | 'club_mandate' | 'other';
  pre_registered_roster_id?: string;
  status: MembershipStatus;
  requested_at: Date;
  validated_at?: Date;
  validated_by_uid?: string;
  /** Coach/staff qui a invité le joueur (invitation pending). */
  invited_by_uid?: string;
  license_number?: string;
  created_at: Date;
  updated_at: Date;
}

export interface RequestMembershipInput {
  club_id: string;
  team_id?: string;
  player_uid: string;
  player_name: string;
  license_number?: string;
  role?: MembershipRole;
  category?: string;
  identity_document_name?: string;
  identity_document_url?: string;
  identity_document_type?: 'cni' | 'passport' | 'fff_license' | 'club_mandate' | 'other';
  pre_registered_roster_id?: string;
}

export interface InvitePlayerMembershipInput {
  club_id: string;
  team_id?: string;
  player_uid: string;
  player_name: string;
  invited_by_uid: string;
  role?: MembershipRole;
  category?: string;
}
