import type { GeoPoint } from './User';
import type { ClubLivePackId } from '../content/clubLivePacks';

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
  /** Tags admin libres (ex. risque, vip, onboarding). */
  admin_tags?: string[];
  categories: string[];
  sponsor_ids: string[];
  owner_uid: string;
  /** N° d’affiliation FFF officiel (DOFA / FootClubs) — clé du cache inscription. */
  fff_affiliation_number?: string;
  /** Forfait commercial live / Veo / all-inclusive (devis). */
  commercial_offer_id?: ClubLivePackId;
  /** Montant HT/TTC convenu (admin) — source pour facture Stripe. */
  commercial_amount_eur?: number;
  commercial_amount_note?: string;
  commercial_amount_updated_at?: Date;
  commercial_amount_updated_by?: string;
  /** E-mail facturation (sinon owner). */
  billing_email?: string;
  stripe_customer_id?: string;
  stripe_invoice_id?: string;
  stripe_invoice_status?: string;
  stripe_invoice_hosted_url?: string;
  stripe_invoice_pdf?: string;
  stripe_invoice_amount_eur?: number;
  stripe_invoice_sent_at?: Date;
  created_at: Date;
  updated_at?: Date;
}
