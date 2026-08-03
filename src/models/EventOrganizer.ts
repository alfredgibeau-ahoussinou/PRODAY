/**
 * Pôle Événements — organisateurs
 * (tournois associatifs / de quartier, académies, stages, détections, showcases, partenaires).
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

export interface EventResultEntry {
  rank: number;
  label: string;
  score?: string;
}

export interface EventResults {
  event_id: string;
  entries: EventResultEntry[];
  published: boolean;
  published_at?: Date;
}

export interface OrganizerEvent {
  id: string;
  organizer_uid: string;
  organizer_name?: string;
  kind: EventOrganizerKind;
  title: string;
  description?: string;
  city?: string;
  venue?: string;
  starts_at: Date;
  ends_at?: Date;
  status: EventOrganizerStatus;
  /** Capacité max inscriptions (null = illimité). */
  capacity?: number | null;
  /** Prix inscription en centimes EUR (0 / null = gratuit). */
  registration_price_cents?: number | null;
  media_urls?: string[];
  results?: EventResults;
  created_at: Date;
  updated_at: Date;
}

export interface EventRegistration {
  id: string;
  event_id: string;
  user_uid: string;
  display_name?: string;
  email?: string;
  status: EventRegistrationStatus;
  /** Stripe checkout session / payment intent id. */
  payment_ref?: string;
  amount_cents?: number;
  created_at: Date;
  updated_at: Date;
}

export interface CreateOrganizerEventInput {
  organizer_uid: string;
  organizer_name: string;
  kind: EventOrganizerKind;
  title: string;
  description?: string;
  city?: string;
  venue?: string;
  starts_at: Date;
  ends_at?: Date;
  capacity?: number | null;
  registration_price_cents?: number | null;
  /** Si true → status registration_open, sinon draft. */
  open_registration?: boolean;
}

export interface RegisterForEventInput {
  event_id: string;
  user_uid: string;
  display_name?: string;
  email?: string;
}

export const EVENT_KIND_LABELS: Record<EventOrganizerKind, string> = {
  tournament: 'Tournoi',
  academy: 'Académie',
  camp: 'Stage / camp',
  detection: 'Détection',
  showcase: 'Showcase',
  partner: 'Événement partenaire',
};

export const EVENT_STATUS_LABELS: Record<EventOrganizerStatus, string> = {
  draft: 'Brouillon',
  published: 'Publié',
  registration_open: 'Inscriptions ouvertes',
  registration_closed: 'Inscriptions closes',
  live: 'En cours',
  completed: 'Terminé',
  cancelled: 'Annulé',
};

export const EVENT_REGISTRATION_STATUS_LABELS: Record<EventRegistrationStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmé',
  waitlist: 'Liste d’attente',
  cancelled: 'Annulé',
  paid: 'Payé',
};

export const EVENT_ORGANIZER_KINDS: EventOrganizerKind[] = [
  'tournament',
  'academy',
  'camp',
  'detection',
  'showcase',
  'partner',
];

export const EVENT_ORGANIZER_FEATURES = [
  'create_events',
  'online_registration',
  'payments',
  'attendee_lists',
  'results',
  'media_share',
] as const;

export type EventOrganizerFeatureId = (typeof EVENT_ORGANIZER_FEATURES)[number];
