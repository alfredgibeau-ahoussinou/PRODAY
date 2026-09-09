export type SponsorQuotePackageTier = 'starter' | 'territorial' | 'national' | 'custom';

export type SponsorQuoteRequestStatus = 'pending' | 'sent' | 'rejected';

export type SponsorQuoteDocType =
  | 'kbis'
  | 'rib'
  | 'logo'
  | 'identity'
  | 'contract'
  | 'portfolio'
  | 'other';

export type SponsorQuoteDocStatus = 'requested' | 'uploaded' | 'waived';

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
  docs_pending?: boolean;
  /** Au moins un document a été déposé par le sponsor — visible admin à télécharger. */
  has_uploaded_docs?: boolean;
  last_doc_uploaded_at?: Date;
  last_contact_at?: Date;
  created_at: Date;
  sent_at?: Date;
  updated_at?: Date;
}

export interface SponsorQuoteThreadMessage {
  id: string;
  author_role: 'admin' | 'sponsor' | 'system';
  author_uid: string;
  body: string;
  channel: 'internal' | 'email';
  email_sent?: boolean;
  email_error?: string;
  subject?: string;
  created_at: Date;
}

export interface SponsorQuoteDocumentRequest {
  id: string;
  type: SponsorQuoteDocType | string;
  label: string;
  status: SponsorQuoteDocStatus;
  file_url?: string;
  file_name?: string;
  requested_at: Date;
  uploaded_at?: Date;
}

export interface SponsorQuoteEvent {
  id: string;
  type: string;
  actor_uid: string;
  actor_role: 'admin' | 'sponsor' | 'system';
  summary: string;
  created_at: Date;
}

export const SPONSOR_QUOTE_PACKAGE_LABELS: Record<SponsorQuotePackageTier, string> = {
  starter: 'Découverte',
  territorial: 'Territorial',
  national: 'National Pro',
  custom: 'Sur-mesure',
};

export const SPONSOR_QUOTE_PACKAGE_AMOUNTS: Record<SponsorQuotePackageTier, string> = {
  starter: '0 €',
  territorial: '49 €/mois',
  national: '99 €/mois',
  custom: 'Sur devis',
};

export const SPONSOR_QUOTE_STATUS_LABELS: Record<SponsorQuoteRequestStatus, string> = {
  pending: 'En attente',
  sent: 'Devis envoyé',
  rejected: 'Refusé',
};

export const SPONSOR_QUOTE_DOC_TYPE_OPTIONS: { id: SponsorQuoteDocType; label: string }[] = [
  { id: 'kbis', label: 'Extrait Kbis' },
  { id: 'rib', label: 'RIB / IBAN' },
  { id: 'logo', label: 'Logo HD' },
  { id: 'identity', label: 'Pièce d’identité' },
  { id: 'contract', label: 'Contrat / mandat' },
  { id: 'portfolio', label: 'Portfolio' },
  { id: 'other', label: 'Autre' },
];
