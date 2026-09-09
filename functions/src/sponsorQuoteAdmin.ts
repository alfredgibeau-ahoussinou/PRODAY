import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { isBrevoConfigured, sendTransactionalEmail } from './emailTransport';
import {
  buildDefaultQuoteHtml,
  buildDefaultQuoteSubject,
  buildDefaultQuoteText,
  buildDocumentRequestEmailHtml,
  buildDocumentRequestEmailText,
  buildThreadMessageEmailHtml,
  buildThreadMessageEmailText,
  type SponsorQuotePackageTier,
} from './sponsorQuoteMail';

function assertAdmin(context: functions.https.CallableContext): string {
  if (!context.auth?.token?.admin) {
    throw new functions.https.HttpsError('permission-denied', 'Admin only');
  }
  return context.auth.uid;
}

function assertSignedIn(context: functions.https.CallableContext): string {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
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

async function appendEvent(
  ref: admin.firestore.DocumentReference,
  event: {
    type: string;
    actor_uid: string;
    actor_role: 'admin' | 'sponsor' | 'system';
    summary: string;
    meta?: Record<string, unknown>;
  },
): Promise<void> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  await ref.collection('events').add({
    ...event,
    created_at: now,
  });
}

async function appendThread(
  ref: admin.firestore.DocumentReference,
  message: {
    author_role: 'admin' | 'sponsor' | 'system';
    author_uid: string;
    body: string;
    channel: 'internal' | 'email';
    email_sent?: boolean;
    email_error?: string;
    subject?: string;
  },
): Promise<string> {
  const now = admin.firestore.FieldValue.serverTimestamp();
  const doc = await ref.collection('thread').add({
    ...message,
    created_at: now,
  });
  return doc.id;
}

async function notifySponsorUid(
  db: admin.firestore.Firestore,
  sponsorUid: string | undefined,
  title: string,
  body: string,
  meta?: Record<string, unknown>,
): Promise<void> {
  const uid = String(sponsorUid ?? '').trim();
  if (!uid) return;
  await db.collection('staff_notifications').add({
    recipient_uid: uid,
    title,
    body,
    type: 'sponsor_quote',
    created_at: admin.firestore.FieldValue.serverTimestamp(),
    ...(meta ?? {}),
  });
}

/** Envoie un devis sponsor personnalisé à la demande — admin uniquement. */
export function createAdminSendSponsorQuoteHandler(db: admin.firestore.Firestore) {
  return async (
    data: {
      requestId?: string;
      subject?: string;
      htmlBody?: string;
      textBody?: string;
      allowResend?: boolean;
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
    if (status === 'rejected') {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Demande refusée — réouvrez-la avant d’envoyer un devis',
      );
    }
    if (status === 'sent' && !data.allowResend) {
      throw new functions.https.HttpsError(
        'failed-precondition',
        'Devis déjà envoyé — utilisez allowResend ou un message email',
      );
    }

    const contactEmail = String(entry.contact_email ?? '').trim().toLowerCase();
    if (!contactEmail) {
      throw new functions.https.HttpsError('failed-precondition', 'Email destinataire manquant');
    }

    const companyName = String(entry.company_name ?? '').trim();
    const contactName = String(entry.contact_name ?? '').trim();
    const packageTier =
      (String(entry.package_tier ?? 'custom') as SponsorQuotePackageTier) || 'custom';

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
      last_contact_at: now,
    });

    await appendThread(ref, {
      author_role: 'admin',
      author_uid: adminUid,
      body: text.slice(0, 4000),
      channel: 'email',
      email_sent: true,
      subject,
    });
    await appendEvent(ref, {
      type: 'quote_sent',
      actor_uid: adminUid,
      actor_role: 'admin',
      summary: `Devis envoyé · ${subject}`,
      meta: { contact_email: contactEmail },
    });
    await notifySponsorUid(
      db,
      entry.sponsor_uid ? String(entry.sponsor_uid) : undefined,
      'Devis ProDay reçu',
      `Votre devis partenaire pour ${companyName || 'votre entreprise'} a été envoyé par e-mail.`,
      { quote_request_id: requestId },
    );

    return { success: true, emailSent, emailError };
  };
}

