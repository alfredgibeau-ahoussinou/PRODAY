/**
 * Service d'authentification par téléphone (SMS) pour ProDay.
 * Conçu pour les flux mobiles et les standards de sécurité Apple / Firebase.
 */

import {
  type ApplicationVerifier,
  type ConfirmationResult,
  PhoneAuthProvider,
  signInWithCredential,
} from 'firebase/auth';
import { getFirebaseAuth } from '../lib/firebase';
import { authService } from './auth.service';
import type { User } from '../models/User';

export interface PhoneAuthSession {
  verificationId: string;
  phoneNumber: string;
}

import {
  formatPhoneNumberE164,
  isValidPhoneNumber,
} from '../utils/phoneFormat';

export { formatPhoneNumberE164, isValidPhoneNumber };

export const phoneAuthService = {
  /**
   * Envoie le code SMS de vérification via PhoneAuthProvider.
   */
  async requestVerificationCode(
    phoneNumber: string,
    appVerifier: ApplicationVerifier,
  ): Promise<string> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');

    const formatted = formatPhoneNumberE164(phoneNumber);
    if (!isValidPhoneNumber(formatted)) {
      throw new Error('Numéro de téléphone invalide (format attendu : +33 6 12 34 56 78)');
    }

    const provider = new PhoneAuthProvider(auth);
    const verificationId = await provider.verifyPhoneNumber(formatted, appVerifier);
    return verificationId;
  },

  /**
   * Confirme le code à 6 chiffres reçu par SMS et connecte l'utilisateur.
   */
  async confirmCode(verificationId: string, code: string): Promise<User> {
    const auth = getFirebaseAuth();
    if (!auth) throw new Error('Firebase non configuré');

    const cleanCode = code.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6) {
      throw new Error('Le code de vérification doit comporter 6 chiffres.');
    }

    const credential = PhoneAuthProvider.credential(verificationId, cleanCode);
    const userCredential = await signInWithCredential(auth, credential);
    
    // Le compte existe ou doit être créé dans Firestore
    return authService.loadProfileAfterAuth(userCredential.user);
  },

  /**
   * Pour les flux ConfirmationResult (compatibilité web / recapcha standard).
   */
  async confirmWithResult(
    confirmationResult: ConfirmationResult,
    code: string,
  ): Promise<User> {
    const cleanCode = code.trim().replace(/\s+/g, '');
    if (cleanCode.length !== 6) {
      throw new Error('Le code de vérification doit comporter 6 chiffres.');
    }

    const userCredential = await confirmationResult.confirm(cleanCode);
    return authService.loadProfileAfterAuth(userCredential.user);
  },
};
