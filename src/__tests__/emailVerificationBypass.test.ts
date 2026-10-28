import {
  isBetaAccountBypassed,
  isBetaBypassAllowed,
  isEmailVerificationBypassed,
  isOnboardingDocumentsBypassed,
  isPartnerPoleTestAccount,
  normalizeEmailForBypass,
} from '../config/emailVerificationBypass';
import { needsEmailVerification } from '../utils/needsEmailVerification';

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

  it('needsEmailVerification contourne la vérification pour coach, club et email_verified', () => {
    const mockUser = {
      emailVerified: false,
      providerData: [{ providerId: 'password' }],
    } as any;

    // Quand le profil a email_verified: true -> bypass
    expect(needsEmailVerification(mockUser, 'test@example.com', true)).toBe(false);

    // Quand le rôle est coach ou club -> bypass
    expect(needsEmailVerification(mockUser, 'coach@example.com', false, 'coach')).toBe(false);
    expect(needsEmailVerification(mockUser, 'club@example.com', false, 'club')).toBe(false);

    // Quand l'email se termine par @proday.club -> bypass
    expect(needsEmailVerification(mockUser, 'coach.alexandre.lm-coach-7726@proday.club')).toBe(false);
  });
});