/** Marque une demande de devis comme refusée — admin uniquement. */
export function createAdminRejectSponsorQuoteHandler(db: admin.firestore.Firestore) {
  return async (
    data: { requestId?: string; note?: string },
    context: functions.https.CallableContext,
  ): Promise<{ success: boolean }> => {
    const adminUid = assertAdmin(context);
    const requestId = String(data.requestId ?? '').trim();
    if (!requestId) {
      throw new functions.https.HttpsError('invalid-argument', 'requestId requis');
    }

    const { ref } = await loadQuoteRequest(db, requestId);
    const now = admin.firestore.FieldValue.serverTimestamp();
    const note = String(data.note ?? '').trim();
    const patch: Record<string, unknown> = {
      status: 'rejected',
      updated_at: now,
    };
    if (note) patch.admin_note = note;

    await ref.update(patch);
    await appendEvent(ref, {
      type: 'quote_rejected',
      actor_uid: adminUid,
      actor_role: 'admin',
      summary: note ? `Demande refusée · ${note}` : 'Demande refusée',
    });
    return { success: true };
  };
}

/** Message admin → sponsor (interne et/ou e-mail réel). */
export function createAdminSponsorQuoteMessageHandler(db: admin.firestore.Firestore) {
  return async (
    data: {
      requestId?: string;
      body?: string;
      subject?: string;
      sendEmail?: boolean;
    },
    context: functions.https.CallableContext,
  ): Promise<{ success: boolean; messageId: string; emailSent: boolean; emailError?: string }> => {
    const adminUid = assertAdmin(context);
    const requestId = String(data.requestId ?? '').trim();
    const body = String(data.body ?? '').trim().slice(0, 4000);
    if (!requestId) {
      throw new functions.https.HttpsError('invalid-argument', 'requestId requis');
    }
    if (!body) {
      throw new functions.https.HttpsError('invalid-argument', 'Message requis');
    }

    const { ref, data: entry } = await loadQuoteRequest(db, requestId);
    const contactEmail = String(entry.contact_email ?? '').trim().toLowerCase();
    const companyName = String(entry.company_name ?? '').trim();
    const contactName = String(entry.contact_name ?? '').trim();
    const sendEmail = data.sendEmail !== false;
    const subject =
      String(data.subject ?? '').trim() ||
      `ProDay Partenaires — ${companyName || 'votre demande'}`;

    let emailSent = false;
    let emailError: string | undefined;

    if (sendEmail) {
      if (!contactEmail) {
        throw new functions.https.HttpsError('failed-precondition', 'Email destinataire manquant');
      }
      if (!isBrevoConfigured()) {
        return {
          success: false,
          messageId: '',
          emailSent: false,
          emailError: 'Transport email non configuré (email.brevo_api_key + email.from_email)',
        };
      }
      try {
        await sendTransactionalEmail({
          to: contactEmail,
          subject,
          html: buildThreadMessageEmailHtml({ contactName, companyName, body }),
          text: buildThreadMessageEmailText({ contactName, companyName, body }),
        });
        emailSent = true;
      } catch (e) {
        emailError = e instanceof Error ? e.message : 'Envoi email impossible';
        console.error('[adminSponsorQuoteMessage]', e);
        return { success: false, messageId: '', emailSent: false, emailError };
      }
    }

    const messageId = await appendThread(ref, {
      author_role: 'admin',
      author_uid: adminUid,
      body,
      channel: sendEmail ? 'email' : 'internal',
      email_sent: emailSent,
      email_error: emailError,
      subject: sendEmail ? subject : undefined,
    });

    const now = admin.firestore.FieldValue.serverTimestamp();
    await ref.update({
      updated_at: now,
      last_contact_at: now,
      ...(sendEmail ? { last_email_subject: subject } : {}),
    });
    await appendEvent(ref, {
      type: sendEmail ? 'email_sent' : 'internal_note',
      actor_uid: adminUid,
      actor_role: 'admin',
      summary: sendEmail ? `E-mail · ${subject}` : `Note interne · ${body.slice(0, 80)}`,
    });
    if (sendEmail) {
      await notifySponsorUid(
        db,
        entry.sponsor_uid ? String(entry.sponsor_uid) : undefined,
        'Message ProDay Partenaires',
        body.slice(0, 160),
        { quote_request_id: requestId },
      );
    }

    return { success: true, messageId, emailSent, emailError };
  };
}

const DOC_LABELS: Record<string, string> = {
  kbis: 'Extrait Kbis',
  rib: 'RIB / IBAN',
  logo: 'Logo haute définition',
  identity: 'Pièce d’identité du contact',
  contract: 'Contrat / mandat signé',
  portfolio: 'Portfolio / références',
  other: 'Document complémentaire',
};

