export type SponsorOfferType = 'equipment' | 'money' | 'visibility';

export interface SponsorOffer {
  id: string;
  company_name: string;
  logo_url: string;
  offer_type: SponsorOfferType;
  description: string;
  value: string;
  target_categories: string[];
  city: string;
  active: boolean;
  created_at: Date;
}

export interface ClubFundingGoal {
  id: string;
  club_id: string;
  title: string;
  target_amount_eur: number;
  raised_amount_eur: number;
  description: string;
}
