jest.mock('firebase/auth', () => ({
  signOut: jest.fn(() => Promise.resolve()),
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signInWithCredential: jest.fn(),
  linkWithCredential: jest.fn(),
  sendEmailVerification: jest.fn(),
  sendPasswordResetEmail: jest.fn(),
  fetchSignInMethodsForEmail: jest.fn(),
  deleteUser: jest.fn(),
  GoogleAuthProvider: { credential: jest.fn() },
  OAuthProvider: jest.fn().mockImplementation(() => ({ credential: jest.fn() })),
}));

jest.mock('../lib/firebase', () => ({
  getFirebaseAuth: jest.fn(() => ({ currentUser: null })),
  getDb: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  deleteDoc: jest.fn(),
}));

jest.mock('../lib/firebaseFunctions', () => ({
  callFunction: jest.fn(),
  getCallableErrorMessage: jest.fn(),
  isFunctionsUnavailable: jest.fn(() => false),
}));

jest.mock('../services/profile.service', () => ({
  profileService: {},
}));

jest.mock('../services/users.service', () => ({
  usersService: {},
}));

import {
  isBetaAccountBypassed,
  isBetaBypassAllowed,
  isEmailVerificationBypassed,
  isOnboardingDocumentsBypassed,
  isPartnerPoleTestAccount,
  normalizeEmailForBypass,
} from '../config/emailVerificationBypass';
import { needsEmailVerification } from '../services/auth.service';
import type { User as FirebaseAuthUser } from 'firebase/auth';

describe('emailVerificationBypass', () => {
  it('autorise le compte démo partenaire', () => {
    expect(isBetaAccountBypassed('part@gmail.com')).toBe(true);
    expect(isEmailVerificationBypassed('  PART@gmail.com  ')).toBe(true);
    expect(isOnboardingDocumentsBypassed('part@gmail.com')).toBe(true);
    expect(isPartnerPoleTestAccount('coach.alexandre.lm-coach-7726@proday.club')).toBe(true);
  });

  it('ne bypass plus le compte joueur principal', () => {
    expect(isBetaAccountBypassed('alfredgibeauahoussinou@gmail.com')).toBe(false);
    expect(isEmailVerificationBypassed('alfredgibeauahoussinou@gmail.com')).toBe(false);
  });

  it('refuse les autres emails', () => {
    expect(isEmailVerificationBypassed('autre@club.fr')).toBe(false);
    expect(isEmailVerificationBypassed('')).toBe(false);
    expect(isPartnerPoleTestAccount('autre@club.fr')).toBe(false);
  });

  it('normalise en minuscules', () => {
    expect(normalizeEmailForBypass('Test@Gmail.COM')).toBe('test@gmail.com');
  });

  it('expose le flag bypass dev', () => {
    expect(typeof isBetaBypassAllowed()).toBe('boolean');
  });

  describe('needsEmailVerification — Bypass clubs et coachs', () => {
    const mockFbUser = (emailVerified = false): FirebaseAuthUser =>
      ({
        emailVerified,
        email: 'coach.dupont@gmail.com',
        providerData: [{ providerId: 'password' }],
      } as unknown as FirebaseAuthUser);

    it('bypass si fbUser.emailVerified est true', () => {
      expect(needsEmailVerification(mockFbUser(true), 'coach.dupont@gmail.com')).toBe(false);
    });

    it('bypass si profile.email_verified est true même si fbUser non vérifié', () => {
      expect(needsEmailVerification(mockFbUser(false), 'coach.dupont@gmail.com', true)).toBe(false);
    });

    it('bypass si role coach ou club', () => {
      expect(needsEmailVerification(mockFbUser(false), 'coach.dupont@gmail.com', false, 'coach')).toBe(false);
      expect(needsEmailVerification(mockFbUser(false), 'president@valdefontenay.fr', false, 'club')).toBe(false);
    });

    it('bypass pour les emails techniques @proday.club', () => {
      expect(needsEmailVerification(mockFbUser(false), 'coach.test.tf-coach-7842@proday.club')).toBe(false);
    });

    it('exige la vérification pour les joueurs non vérifiés', () => {
      expect(needsEmailVerification(mockFbUser(false), 'joueur.lambda@gmail.com', false, 'player')).toBe(true);
    });
  });
});
