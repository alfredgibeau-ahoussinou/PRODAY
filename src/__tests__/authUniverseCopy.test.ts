import { resolveUniverseAuthCopy } from '../screens/authUniverseCopy';

/**
 * Contrat libellés auth : chaque pôle affiche SON « Espace … ».
 * « Espace Administrateur » n'apparaît QUE pour l'entrée admin explicite
 * (isAdminAuth) — jamais déduite d'un email mémorisé (régression dcb9e59a :
 * le flag fuyait sur tous les pôles et rendait « Créer un compte » inopérant).
 */
describe('resolveUniverseAuthCopy — Espace X par pôle', () => {
  const guest = {
    isAdminAuth: false,
    productLine: 'amateur' as const,
  };

  it('joueur → Espace Joueur (gate + login)', () => {
    const copy = resolveUniverseAuthCopy({ ...guest, initialPole: 'joueur' });
    expect(copy.title).toBe('Espace Joueur');
    expect(copy.gateTitle).toBe('Espace Joueur');
    expect(copy.gateTitle).not.toContain('Administrateur');
  });

  it('coach → Espace Coach', () => {
    const byPole = resolveUniverseAuthCopy({ ...guest, initialPole: 'coach' });
    const byLine = resolveUniverseAuthCopy({ ...guest, productLine: 'pro_staff' });
    const byRole = resolveUniverseAuthCopy({
      ...guest,
      signupInitialRole: 'coach',
    });
    for (const copy of [byPole, byLine, byRole]) {
      expect(copy.title).toBe('Espace Coach');
      expect(copy.gateTitle).toBe('Espace Coach');
    }
  });

  it('club / président → Espace Club', () => {
    const byPole = resolveUniverseAuthCopy({ ...guest, initialPole: 'pro_club' });
    const byPresident = resolveUniverseAuthCopy({ ...guest, initialPole: 'president' });
    const byRole = resolveUniverseAuthCopy({ ...guest, signupInitialRole: 'club' });
    for (const copy of [byPole, byPresident, byRole]) {
      expect(copy.title).toBe('Espace Club');
      expect(copy.gateTitle).toBe('Espace Club');
    }
  });

  it('parent → Espace Parent', () => {
    const copy = resolveUniverseAuthCopy({ ...guest, initialPole: 'parent' });
    expect(copy.title).toBe('Espace Parent');
    expect(copy.gateTitle).toBe('Espace Parent');
  });

  it('supporter → Espace Supporter', () => {
    const copy = resolveUniverseAuthCopy({ ...guest, initialPole: 'supporter' });
    expect(copy.title).toBe('Espace Supporter');
    expect(copy.gateTitle).toBe('Espace Supporter');
  });

  it('sponsor → Espace Partenaire (inchangé)', () => {
    const copy = resolveUniverseAuthCopy({ ...guest, initialPole: 'sponsor' });
    expect(copy.title).toBe('Connexion Partenaire');
    expect(copy.gateTitle).toBe('Espace Partenaire');
  });

  it('Espace Administrateur UNIQUEMENT pour l’entrée admin explicite', () => {
    for (const pole of [
      'joueur',
      'coach',
      'pro_club',
      'president',
      'parent',
      'supporter',
      'sponsor',
    ] as const) {
      const copy = resolveUniverseAuthCopy({ ...guest, initialPole: pole });
      expect(copy.gateTitle).not.toBe('Espace Administrateur');
      expect(copy.title).not.toBe('Connexion Admin');
    }

    const admin = resolveUniverseAuthCopy({
      isAdminAuth: true,
      productLine: 'amateur',
      initialPole: 'admin',
    });
    expect(admin.gateTitle).toBe('Espace Administrateur');
    expect(admin.title).toBe('Connexion Admin');
  });

  it('le résolveur ne prend aucun email en entrée — un email mémorisé ne peut plus influencer les titres (contrat par signature)', () => {
    // Garde-fou anti-régression : la signature n'expose aucun champ email/claim.
    const opts: Parameters<typeof resolveUniverseAuthCopy>[0] = {
      isAdminAuth: false,
      productLine: 'amateur',
      initialPole: 'joueur',
    };
    expect(Object.keys(opts)).toEqual([
      'isAdminAuth',
      'productLine',
      'initialPole',
    ]);
    expect(opts).not.toHaveProperty('email');
    expect(opts).not.toHaveProperty('savedEmail');
  });
});
