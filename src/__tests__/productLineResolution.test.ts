jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  canonicalizeActiveProductLine,
  canonicalizeUserProductLine,
  needsProductLineMigration,
  resolvePersistedProductLine,
  splitLegacyProByRole,
} from '../utils/productLineResolution';

describe('productLineResolution', () => {
  it('scinde pro legacy par rôle', () => {
    expect(splitLegacyProByRole('player')).toBe('pro_player');
    expect(splitLegacyProByRole('club')).toBe('pro_club');
    expect(splitLegacyProByRole('coach')).toBe('pro_staff');
    expect(splitLegacyProByRole('sponsor')).toBe('pro_staff');
  });

  it('canonicalise pro legacy', () => {
    expect(canonicalizeUserProductLine('pro', 'club')).toBe('pro_club');
    expect(canonicalizeUserProductLine('pro_player', 'player')).toBe('pro_player');
    expect(canonicalizeActiveProductLine('pro_player', 'coach')).toBe('pro_player');
  });

  it('canonicalise homme/woman joueur vers pro_player', () => {
    expect(canonicalizeUserProductLine('homme', 'player')).toBe('pro_player');
    expect(canonicalizeUserProductLine('woman', 'player')).toBe('pro_player');
    expect(canonicalizeUserProductLine(undefined, 'player')).toBe('pro_player');
  });

  it('détecte les comptes à migrer', () => {
    expect(needsProductLineMigration('pro')).toBe(true);
    expect(needsProductLineMigration('pro_player')).toBe(false);
  });

  it('résout la valeur persistée pour inscription', () => {
    expect(resolvePersistedProductLine('pro', 'player')).toBe('pro_player');
    expect(resolvePersistedProductLine('pro_club', 'club')).toBe('pro_club');
  });
});
