import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  GoogleAuthProvider,
  OAuthProvider,
  type AuthCredential,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import type { FirebaseError } from 'firebase/app';
import type { User, UserRole, UserProfile } from '../models/User';
import type { ParentalSettings } from '../models/ParentalSettings';
import type { AppSpaceId } from '../models/AppSpace';
import type { ProductLineId } from '../models/ProductLine';
import { getFirebaseAuth } from '../lib/firebase';
import { callFunction, getCallableErrorMessage, isFunctionsUnavailable } from '../lib/firebaseFunctions';
import { profileService } from './profile.service';
import { usersService } from './users.service';
import {
  assertProfileMatchesActiveLine,
  getActiveProductLineFromStorage,
  ProductLineMismatchError,
} from '../utils/productLineAccess';
import { isBetaAccountBypassed } from '../config/emailVerificationBypass';
import { AuthNeedsProfileError, AuthLinkPasswordRequiredError } from '../utils/authErrors';
import {
  decodeJwtEmail,
  getFirebaseAuthErrorCode,
  humanizeAuthErrorText,
  normalizeAuthEmail,
  oauthProviderLabel,
} from '../utils/authOAuthLink';
import { markVerificationEmailResend } from '../utils/verificationEmailResend';
import { resolveAuthEmailSendStrategy } from '../utils/authEmailCallableResult';

export { ProductLineMismatchError } from '../utils/productLineAccess';
export { AuthNeedsProfileError, AuthLinkPasswordRequiredError } from '../utils/authErrors';

const AUTH_EMAIL_FUNCTIONS_REGION = 'europe-west1';

type AuthEmailCallableResult = { enabled: boolean; sent: boolean };

export class AuthEmailSendError extends Error {
  readonly code = 'auth/email-send-failed' as const;

  constructor(message: string) {
    super(message);
    this.name = 'AuthEmailSendError';
  }
}

async function tryCustomVerificationEmail(): Promise<boolean> {
  try {
    const result = await callFunction<Record<string, never>, AuthEmailCallableResult>(
      'sendAuthVerificationEmail',
      {},
      AUTH_EMAIL_FUNCTIONS_REGION
    );
    const strategy = resolveAuthEmailSendStrategy(result);
    if (strategy === 'custom-sent' || strategy === 'skip') return true;
  } catch (e) {
    // Ne pas retomber sur sendEmailVerification() si la callable a répondu :
    // double appel = rate-limit Firebase (TOO_MANY_ATTEMPTS_TRY_LATER).
    if (!isFunctionsUnavailable(e)) {
      throw new AuthEmailSendError(getCallableErrorMessage(e));
    }
    if (__DEV__) {
      console.warn('[auth] custom verification email unavailable, fallback Firebase Auth');
    }
  }
  return false;
}

async function sendVerificationEmailForUser(user: FirebaseAuthUser): Promise<void> {
  const customSent = await tryCustomVerificationEmail();
  if (customSent) return;

  try {
    await sendEmailVerification(user);
  } catch (e) {
    const code =
      e && typeof e === 'object' && 'code' in e
        ? String((e as { code: string }).code)
        : '';
    const mapped = mapAuthError(code);
    throw new AuthEmailSendError(
      humanizeAuthErrorText(
        mapped ||
          (e instanceof Error && e.message ? e.message : '') ||
          'Impossible d’envoyer l’e-mail de vérification. Réessayez dans quelques minutes.'
      )
    );
  }
}

async function tryCustomPasswordResetEmail(email: string): Promise<boolean> {
  try {
    const result = await callFunction<{ email: string }, AuthEmailCallableResult>(
      'sendAuthPasswordResetEmail',
      { email },
      AUTH_EMAIL_FUNCTIONS_REGION
    );
    const strategy = resolveAuthEmailSendStrategy(result);
    if (strategy === 'custom-sent' || strategy === 'skip') return true;
    if (__DEV__) {
      console.warn(
        '[auth] custom password reset unavailable, fallback Firebase Auth',
        result
      );
    }
  } catch (e) {
    if (__DEV__) {
      console.warn(
        '[auth] custom password reset failed, fallback Firebase Auth:',
        isFunctionsUnavailable(e) ? 'functions unavailable' : getCallableErrorMessage(e)
      );
    }
  }
  return false;
}

export interface SignUpInput {
  email: string;
  password: string;
  display_name: string;
  role: UserRole;
  city?: string;
  department?: string;
  profile?: Partial<UserProfile>;
  parental_settings?: ParentalSettings;
  app_space?: AppSpaceId;
  product_line?: ProductLineId;
}

