import { doc, onSnapshot } from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import type { AiVerificationResult } from '../utils/aiVerification';

export type { AiVerificationResult, AiVerificationStatus } from '../utils/aiVerification';
export { isAiVerificationPassing } from '../utils/aiVerification';

function mapAiVerification(raw: Record<string, unknown> | undefined): AiVerificationResult | null {
  if (!raw) return null;
  const status = String(raw.status ?? 'processing') as AiVerificationResult['status'];
  return {
    status,
    summary_fr: raw.summary_fr != null ? String(raw.summary_fr) : undefined,
    rejection_reason_fr:
      raw.rejection_reason_fr != null ? String(raw.rejection_reason_fr) : null,
    confidence: raw.confidence != null ? Number(raw.confidence) : undefined,
    document_type_detected:
      raw.document_type_detected != null ? String(raw.document_type_detected) : undefined,
  };
}

export function watchDocumentAiVerification(
  uid: string,
  documentId: string,
  onUpdate: (result: AiVerificationResult) => void
): () => void {
  const db = getDb();
  if (!db) {
    onUpdate({ status: 'skipped', summary_fr: 'Analyse locale indisponible.' });
    return () => {};
  }

  const ref = doc(db, 'users', uid, 'documents', documentId);
  return onSnapshot(
    ref,
    (snap) => {
      const mapped = mapAiVerification(
        snap.data()?.ai_verification as Record<string, unknown> | undefined
      );
      onUpdate(mapped ?? { status: 'processing' });
    },
    () => onUpdate({ status: 'skipped', summary_fr: 'Suivi IA indisponible. Revue manuelle.' })
  );
}

export function waitForDocumentAiVerification(
  uid: string,
  documentId: string,
  timeoutMs = 120_000
): Promise<AiVerificationResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const timer = setTimeout(() => {
      if (settled) return;
      settled = true;
      unsub();
      reject(new Error('L’analyse IA prend plus de temps que prévu. Réessayez dans un instant.'));
    }, timeoutMs);

    const unsub = watchDocumentAiVerification(uid, documentId, (result) => {
      if (result.status === 'processing') return;
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      unsub();
      resolve(result);
    });
  });
}
