import { membershipFromFirestore } from '../lib/firestoreMappers';
import type { Membership } from '../models/Membership';

describe('signupFffAffiliation & Membership Data', () => {
  it('mappe correctement une adhésion avec rôle, catégorie et pièce d’identité', () => {
    const raw = {
      club_id: 'montrouge_fc_92',
      team_id: 'team_d1',
      player_uid: 'usr_player_1',
      player_name: 'Lucas Dupont',
      role: 'player',
      category: 'Seniors D1',
      identity_document_name: 'CNI_Dupont.pdf',
      identity_document_url: 'file:///path/to/cni.pdf',
      identity_document_type: 'cni',
      pre_registered_roster_id: 'mfc_1',
      status: 'pending',
      requested_at: { toDate: () => new Date('2025-03-01T10:00:00Z') },
      created_at: { toDate: () => new Date('2025-03-01T10:00:00Z') },
      updated_at: { toDate: () => new Date('2025-03-01T10:00:00Z') },
    };

    const membership: Membership = membershipFromFirestore('mem_123', raw);

    expect(membership.id).toBe('mem_123');
    expect(membership.club_id).toBe('montrouge_fc_92');
    expect(membership.player_name).toBe('Lucas Dupont');
    expect(membership.role).toBe('player');
    expect(membership.category).toBe('Seniors D1');
    expect(membership.identity_document_name).toBe('CNI_Dupont.pdf');
    expect(membership.identity_document_url).toBe('file:///path/to/cni.pdf');
    expect(membership.identity_document_type).toBe('cni');
    expect(membership.pre_registered_roster_id).toBe('mfc_1');
    expect(membership.status).toBe('pending');
  });

  it('gère les rôles coach et parent lors de la demande d’adhésion', () => {
    const coachRaw = {
      club_id: 'js_suresnes',
      team_id: 'team_suresnes_d1',
      player_uid: 'usr_coach_1',
      player_name: 'Hervé Renard',
      role: 'coach',
      category: 'Seniors D1',
      identity_document_name: 'Diplome_Coach.jpg',
      identity_document_type: 'club_mandate',
      status: 'pending',
      requested_at: { toDate: () => new Date() },
      created_at: { toDate: () => new Date() },
      updated_at: { toDate: () => new Date() },
    };

    const coachMembership = membershipFromFirestore('mem_coach_1', coachRaw);
    expect(coachMembership.role).toBe('coach');
    expect(coachMembership.identity_document_name).toBe('Diplome_Coach.jpg');
    expect(coachMembership.category).toBe('Seniors D1');

    const parentRaw = {
      club_id: 'ac_boulogne_billancourt',
      team_id: 'team_u15',
      player_uid: 'usr_parent_1',
      player_name: 'Sophie Martin',
      role: 'parent',
      category: 'U15 R1',
      identity_document_name: 'Livret_Famille.pdf',
      identity_document_type: 'cni',
      status: 'pending',
      requested_at: { toDate: () => new Date() },
      created_at: { toDate: () => new Date() },
      updated_at: { toDate: () => new Date() },
    };

    const parentMembership = membershipFromFirestore('mem_parent_1', parentRaw);
    expect(parentMembership.role).toBe('parent');
    expect(parentMembership.category).toBe('U15 R1');
  });
});
