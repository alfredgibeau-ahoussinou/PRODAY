export type SponsorOfferType = 'equipment' | 'money' | 'visibility';

export interface SponsorOffer {
  id: string;
  sponsor_uid?: string;
  company_name: string;
  logo_url: string;
  offer_type: SponsorOfferType;
  description: string;
  value: string;
  target_categories: string[];
  city: string;
  active: boolean;
  created_at: Date;
  /** Ville normalisée pour requêtes push géo */
  geo_target_city?: string;
  geo_push_sent_at?: Date;
  geo_push_recipients?: number;
  geo_push_delivered?: number;
  views_count?: number;
  clicks_count?: number;
  leads_count?: number;
}

export interface SponsorAnalytics {
  impressions: number;
  profile_views: number;
  offer_clicks: number;
  clubs_reached: number;
  leads: number;
  conversion_rate: number;
}

export interface SponsorActivityItem {
  id: string;
  type: 'offer_view' | 'lead' | 'contribution' | 'message' | 'offer_published';
  title: string;
  subtitle: string;
  at: Date;
}

export interface SponsorContribution {
  id: string;
  goal_id: string;
  goal_title: string;
  amount_eur: number;
  at: Date;
}

export interface SponsorProspect {
  id: string;
  owner_uid: string;
  name: string;
  city: string;
  category: string;
  match_score: number;
  reason: string;
}

export interface ClubFundingGoal {
  id: string;
  club_id: string;
  title: string;
  target_amount_eur: number;
  raised_amount_eur: number;
  description: string;
}
