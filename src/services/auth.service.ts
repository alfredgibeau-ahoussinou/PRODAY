import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import type { User, UserRole, UserProfile } from '../models/User';
import { getFirebaseAuth } from '../lib/firebase';
import { profileService } from './profile.service';
import { usersService } from './users.service';

export interface SignUpInput {
  email: string;
  password: string;
  display_name: string;
  role: UserRole;
  city?: string;
  profile?: Partial<UserProfile>;
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
  };
  return messages[code] ?? '';
}

export const authService = {
  async signUp(input: SignUpInput): Promise<User> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');

    const cred = await createUserWithEmailAndPassword(
      auth,
      input.email.trim(),
      input.password
    );

    return profileService.createProfile(
      cred.user.uid,
      input.email.trim(),
      input.role,
      input.display_name.trim(),
      { city: input.city, profile: input.profile }
    );
  },

  async signIn(email: string, password: string): Promise<User> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');

    const cred = await signInWithEmailAndPassword(
      auth,
      email.trim(),
      password
    );

    let profile: User | null;
    try {
      profile = await usersService.getById(cred.user.uid);
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
      throw new Error(
        'Compte connecté mais profil absent. Créez un compte via Inscription pour compléter votre profil.'
      );
    }
    return profile;
  },

  async signOut(): Promise<void> {
    const auth = getFirebaseAuth();
    if (auth) await firebaseSignOut(auth);
  },

  getAuthErrorMessage(error: unknown): string {
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
