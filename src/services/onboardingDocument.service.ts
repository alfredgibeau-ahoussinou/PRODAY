import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';
import { callFunction } from '../lib/firebaseFunctions';
import { normalizeImageMimeType } from './storage.service';
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
  if (Platform.OS !== 'web' && uri.startsWith('file://')) {
    return FileSystem.readAsStringAsync(uri, { encoding: 'base64' });
  }
  const response = await fetch(uri);
  if (!response.ok) throw new Error('Impossible de lire le fichier');
  const blob = await response.blob();
  const buffer = await blob.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
