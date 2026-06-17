import {
  isBetaAccountBypassed,
  isBetaBypassAllowed,
  isEmailVerificationBypassed,
  isOnboardingDocumentsBypassed,
  isPartnerPoleTestAccount,
  normalizeEmailForBypass,
} from '../config/emailVerificationBypass';

describe('emailVerificationBypass', () => {
  it('autorise le compte démo partenaire', () => {
    expect(isBetaAccountBypassed('part@gmail.com')).toBe(true);
    expect(isEmailVerificationBypassed('  PART@gmail.com  ')).toBe(true);
    expect(isOnboardingDocumentsBypassed('part@gmail.com')).toBe(true);
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
});
