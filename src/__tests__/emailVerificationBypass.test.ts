import {
  isBetaAccountBypassed,
  isEmailVerificationBypassed,
  isOnboardingDocumentsBypassed,
  normalizeEmailForBypass,
} from '../config/emailVerificationBypass';

describe('emailVerificationBypass', () => {
  it('autorise l’email beta configuré', () => {
    expect(isBetaAccountBypassed('alfredgibeauahoussinou@gmail.com')).toBe(true);
    expect(isEmailVerificationBypassed('  AlfredGibeauAhoussinou@gmail.com  ')).toBe(true);
    expect(isOnboardingDocumentsBypassed('alfredgibeauahoussinou@gmail.com')).toBe(true);
  });

  it('refuse les autres emails', () => {
    expect(isEmailVerificationBypassed('autre@club.fr')).toBe(false);
    expect(isEmailVerificationBypassed('')).toBe(false);
  });

  it('normalise en minuscules', () => {
    expect(normalizeEmailForBypass('Test@Gmail.COM')).toBe('test@gmail.com');
  });
});
