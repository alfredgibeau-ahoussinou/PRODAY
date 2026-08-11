import { stripDashTypography } from '../utils/stripDashTypography';

describe('stripDashTypography', () => {
  it('retire tirets longs et puces', () => {
    const raw = 'Salut — voici l’idée.\n- Ouvre Structure\n– Puis Vivier';
    const cleaned = stripDashTypography(raw);
    expect(cleaned).not.toMatch(/[—–]/);
    expect(cleaned).not.toMatch(/^\s*-\s/m);
    expect(cleaned).toContain('Ouvre Structure');
    expect(cleaned).toContain('Puis Vivier');
  });

  it('conserve les traits d’union dans les mots', () => {
    expect(stripDashTypography('Tu peux peut-être commencer.')).toBe(
      'Tu peux peut-être commencer.',
    );
  });
});
