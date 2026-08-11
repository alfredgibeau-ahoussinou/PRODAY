/**
 * Short-lived signed URL for personal / medical vault files after RBAC check.
 */
import * as functions from 'firebase-functions';
import { admin } from './firebaseAdmin';

type ResourceType = 'personal_document' | 'medical_document';

interface GrantDoc {
  owner_uid?: string;
  grantee_uid?: string;
  resource_type?: string;
  resource_id?: string | null;
  scope?: string;
  permissions?: string[];
  expires_at?: FirebaseFirestore.Timestamp | null;
  revoked_at?: FirebaseFirestore.Timestamp | null;
}

function isActiveGrant(g: GrantDoc, now: Date): boolean {
  if (g.revoked_at) return false;
  if (g.expires_at && g.expires_at.toDate().getTime() < now.getTime()) return false;
  return true;
}

async function writeAudit(input: {
  actor_uid: string;
  action: string;
  resource_type: string;
  resource_id: string;
  owner_uid: string;
  context?: string;
}): Promise<void> {
  await admin.firestore().collection('privacy_audit_log').add({
    ...input,
    context: input.context ?? null,
    created_at: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function assertAccess(input: {
  actorUid: string;
  resourceType: ResourceType;
  resourceId: string;
  permission: 'read' | 'download';
}): Promise<{ storagePath: string; ownerUid: string }> {
  const db = admin.firestore();
  const actorSnap = await db.doc(`users/${input.actorUid}`).get();
  const actor = actorSnap.data() ?? {};
  const actorRole = String(actor.role ?? '');
  const isAdmin = actorRole === 'admin' || actor.is_admin === true;

  let storagePath = '';
  let ownerUid = '';

  if (input.resourceType === 'personal_document') {
    const snap = await db.doc(`personal_documents/${input.resourceId}`).get();
    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', 'Document introuvable');
    }
    const data = snap.data()!;
    ownerUid = String(data.owner_uid ?? '');
    storagePath = String(data.storage_path ?? '');
  } else {
    const snap = await db.doc(`medical_documents/${input.resourceId}`).get();
    if (!snap.exists) {
      throw new functions.https.HttpsError('not-found', 'Document médical introuvable');
    }
    const data = snap.data()!;
    ownerUid = String(data.patient_uid ?? '');
    storagePath = String(data.storage_path ?? '');
  }

  if (!storagePath) {
    throw new functions.https.HttpsError('failed-precondition', 'Fichier indisponible');
  }

  if (input.actorUid === ownerUid || isAdmin) {
    if (isAdmin && input.actorUid !== ownerUid) {
      await writeAudit({
        actor_uid: input.actorUid,
        action: 'admin_break_glass',
        resource_type: input.resourceType,
        resource_id: input.resourceId,
        owner_uid: ownerUid,
      });
    }
    return { storagePath, ownerUid };
  }

  // Grants
  const grantsSnap = await db
    .collection('privacy_access_grants')
    .where('owner_uid', '==', ownerUid)
    .where('grantee_uid', '==', input.actorUid)
    .limit(40)
    .get();
  const now = new Date();
  const granted = grantsSnap.docs.some((d) => {
    const g = d.data() as GrantDoc;
    if (!isActiveGrant(g, now)) return false;
    if (!(g.permissions ?? []).includes(input.permission)) return false;
    if (g.scope === 'all_medical') {
      return input.resourceType === 'medical_document';
    }
    if (g.scope === 'all_personal') {
      return input.resourceType === 'personal_document';
    }
    return (
      g.scope === 'resource' &&
      g.resource_type === input.resourceType &&
      g.resource_id === input.resourceId
    );
  });
  if (granted) return { storagePath, ownerUid };

  // Treating physio for medical
  if (input.resourceType === 'medical_document' && actorRole === 'physio') {
    const appt = await db
      .collection('medical_appointments')
      .where('physio_uid', '==', input.actorUid)
      .where('patient_uid', '==', ownerUid)
      .limit(5)
      .get();
    const treating = appt.docs.some((d) => {
      const data = d.data();
      return data.treating_access_revoked !== true && data.status !== 'cancelled';
    });
    if (treating) return { storagePath, ownerUid };
  }

  // Parent with medical flag
  if (input.resourceType === 'medical_document' && actorRole === 'parent') {
    const parentOf: string[] = Array.isArray(actor.parent_of) ? actor.parent_of : [];
    if (parentOf.includes(ownerUid)) {
      const patientSnap = await db.doc(`users/${ownerUid}`).get();
      const privacy = patientSnap.data()?.parental_settings?.privacy ?? {};
      if (privacy.parent_can_access_medical === true) {
        return { storagePath, ownerUid };
      }
    }
  }

  throw new functions.https.HttpsError(
    'permission-denied',
    'Accès refusé à ce document sensible.',
  );
}

export const getSensitiveDocumentUrl = functions.https.onCall(async (data, context) => {
  if (!context.auth?.uid) {
    throw new functions.https.HttpsError('unauthenticated', 'Connexion requise');
  }
  const resourceType = data?.resource_type as ResourceType;
  const resourceId = String(data?.resource_id ?? '').trim();
  if (
    !resourceId ||
    (resourceType !== 'personal_document' && resourceType !== 'medical_document')
  ) {
    throw new functions.https.HttpsError('invalid-argument', 'Paramètres invalides');
  }

  const { storagePath, ownerUid } = await assertAccess({
    actorUid: context.auth.uid,
    resourceType,
    resourceId,
    permission: 'download',
  });

  const [url] = await admin
    .storage()
    .bucket()
    .file(storagePath)
    .getSignedUrl({
      action: 'read',
      expires: Date.now() + 5 * 60 * 1000,
    });

  await writeAudit({
    actor_uid: context.auth.uid,
    action: 'download',
    resource_type: resourceType,
    resource_id: resourceId,
    owner_uid: ownerUid,
  });

  return { url, expires_in_sec: 300 };
});

/** Server-side audit when medical documents are written. */
export const onMedicalDocumentWrite = functions.firestore
  .document('medical_documents/{docId}')
  .onWrite(async (change, context) => {
    const after = change.after.exists ? change.after.data() : null;
    const before = change.before.exists ? change.before.data() : null;
    const action = !before ? 'create' : !after ? 'delete' : 'update';
    const data = after ?? before;
    if (!data) return;
    await writeAudit({
      actor_uid: String(data.uploaded_by_uid ?? data.patient_uid ?? 'system'),
      action,
      resource_type: 'medical_document',
      resource_id: context.params.docId,
      owner_uid: String(data.patient_uid ?? ''),
      context: 'server_trigger',
    });
  });
