import { AUTH_XP } from '../features/auth/experience/tokens';
import { buildSignupSteps } from '../screens/signup/signupFlowConfig';
import { MOTION_PRESETS, prodayMotion } from '../motion';
import {
  brandSessionTotalMs,
  BRAND_SESSION_COPY,
  BRAND_SESSION_REVEAL,
} from '../components/branding/intro/launchIntroFlow';

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

  it('aligne les timings auth UI sur la fenêtre fluidité (140–480ms)', () => {
    expect(AUTH_XP.motionFast).toBeGreaterThanOrEqual(140);
    expect(AUTH_XP.motionFast).toBeLessThanOrEqual(prodayMotion.duration.slow);
    expect(AUTH_XP.motionNormal).toBeGreaterThanOrEqual(AUTH_XP.motionFast);
    expect(AUTH_XP.motionReveal).toBeGreaterThanOrEqual(400);
    expect(AUTH_XP.motionReveal).toBeLessThanOrEqual(600);
    expect(MOTION_PRESETS.form.spring).toEqual(prodayMotion.spring.smooth);
  });

  it('orchestre connect/disconnect via BrandSessionReveal (~1.5–2.5s)', () => {
    expect(BRAND_SESSION_COPY.welcome).toBe('Bienvenue');
    expect(BRAND_SESSION_COPY.goodbye).toBe('Au revoir');

    const full = brandSessionTotalMs(false);
    const reduced = brandSessionTotalMs(true);
    expect(full).toBeGreaterThanOrEqual(1500);
    expect(full).toBeLessThanOrEqual(2500);
    expect(reduced).toBeLessThan(full);
    expect(BRAND_SESSION_REVEAL.exitFloor).toBeGreaterThan(0);
  });
});
