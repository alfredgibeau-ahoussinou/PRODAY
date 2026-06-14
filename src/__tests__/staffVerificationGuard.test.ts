jest.mock('../services/profile.service', () => ({
  profileService: {
    canPerformSensitiveAction: (user: { is_verified?: boolean }) => Boolean(user.is_verified),
  },
}));

import {
  guardStaffVerification,
  isStaffVerificationPending,
} from '../utils/staffVerificationGuard';
import type { User } from '../models/User';

function staffUser(verified: boolean): User {
  return {
    uid: 'coach-1',
    role: 'coach',
    display_name: 'Coach',
    is_verified: verified,
    profile: {},
    city: 'Paris',
    created_at: new Date(),
    updated_at: new Date(),
  } as User;
}

describe('staffVerificationGuard', () => {
  it('détecte un staff non vérifié', () => {
    expect(isStaffVerificationPending(staffUser(false))).toBe(true);
    expect(isStaffVerificationPending(staffUser(true))).toBe(false);
    expect(isStaffVerificationPending(null)).toBe(false);
  });

  it('autorise un staff vérifié', () => {
    expect(guardStaffVerification(staffUser(true))).toBe(true);
  });
});
