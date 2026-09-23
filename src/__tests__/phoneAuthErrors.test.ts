import {
  mapPhoneAuthErrorCode,
  phoneAuthErrorMessage,
} from '../utils/phoneAuthErrors';

describe('phoneAuthErrors', () => {
  it('maps every user-facing phone auth failure to an honest French message', () => {
    expect(mapPhoneAuthErrorCode('auth/invalid-verification-code')).toContain('Code incorrect');
    expect(mapPhoneAuthErrorCode('auth/code-expired')).toContain('expiré');
    expect(mapPhoneAuthErrorCode('auth/too-many-requests')).toContain('Trop de tentatives');
    expect(mapPhoneAuthErrorCode('auth/quota-exceeded')).toContain('Quota');
    expect(mapPhoneAuthErrorCode('auth/invalid-app-credential')).toContain(
      'reCAPTCHA/attestation',
    );
    expect(mapPhoneAuthErrorCode('auth/credential-already-in-use')).toContain(
      'déjà associé',
    );
  });

  it('returns undefined for unknown codes so the caller can use its fallback', () => {
    expect(mapPhoneAuthErrorCode('auth/unknown-code')).toBeUndefined();
    expect(phoneAuthErrorMessage(new Error('boom'))).toBeUndefined();
    expect(phoneAuthErrorMessage('not-an-error')).toBeUndefined();
  });

  it('extracts the code from Firebase-shaped errors only', () => {
    expect(phoneAuthErrorMessage({ code: 'auth/code-expired' })).toContain('expiré');
    expect(phoneAuthErrorMessage({ code: 'auth/invalid-verification-code' })).toContain(
      'Code incorrect',
    );
  });
});
