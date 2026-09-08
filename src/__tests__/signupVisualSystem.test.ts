import { PRODAY_POLE_ACCENTS } from '../theme/prodayBrand';
import {
  SIGNUP_POLE_ACCENT_MAP,
  brandVariantForSignupRole,
  resolveSignupVisual,
} from '../screens/signup/signupVisualSystem';

describe('Signup visual system — accents officiels pôles', () => {
  it('mappe chaque rôle foot sur PRODAY_POLE_ACCENTS (pas d’or forcé joueur)', () => {
    expect(resolveSignupVisual({ role: 'player' }).accent).toBe(PRODAY_POLE_ACCENTS.player);
    expect(resolveSignupVisual({ role: 'coach' }).accent).toBe(PRODAY_POLE_ACCENTS.coach);
    expect(resolveSignupVisual({ role: 'club' }).accent).toBe(PRODAY_POLE_ACCENTS.club);
    expect(resolveSignupVisual({ role: 'parent' }).accent).toBe(PRODAY_POLE_ACCENTS.parent);
    expect(resolveSignupVisual({ role: 'sponsor' }).accent).toBe(PRODAY_POLE_ACCENTS.sponsor);
    expect(resolveSignupVisual({ role: 'supporter' }).accent).toBe(PRODAY_POLE_ACCENTS.supporter);
  });

  it('expose le même mapping que la planche brand', () => {
    expect(SIGNUP_POLE_ACCENT_MAP.player).toBe('#FFFFFF');
    expect(SIGNUP_POLE_ACCENT_MAP.coach).toBe('#C5A059');
    expect(SIGNUP_POLE_ACCENT_MAP.club).toBe('#10B981');
    expect(SIGNUP_POLE_ACCENT_MAP.parent).toBe('#8CC63F');
  });

  it('donne un chrome shell (wash + surfaces charcoal) par pôle', () => {
    const club = resolveSignupVisual({ role: 'club' });
    expect(club.bg).toBe('#000000');
    expect(club.poleLabel).toBe('CLUB');
    expect(club.washTop).toContain('16, 185, 129');
    expect(club.onAccent).toBe('#FFFFFF');

    const player = resolveSignupVisual({ role: 'player' });
    expect(player.poleLabel).toBe('JOUEUR');
    expect(player.onAccent).toBe('#000000');
    // Focus lisible (pas blanc pur sur chrome fin)
    expect(player.focus).toBe('#E8D5A3');
  });

  it('mappe les variantes brand correctement', () => {
    expect(brandVariantForSignupRole('player')).toBe('player');
    expect(brandVariantForSignupRole('coach')).toBe('coach');
    expect(brandVariantForSignupRole('club')).toBe('club');
    expect(brandVariantForSignupRole('parent')).toBe('parent');
  });

  it('résout le pôle carousel vers le bon accent', () => {
    expect(resolveSignupVisual({ pole: 'joueur' }).accent).toBe(PRODAY_POLE_ACCENTS.player);
    expect(resolveSignupVisual({ pole: 'coach' }).accent).toBe(PRODAY_POLE_ACCENTS.coach);
    expect(resolveSignupVisual({ pole: 'pro_club' }).accent).toBe(PRODAY_POLE_ACCENTS.club);
  });
});
