import {
  resolveAuthEmailSendStrategy,
  type AuthEmailCallableResult,
} from '../utils/authEmailCallableResult';

describe('resolveAuthEmailSendStrategy', () => {
  it('indique un envoi custom réussi', () => {
    expect(resolveAuthEmailSendStrategy({ enabled: true, sent: true })).toBe('custom-sent');
  });

  it('ignore le renvoi si e-mail déjà vérifié', () => {
    expect(resolveAuthEmailSendStrategy({ enabled: true, sent: false })).toBe('skip');
  });

  it('bascule sur Firebase Auth si le transport custom est indisponible', () => {
    const disabled: AuthEmailCallableResult = { enabled: false, sent: false };
    expect(resolveAuthEmailSendStrategy(disabled)).toBe('firebase-fallback');
  });
});
