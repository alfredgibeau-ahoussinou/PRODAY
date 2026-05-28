import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithCredential,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  reload,
  GoogleAuthProvider,
  OAuthProvider,
  type User as FirebaseAuthUser,
} from 'firebase/auth';
import type { User, UserRole, UserProfile } from '../models/User';
import type { ParentalSettings } from '../models/ParentalSettings';
import type { AppSpaceId } from '../models/AppSpace';
import { getFirebaseAuth } from '../lib/firebase';
import { profileService } from './profile.service';
import { usersService } from './users.service';

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
    'auth/popup-closed-by-user': 'Connexion annulée.',
    'auth/cancelled-popup-request': 'Connexion annulée.',
    'auth/account-exists-with-different-credential':
      'Un compte existe déjà avec cet email (autre méthode de connexion).',
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

export function needsEmailVerification(fbUser: FirebaseAuthUser | null): boolean {
  if (!fbUser || fbUser.emailVerified) return false;
  return usesPasswordProvider(fbUser);
}

/** Firebase connecté mais profil Firestore absent — compléter via Inscription. */
export class AuthNeedsProfileError extends Error {
  readonly code = 'auth/profile-required' as const;

  constructor(
    public readonly email: string,
    public readonly displayName?: string
  ) {
    super('Complétez votre profil via l’onglet Inscription.');
    this.name = 'AuthNeedsProfileError';
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

    const existing = await usersService.getById(fb.uid);
    if (existing) return existing;

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
      await sendEmailVerification(cred.user);
    } catch {
      // Le profil peut quand même être créé ; l'utilisateur pourra renvoyer le mail.
    }

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
        email_verified: false,
      }
    );
  },

  async resendEmailVerification(): Promise<void> {
    const auth = getFirebaseAuth();
    const user = auth?.currentUser;
    if (!user) throw new Error('Session expirée');
    await sendEmailVerification(user);
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
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');
    const cred = await signInWithCredential(
      auth,
      GoogleAuthProvider.credential(idToken)
    );
    return loadProfileAfterAuth(cred.user);
  },

  async signInWithApple(identityToken: string, rawNonce: string): Promise<User> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');
    const provider = new OAuthProvider('apple.com');
    const cred = await signInWithCredential(
      auth,
      provider.credential({ idToken: identityToken, rawNonce })
    );
    return loadProfileAfterAuth(cred.user);
  },

  async signOut(): Promise<void> {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
  },

  async sendPasswordReset(email: string): Promise<void> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');
    await sendPasswordResetEmail(auth, email.trim());
  },

  getAuthErrorMessage(error: unknown): string {
    if (error instanceof AuthNeedsProfileError) return error.message;
    const code =
      error && typeof error === 'object' && 'code' in error
        ? String((error as { code: string }).code)
        : '';
    const mapped = mapAuthError(code);
    if (mapped) return mapped;
    if (error instanceof Error && error.message) return error.message;
    if (__DEV__ && code) return `Erreur (${code}). Réessayez.`;
    return 'Erreur de connexion. Réessayez.';
  },
};
