import {
  canAccessSensitiveResource,
  denyReason,
  hasActiveGrant,
  isTreatingPhysio,
  mapUserRoleToPrivacyActor,
  type PrivacyAccessContext,
} from '../utils/privacyAccess';
import type { PrivacyAccessGrant } from '../models/Privacy';

function grant(partial: Partial<PrivacyAccessGrant> & Pick<PrivacyAccessGrant, 'id' | 'owner_uid' | 'grantee_uid' | 'scope' | 'permissions'>): PrivacyAccessGrant {
  return {
    resource_type: 'medical_document',
    resource_id: null,
    purpose: null,
    expires_at: null,
    revoked_at: null,
    created_at: new Date(),
    updated_at: new Date(),
    ...partial,
  };
}

const base = (overrides: Partial<PrivacyAccessContext> = {}): PrivacyAccessContext => ({
  actor_uid: 'actor',
  actor_role: 'other',
  owner_uid: 'patient1',
  resource_type: 'medical_document',
  resource_id: 'med1',
  grants: [],
  treating_links: [],
  now: new Date('2026-08-05T12:00:00Z'),
  ...overrides,
});

describe('privacyAccess RBAC', () => {
  it('autorise le patient propriétaire', () => {
    expect(
      canAccessSensitiveResource(
        base({ actor_uid: 'patient1', actor_role: 'patient' }),
      ),
    ).toBe(true);
  });

  it('autorise le praticien traitant', () => {
    expect(
      canAccessSensitiveResource(
        base({
          actor_uid: 'physio1',
          actor_role: 'physio',
          treating_links: [{ physio_uid: 'physio1', patient_uid: 'patient1' }],
        }),
      ),
    ).toBe(true);
  });

  it('refuse le praticien sans lien de soin', () => {
    expect(
      canAccessSensitiveResource(
        base({ actor_uid: 'physio2', actor_role: 'physio' }),
      ),
    ).toBe(false);
  });

  it('refuse le praticien si treating_revoked', () => {
    expect(
      canAccessSensitiveResource(
        base({
          actor_uid: 'physio1',
          actor_role: 'physio',
          treating_links: [
            { physio_uid: 'physio1', patient_uid: 'patient1', treating_revoked: true },
          ],
        }),
      ),
    ).toBe(false);
  });

  it('autorise le parent uniquement si flag médical', () => {
    expect(
      canAccessSensitiveResource(
        base({
          actor_uid: 'parent1',
          actor_role: 'parent',
          parent_of_owner: true,
          parent_can_access_medical: false,
        }),
      ),
    ).toBe(false);
    expect(
      canAccessSensitiveResource(
        base({
          actor_uid: 'parent1',
          actor_role: 'parent',
          parent_of_owner: true,
          parent_can_access_medical: true,
        }),
      ),
    ).toBe(true);
  });

  it('refuse coach / club / recruiter / agent sans grant', () => {
    for (const role of ['coach', 'club', 'recruiter', 'agent'] as const) {
      expect(
        canAccessSensitiveResource(base({ actor_uid: 'x', actor_role: role })),
      ).toBe(false);
    }
  });

  it('autorise coach avec grant explicite', () => {
    const ctx = base({
      actor_uid: 'coach1',
      actor_role: 'coach',
      grants: [
        grant({
          id: 'g1',
          owner_uid: 'patient1',
          grantee_uid: 'coach1',
          scope: 'resource',
          resource_type: 'medical_document',
          resource_id: 'med1',
          permissions: ['read'],
        }),
      ],
    });
    expect(canAccessSensitiveResource(ctx, 'read')).toBe(true);
    expect(canAccessSensitiveResource(ctx, 'download')).toBe(false);
  });

  it('ignore les grants révoqués ou expirés', () => {
    expect(
      hasActiveGrant(
        base({
          actor_uid: 'coach1',
          grants: [
            grant({
              id: 'g1',
              owner_uid: 'patient1',
              grantee_uid: 'coach1',
              scope: 'all_medical',
              permissions: ['read'],
              revoked_at: new Date('2026-08-01'),
            }),
          ],
        }),
        'read',
      ),
    ).toBe(false);

    expect(
      hasActiveGrant(
        base({
          actor_uid: 'coach1',
          grants: [
            grant({
              id: 'g2',
              owner_uid: 'patient1',
              grantee_uid: 'coach1',
              scope: 'all_medical',
              permissions: ['read'],
              expires_at: new Date('2026-08-01'),
            }),
          ],
        }),
        'read',
      ),
    ).toBe(false);
  });

  it('refuse documents personnels sans grant même pour physio', () => {
    expect(
      canAccessSensitiveResource(
        base({
          actor_uid: 'physio1',
          actor_role: 'physio',
          resource_type: 'personal_document',
          resource_id: 'p1',
          treating_links: [{ physio_uid: 'physio1', patient_uid: 'patient1' }],
        }),
      ),
    ).toBe(false);
  });

  it('autorise admin (break-glass)', () => {
    expect(
      canAccessSensitiveResource(base({ actor_uid: 'admin1', actor_role: 'admin' })),
    ).toBe(true);
  });

  it('mappe les rôles utilisateur', () => {
    expect(mapUserRoleToPrivacyActor('physio')).toBe('physio');
    expect(mapUserRoleToPrivacyActor('player')).toBe('patient');
    expect(mapUserRoleToPrivacyActor('coach')).toBe('coach');
  });

  it('expose un motif de refus clair', () => {
    expect(
      denyReason(base({ actor_uid: 'coach1', actor_role: 'coach' })),
    ).toMatch(/autorisation explicite/i);
    expect(isTreatingPhysio(base({ actor_role: 'physio' }))).toBe(false);
  });
});
