import { AUTH_XP } from '../features/auth/experience/tokens';
import { buildSignupSteps } from '../screens/signup/signupFlowConfig';

describe('ProDay Auth Experience', () => {
  it('expose une DA signature (noir + or master)', () => {
    expect(AUTH_XP.black).toBe('#000000');
    expect(AUTH_XP.gold).toBe('#C5A059');
    expect(AUTH_XP.headline).toMatch(/terrain/i);
  });

  it('ne place plus le choix d’univers avant le compte', () => {
    const steps = buildSignupSteps('player', {
      role: 'player',
      parentalRequired: false,
    });
    expect(steps[0]).toBe('account');
    expect(steps.includes('welcome')).toBe(false);
  });
});
