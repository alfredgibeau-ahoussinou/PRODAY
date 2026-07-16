import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { isBrevoConfigured, sendTransactionalEmail } from './emailTransport';
import {
  buildDefaultQuoteHtml,
  buildDefaultQuoteSubject,
  buildDefaultQuoteText,
  type SponsorQuotePackageTier,
} from './sponsorQuoteMail';

function assertAdmin(context: functions.https.CallableContext): string {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }
  return context.auth.uid;
}

async function loadQuoteRequest(
  db: admin.firestore.Firestore,
  requestId: string,
): Promise<{ ref: admin.firestore.DocumentReference; data: admin.firestore.DocumentData }> {
  const ref = db.collection('sponsor_quote_requests').doc(requestId);
  const snap = await ref.get();
  if (!snap.exists) {
    throw new functions.https.HttpsError('not-found', 'Demande de devis introuvable');
  }
  return { ref, data: snap.data()! };
}

/** Envoie un devis sponsor personnalisé à la demande — admin uniquement. */
export function createAdminSendSponsorQuoteHandler(db: admin.firestore.Firestore) {
  return async (
    data: {
      requestId?: string;
      subject?: string;
      htmlBody?: string;
      textBody?: string;
    },
    context: functions.https.CallableContext,
  ): Promise<{ success: boolean; emailSent: boolean; emailError?: string }> => {
    const adminUid = assertAdmin(context);
    const requestId = String(data.requestId ?? '').trim();
    if (!requestId) {
      throw new functions.https.HttpsError('invalid-argument', 'requestId requis');
    }

    const { ref, data: entry } = await loadQuoteRequest(db, requestId);
    const status = String(entry.status ?? 'pending');
    if (status === 'sent') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Devis déjà envoyé — renvoi non autorisé depuis cette action',
      );
    }

    const contactEmail = String(entry.contact_email ?? '').trim().toLowerCase();
    if (!contactEmail) {
      throw new functions.https.HttpsError('failed-precondition', 'Email destinataire manquant');
    }

    const companyName = String(entry.company_name ?? '').trim();
    const contactName = String(entry.contact_name ?? '').trim();
    const packageTier = (String(entry.package_tier ?? 'custom') as SponsorQuotePackageTier) || 'custom';

    const subject =
      String(data.subject ?? '').trim() || buildDefaultQuoteSubject(companyName);
    const html =
      String(data.htmlBody ?? '').trim() ||
      buildDefaultQuoteHtml({
        contactName,
        companyName,
        packageTier,
        budget: entry.budget ? String(entry.budget) : undefined,
        goals: Array.isArray(entry.goals) ? entry.goals.map(String) : undefined,
        regions: Array.isArray(entry.regions) ? entry.regions.map(String) : undefined,
      });
    const text =
      String(data.textBody ?? '').trim() ||
      buildDefaultQuoteText({
        contactName,
        companyName,
        packageTier,
        budget: entry.budget ? String(entry.budget) : undefined,
        goals: Array.isArray(entry.goals) ? entry.goals.map(String) : undefined,
        regions: Array.isArray(entry.regions) ? entry.regions.map(String) : undefined,
      });

    if (!isBrevoConfigured()) {
      return {
        success: false,
        emailSent: false,
        emailError: 'Transport email non configuré (email.brevo_api_key + email.from_email)',
      };
    }

    let emailSent = false;
    let emailError: string | undefined;

    try {
      await sendTransactionalEmail({
        to: contactEmail,
        subject,
        html,
        text,
      });
      emailSent = true;
    } catch (e) {
      emailError = e instanceof Error ? e.message : 'Envoi email impossible';
      console.error('[adminSendSponsorQuote]', e);
      return { success: false, emailSent: false, emailError };
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    await ref.update({
      status: 'sent',
      sent_at: now,
      sent_by: adminUid,
      quote_subject: subject,
      updated_at: now,
    });

    return { success: true, emailSent, emailError };
  };
}

/** Marque une demande de devis comme refusée — admin uniquement. */
export function createAdminRejectSponsorQuoteHandler(db: admin.firestore.Firestore) {
  return async (
    data: { requestId?: string; note?: string },
    context: functions.https.CallableContext,
  ): Promise<{ success: boolean }> => {
    assertAdmin(context);
    const requestId = String(data.requestId ?? '').trim();
    if (!requestId) {
      throw new functions.https.HttpsError('invalid-argument', 'requestId requis');
    }

    const { ref } = await loadQuoteRequest(db, requestId);
    const now = admin.firestore.FieldValue.serverTimestamp();
    const patch: Record<string, unknown> = {
      status: 'rejected',
      updated_at: now,
    };
    const note = String(data.note ?? '').trim();
    if (note) patch.admin_note = note;

    await ref.update(patch);
    return { success: true };
  };
}