/** Demande de documents au sponsor — checklist + e-mail + notif. */
export function createAdminRequestSponsorQuoteDocsHandler(db: admin.firestore.Firestore) {
  return async (
    data: {
      requestId?: string;
      docTypes?: string[];
      customLabels?: string[];
      message?: string;
      sendEmail?: boolean;
    },
    context: functions.https.CallableContext,
  ): Promise<{ success: boolean; requestedIds: string[]; emailSent: boolean; emailError?: string }> => {
    const adminUid = assertAdmin(context);
    const requestId = String(data.requestId ?? '').trim();
    if (!requestId) {
      throw new functions.https.HttpsError('invalid-argument', 'requestId requis');
    }

    const types = Array.isArray(data.docTypes)
      ? data.docTypes.map((t) => String(t).trim().toLowerCase()).filter(Boolean).slice(0, 12)
      : [];
    const customs = Array.isArray(data.customLabels)
      ? data.customLabels.map((t) => String(t).trim()).filter(Boolean).slice(0, 6)
      : [];
    if (types.length === 0 && customs.length === 0) {
      throw new functions.https.HttpsError('invalid-argument', 'Au moins un document requis');
    }

    const { ref, data: entry } = await loadQuoteRequest(db, requestId);
    const contactEmail = String(entry.contact_email ?? '').trim().toLowerCase();
    const companyName = String(entry.company_name ?? '').trim();
    const contactName = String(entry.contact_name ?? '').trim();
    const note = String(data.message ?? '').trim().slice(0, 2000);
    const sendEmail = data.sendEmail !== false;

    const now = admin.firestore.FieldValue.serverTimestamp();
    const batch = db.batch();
    const requestedIds: string[] = [];
    const labels: string[] = [];

    for (const type of types) {
      const docRef = ref.collection('document_requests').doc();
      requestedIds.push(docRef.id);
      const label = DOC_LABELS[type] ?? type;
      labels.push(label);
      batch.set(docRef, {
        type,
        label,
        status: 'requested',
        requested_by: adminUid,
        requested_at: now,
        updated_at: now,
      });
    }
    for (const label of customs) {
      const docRef = ref.collection('document_requests').doc();
      requestedIds.push(docRef.id);
      labels.push(label);
      batch.set(docRef, {
        type: 'other',
        label,
        status: 'requested',
        requested_by: adminUid,
        requested_at: now,
        updated_at: now,
      });
    }
    batch.update(ref, {
      docs_pending: true,
      docs_requested_at: now,
      updated_at: now,
      last_contact_at: now,
    });
    await batch.commit();

    let emailSent = false;
    let emailError: string | undefined;
    const subject = `Documents demandés — ProDay Partenaires · ${companyName || 'votre dossier'}`;
    const bodyText =
      note ||
      `Afin de finaliser votre dossier partenaire ProDay, merci de nous transmettre : ${labels.join(', ')}.`;

    if (sendEmail) {
      if (!contactEmail) {
        throw new functions.https.HttpsError('failed-precondition', 'Email destinataire manquant');
      }
      if (!isBrevoConfigured()) {
        return {
          success: false,
          requestedIds,
          emailSent: false,
          emailError: 'Transport email non configuré (email.brevo_api_key + email.from_email)',
        };
      }
      try {
        await sendTransactionalEmail({
          to: contactEmail,
          subject,
          html: buildDocumentRequestEmailHtml({
            contactName,
            companyName,
            labels,
            message: note || undefined,
          }),
          text: buildDocumentRequestEmailText({
            contactName,
            companyName,
            labels,
            message: note || undefined,
          }),
        });
        emailSent = true;
      } catch (e) {
        emailError = e instanceof Error ? e.message : 'Envoi email impossible';
        console.error('[adminRequestSponsorQuoteDocs]', e);
      }
    }

    await appendThread(ref, {
      author_role: 'admin',
      author_uid: adminUid,
      body: bodyText,
      channel: sendEmail && emailSent ? 'email' : 'internal',
      email_sent: emailSent,
      email_error: emailError,
      subject: sendEmail ? subject : undefined,
    });
    await appendEvent(ref, {
      type: 'docs_requested',
      actor_uid: adminUid,
      actor_role: 'admin',
      summary: `Documents demandés · ${labels.join(', ')}`,
      meta: { requestedIds, emailSent },
    });
    await notifySponsorUid(
      db,
      entry.sponsor_uid ? String(entry.sponsor_uid) : undefined,
      'Documents demandés',
      `ProDay Partenaires demande : ${labels.join(', ')}.`,
      { quote_request_id: requestId },
    );

    return { success: true, requestedIds, emailSent, emailError };
  };
}

