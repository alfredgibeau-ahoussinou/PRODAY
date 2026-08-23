import { filterAccessibleUniversePoles } from '../components/branding/intro/filterAccessibleUniversePoles';
import {
  accentColorAtPage,
  universeAccentRanges,
} from '../components/branding/intro/universeAccentMotion';
import {
  brandVariantForCarouselPole,
  universeEnterCtaLabel,
  universePoleDisplayName,
  universePoleIcon,
} from '../components/branding/intro/universePoleBrand';
import { UNIVERSE_ACCENT } from '../components/branding/intro/universeIntroAccents';
import { UNIVERSE_CHOICE_ORDER } from '../components/branding/intro/universeChoiceShared';
import { PRODAY_POLE_ACCENTS } from '../theme/prodayBrand';
import { gradientsForCarouselPole } from '../theme/universeGradients';

describe('sélecteur univers — accent motion', () => {
  it('interpole les couleurs entre pôles adjacents', () => {
    const lines = ['joueur', 'pro_club', 'coach'] as const;
    const ranges = universeAccentRanges([...lines]);
    expect(ranges.inputRange).toEqual([0, 1, 2]);
    expect(ranges.outputRange[0]).toBe(PRODAY_POLE_ACCENTS.player);
    expect(accentColorAtPage(0, ranges)).toContain('30');
    expect(accentColorAtPage(2, ranges)).toContain('34');
  });
});

describe('sélecteur univers — brand + ACL', () => {
  it('mappe chaque pôle vitrine vers variante + accent planche', () => {
    expect(brandVariantForCarouselPole('joueur')).toBe('player');
    expect(brandVariantForCarouselPole('coach')).toBe('coach');
    expect(brandVariantForCarouselPole('pro_club')).toBe('club');
    expect(brandVariantForCarouselPole('president')).toBe('president');
    expect(brandVariantForCarouselPole('parent')).toBe('parent');
    expect(brandVariantForCarouselPole('supporter')).toBe('supporter');
    expect(brandVariantForCarouselPole('sponsor')).toBe('sponsor');

    expect(UNIVERSE_ACCENT.joueur).toBe(PRODAY_POLE_ACCENTS.player);
    expect(UNIVERSE_ACCENT.coach).toBe(PRODAY_POLE_ACCENTS.coach);
    expect(UNIVERSE_ACCENT.pro_club).toBe(PRODAY_POLE_ACCENTS.club);
    expect(UNIVERSE_ACCENT.president).toBe(PRODAY_POLE_ACCENTS.president);
    expect(UNIVERSE_ACCENT.parent).toBe(PRODAY_POLE_ACCENTS.parent);
    expect(UNIVERSE_ACCENT.supporter).toBe(PRODAY_POLE_ACCENTS.supporter);
    expect(UNIVERSE_ACCENT.sponsor).toBe(PRODAY_POLE_ACCENTS.sponsor);
  });

  it('expose CTA « Entrer dans l’univers X » et icônes rôle', () => {
    expect(universeEnterCtaLabel('joueur')).toBe('Entrer dans l’univers Joueur');
    expect(universePoleDisplayName('president')).toBe('Président');
    expect(universePoleIcon('joueur')).toBe('person');
    expect(universePoleIcon('coach')).toBe('school');
    expect(universePoleIcon('pro_club')).toBe('shield');
    expect(universePoleIcon('president')).toBe('star');
    expect(universePoleIcon('parent')).toBe('people');
    expect(universePoleIcon('supporter')).toBe('flag');
    expect(universePoleIcon('sponsor')).toBe('handshake');
  });

  it('pré-auth / admin : vitrine complète', () => {
    expect(filterAccessibleUniversePoles(null)).toEqual(UNIVERSE_CHOICE_ORDER);
    expect(filterAccessibleUniversePoles({ isAdmin: true, role: 'player' })).toEqual(
      UNIVERSE_CHOICE_ORDER,
    );
  });

  it('filtre ACL joueur / coach / club (président inclus)', () => {
    expect(filterAccessibleUniversePoles('player')).toEqual(['joueur']);
    expect(filterAccessibleUniversePoles('coach')).toEqual(['coach']);
    expect(filterAccessibleUniversePoles('club')).toEqual(['pro_club', 'president']);
  });

  it('parent voit Parent + Supporter (guest)', () => {
    expect(filterAccessibleUniversePoles('parent')).toEqual(['parent', 'supporter']);
  });

  it('gradients carousel alignés accents brand (continuité shell)', () => {
    expect(gradientsForCarouselPole('joueur').cta[0]).toBe('#1E3AFF');
    expect(gradientsForCarouselPole('coach').cta[1]).toBe('#22C55E');
    expect(gradientsForCarouselPole('pro_club').cta[1]).toBe('#7C3AED');
    expect(gradientsForCarouselPole('president').cta[1]).toBe('#FBBF24');
    expect(gradientsForCarouselPole('sponsor').cta[1]).toBe('#EF4444');
  });
});
