import {
  CAROUSEL_SHOWCASE_POLE_ORDER,
} from '../models/CarouselPole';
import {
  UNIVERSE_GUIDE_PUBLIC_POLES,
  UNIVERSE_GUIDE_ROOT,
  filterGuideLeadBranchForLines,
  filterGuideRootForLines,
  resolveGuidePoleInLines,
  universeGuideResultCopy,
} from '../components/branding/intro/universeGuideContent';

describe('universeGuideContent', () => {
  it('n’expose pas Admin dans les pôles grand public du guide', () => {
    expect(UNIVERSE_GUIDE_PUBLIC_POLES.includes('admin')).toBe(false);
    expect(UNIVERSE_GUIDE_ROOT.some((c) => c.pole === 'admin')).toBe(false);
  });

  it('filtre les choix selon le carousel visible', () => {
    const lines = CAROUSEL_SHOWCASE_POLE_ORDER.filter((p) => p !== 'admin');
    const root = filterGuideRootForLines(lines);
    expect(root.map((c) => c.id)).toEqual([
      'play',
      'lead',
      'family',
      'fans',
      'brand',
    ]);
    const lead = filterGuideLeadBranchForLines(lines);
    expect(lead.map((c) => c.pole)).toEqual(['coach', 'pro_club', 'president']);
  });

  it('résout le pôle dans les lignes carousel', () => {
    expect(resolveGuidePoleInLines('joueur', ['joueur', 'coach'])).toBe('joueur');
    expect(resolveGuidePoleInLines('admin', ['joueur', 'coach'])).toBeNull();
  });

  it('fournit un CTA « Voir l’univers » pour le résultat', () => {
    const copy = universeGuideResultCopy('pro_club');
    expect(copy.cta).toMatch(/univers/i);
    expect(copy.title).toBe('Club');
  });
});
