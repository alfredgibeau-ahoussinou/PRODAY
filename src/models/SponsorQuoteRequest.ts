export type SponsorQuotePackageTier = 'starter' | 'territorial' | 'national' | 'custom';

export type SponsorQuoteRequestStatus = 'pending' | 'sent' | 'rejected';

export interface SponsorQuoteRequest {
  id: string;
  company_name: string;
  contact_email: string;
  contact_name: string;
  contact_role?: string;
  phone?: string;
  budget?: string;
  goals?: string[];
  audience?: string[];
  regions?: string[];
  sports?: string[];
  message?: string;
  package_tier: SponsorQuotePackageTier;
  sector?: string;
  source: 'website' | 'app';
  sponsor_uid?: string;
  status: SponsorQuoteRequestStatus;
  admin_note?: string;
  quote_subject?: string;
  created_at: Date;
  sent_at?: Date;
  updated_at?: Date;
}

export const SPONSOR_QUOTE_PACKAGE_LABELS: Record<SponsorQuotePackageTier, string> = {
  starter: 'Découverte',
  territorial: 'Territorial',
  national: 'National Pro',
  custom: 'Sur-mesure',
};

export const SPONSOR_QUOTE_STATUS_LABELS: Record<SponsorQuoteRequestStatus, string> = {
  pending: 'En attente',
  sent: 'Devis envoyé',
  rejected: 'Refusé',
};
