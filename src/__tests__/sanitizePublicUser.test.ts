import type { User } from '../models/User';
import { sanitizePublicUser } from '../utils/sanitizePublicUser';

describe('sanitizePublicUser', () => {
  const fullUser = {
    uid: 'u1',
    email: 'secret@test.com',
    phone: '0600000000',
    other_contact: '@joueur',
    display_name: 'Joueur',
    role: 'player',
    is_verified: false,
    verification_status: 'NOT_REQUIRED',
    documents: [],
    created_at: new Date(),
    updated_at: new Date(),
    contact_privacy: {
      phone: ['club_staff'],
      email: ['agents'],
      other: ['connections'],
    },
    profile: { age: 16, phone: '0600000000' },
    parental_settings: { is_minor: true, supervision_enabled: true },
  } as unknown as User;

  it('retire les champs sensibles pour un stranger', () => {
    const publicUser = sanitizePublicUser(fullUser);
    expect(publicUser.email).toBeUndefined();
    expect(publicUser.phone).toBeUndefined();
    expect(publicUser.other_contact).toBeUndefined();
    expect(publicUser.parental_settings).toBeUndefined();
    expect(publicUser.display_name).toBe('Joueur');
  });

  it('expose email aux agents selon contact_privacy', () => {
    const publicUser = sanitizePublicUser(fullUser, { viewerRelation: 'agent' });
    expect(publicUser.email).toBe('secret@test.com');
    expect(publicUser.phone).toBeUndefined();
    expect(publicUser.other_contact).toBeUndefined();
    expect(publicUser.parental_settings).toBeUndefined();
  });

  it('expose téléphone au staff club', () => {
    const publicUser = sanitizePublicUser(fullUser, { viewerRelation: 'club_staff' });
    expect(publicUser.phone).toBe('0600000000');
    expect(publicUser.email).toBeUndefined();
  });

  it('expose tout au propriétaire', () => {
    const publicUser = sanitizePublicUser(fullUser, { viewerRelation: 'self' });
    expect(publicUser.email).toBe('secret@test.com');
    expect(publicUser.phone).toBe('0600000000');
    expect(publicUser.other_contact).toBe('@joueur');
  });
});
