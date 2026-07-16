import * as functions from 'firebase-functions';
import { onDocumentCreated, onDocumentUpdated } from 'firebase-functions/v2/firestore';
import * as admin from 'firebase-admin';
import { admin as firebaseAdmin } from './firebaseAdmin';
import {
  buildAppointmentPlainText,
  renderAppointmentEmailHtml,
} from './appointmentEmailTemplate';
import { getEmailJsConfig } from './emailJsClient';
import { isBrevoConfigured, sendTransactionalEmail } from './emailTransport';

export type AppointmentEmailKind =
  | 'booking_request_physio'
  | 'booking_pending_patient'
  | 'booking_confirmed'
  | 'booking_cancelled';

type AppointmentDoc = {
  physio_uid: string;
  physio_name: string;
  patient_uid: string;
  patient_name: string;
  specialty?: string;
  start_at: admin.firestore.Timestamp | Date;
  end_at?: admin.firestore.Timestamp | Date;
  duration_min?: number;
  status?: string;
  motif?: string | null;
  location_label?: string | null;
};

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof admin.firestore.Timestamp) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function formatAppointmentDay(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

function formatAppointmentTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

function getSiteUrl(): string {
  const cfg = functions.config();
  return (
    (cfg.appointment?.site_url as string | undefined)?.trim() ||
    (cfg.beta?.site_url as string | undefined)?.trim() ||
    'https://proday75.fr'
  ).replace(/\/$/, '');
}

async function resolveUserEmail(uid: string): Promise<string | null> {
  const snap = await firebaseAdmin.firestore().doc(`users/${uid}`).get();
  const fromDoc = snap.data()?.email;
  if (typeof fromDoc === 'string' && fromDoc.trim()) {
    return fromDoc.trim().toLowerCase();
  }
  try {
    const user = await firebaseAdmin.auth().getUser(uid);
    return user.email?.trim().toLowerCase() ?? null;
  } catch {
    return null;
  }
}

export function buildAppointmentEmailJsParams(input: {
  to: string;
  kind: AppointmentEmailKind;
  recipientName: string;
  counterpartyName: string;
  startAt: Date;
  durationMin: number;
  locationLabel?: string;
  motif?: string;
  specialty?: string;
}): Record<string, string> {
  const siteUrl = getSiteUrl();
  const dateLabel = formatAppointmentDay(input.startAt);
  const timeLabel = formatAppointmentTime(input.startAt);

  const detailLines = [
    input.specialty ? `Spécialité : ${input.specialty}` : '',
    `Date : ${dateLabel}`,
    `Heure : ${timeLabel}`,
    `Durée : ${input.durationMin} min`,
    input.locationLabel ? `Lieu : ${input.locationLabel}` : '',
    input.motif ? `Motif : ${input.motif}` : '',
  ]
    .filter(Boolean)
    .join('\n');

  const copy: Record<
    AppointmentEmailKind,
    { subject: string; headline: string; bodyIntro: string; bodyAction: string; statusLabel: string }
  > = {
    booking_request_physio: {
      subject: 'Nouvelle demande de rendez-vous ProDay',
      headline: 'Nouvelle demande de rendez-vous',
      bodyIntro: `<strong>${input.counterpartyName}</strong> souhaite un rendez-vous avec vous.`,
      bodyAction: 'Consultez votre agenda ProDay pour confirmer ou refuser cette demande.',
      statusLabel: 'En attente de confirmation',
    },
    booking_pending_patient: {
      subject: 'Demande de rendez-vous enregistrée — ProDay',
      headline: 'Demande envoyée',
      bodyIntro: `Votre demande de rendez-vous avec <strong>${input.counterpartyName}</strong> a bien été enregistrée.`,
      bodyAction: 'Vous recevrez un email dès que le praticien aura confirmé ou refusé le créneau.',
      statusLabel: 'En attente de confirmation',
    },
    booking_confirmed: {
      subject: 'Rendez-vous confirmé — ProDay',
      headline: 'Rendez-vous confirmé',
      bodyIntro: `Votre rendez-vous avec <strong>${input.counterpartyName}</strong> est confirmé.`,
      bodyAction: 'Retrouvez les détails dans l’application ProDay (onglet Santé).',
      statusLabel: 'Confirmé',
    },
    booking_cancelled: {
      subject: 'Rendez-vous annulé — ProDay',
      headline: 'Rendez-vous annulé',
      bodyIntro: `Le rendez-vous avec <strong>${input.counterpartyName}</strong> a été annulé.`,
      bodyAction: 'Vous pouvez réserver un autre créneau depuis l’application ProDay.',
      statusLabel: 'Annulé',
    },
  };

  const c = copy[input.kind];

  return {
    email: input.to,
    to_email: input.to,
    user_email: input.to,
    subject: c.subject,
    headline: c.headline,
    body_intro: c.bodyIntro,
    body_action: c.bodyAction,
    body_detail: detailLines,
    recipient_name: input.recipientName,
    counterparty_name: input.counterpartyName,
    appointment_date: dateLabel,
    appointment_time: timeLabel,
    duration_min: String(input.durationMin),
    location_label: input.locationLabel ?? '',
    motif: input.motif ?? '',
    status_label: c.statusLabel,
    email_kind: input.kind,
    site_url: siteUrl,
    app_name: 'ProDay',
  };
}

async function sendAppointmentEmail(
  to: string,
  params: Record<string, string>
): Promise<boolean> {
  const emailJs = getEmailJsConfig('appointment');
  if (!isBrevoConfigured() && !emailJs) {
    console.warn(
      '[appointmentEmail] Transport non configuré (email.brevo_api_key ou appointment.emailjs_template_id)'
    );
    return false;
  }

  const html = renderAppointmentEmailHtml(params);
  const text = buildAppointmentPlainText(params);

  try {
    await sendTransactionalEmail(
      { to, subject: params.subject, html, text },
      emailJs ? { config: emailJs, templateParams: params } : undefined
    );
    return true;
  } catch (e) {
    console.error('[appointmentEmail] Envoi email:', e);
    return false;
  }
}

async function notifyFromAppointment(
  data: AppointmentDoc,
  kind: AppointmentEmailKind,
  recipientUid: string,
  recipientName: string,
  counterpartyName: string
): Promise<void> {
  const startAt = toDate(data.start_at);
  if (!startAt) return;

  const email = await resolveUserEmail(recipientUid);
  if (!email) {
    console.warn(`[appointmentEmail] Pas d'email pour ${recipientUid} (${kind})`);
    return;
  }

  const params = buildAppointmentEmailJsParams({
    to: email,
    kind,
    recipientName,
    counterpartyName,
    startAt,
    durationMin: Number(data.duration_min ?? 30),
    locationLabel: data.location_label ?? undefined,
    motif: data.motif ?? undefined,
    specialty: data.specialty,
  });

  await sendAppointmentEmail(email, params);
}

function parseAppointmentData(raw: FirebaseFirestore.DocumentData): AppointmentDoc {
  return raw as AppointmentDoc;
}

/** Nouveau rendez-vous → email praticien + patient. */
export async function onMedicalAppointmentCreatedHandler(
  snap: functions.firestore.QueryDocumentSnapshot
): Promise<void> {
  const data = parseAppointmentData(snap.data());
  if (data.status && data.status !== 'pending') return;

  await Promise.all([
    notifyFromAppointment(
      data,
      'booking_request_physio',
      data.physio_uid,
      data.physio_name,
      data.patient_name
    ),
    notifyFromAppointment(
      data,
      'booking_pending_patient',
      data.patient_uid,
      data.patient_name,
      data.physio_name
    ),
  ]);
}

/** Changement de statut → email patient (confirmé / annulé). */
export async function onMedicalAppointmentUpdatedHandler(
  change: functions.Change<functions.firestore.QueryDocumentSnapshot>
): Promise<void> {
  const before = parseAppointmentData(change.before.data());
  const after = parseAppointmentData(change.after.data());

  if (before.status === after.status) return;

  if (after.status === 'confirmed') {
    await notifyFromAppointment(
      after,
      'booking_confirmed',
      after.patient_uid,
      after.patient_name,
      after.physio_name
    );
    return;
  }

  if (after.status === 'cancelled') {
    await notifyFromAppointment(
      after,
      'booking_cancelled',
      after.patient_uid,
      after.patient_name,
      after.physio_name
    );
  }
}

const firestoreTriggerOptions = {
  document: 'medical_appointments/{appointmentId}',
  region: 'europe-west1',
} as const;

/** Nouveau rendez-vous → email praticien + patient (Gen2, europe-west1). */
export const onMedicalAppointmentCreated = onDocumentCreated(
  firestoreTriggerOptions,
  async (event) => {
    const snap = event.data;
    if (!snap) return;
    await onMedicalAppointmentCreatedHandler(snap);
  }
);

/** Changement de statut → email patient confirmé / annulé (Gen2, europe-west1). */
export const onMedicalAppointmentUpdated = onDocumentUpdated(
  firestoreTriggerOptions,
  async (event) => {
    const before = event.data?.before;
    const after = event.data?.after;
    if (!before || !after) return;
    await onMedicalAppointmentUpdatedHandler({ before, after });
  }
);
