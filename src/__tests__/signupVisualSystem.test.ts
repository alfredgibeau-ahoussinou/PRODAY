import {
  ATHLETIC_PALETTE,
  SIGNUP_POLE_ACCENT_MAP,
  brandVariantForSignupRole,
  resolveSignupVisual,
} from '../screens/signup/signupVisualSystem';

describe('Signup visual system — accents Electric Athletic', () => {
  it('mappe chaque rôle foot sur la palette Electric Athletic', () => {
    expect(resolveSignupVisual({ role: 'player' }).accent).toBe(ATHLETIC_PALETTE.electricMint);
    expect(resolveSignupVisual({ role: 'coach' }).accent).toBe(ATHLETIC_PALETTE.iceCyan);
    expect(resolveSignupVisual({ role: 'club' }).accent).toBe(ATHLETIC_PALETTE.amberSunset);
    expect(resolveSignupVisual({ role: 'parent' }).accent).toBe(ATHLETIC_PALETTE.electricMint);
    expect(resolveSignupVisual({ role: 'sponsor' }).accent).toBe(ATHLETIC_PALETTE.amberSunset);
    expect(resolveSignupVisual({ role: 'supporter' }).accent).toBe(ATHLETIC_PALETTE.iceCyan);
  });

  it('expose le même mapping que SIGNUP_POLE_ACCENT_MAP', () => {
    expect(SIGNUP_POLE_ACCENT_MAP.player).toBe(ATHLETIC_PALETTE.electricMint);
    expect(SIGNUP_POLE_ACCENT_MAP.coach).toBe(ATHLETIC_PALETTE.iceCyan);
    expect(SIGNUP_POLE_ACCENT_MAP.club).toBe(ATHLETIC_PALETTE.amberSunset);
    expect(SIGNUP_POLE_ACCENT_MAP.parent).toBe(ATHLETIC_PALETTE.electricMint);
  });

  it('donne un chrome shell (wash + surfaces dark athletic) par pôle', () => {
    const club = resolveSignupVisual({ role: 'club' });
    expect(club.bg).toBe(ATHLETIC_PALETTE.bg);
    expect(club.poleLabel).toBe('CLUB');
    expect(club.onAccent).toBe(ATHLETIC_PALETTE.onAmber);

    const player = resolveSignupVisual({ role: 'player' });
    expect(player.bg).toBe(ATHLETIC_PALETTE.bg);
    expect(player.poleLabel).toBe('JOUEUR');
    expect(player.onAccent).toBe(ATHLETIC_PALETTE.onMint);
  });

  it('mappe les variantes brand correctement', () => {
    expect(brandVariantForSignupRole('player')).toBe('player');
    expect(brandVariantForSignupRole('coach')).toBe('coach');
    expect(brandVariantForSignupRole('club')).toBe('club');
    expect(brandVariantForSignupRole('parent')).toBe('parent');
  });

  it('résout le pôle carousel vers le bon accent', () => {
    expect(resolveSignupVisual({ pole: 'joueur' }).accent).toBe(ATHLETIC_PALETTE.electricMint);
    expect(resolveSignupVisual({ pole: 'coach' }).accent).toBe(ATHLETIC_PALETTE.iceCyan);
    expect(resolveSignupVisual({ pole: 'pro_club' }).accent).toBe(ATHLETIC_PALETTE.amberSunset);
  });
});
