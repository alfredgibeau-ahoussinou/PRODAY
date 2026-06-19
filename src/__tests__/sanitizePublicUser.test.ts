import type { User } from '../models/User';
import { sanitizePublicUser } from '../utils/sanitizePublicUser';

describe('sanitizePublicUser', () => {
  const fullUser = {
    uid: 'u1',
    email: 'secret@test.com',
    phone: '0600000000',
    display_name: 'Joueur',
    role: 'player',
    is_verified: false,
    verification_status: 'NOT_REQUIRED',
    documents: [],
    created_at: new Date(),
    updated_at: new Date(),
    profile: { age: 16, phone: '0600000000' },
    parental_settings: { is_minor: true, supervision_enabled: true },
  } as unknown as User;

  it('retire les champs sensibles', () => {
    const publicUser = sanitizePublicUser(fullUser);
    expect(publicUser.email).toBeUndefined();
    expect(publicUser.phone).toBeUndefined();
    expect(publicUser.parental_settings).toBeUndefined();
    expect(publicUser.display_name).toBe('Joueur');
  });
});
