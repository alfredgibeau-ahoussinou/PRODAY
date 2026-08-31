/**
 * Auth + patch joueur pour `validateProfile`.
 * Duplique volontairement `src/config/admin.ts` + `applyAdminPlayerVerificationDecision`
 * (functions ne peuvent pas importer le client Expo).
 */

import * as functions from 'firebase-functions';

export const PLATFORM_ADMIN_EMAILS = [
  'proday.admin@gmail.com',
  'semedoyohan1@gmail.com',
] as const;

type CheckStatus = 'not_submitted' | 'pending' | 'verified' | 'rejected';

export type PlayerVerificationCheck = {
  status: CheckStatus;
  document_id?: string;
  rejection_reason?: string;
  [k: string]: unknown;
};

export type PlayerVerificationState = {
  identity: PlayerVerificationCheck;
  club_license: PlayerVerificationCheck;
  parental_consent?: PlayerVerificationCheck;
};

function normalizeEmail(email: unknown): string {
  return String(email ?? '')
    .trim()
    .toLowerCase();
}

function extraAdminEmailsFromEnv(): string[] {
  const raw = [
    process.env.ADMIN_EMAILS,
    process.env.PLATFORM_ADMIN_EMAILS,
  ]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .join(',');
  return raw
    .split(',')
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
}

export function isPlatformAdminEmail(email: string | null | undefined): boolean {
  const normalized = normalizeEmail(email);
  if (!normalized) return false;
  const allow = new Set<string>([...PLATFORM_ADMIN_EMAILS, ...extraAdminEmailsFromEnv()]);
  return allow.has(normalized);
}

/** Claim `admin` **ou** email fondateur / liste PLATFORM_ADMIN. */
export function assertCanValidateProfile(context: functions.https.CallableContext): string {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Sign in required');
  }
  if (context.auth.token.admin === true) {
    return context.auth.uid;
  }
  const email = normalizeEmail(context.auth.token.email);
  if (isPlatformAdminEmail(email)) {
    return context.auth.uid;
  }
  throw new functions.https.HttpsError('permission-denied', 'Admin only');
}

function defaultPlayerVerificationState(hasParental: boolean): PlayerVerificationState {
  return {
    identity: { status: 'not_submitted' },
    club_license: { status: 'not_submitted' },
    ...(hasParental ? { parental_consent: { status: 'not_submitted' as const } } : {}),
  };
}

function asCheck(value: unknown): PlayerVerificationCheck | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const rec = value as Record<string, unknown>;
  const status = String(rec.status ?? 'not_submitted') as CheckStatus;
  return { ...rec, status } as PlayerVerificationCheck;
}

function applyForcedCheck(
  check: PlayerVerificationCheck | undefined,
  status: 'verified' | 'rejected',
  rejectionReason?: string,
): PlayerVerificationCheck {
  const next: PlayerVerificationCheck = {
    ...(check ?? { status: 'not_submitted' }),
    status,
  };
  if (status === 'rejected') {
    next.rejection_reason = rejectionReason?.trim() || 'Refusé par l’administrateur';
  } else {
    delete next.rejection_reason;
  }
  return next;
}

export function applyAdminPlayerVerificationDecision(
  existing: unknown,
  action: 'approve' | 'reject',
  rejectionReason?: string,
): {
  player_verification: PlayerVerificationState;
  verification_status: 'VERIFIED' | 'REJECTED';
  is_verified: boolean;
  onboarding_documents_submitted?: boolean;
} {
  const verified = action === 'approve';
  const checkStatus = verified ? 'verified' : 'rejected';
  const raw =
    existing && typeof existing === 'object'
      ? (existing as Record<string, unknown>)
      : undefined;
  const existingState: PlayerVerificationState | undefined = raw
    ? {
        identity: asCheck(raw.identity) ?? { status: 'not_submitted' },
        club_license: asCheck(raw.club_license) ?? { status: 'not_submitted' },
        ...(raw.parental_consent
          ? { parental_consent: asCheck(raw.parental_consent) }
          : {}),
      }
    : undefined;

  const base = defaultPlayerVerificationState(Boolean(existingState?.parental_consent));
  const pv: PlayerVerificationState = {
    ...base,
    ...existingState,
    identity: applyForcedCheck(
      existingState?.identity ?? base.identity,
      checkStatus,
      rejectionReason,
    ),
    club_license: applyForcedCheck(
      existingState?.club_license ?? base.club_license,
      checkStatus,
      rejectionReason,
    ),
  };

  if (verified && (existingState?.parental_consent || pv.parental_consent)) {
    pv.parental_consent = applyForcedCheck(
      existingState?.parental_consent ?? pv.parental_consent,
      'verified',
    );
  }

  return {
    player_verification: pv,
    verification_status: verified ? 'VERIFIED' : 'REJECTED',
    is_verified: verified,
    ...(verified ? { onboarding_documents_submitted: true } : {}),
  };
}
