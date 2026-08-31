import { blendHex, deriveSurface, deriveThemedBackground } from '../utils/colorBlend';

describe('colorBlend', () => {
  it('blendHex mélange deux couleurs à mi-chemin', () => {
    expect(blendHex('#000000', '#FFFFFF', 0.5)).toBe('#808080');
  });

  it('blendHex ratio 0 retourne a', () => {
    expect(blendHex('#FF0000', '#0000FF', 0)).toBe('#FF0000');
  });

  it('blendHex ratio 1 retourne b', () => {
    expect(blendHex('#FF0000', '#0000FF', 1)).toBe('#0000FF');
  });

  it('deriveSurface teinte le fond avec l’accent', () => {
    const surface = deriveSurface('#0A0A0F', '#1E88E5');
    expect(surface).toMatch(/^#[0-9A-F]{6}$/);
    expect(surface).not.toBe('#0A0A0F');
  });

  it('deriveThemedBackground assombrit avec teinte accent', () => {
    const bg = deriveThemedBackground('#E53935');
    expect(bg).toMatch(/^#[0-9A-F]{6}$/);
    expect(bg).not.toBe('#0A0A0F');
  });

  it('blendHex normalise les hex sans #', () => {
    const result = blendHex('FF0000', '0000FF', 0.5);
    expect(result).toBe('#800080');
  });
});
