import {
  formatPhoneNumberE164,
  isValidPhoneNumber,
} from '../utils/phoneFormat';
import { POPULAR_COUNTRIES } from '../components/auth/CountryCodePicker';
import { isGoogleAuthConfigured } from '../config/oauth';
import { phoneAuthErrorMessage } from '../utils/phoneAuthErrors';

describe('Auth Experience Rebuild & International Phone Auth', () => {
  describe('CountryCodePicker & DOM-TOM Support', () => {
    it('includes France and all French overseas territories (DOM-TOM)', () => {
      const dialCodes = POPULAR_COUNTRIES.map((c) => c.dialCode);
      const countryCodes = POPULAR_COUNTRIES.map((c) => c.code);

      // France métropolitaine
      expect(dialCodes).toContain('+33');
      expect(countryCodes).toContain('FR');

      // Guadeloupe (+590)
      expect(dialCodes).toContain('+590');
      expect(countryCodes).toContain('GP');

      // Martinique (+596)
      expect(dialCodes).toContain('+596');
      expect(countryCodes).toContain('MQ');

      // Guyane (+594)
      expect(dialCodes).toContain('+594');
      expect(countryCodes).toContain('GF');

      // La Réunion (+262)
      expect(dialCodes).toContain('+262');
      expect(countryCodes).toContain('RE');

      // Mayotte (+262)
      expect(countryCodes).toContain('YT');

      // Nouvelle-Calédonie (+687) & Polynésie (+689)
      expect(dialCodes).toContain('+687');
      expect(dialCodes).toContain('+689');
    });

    it('includes key European and International countries', () => {
      const countryCodes = POPULAR_COUNTRIES.map((c) => c.code);
      expect(countryCodes).toContain('BE'); // Belgique
      expect(countryCodes).toContain('CH'); // Suisse
      expect(countryCodes).toContain('GB'); // UK
      expect(countryCodes).toContain('US'); // USA
      expect(countryCodes).toContain('CA'); // Canada
      expect(countryCodes).toContain('CI'); // Côte d'Ivoire
      expect(countryCodes).toContain('SN'); // Sénégal
    });
  });

  describe('formatPhoneNumberE164 & isValidPhoneNumber', () => {
    it('formats national French numbers to +33 E164', () => {
      expect(formatPhoneNumberE164('06 12 34 56 78')).toBe('+33612345678');
      expect(formatPhoneNumberE164('0712345678')).toBe('+33712345678');
      expect(isValidPhoneNumber('06 12 34 56 78')).toBe(true);
    });

    it('preserves existing international prefix +33 or other', () => {
      expect(formatPhoneNumberE164('+33612345678')).toBe('+33612345678');
      expect(formatPhoneNumberE164('+590 690 12 34 56')).toBe('+590690123456');
      expect(isValidPhoneNumber('+590 690 12 34 56')).toBe(true);
    });

    it('formats overseas and international numbers with specific country code', () => {
      // Guadeloupe (+590) with leading 0
      expect(formatPhoneNumberE164('0690123456', '+590')).toBe('+590690123456');
      expect(isValidPhoneNumber('+590690123456')).toBe(true);

      // Belgique (+32)
      expect(formatPhoneNumberE164('0470123456', '+32')).toBe('+32470123456');
      expect(isValidPhoneNumber('+32470123456')).toBe(true);

      // Suisse (+41)
      expect(formatPhoneNumberE164('0791234567', '+41')).toBe('+41791234567');
      expect(isValidPhoneNumber('+41791234567')).toBe(true);
    });

    it('rejects malformed numbers', () => {
      expect(isValidPhoneNumber('123')).toBe(false);
      expect(isValidPhoneNumber('abcd')).toBe(false);
      expect(isValidPhoneNumber('+0123')).toBe(false); // country codes do not start with 0
    });
  });

  describe('OAuth Configuration', () => {
    it('isGoogleAuthConfigured returns a boolean based on environment client IDs', () => {
      const configured = isGoogleAuthConfigured();
      expect(typeof configured).toBe('boolean');
    });
  });

  describe('phoneAuthErrorMessage mappings', () => {
    it('maps firebase quota-exceeded error to friendly text', () => {
      const err = { code: 'auth/quota-exceeded' };
      const msg = phoneAuthErrorMessage(err);
      expect(msg).toContain('SMS');
    });

    it('maps invalid-verification-code to friendly text', () => {
      const err = { code: 'auth/invalid-verification-code' };
      const msg = phoneAuthErrorMessage(err);
      expect(msg).toContain('Code incorrect');
    });

    it('maps session-expired to friendly text', () => {
      const err = { code: 'auth/code-expired' };
      const msg = phoneAuthErrorMessage(err);
      expect(msg).toContain('expiré');
    });
  });
});
