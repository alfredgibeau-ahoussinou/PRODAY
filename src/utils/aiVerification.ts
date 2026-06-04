export type AiVerificationStatus =
  | 'processing'
  | 'approved'
  | 'manual_review'
  | 'rejected'
  | 'skipped';

export interface AiVerificationResult {
  status: AiVerificationStatus;
  summary_fr?: string;
  rejection_reason_fr?: string | null;
  confidence?: number;
  document_type_detected?: string;
}

/** Statuts IA permettant de passer à la vérification email. */
export function isAiVerificationPassing(status: AiVerificationStatus): boolean {
  return (
    status === 'approved' ||
    status === 'manual_review' ||
    status === 'skipped'
  );
}
