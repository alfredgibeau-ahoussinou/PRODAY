import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
} from 'firebase/auth';
import type { User, UserRole } from '../models/User';
import { getFirebaseAuth } from '../lib/firebase';
import { profileService } from './profile.service';
import { usersService } from './users.service';

export interface SignUpInput {
  email: string;
  password: string;
  display_name: string;
  role: UserRole;
}

function mapAuthError(code: string): string {
  const messages: Record<string, string> = {
    'auth/email-already-in-use': 'Cet email est déjà utilisé.',
    'auth/invalid-email': 'Email invalide.',
    'auth/weak-password': 'Mot de passe trop faible (6 caractères min.).',
    'auth/user-not-found': 'Aucun compte avec cet email.',
    'auth/wrong-password': 'Mot de passe incorrect.',
    'auth/invalid-credential': 'Email ou mot de passe incorrect.',
  };
  return messages[code] ?? 'Erreur de connexion. Réessayez.';
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
      input.display_name.trim()
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

    const profile = await usersService.getById(cred.user.uid);
    if (!profile) {
      throw new Error('Profil introuvable. Terminez l’inscription.');
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
    return mapAuthError(code) || (error instanceof Error ? error.message : 'Erreur');
  },
};
