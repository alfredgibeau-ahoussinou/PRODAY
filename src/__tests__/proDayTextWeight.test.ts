import { resolveProDayTextStyle, resolveTextFamily, resolveTextWeight } from '../theme/proDayTextStyle';
import { fontFamily, textVariants } from '../theme/typography';

/**
 * Régression corrigée : la famille résolue est la **pile système Apple**, dont
 * tous les alias (`regular`, `bold`, `black`, `display`…) pointent vers la même
 * valeur. La graisse ne peut donc plus être portée par le nom de la famille et
 * doit rester dans `fontWeight` — sinon tous les titres retombent en graisse
 * normale et la hiérarchie visuelle disparaît de toute l'application.
 */
describe('ProDayText — la graisse survit à la résolution de famille', () => {
  it('les alias de famille pointent tous vers la pile système (prémisse du correctif)', () => {
    const aliases = [
      fontFamily.regular,
      fontFamily.semibold,
      fontFamily.bold,
      fontFamily.extrabold,
      fontFamily.black,
      fontFamily.display,
      fontFamily.displayBold,
    ];
    // Une seule valeur distincte : le nom de famille ne peut rien encoder.
    expect(new Set(aliases).size).toBe(1);
  });

  it('transmet la graisse de la variante quand l’appelant n’en fournit pas', () => {
    for (const variant of Object.keys(textVariants) as (keyof typeof textVariants)[]) {
      const resolved = resolveProDayTextStyle(variant);
      expect(resolved.fontWeight).toBe(textVariants[variant].fontWeight);
    }
  });

  it('un titre de variante reste gras au lieu de retomber en normal', () => {
    const title = resolveProDayTextStyle('title');
    const numeric = Number(title.fontWeight);
    expect(numeric).toBeGreaterThanOrEqual(600);

    const hero = resolveProDayTextStyle('hero');
    expect(Number(hero.fontWeight)).toBeGreaterThanOrEqual(600);
  });

  it('honore une graisse explicite de l’appelant', () => {
    const resolved = resolveProDayTextStyle('body', { fontWeight: '800' });
    expect(resolved.fontWeight).toBe('800');
  });

  it('impose la famille système et ignore toute police tierce reçue', () => {
    const resolved = resolveProDayTextStyle('title', { fontFamily: 'Inter_700Bold' });
    expect(resolved.fontFamily).toBe(resolveTextFamily('title'));
    expect(resolved.fontFamily).not.toBe('Inter_700Bold');
  });

  it('retire toute distorsion de texte (transform)', () => {
    const resolved = resolveProDayTextStyle('title', { transform: [{ skewX: '12deg' }] });
    expect(resolved.transform).toBeUndefined();
  });

  it('conserve les tailles et interlignes de la variante', () => {
    const resolved = resolveProDayTextStyle('hero');
    expect(resolved.fontSize).toBe(textVariants.hero.fontSize);
    expect(resolved.lineHeight).toBe(textVariants.hero.lineHeight);
  });

  it('replie sur la graisse normale quand la variante n’en définit aucune', () => {
    expect(resolveTextWeight('body', undefined)).toBe('400');
  });
});