/** Sponsor dépose un document demandé (URL Storage déjà uploadée). */
export function createSponsorFulfillQuoteDocHandler(db: admin.firestore.Firestore) {
  return async (
    data: {
      requestId?: string;
      documentRequestId?: string;
      fileUrl?: string;
      fileName?: string;
    },
    context: functions.https.CallableContext,
  ): Promise<{ success: boolean }> => {
    const uid = assertSignedIn(context);
    const requestId = String(data.requestId ?? '').trim();
    const documentRequestId = String(data.documentRequestId ?? '').trim();
    const fileUrl = String(data.fileUrl ?? '').trim();
    if (!requestId || !documentRequestId || !fileUrl) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'requestId, documentRequestId et fileUrl requis',
      );
    }
    if (!/^https:\/\//i.test(fileUrl)) {
      throw new functions.https.HttpsError('invalid-argument', 'URL fichier invalide');
    }

    const { ref, data: entry } = await loadQuoteRequest(db, requestId);
    const sponsorUid = String(entry.sponsor_uid ?? '').trim();
    const isAdmin = Boolean(context.auth?.token?.admin);
    if (!isAdmin && sponsorUid !== uid) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Seul le sponsor lié à cette demande peut déposer le document',
      );
    }

    const docRef = ref.collection('document_requests').doc(documentRequestId);
    const docSnap = await docRef.get();
    if (!docSnap.exists) {
      throw new functions.https.HttpsError('not-found', 'Demande de document introuvable');
    }

    const now = admin.firestore.FieldValue.serverTimestamp();
    await docRef.update({
      status: 'uploaded',
      file_url: fileUrl,
      file_name: String(data.fileName ?? '').trim().slice(0, 200) || null,
      uploaded_by: uid,
      uploaded_at: now,
      updated_at: now,
    });

    const pendingSnap = await ref
      .collection('document_requests')
      .where('status', '==', 'requested')
      .limit(1)
      .get();
    await ref.update({
      docs_pending: !pendingSnap.empty,
      updated_at: now,
    });

    await appendEvent(ref, {
      type: 'doc_uploaded',
      actor_uid: uid,
      actor_role: isAdmin ? 'admin' : 'sponsor',
      summary: `Document déposé · ${String(docSnap.data()?.label ?? documentRequestId)}`,
    });
    await appendThread(ref, {
      author_role: isAdmin ? 'admin' : 'sponsor',
      author_uid: uid,
      body: `Document déposé : ${String(docSnap.data()?.label ?? documentRequestId)}`,
      channel: 'internal',
    });

    return { success: true };
  };
}

/** Liste thread / docs / events pour admin (ou sponsor lié). */
export function createGetSponsorQuoteDeskHandler(db: admin.firestore.Firestore) {
  return async (
    data: { requestId?: string },
    context: functions.https.CallableContext,
  ): Promise<{
    thread: Array<Record<string, unknown>>;
    documents: Array<Record<string, unknown>>;
    events: Array<Record<string, unknown>>;
  }> => {
    const uid = assertSignedIn(context);
    const requestId = String(data.requestId ?? '').trim();
    if (!requestId) {
      throw new functions.https.HttpsError('invalid-argument', 'requestId requis');
    }

    const { ref, data: entry } = await loadQuoteRequest(db, requestId);
    const isAdmin = Boolean(context.auth?.token?.admin);
    const sponsorUid = String(entry.sponsor_uid ?? '').trim();
    if (!isAdmin && sponsorUid !== uid) {
      throw new functions.https.HttpsError('permission-denied', 'Accès refusé');
    }

    const [threadSnap, docsSnap, eventsSnap] = await Promise.all([
      ref.collection('thread').orderBy('created_at', 'asc').limit(200).get(),
      ref.collection('document_requests').orderBy('requested_at', 'desc').limit(50).get(),
      ref.collection('events').orderBy('created_at', 'desc').limit(100).get(),
    ]);

    const mapDoc = (d: admin.firestore.QueryDocumentSnapshot) => {
      const raw = d.data();
      const created = raw.created_at as admin.firestore.Timestamp | undefined;
      const requested = raw.requested_at as admin.firestore.Timestamp | undefined;
      const uploaded = raw.uploaded_at as admin.firestore.Timestamp | undefined;
      return {
        id: d.id,
        ...raw,
        created_at: created?.toDate?.()?.toISOString?.() ?? null,
        requested_at: requested?.toDate?.()?.toISOString?.() ?? null,
        uploaded_at: uploaded?.toDate?.()?.toISOString?.() ?? null,
      };
    };

    return {
      thread: threadSnap.docs.map(mapDoc),
      documents: docsSnap.docs.map(mapDoc),
      events: eventsSnap.docs.map(mapDoc),
    };
  };
}
