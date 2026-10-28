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
  deleteUser,
  type AuthCredential,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import type { FirebaseError } from 'firebase/app';
import type { User, UserRole, UserProfile } from '../models/User';
import type { ParentalSettings } from '../models/ParentalSettings';
import type { AppSpaceId } from '../models/AppSpace';
import { PRODUCT_LINE_STORAGE_KEY, type ProductLineId } from '../models/ProductLine';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearProdayAiReplyCache } from './prodayAiReplyCache';
import { getFirebaseAuth, getDb } from '../lib/firebase';
import { callFunction, getCallableErrorMessage, isFunctionsUnavailable } from '../lib/firebaseFunctions';
import { profileService } from './profile.service';
import { usersService } from './users.service';
import {
  getUserProductLine,
  assertProfileMatchesActiveLine,
  getActiveProductLineFromStorage,
  ProductLineMismatchError,
} from '../utils/productLineAccess';
import { isBetaAccountBypassed } from '../config/emailVerificationBypass';
import { isPlatformAdminEmail } from '../config/admin';
import { AuthNeedsProfileError, AuthLinkPasswordRequiredError } from '../utils/authErrors';
import {
  decodeJwtEmail,
  getFirebaseAuthErrorCode,
  humanizeAuthErrorText,
  normalizeAuthEmail,
  oauthProviderLabel,
} from '../utils/authOAuthLink';
import {
  translateAuthErrorCode,
  translateAuthFallback,
} from '../i18n/authErrorMessages';
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

