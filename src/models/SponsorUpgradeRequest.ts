export type SponsorUpgradeTier = 'territorial';
export type SponsorUpgradeRequestStatus = 'pending' | 'contacted' | 'approved' | 'rejected';

export interface SponsorUpgradeRequest {
  id: string;
  sponsor_uid: string;
  tier: SponsorUpgradeTier;
  company: string;
  city: string;
  status: SponsorUpgradeRequestStatus;
  admin_note?: string;
  created_at: Date;
  contacted_at?: Date;
  approved_at?: Date;
  rejected_at?: Date;
  updated_at?: Date;
}