function mapAuthError(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Cet email est déjà utilisé.',
    'auth/invalid-email': 'Email invalide.',
    'auth/weak-password': 'Mot de passe trop faible (6 caractères min.).',
    'auth/user-not-found': 'Aucun compte avec cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
    'auth/too-many-requests': 'Trop de tentatives. Réessayez plus tard.',
    'auth/network-request-failed': 'Pas de réseau. Vérifiez votre connexion.',
    'auth/operation-not-allowed':
      'Connexion email/mot de passe désactivée dans Firebase (Authentication).',
    'auth/user-disabled': 'Ce compte est désactivé.',
    'auth/invalid-api-key': 'Clé Firebase invalide. Vérifiez le fichier .env.',
    'auth/configuration-not-found': 'Projet Firebase introuvable. Vérifiez le .env.',
    'firestore/permission-denied': 'Accès refusé aux données. Réessayez ou contactez le support.',
    'permission-denied': 'Accès refusé aux données. Réessayez ou contactez le support.',
    'auth/popup-closed-by-user': 'Connexion annulée.',
    'auth/cancelled-popup-request': 'Connexion annulée.',
    'auth/account-exists-with-different-credential':
      'Un compte existe déjà avec cet email. Connectez-vous avec votre mot de passe ProDay pour lier Google ou Apple.',
    'auth/operation-not-supported-in-this-environment':
      'Connexion non disponible sur cette plateforme.',
    'auth/invalid-id-token': 'Session Google invalide. Réessayez ou vérifiez les ID clients dans .env.',
    'auth/invalid-oauth-client-id': 'ID client Google incorrect dans .env.',
    'auth/unauthorized-domain': 'Domaine non autorisé dans la console Google.',
    'auth/missing-email':
      'Email non fourni par Google/Apple. Autorisez le partage d’email ou utilisez un autre compte.',
    'auth/credential-already-in-use': 'Cet email est déjà lié à un autre compte.',
    'auth/user-token-expired': 'Session expirée. Reconnectez-vous.',
    'auth/internal-error': 'Erreur serveur. Réessayez dans un instant.',
  };
  return messages[code] ?? '';
}

function usesPasswordProvider(fbUser: FirebaseAuthUser): boolean {
  return fbUser.providerData.some((p) => p.providerId === 'password');
}

export function needsEmailVerification(
  fbUser: FirebaseAuthUser | null,
  profileEmail?: string | null
): boolean {
  if (!fbUser || fbUser.emailVerified) return false;
  if (!usesPasswordProvider(fbUser)) return false;
  const email = profileEmail ?? fbUser.email ?? '';
  if (isBetaAccountBypassed(email)) return false;
  return true;
}

function extractPendingOAuthCredential(
  error: unknown,
  provider: 'google' | 'apple'
): AuthCredential | null {
  const fbError = error as FirebaseError;
  if (provider === 'google') {
    return GoogleAuthProvider.credentialFromError(fbError);
  }
  return OAuthProvider.credentialFromError(fbError);
}

function resolveExistingAccountEmail(
  error: unknown,
  fallbackEmail?: string | null
): string | null {
  const customEmail =
    error && typeof error === 'object' && 'customData' in error
      ? (error as { customData?: { email?: string } }).customData?.email
      : undefined;
  return normalizeAuthEmail(customEmail ?? fallbackEmail ?? null);
}

async function signInWithOAuthCredential(
  credential: AuthCredential,
  provider: 'google' | 'apple',
  fallbackEmail?: string | null
): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error('Firebase non configuré');

  try {
    const cred = await signInWithCredential(auth, credential);
    return loadProfileAfterAuth(cred.user);
  } catch (error) {
    const code = getFirebaseAuthErrorCode(error);
    if (code !== 'auth/account-exists-with-different-credential') {
      throw error;
    }

    const pending = extractPendingOAuthCredential(error, provider);
    if (!pending) throw error;

    const email = resolveExistingAccountEmail(error, fallbackEmail);
    if (!email) {
      throw new Error(
        `Impossible de relier ${oauthProviderLabel(provider)} : email non partagé. ` +
          'Utilisez votre mot de passe ProDay ou autorisez le partage d’email avec Apple.'
      );
    }

    const methods = await fetchSignInMethodsForEmail(auth, email);
    if (methods.includes('password')) {
      throw new AuthLinkPasswordRequiredError(email, pending, provider);
    }

    throw error;
  }
}

async function loadProfileAfterAuth(fbUser: FirebaseAuthUser): Promise<User> {
  let profile: User | null;
  try {
    profile = await usersService.getById(fbUser.uid);
  } catch (e) {
    const code =
      e && typeof e === 'object' && 'code' in e
        ? String((e as { code: string }).code)
        : '';
    if (code === 'permission-denied' || code === 'firestore/permission-denied') {
      throw Object.assign(new Error(mapAuthError('firestore/permission-denied')), {
        code: 'firestore/permission-denied',
      });
    }
    throw e;
  }
  if (!profile) {
    throw new AuthNeedsProfileError(
      fbUser.email ?? '',
      fbUser.displayName ?? undefined
    );
  }

  const activeLine = await getActiveProductLineFromStorage();
  try {
    assertProfileMatchesActiveLine(profile, activeLine);
  } catch (e) {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
    throw e;
  }

  if (isBetaAccountBypassed(fbUser.email ?? profile.email)) {
    const patch: {
      email_verified?: boolean;
      onboarding_documents_submitted?: boolean;
    } = {};
    if (!profile.email_verified) patch.email_verified = true;
    if (!profile.onboarding_documents_submitted) {
      patch.onboarding_documents_submitted = true;
    }
    if (Object.keys(patch).length > 0) {
      await profileService.updateProfile(profile.uid, patch);
      return { ...profile, ...patch };
    }
  }

  return profile;
}

