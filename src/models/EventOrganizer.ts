/**
 * Pôle Événements — scaffolding organisateurs
 * (tournois, académies, stages, détections, showcases, partenaires).
 *
 * TODO: paiements en ligne Stripe/IAP, listes d'inscrits sync, résultats live, partage média.
 */

export type EventOrganizerKind =
  | 'tournament'
  | 'academy'
  | 'camp'
  | 'detection'
  | 'showcase'
  | 'partner';

export type EventOrganizerStatus =
  | 'draft'
  | 'published'
  | 'registration_open'
  | 'registration_closed'
  | 'live'
  | 'completed'
  | 'cancelled';

export type EventRegistrationStatus =
  | 'pending'
  | 'confirmed'
  | 'waitlist'
  | 'cancelled'
  | 'paid';

export interface OrganizerEvent {
  id: string;
  organizer_uid: string;
  kind: EventOrganizerKind;
  title: string;
  description?: string;
  city?: string;
  starts_at: Date;
  ends_at?: Date;
  status: EventOrganizerStatus;
  /** Capacité max inscriptions (null = illimité). */
  capacity?: number | null;
  /** Prix inscription en centimes EUR — TODO wiring paiement. */
  registration_price_cents?: number | null;
  media_urls?: string[];
  created_at: Date;
  updated_at: Date;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_uid: string;
  display_name?: string;
  status: EventRegistrationStatus;
  /** TODO: payment_intent_id Stripe / store. */
  payment_ref?: string;
  created_at: Date;
  updated_at: Date;
}

export const EVENT_KIND_LABELS: Record<EventOrganizerKind, string> = {
  tournament: 'Tournoi',
  academy: 'Académie',
  camp: 'Stage / camp',
  detection: 'Détection',
  showcase: 'Showcase',
  partner: 'Événement partenaire',
};

export const EVENT_ORGANIZER_FEATURES = [
  'create_events',
  'online_registration',
  'payments', // TODO
  'attendee_lists',
  'results',
  'media_share',
] as const;

export type EventOrganizerFeatureId = (typeof EVENT_ORGANIZER_FEATURES)[number];
