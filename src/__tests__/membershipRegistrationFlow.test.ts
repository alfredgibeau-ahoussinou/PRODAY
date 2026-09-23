import { resolveUserDestination } from '../navigation/membershipRouting';
import { canRequestClubMembership } from '../utils/membershipValidation';
import type { User } from '../models/User';
import type { Membership } from '../models/Membership';

function mockUser(overrides: Partial<User> = {}): User {
  return {
    uid: 'real_user_123',
    email: 'thomas.dupont@gmail.com',
    display_name: 'Thomas Dupont',
    role: 'player',
    is_verified: false,
    verification_status: 'NOT_REQUIRED',
    profile: {},
    documents: [],
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    is_active: true,
    ...overrides,
  };
}

function mockMembership(overrides: Partial<Membership> = {}): Membership {
  return {
    id: 'mem_1',
    club_id: 'club_1',
    team_id: 'team_1',
    player_uid: 'real_user_123',
    player_name: 'Thomas Dupont',
    role: 'player',
    status: 'pending',
    requested_at: new Date('2026-01-01'),
    created_at: new Date('2026-01-01'),
    updated_at: new Date('2026-01-01'),
    ...overrides,
  };
}

describe('Membership Registration and Routing Flow', () => {
  const baseRealUser = mockUser();
  const syntheticDemoUser = mockUser({
    uid: 'seed_player_01',
    email: 'lucas.demo@proday.app',
    display_name: 'Lucas Demo',
  });
  const adminUser = mockUser({
    uid: 'admin_user_999',
    email: 'admin@proday.app',
    display_name: 'Super Admin',
    role: 'club',
    is_admin: true,
  });

  describe('resolveUserDestination', () => {
    it('returns guest for null or undefined user', () => {
      expect(resolveUserDestination(null)).toEqual({ kind: 'guest' });
      expect(resolveUserDestination(undefined)).toEqual({ kind: 'guest' });
    });

    it('returns platform_admin for admin users', () => {
      const dest = resolveUserDestination(adminUser);
      expect(dest.kind).toBe('platform_admin');
    });

    it('returns standalone_role for supporter, parent, and sponsor', () => {
      const supporter = mockUser({ role: 'supporter' });
      expect(resolveUserDestination(supporter).kind).toBe('standalone_role');

      const parent = mockUser({ role: 'parent' });
      expect(resolveUserDestination(parent).kind).toBe('standalone_role');

      const sponsor = mockUser({ role: 'sponsor' });
      expect(resolveUserDestination(sponsor).kind).toBe('standalone_role');
    });

    it('returns demo destination for synthetic and demo accounts', () => {
      const dest = resolveUserDestination(syntheticDemoUser);
      expect(dest.kind).toBe('demo');
    });

    it('returns no_club for real users with zero memberships', () => {
      const dest = resolveUserDestination(baseRealUser, []);
      expect(dest.kind).toBe('no_club');
      expect(dest.user?.uid).toBe('real_user_123');
    });

    it('returns pending_approval when user has a pending membership', () => {
      const pendingMembership = mockMembership({
        id: 'mem_pending_1',
        club_id: 'club_psg_amateur',
        club_name: 'Paris Saint-Germain Amateur',
        status: 'pending',
      });

      const dest = resolveUserDestination(baseRealUser, [pendingMembership]);
      expect(dest.kind).toBe('pending_approval');
      expect(dest.membership?.id).toBe('mem_pending_1');
      expect(dest.clubId).toBe('club_psg_amateur');
    });

    it('returns active_club when user has an active membership', () => {
      const activeMembership = mockMembership({
        id: 'mem_active_1',
        club_id: 'club_rc_lens',
        club_name: 'RC Lens Amateur',
        status: 'active',
      });

      const dest = resolveUserDestination(baseRealUser, [activeMembership]);
      expect(dest.kind).toBe('active_club');
      expect(dest.clubId).toBe('club_rc_lens');
    });

    it('returns multi_club when user has multiple active memberships', () => {
      const active1 = mockMembership({
        id: 'mem_active_1',
        club_id: 'club_1',
        status: 'active',
      });
      const active2 = mockMembership({
        id: 'mem_active_2',
        club_id: 'club_2',
        status: 'active',
      });

      const dest = resolveUserDestination(baseRealUser, [active1, active2]);
      expect(dest.kind).toBe('multi_club');
      expect(dest.memberships?.length).toBe(2);
    });

    it('multi_club honore un choix enregistré correspondant à une adhésion active', () => {
      const active1 = mockMembership({ id: 'mem_active_1', club_id: 'club_1', status: 'active' });
      const active2 = mockMembership({ id: 'mem_active_2', club_id: 'club_2', status: 'active' });
      const user = mockUser({ profile: { club_id: 'club_2' } });

      const dest = resolveUserDestination(user, [active1, active2]);
      expect(dest.kind).toBe('active_club');
      expect(dest.clubId).toBe('club_2');
      expect(dest.membership?.club_id).toBe('club_2');
    });

    it('multi_club garde l’écran de sélection si le choix enregistré n’est plus actif', () => {
      const active1 = mockMembership({ id: 'mem_active_1', club_id: 'club_1', status: 'active' });
      const active2 = mockMembership({ id: 'mem_active_2', club_id: 'club_2', status: 'active' });
      const user = mockUser({ profile: { club_id: 'club_9' } });

      const dest = resolveUserDestination(user, [active1, active2]);
      expect(dest.kind).toBe('multi_club');
      expect(dest.clubId).toBe('club_1');
    });

    it('multi_club retombe sur le premier club actif sans choix enregistré', () => {
      const active1 = mockMembership({ id: 'mem_active_1', club_id: 'club_1', status: 'active' });
      const active2 = mockMembership({ id: 'mem_active_2', club_id: 'club_2', status: 'active' });
      const user = mockUser({ profile: {} });

      const dest = resolveUserDestination(user, [active1, active2]);
      expect(dest.kind).toBe('multi_club');
      expect(dest.memberships?.length).toBe(2);
    });

    it('returns no_club with latestRejected when request was rejected', () => {
      const rejectedMembership = mockMembership({
        id: 'mem_rej_1',
        club_id: 'club_ol',
        club_name: 'Olympique Lyonnais',
        status: 'rejected',
        rejection_reason: 'Effectif complet',
        created_at: new Date('2026-02-01'),
        updated_at: new Date('2026-02-02'),
      });

      const dest = resolveUserDestination(baseRealUser, [rejectedMembership]);
      expect(dest.kind).toBe('no_club');
      expect(dest.latestRejected?.rejection_reason).toBe('Effectif complet');
    });
  });

  describe('canRequestClubMembership validation', () => {
    it('allows request when user has no existing memberships', () => {
      const res = canRequestClubMembership([], 'club_abc');
      expect(res.allowed).toBe(true);
    });

    it('blocks request when user already has an active membership in the same club', () => {
      const active = mockMembership({
        id: 'mem_1',
        club_id: 'club_abc',
        status: 'active',
      });
      const res = canRequestClubMembership([active], 'club_abc');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('déjà affilié');
    });

    it('blocks request when user already has a pending request for the same club', () => {
      const pending = mockMembership({
        id: 'mem_2',
        club_id: 'club_abc',
        status: 'pending',
      });
      const res = canRequestClubMembership([pending], 'club_abc');
      expect(res.allowed).toBe(false);
      expect(res.reason).toContain('déjà en attente');
    });

    it('allows request when previous membership in the club was rejected or cancelled', () => {
      const rejected = mockMembership({
        id: 'mem_3',
        club_id: 'club_abc',
        status: 'rejected',
      });
      const res = canRequestClubMembership([rejected], 'club_abc');
      expect(res.allowed).toBe(true);

      const cancelled = mockMembership({
        id: 'mem_4',
        club_id: 'club_abc',
        status: 'cancelled',
      });
      const res2 = canRequestClubMembership([cancelled], 'club_abc');
      expect(res2.allowed).toBe(true);
    });
  });
});
