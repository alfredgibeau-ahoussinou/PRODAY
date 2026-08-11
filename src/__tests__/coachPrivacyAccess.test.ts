import {
  canAccessSensitiveResource,
  mapUserRoleToPrivacyActor,
} from '../utils/privacyAccess';
import type { PrivacyAccessGrant } from '../models/Privacy';

describe('coach medical access', () => {
  it('refuse le coach sans grant', () => {
    const allowed = canAccessSensitiveResource({
      actor_uid: 'coach1',
      actor_role: mapUserRoleToPrivacyActor('coach'),
      owner_uid: 'player1',
      resource_type: 'medical_document',
      resource_id: 'doc1',
      grants: [],
    });
    expect(allowed).toBe(false);
  });

  it('autorise le coach avec grant all_medical', () => {
    const grant: PrivacyAccessGrant = {
      id: 'g1',
      owner_uid: 'player1',
      grantee_uid: 'coach1',
      resource_type: 'medical_document',
      resource_id: null,
      scope: 'all_medical',
      permissions: ['read'],
      purpose: null,
      expires_at: null,
      revoked_at: null,
      created_at: new Date(),
      updated_at: new Date(),
    };
    const allowed = canAccessSensitiveResource({
      actor_uid: 'coach1',
      actor_role: 'coach',
      owner_uid: 'player1',
      resource_type: 'medical_document',
      resource_id: 'doc1',
      grants: [grant],
    });
    expect(allowed).toBe(true);
  });
});
