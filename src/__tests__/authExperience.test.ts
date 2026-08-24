import { AUTH_XP } from '../features/auth/experience/tokens';
import { buildSignupSteps } from '../screens/signup/signupFlowConfig';
import { MOTION_PRESETS, prodayMotion } from '../motion';

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

  it('aligne les timings auth sur la fenêtre fluidité (200–480ms)', () => {
    expect(AUTH_XP.motionFast).toBeGreaterThanOrEqual(200);
    expect(AUTH_XP.motionFast).toBeLessThanOrEqual(prodayMotion.duration.slow);
    expect(AUTH_XP.motionNormal).toBeGreaterThanOrEqual(AUTH_XP.motionFast);
    expect(AUTH_XP.motionReveal).toBeGreaterThanOrEqual(400);
    expect(AUTH_XP.motionReveal).toBeLessThanOrEqual(600);
    expect(MOTION_PRESETS.form.spring).toEqual(prodayMotion.spring.smooth);
  });
});
