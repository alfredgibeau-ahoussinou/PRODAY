import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendFcmToUser } from './messaging';

const AUTO_APPROVE_CONFIDENCE = 0.88;
const MISTRAL_MODEL = 'pixtral-12b-2409';

interface MistralVerdict {
  approved: boolean;
  confidence: number;
  document_type_detected: string;
  summary_fr: string;
  rejection_reason_fr: string | null;
}

function getMistralApiKey(): string | null {
  return (
    functions.config().mistral?.api_key ??
    process.env.MISTRAL_API_KEY ??
    null
  );
}

function roleExpectationFr(role: string, verificationCheck?: string): string {
  if (role === 'player') {
    if (verificationCheck === 'club_license') {
      return 'licence FFF, carte licencié, attestation club officielle, certificat de licenciement';
    }
    if (verificationCheck === 'parental_consent') {
      return "autorisation parentale signée, pièce d'identité du responsable légal";
    }
    return "pièce d'identité du joueur (CNI, passeport), photo lisible, nom et date de naissance visibles";
  }
  switch (role) {
    case 'agent':
      return 'licence agent FIFA/FFF, carte professionnelle agent, attestation officielle';
    case 'organizer':
      return "pièce d'identité, attestation club, mandat organisateur de tournoi ou licence";
  }
  return "diplôme d'éducateur (BEF, DES, BEFF, UEFA), carte éducateur, attestation club officielle";
}

async function syncPlayerCheckAfterMistral(
  uid: string,
  checkId: string,
  verdict: MistralVerdict,
  autoApprove: boolean
): Promise<void> {
  const db = admin.firestore();
  const userRef = db.doc(`users/${uid}`);
  const snap = await userRef.get();
  if (!snap.exists) return;

  const pv = (snap.data()?.player_verification as Record<string, unknown>) ?? {};
  const checkStatus = autoApprove
    ? 'verified'
    : verdict.approved
      ? 'pending'
      : 'rejected';

  pv[checkId] = {
    status: checkStatus,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    ...(checkStatus === 'rejected'
      ? { rejection_reason: verdict.rejection_reason_fr ?? 'Document non conforme' }
      : {}),
  };

  const identityOk =
    checkId === 'identity'
      ? checkStatus === 'verified'
      : (pv.identity as { status?: string })?.status === 'verified';
  const clubOk = (pv.club_license as { status?: string })?.status === 'verified';

  let verification_status = 'PENDING';
  let is_verified = false;
  if (identityOk) {
    is_verified = true;
    verification_status = clubOk ? 'VERIFIED' : 'PENDING';
  }
  if (
    (pv.identity as { status?: string })?.status === 'rejected' ||
    (pv.club_license as { status?: string })?.status === 'rejected'
  ) {
    verification_status = 'REJECTED';
    is_verified = false;
  }

  await userRef.update({
    player_verification: pv,
    is_verified,
    verification_status,
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
    ...(clubOk && identityOk
      ? { verification_date: admin.firestore.FieldValue.serverTimestamp() }
      : {}),
  });
}

async function fetchDocumentAsDataUrl(storageUrl: string, mimeHint?: string): Promise<string | null> {
  const res = await fetch(storageUrl);
  if (!res.ok) return null;
  const contentType = res.headers.get('content-type') ?? mimeHint ?? 'image/jpeg';
  if (contentType.includes('pdf')) {
    return null;
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const base64 = buf.toString('base64');
  return `data:${contentType.split(';')[0]};base64,${base64}`;
}

async function callMistralVision(
  apiKey: string,
  role: string,
  displayName: string,
  imageDataUrl: string,
  verificationCheck?: string
): Promise<MistralVerdict | null> {
  const prompt = `Tu es l'assistant conformité de ProDay (football amateur/semi-pro).
Analyse ce document pour un compte "${role}" (${displayName}).
Documents acceptables pour ce rôle : ${roleExpectationFr(role, verificationCheck)}.

Réponds UNIQUEMENT en JSON valide (sans markdown) :
{
  "approved": boolean,
  "confidence": number entre 0 et 1,
  "document_type_detected": string,
  "summary_fr": string courte,
  "rejection_reason_fr": string ou null
}

approved=true seulement si le document semble authentique et correspond clairement au rôle.
En cas de doute, approved=false et confidence < 0.7.`;

  const res = await fetch('https://api.mistral.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MISTRAL_MODEL,
      temperature: 0.1,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: imageDataUrl },
          ],
        },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error('[mistral] API error', res.status, errText.slice(0, 400));
    return null;
  }

  const json = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const raw = json.choices?.[0]?.message?.content?.trim();
  if (!raw) return null;

  try {
    return JSON.parse(raw) as MistralVerdict;
  } catch {
    console.error('[mistral] invalid JSON', raw.slice(0, 200));
    return null;
  }
}

