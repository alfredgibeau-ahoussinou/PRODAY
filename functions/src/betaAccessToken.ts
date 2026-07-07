import * as crypto from 'crypto';

/** Jeton opaque stocké dans Firestore (`beta_waitlist.access_token`). */
export function generateBetaAccessToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}