async function tryCustomVerificationEmail(user: FirebaseAuthUser): Promise<boolean> {
  try {
    const result = await callFunction<Record<string, never>, AuthEmailCallableResult>(
      'sendAuthVerificationEmail',
      {},
      AUTH_EMAIL_FUNCTIONS_REGION
    );
    const strategy = resolveAuthEmailSendStrategy(result);
    if (strategy === 'custom-sent') return true;
    // Ne pas traiter « skip » comme un envoi réussi tant que Firebase Auth n’a pas confirmé.
    if (strategy === 'skip' && user.emailVerified) return true;
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
  const customSent = await tryCustomVerificationEmail(user);
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

/** WAVE 5 — codes Firebase → catalogues fr/en/es/pt. */
function mapAuthError(code: string): string {
  return translateAuthErrorCode(code);
}

export { needsEmailVerification } from '../utils/needsEmailVerification';

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
    if (fbUser.email && isPlatformAdminEmail(fbUser.email)) {
      try {
        profile = await profileService.createProfile(
          fbUser.uid,
          fbUser.email,
          'coach',
          fbUser.displayName || 'Administrateur ProDay',
          {
            email_verified: true,
            onboarding_documents_submitted: true,
            product_line: 'pro',
          },
        );
      } catch {
        // En cas d'erreur de création Firestore (ex: règles ou offline), profil minimal mémoire
        profile = {
          uid: fbUser.uid,
          email: fbUser.email,
          display_name: fbUser.displayName || 'Administrateur ProDay',
          role: 'coach',
          is_admin: true,
          email_verified: true,
          onboarding_documents_submitted: true,
          is_verified: true,
          verification_status: 'VERIFIED',
          profile: {},
          documents: [],
          created_at: new Date(),
          updated_at: new Date(),
          is_active: true,
          product_line: 'pro',
        };
      }
    } else {
      throw new AuthNeedsProfileError(
        fbUser.email ?? '',
        fbUser.displayName ?? undefined
      );
    }
  }

  // Synchronise automatiquement l'univers canonique du compte utilisateur
  const userLine = getUserProductLine(profile);
  try {
    await AsyncStorage.setItem(PRODUCT_LINE_STORAGE_KEY, userLine);
  } catch {
    // ignore
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

async function createProfileWithRetry(
  uid: string,
  email: string,
  role: UserRole,
  displayName: string,
  options: Parameters<typeof profileService.createProfile>[4],
  maxAttempts = 3
): Promise<User> {
  let lastError: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await profileService.createProfile(uid, email, role, displayName, options);
    } catch (err) {
      lastError = err;
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, attempt * 500));
      }
    }
  }
  throw lastError;
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

    return createProfileWithRetry(
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

    const cleanEmail = normalizeAuthEmail(input.email) || input.email.trim().toLowerCase();
    const cleanPassword = input.password.trim();
    const cleanDisplayName = input.display_name.trim();

    let credUser: FirebaseAuthUser;
    try {
      const cred = await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        cleanPassword
      );
      credUser = cred.user;
    } catch (error) {
      const code = getFirebaseAuthErrorCode(error);
      if (code === 'auth/email-already-in-use') {
        // Auto-healing: check if account exists without a Firestore profile (orphan account recovery)
        try {
          const signInCred = await signInWithEmailAndPassword(auth, cleanEmail, cleanPassword);
          const existingProfile = await usersService.getById(signInCred.user.uid).catch(() => null);
          if (!existingProfile) {
            if (__DEV__) {
              console.info('[auth] Auto-healing orphan account without Firestore profile:', signInCred.user.uid);
            }
            credUser = signInCred.user;
          } else {
            throw new Error(
              'Un compte actif existe déjà avec cet email. Veuillez vous connecter.'
            );
          }
        } catch (signInErr) {
          if (signInErr instanceof Error && signInErr.message.includes('Un compte actif')) {
            throw signInErr;
          }
          throw error;
        }
      } else {
        throw error;
      }
    }

    try {
      await sendVerificationEmailForUser(credUser);
    } catch (e) {
      markVerificationEmailResend(credUser.uid);
      if (__DEV__) {
        console.warn('[auth] verification email at signup:', e);
      }
    }

    const registrationLine: ProductLineId = input.product_line ?? 'amateur';

    return createProfileWithRetry(
      credUser.uid,
      cleanEmail,
      input.role,
      cleanDisplayName,
      {
        city: input.city?.trim() || undefined,
        department: input.department?.trim() || undefined,
        profile: input.profile,
        parental_settings: input.parental_settings,
        app_space: input.app_space,
        product_line: registrationLine,
        email_verified: isBetaAccountBypassed(cleanEmail),
        onboarding_documents_submitted: isBetaAccountBypassed(cleanEmail),
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

  /**
   * Connexion directe avec un code officiel de club ou de coach partenaire.
   * Si l'appareil / IP n'est pas reconnu ou si le compte n'existe pas encore,
   * utilise les informations de l'éducateur / dirigeant pour finaliser l'accès et l'affiliation.
   */
  async loginWithPartnerCode(
    affiliation: import('./partnerClubs.service').ResolvedClubAffiliation,
    identity?: {
      firstName: string;
      lastName: string;
      phone?: string;
      functionOrDiploma?: string;
      category?: string;
      email?: string;
    }
  ): Promise<User> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');

    const club = affiliation.club;
    const isCoach = affiliation.matchedType === 'coach';
    const role: UserRole = isCoach ? 'coach' : 'club';

    // Génération d'un identifiant stable pour l'utilisateur affilié
    const cleanFirstName = (identity?.firstName || 'Coach').trim();
    const cleanLastName = (identity?.lastName || club.clubName.split(' ')[0]).trim();
    const displayName = `${cleanFirstName} ${cleanLastName}`.trim();
    
    // Email de connexion : fourni par l'utilisateur ou compte de rattachement au club
    const effectiveEmail = identity?.email
      ? identity.email.trim().toLowerCase()
      : isCoach
        ? `coach.${cleanFirstName.toLowerCase().replace(/[^a-z0-9]/g, '')}.${affiliation.codeUsed.toLowerCase()}@proday.club`
        : `club.${affiliation.club.fffNumber}@proday.club`;

    const codeSecretPassword = `ProDay#${affiliation.codeUsed}*2026!`;

    let fbUser: FirebaseAuthUser;
    try {
      // 1. Tenter la connexion si le compte existe déjà
      const cred = await signInWithEmailAndPassword(auth, effectiveEmail, codeSecretPassword);
      fbUser = cred.user;
    } catch (err: unknown) {
      const code = getFirebaseAuthErrorCode(err);
      if (code === 'auth/user-not-found' || code === 'auth/invalid-credential') {
        // 2. Compte non existant : création automatique
        try {
          const cred = await createUserWithEmailAndPassword(auth, effectiveEmail, codeSecretPassword);
          fbUser = cred.user;
        } catch (createErr: unknown) {
          const createCode = getFirebaseAuthErrorCode(createErr);
          if (createCode === 'auth/email-already-in-use') {
            // Reconnexion avec le compte existant
            const signInCred = await signInWithEmailAndPassword(auth, effectiveEmail, codeSecretPassword);
            fbUser = signInCred.user;
          } else {
            throw createErr;
          }
        }
      } else {
        throw err;
      }
    }

    // 3. Récupération ou création du profil Firestore
    let existingProfile = await usersService.getById(fbUser.uid).catch(() => null);
    if (!existingProfile) {
      existingProfile = await profileService.createProfile(
        fbUser.uid,
        effectiveEmail,
        role,
        displayName,
        {
          city: club.city,
          department: club.department,
          profile: {
            club_id: `fff_${club.fffNumber}`,
            job_title: identity?.functionOrDiploma || (isCoach ? 'Entraîneur' : 'Dirigeant'),
            category: identity?.category || club.defaultCategories?.[0],
          },
          email_verified: true,
          onboarding_documents_submitted: true,
          product_line: 'pro',
        }
      );
      if (identity?.phone) {
        await profileService.updateProfile(fbUser.uid, { phone: identity.phone }).catch(() => {});
      }
    } else {
      // Mettre à jour les informations utiles si fournies et garantir email_verified
      const updatePayload: Record<string, unknown> = {
        email_verified: true,
      };
      if (identity?.functionOrDiploma) updatePayload['profile.job_title'] = identity.functionOrDiploma;
      if (identity?.category) updatePayload['profile.category'] = identity.category;
      if (identity?.phone) updatePayload['phone'] = identity.phone;
      if (displayName && (!existingProfile.display_name || existingProfile.display_name === 'Membre')) {
        updatePayload['display_name'] = displayName;
      }
      await profileService.updateProfile(fbUser.uid, updatePayload as any).catch(() => {});
      existingProfile.email_verified = true;
    }

    // 4. Rattachement et auto-validation du membership du club
    try {
      const { clubsService } = await import('./clubs.service');
      const { membershipsService } = await import('./memberships.service');

      let clubDoc = await clubsService.getByFffAffiliationNumber(club.fffNumber);
      if (!clubDoc) {
        const newClubId = await clubsService.create({
          name: club.clubName,
          city: club.city,
          department: club.department,
          categories: club.defaultCategories,
          owner_uid: isCoach ? 'system_partner' : fbUser.uid,
          fff_affiliation_number: club.fffNumber,
          fff_league_id: club.fffLeagueId,
          fff_division_label: club.divisionLabel,
          logo_url: club.logoUrl,
        });
        clubDoc = await clubsService.getById(newClubId);
      }

      if (clubDoc) {
        const memberships = await membershipsService.listByPlayer(fbUser.uid);
        const existingMem = memberships.find((m) => m.club_id === clubDoc?.id);
        if (!existingMem) {
          const membershipRole: import('../models/Membership').MembershipRole = isCoach ? 'coach' : 'coach';
          const newMem = await membershipsService.requestJoin({
            club_id: clubDoc.id,
            player_uid: fbUser.uid,
            player_name: displayName,
            role: membershipRole,
            category: identity?.category || club.defaultCategories?.[0],
          });
          if (club.coachAutoValidate && newMem?.id) {
            await membershipsService.approve(newMem.id, 'system_partner_code', {
              role: membershipRole,
            }).catch(() => {});
          }
        }
      }
    } catch (membershipErr) {
      console.warn('[authService] loginWithPartnerCode membership link:', membershipErr);
    }

    return existingProfile;
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
    // Évite qu'un autre compte reçoive une réponse Proday IA mise en cache.
    await clearProdayAiReplyCache();
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
  },

  async deleteAccount(): Promise<void> {
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (!user) throw new Error('Aucun utilisateur connecté');

    const email = (user.email ?? '').toLowerCase();
    const isDemo =
      isBetaAccountBypassed(email) ||
      email.includes('demo') ||
      email === 'player.demo@proday.app' ||
      email === 'coach.demo@proday.app';

    if (isDemo) {
      // Pour les comptes de démo Apple Review, déconnexion sans suppression du compte partagé
      await this.signOut();
      return;
    }

    // 1. Appel du backend sécurisé Firebase Cloud Functions deleteMyAccount
    try {
      await callFunction('deleteMyAccount', {});
      await this.signOut();
      return;
    } catch (fnErr) {
      if (__DEV__) {
        console.warn('[authService] deleteMyAccount callable failed, fallback client SDK:', fnErr);
      }
    }

    // 2. Fallback direct client SDK : suppression des documents Firestore associés
    const db = getDb();
    if (db && user.uid) {
      try {
        await deleteDoc(doc(db, 'users', user.uid));
        await deleteDoc(doc(db, 'user_profiles', user.uid));
      } catch (err) {
        console.warn('[authService] Suppression Firestore partielle:', err);
      }
    }

    // 3. Suppression du compte Firebase Auth
    try {
      await deleteUser(user);
    } catch (error: unknown) {
      const code = getFirebaseAuthErrorCode(error);
      if (code === 'auth/requires-recent-login') {
        throw new Error(
          'Pour des raisons de sécurité, veuillez vous déconnecter et vous reconnecter avant de supprimer définitivement votre compte.'
        );
      }
      throw error;
    }
  },

  async sendPasswordReset(email: string): Promise<void> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');
    const customSent = await tryCustomPasswordResetEmail(email.trim());
    if (!customSent) await sendPasswordResetEmail(auth, email.trim());
  },

  loadProfileAfterAuth(fbUser: FirebaseAuthUser): Promise<User> {
    return loadProfileAfterAuth(fbUser);
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
      translateAuthFallback(code || undefined);
    return humanizeAuthErrorText(raw);
  },
};