export const authService = {
  /** Profil Firestore après connexion Google / Apple (utilisateur Firebase déjà créé). */
  async completeProfile(
    input: Omit<SignUpInput, 'password'> & { email?: string }
  ): Promise<User> {
    const auth = getFirebaseAuth();
    const fb = auth?.currentUser;
    if (!fb) throw new Error('Firebase non configuré ou session expirée');

    const email = (input.email ?? fb.email ?? '').trim();
    if (!email) {
      throw new Error('Email requis. Utilisez un compte Google/Apple qui partage votre email.');
    }

    const registrationLine: ProductLineId = input.product_line ?? 'amateur';

    const existing = await usersService.getById(fb.uid);
    if (existing) {
      assertProfileMatchesActiveLine(existing, registrationLine);
      return existing;
    }

    return profileService.createProfile(
      fb.uid,
      email,
      input.role,
      input.display_name.trim(),
      {
        city: input.city,
        department: input.department,
        profile: input.profile,
        parental_settings: input.parental_settings,
        app_space: input.app_space,
        product_line: registrationLine,
        email_verified: fb.emailVerified,
      }
    );
  },

  async signUp(input: SignUpInput): Promise<User> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');

    const cred = await createUserWithEmailAndPassword(
      auth,
      input.email.trim(),
      input.password
    );

    try {
      await sendVerificationEmailForUser(cred.user);
    } catch (e) {
      markVerificationEmailResend(cred.user.uid);
      if (__DEV__) {
        console.warn('[auth] verification email at signup:', e);
      }
    }

    const registrationLine: ProductLineId = input.product_line ?? 'amateur';

    return profileService.createProfile(
      cred.user.uid,
      input.email.trim(),
      input.role,
      input.display_name.trim(),
      {
        city: input.city,
        department: input.department,
        profile: input.profile,
        parental_settings: input.parental_settings,
        app_space: input.app_space,
        product_line: registrationLine,
        email_verified: isBetaAccountBypassed(input.email.trim()),
        onboarding_documents_submitted: isBetaAccountBypassed(input.email.trim()),
      }
    );
  },

  async resendEmailVerification(): Promise<void> {
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (!user) throw new Error('Session expirée');
    await sendVerificationEmailForUser(user);
  },

  async reloadAuthUser(): Promise<FirebaseAuthUser | null> {
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (!user) return null;
    await reload(user);
    return auth.currentUser;
  },

  async syncEmailVerifiedToProfile(uid: string, verified: boolean): Promise<void> {
    if (!verified) return;
    await profileService.updateProfile(uid, { email_verified: true });
  },

  async signIn(email: string, password: string): Promise<User> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');

    const cred = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    return loadProfileAfterAuth(cred.user);
  },

  async signInWithGoogleIdToken(idToken: string): Promise<User> {
    const credential = GoogleAuthProvider.credential(idToken);
    const email = decodeJwtEmail(idToken);
    return signInWithOAuthCredential(credential, 'google', email);
  },

  async signInWithApple(identityToken: string, rawNonce: string): Promise<User> {
    const provider = new OAuthProvider('apple.com');
    const credential = provider.credential({ idToken: identityToken, rawNonce });
    const email = decodeJwtEmail(identityToken);
    return signInWithOAuthCredential(credential, 'apple', email);
  },

  async linkOAuthWithPassword(
    email: string,
    password: string,
    pendingCredential: AuthCredential
  ): Promise<User> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');

    const normalized = normalizeAuthEmail(email);
    if (!normalized) throw new Error('Email invalide');

    const cred = await signInWithEmailAndPassword(auth, normalized, password);
    try {
      const linked = await linkWithCredential(cred.user, pendingCredential);
      if (linked.user.emailVerified) {
        await profileService.updateProfile(linked.user.uid, { email_verified: true });
      }
      return loadProfileAfterAuth(linked.user);
    } catch (error) {
      const code = getFirebaseAuthErrorCode(error);
      if (code === 'auth/provider-already-linked') {
        return loadProfileAfterAuth(cred.user);
      }
      throw error;
    }
  },

  async signOut(): Promise<void> {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
  },

  async sendPasswordReset(email: string): Promise<void> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');
    const customSent = await tryCustomPasswordResetEmail(email.trim());
    if (!customSent) await sendPasswordResetEmail(auth, email.trim());
  },

  getAuthErrorMessage(error: unknown): string {
    if (error instanceof AuthEmailSendError) return error.message;
    if (error instanceof AuthNeedsProfileError) return error.message;
    if (error instanceof AuthLinkPasswordRequiredError) return error.message;
    if (error instanceof ProductLineMismatchError) return error.message;
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: string }).code)
        : '';
    const mapped = mapAuthError(code);
    const raw =
      mapped ||
      (error instanceof Error && error.message ? error.message : '') ||
      (__DEV__ && code ? `Erreur (${code}). Réessayez.` : 'Erreur de connexion. Réessayez.');
    return humanizeAuthErrorText(raw);
  },
};