/** Analyse IA d'un document de vérification (déclenché après upload). */
export async function runMistralDocumentVerification(
  uid: string,
  docId: string
): Promise<void> {
  const apiKey = getMistralApiKey();
  const db = admin.firestore();
  const docRef = db.doc(`users/${uid}/documents/${docId}`);
  const docSnap = await docRef.get();
  if (!docSnap.exists) return;

  const docData = docSnap.data()!;
  const storageUrl = String(docData.storage_url ?? '');
  if (!storageUrl) return;

  const userSnap = await db.doc(`users/${uid}`).get();
  if (!userSnap.exists) return;
  const user = userSnap.data()!;
  const role = String(user.role ?? 'coach');
  const displayName = String(user.display_name ?? '');
  const verificationCheck = docData.verification_check as string | undefined;

  if (!apiKey) {
    await docRef.update({
      ai_verification: {
        status: 'skipped',
        summary_fr: 'Clé Mistral non configurée — revue manuelle admin.',
        analyzed_at: admin.firestore.FieldValue.serverTimestamp(),
      },
    });
    return;
  }

  await docRef.update({
    ai_verification: {
      status: 'processing',
      analyzed_at: admin.firestore.FieldValue.serverTimestamp(),
    },
  });

  const dataUrl = await fetchDocumentAsDataUrl(storageUrl);
  if (!dataUrl) {
    await docRef.update({
      ai_verification: {
        status: 'manual_review',
        summary_fr: 'PDF ou format non analysable automatiquement. Un admin validera sous 48 h.',
        confidence: 0,
        analyzed_at: admin.firestore.FieldValue.serverTimestamp(),
      },
    });
    return;
  }

  const verdict = await callMistralVision(apiKey, role, displayName, dataUrl, verificationCheck);
  if (!verdict) {
    await docRef.update({
      ai_verification: {
        status: 'manual_review',
        summary_fr: 'Analyse IA indisponible. Revue manuelle en cours.',
        analyzed_at: admin.firestore.FieldValue.serverTimestamp(),
      },
    });
    return;
  }

  const confidence = Math.min(1, Math.max(0, Number(verdict.confidence) || 0));
  const autoApprove = verdict.approved && confidence >= AUTO_APPROVE_CONFIDENCE;

  await docRef.update({
    ai_verification: {
      status: autoApprove ? 'approved' : verdict.approved ? 'manual_review' : 'rejected',
      approved: verdict.approved,
      confidence,
      document_type_detected: verdict.document_type_detected,
      summary_fr: verdict.summary_fr,
      rejection_reason_fr: verdict.rejection_reason_fr,
      analyzed_at: admin.firestore.FieldValue.serverTimestamp(),
    },
  });

  const userRef = db.doc(`users/${uid}`);

  if (role === 'player' && verificationCheck) {
    await syncPlayerCheckAfterMistral(uid, verificationCheck, verdict, autoApprove);
    const title = autoApprove
      ? 'Étape validée'
      : verdict.approved
        ? 'Vérification en cours'
        : 'Document refusé';
    const body = autoApprove
      ? `Votre justificatif « ${verificationCheck} » a été accepté par l'analyse IA.`
      : verdict.rejection_reason_fr ?? 'Consultez votre profil pour compléter la vérification.';
    await sendFcmToUser(uid, { title, body, data: { type: 'player_verification', verificationCheck } });
    return;
  }

  if (autoApprove) {
    await userRef.update({
      is_verified: true,
      verification_status: 'VERIFIED',
      verification_date: admin.firestore.FieldValue.serverTimestamp(),
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    await sendFcmToUser(uid, {
      title: 'Profil vérifié',
      body: 'Votre document a été validé automatiquement par ProDay. Messagerie complète débloquée.',
      data: { type: 'verification_ai_approved' },
    });
    return;
  }

  if (!verdict.approved && confidence >= 0.75) {
    await userRef.update({
      is_verified: false,
      verification_status: 'REJECTED',
      updated_at: admin.firestore.FieldValue.serverTimestamp(),
    });
    await sendFcmToUser(uid, {
      title: 'Document non conforme',
      body:
        verdict.rejection_reason_fr ??
        'Le document ne correspond pas aux attentes. Téléversez un autre justificatif.',
      data: { type: 'verification_ai_rejected' },
    });
    return;
  }

  await userRef.update({
    is_verified: false,
    verification_status: 'PENDING',
    updated_at: admin.firestore.FieldValue.serverTimestamp(),
  });
  await sendFcmToUser(uid, {
    title: 'Vérification en cours',
    body: 'Votre document est en revue (IA + équipe ProDay). Vous serez notifié sous 48 h.',
    data: { type: 'verification_pending' },
  });
}
