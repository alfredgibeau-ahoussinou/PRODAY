import { getLiquidGlassTokens, LIQUID_GLASS_TOKENS } from '../theme/liquidGlass';
import { buildSignupSteps, resolveSignupBackKind } from '../screens/signup/signupFlowConfig';

describe('Liquid Glass & Simplified Registration Redesign', () => {
  it('provides glass tokens by default on supported environments', () => {
    const tokens = getLiquidGlassTokens(false);
    expect(tokens.mode).toBe('glass');
    expect(tokens.bg).toBe(LIQUID_GLASS_TOKENS.glass.bg);
    expect(tokens.border).toBe(LIQUID_GLASS_TOKENS.glass.border);
  });

  it('provides clean opaque fallback when forceOpaque is true', () => {
    const tokens = getLiquidGlassTokens(true);
    expect(tokens.mode).toBe('opaque');
    expect(tokens.bg).toBe(LIQUID_GLASS_TOKENS.opaque.bg);
    expect(tokens.border).toBe(LIQUID_GLASS_TOKENS.opaque.border);
  });

  it('builds clean single-focus step journeys for coach without redundant document steps in-flow', () => {
    const coachSteps = buildSignupSteps('staff', {
      role: 'coach',
      parentalRequired: false,
    });
    expect(coachSteps).toEqual(['coach_pro', 'account', 'security', 'launch']);
  });

  it('builds clean single-focus step journeys for player without demo fallback traps', () => {
    const playerSteps = buildSignupSteps('player', {
      role: 'player',
      parentalRequired: false,
    });
    expect(playerSteps).toEqual(['sport', 'account', 'security', 'launch']);
  });

  it('handles back navigation cleanly from step 0 to close and step > 0 to previous', () => {
    expect(resolveSignupBackKind({ accountCreated: false, pageIndex: 0 })).toBe('close');
    expect(resolveSignupBackKind({ accountCreated: false, pageIndex: 1 })).toBe('previous');
    expect(resolveSignupBackKind({ accountCreated: true, pageIndex: 2 })).toBe('none');
  });
});
