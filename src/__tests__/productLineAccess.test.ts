jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

import {
  getProductLineMismatchMessage,
  getUserProductLine,
  profileMatchesActiveLine,
} from '../utils/productLineAccess';
import type { User } from '../models/User';

const baseUser = {
  uid: 'u1',
  display_name: 'Test',
  email: 't@test.com',
  role: 'player' as const,
  is_verified: false,
  verification_status: 'NOT_REQUIRED' as const,
  profile: {},
  documents: [],
  created_at: new Date(),
  updated_at: new Date(),
  is_active: true,
};

describe('productLineAccess', () => {
  it('lit product_line explicite', () => {
    const user = { ...baseUser, product_line: 'woman' as const };
    expect(getUserProductLine(user)).toBe('woman');
  });

  it('déduit woman depuis app_space legacy', () => {
    const user = { ...baseUser, app_space: 'women' as const };
    expect(getUserProductLine(user)).toBe('woman');
  });

  it('compte standard par défaut', () => {
    expect(getUserProductLine(baseUser as User)).toBe('standard');
  });

  it('refuse connexion cross-version', () => {
    const womanUser = { ...baseUser, product_line: 'woman' as const } as User;
    expect(profileMatchesActiveLine(womanUser, 'standard')).toBe(false);
    expect(getProductLineMismatchMessage('woman', 'standard')).toMatch(/ProDay Woman/);
    expect(getProductLineMismatchMessage('standard', 'woman')).toMatch(/classique/);
  });
});
