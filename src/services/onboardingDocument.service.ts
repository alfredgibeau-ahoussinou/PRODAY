import { callFunction } from '../lib/firebaseFunctions';
import { normalizeImageMimeType, readFileAsBase64ForUpload } from './storage.service';
import type { PlayerVerificationCheckId } from '../models/User';
import type { AiVerificationResult } from '../utils/aiVerification';

const MAX_BYTES = 4 * 1024 * 1024;

interface EphemeralVerifyResponse {
  status: 'approved' | 'rejected';
  approved: boolean;
  confidence: number;
  document_type_detected: string;
  summary_fr: string;
  rejection_reason_fr: string | null;
}

async function readFileBase64(uri: string): Promise<string> {
  return readFileAsBase64ForUpload(uri);
}

function mapResponse(res: EphemeralVerifyResponse): AiVerificationResult {
  return {
    status: res.status,
    summary_fr: res.summary_fr,
    rejection_reason_fr: res.rejection_reason_fr,
    confidence: res.confidence,
    document_type_detected: res.document_type_detected,
  };
}

/**
 * Vérifie un document via Mistral IA sans l’enregistrer (Storage / documents Firestore).
 * Si conforme → profil mis à jour directement côté serveur.
 */
export async function verifyOnboardingDocumentWithAi(
  file: { uri: string; mimeType: string },
  verificationCheck?: PlayerVerificationCheckId
): Promise<AiVerificationResult> {
  const mime = normalizeImageMimeType(file.mimeType);
  if (mime.includes('pdf')) {
    return {
      status: 'rejected',
      summary_fr: 'PDF non pris en charge sans stockage.',
      rejection_reason_fr: 'Photographiez le document (JPG ou PNG).',
    };
  }

  const base64 = await readFileBase64(file.uri);
  const byteLength = Math.ceil((base64.length * 3) / 4);
  if (byteLength > MAX_BYTES) {
    throw new Error('Photo trop lourde (max 4 Mo). Rapprochez-vous ou réduisez la résolution.');
  }

  const res = await callFunction<
    {
      image_base64: string;
      mime_type: string;
      verification_check?: PlayerVerificationCheckId;
    },
    EphemeralVerifyResponse
  >('verifyOnboardingDocument', {
    image_base64: base64,
    mime_type: mime,
    verification_check: verificationCheck,
  });

  return mapResponse(res);
}
