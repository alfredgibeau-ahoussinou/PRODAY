import { guardianEmailsMatch, normalizeGuardianEmail } from '../utils/guardianEmail';

describe('guardianEmail', () => {
  it('normalise les emails', () => {
    expect(normalizeGuardianEmail('  Parent@Test.COM ')).toBe('parent@test.com');
  });

  it('compare les emails tuteur', () => {
    expect(guardianEmailsMatch('Parent@Test.com', 'parent@test.com')).toBe(true);
    expect(guardianEmailsMatch('a@test.com', 'b@test.com')).toBe(false);
  });
});
