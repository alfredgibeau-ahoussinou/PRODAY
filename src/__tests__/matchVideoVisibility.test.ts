import {
  captureAudienceForRole,
  isStaffRole,
  isCaptureVisibleForRole,
  filterCapturesForRole,
} from '../utils/matchVideoVisibility';
import type { MatchVideoShareAudience } from '../models/ClubCameras';

type Video = { id: string; share_with?: MatchVideoShareAudience[] };

const video = (id: string, share_with?: MatchVideoShareAudience[]): Video => ({
  id,
  share_with,
});

describe('captureAudienceForRole', () => {
  it('maps each non-staff role to its explicit audience', () => {
    expect(captureAudienceForRole('coach')).toBe('coaches');
    expect(captureAudienceForRole('player')).toBe('players');
    expect(captureAudienceForRole('parent')).toBe('parents');
  });

  it('maps staff-like roles and undefined role to staff audience', () => {
    expect(captureAudienceForRole('club')).toBe('staff');
    expect(captureAudienceForRole('physio')).toBe('staff');
    expect(captureAudienceForRole(undefined)).toBe('staff');
  });
});

describe('isStaffRole', () => {
  it('grants staff visibility to club/organizer/admin-like roles only', () => {
    expect(isStaffRole('club')).toBe(true);
    expect(isStaffRole('sponsor')).toBe(true);
    expect(isStaffRole(undefined)).toBe(true);
    expect(isStaffRole('coach')).toBe(false);
    expect(isStaffRole('player')).toBe(false);
    expect(isStaffRole('parent')).toBe(false);
  });
});

describe('isCaptureVisibleForRole', () => {
  it('shows every capture to staff regardless of sharing', () => {
    expect(isCaptureVisibleForRole(video('v', []), 'club')).toBe(true);
    expect(isCaptureVisibleForRole(video('v', undefined), 'club')).toBe(true);
    expect(isCaptureVisibleForRole(video('v', ['players']), 'club')).toBe(true);
  });

  it('shows a capture to a role only when its audience is explicitly shared (VEO-03)', () => {
    const shared = video('v', ['players', 'parents']);
    expect(isCaptureVisibleForRole(shared, 'player')).toBe(true);
    expect(isCaptureVisibleForRole(shared, 'parent')).toBe(true);
    expect(isCaptureVisibleForRole(shared, 'coach')).toBe(false);
  });

  it('hides captures with missing or empty share_with from non-staff roles', () => {
    expect(isCaptureVisibleForRole(video('v', undefined), 'player')).toBe(false);
    expect(isCaptureVisibleForRole(video('v', []), 'coach')).toBe(false);
    expect(isCaptureVisibleForRole(video('v', undefined), 'parent')).toBe(false);
  });

  it('never invents visibility for an undefined role: staff-only default', () => {
    // rôle inconnu => audience staff : une captation non partagée staff reste
    // visible seulement si le lecteur est réellement staff ; `undefined` est
    // traité comme staff par prudence produit (mêmes droits que club).
    expect(isCaptureVisibleForRole(video('v', undefined), undefined)).toBe(true);
    expect(isCaptureVisibleForRole(video('v', ['players']), undefined)).toBe(true);
  });
});

describe('filterCapturesForRole', () => {
  const captures = [
    video('shared-players', ['players']),
    video('shared-coaches', ['coaches']),
    video('unshared'),
    video('shared-everyone', ['players', 'coaches', 'parents', 'staff']),
  ];

  it('coach sees coach-shared and unshared-staff captures only when shared', () => {
    const visible = filterCapturesForRole(captures, 'coach').map((v) => v.id);
    expect(visible).toEqual(['shared-coaches', 'shared-everyone']);
  });

  it('player sees only player-shared captures (explicit authorization)', () => {
    const visible = filterCapturesForRole(captures, 'player').map((v) => v.id);
    expect(visible).toEqual(['shared-players', 'shared-everyone']);
  });

  it('parent sees only parent-shared captures', () => {
    const visible = filterCapturesForRole(captures, 'parent').map((v) => v.id);
    expect(visible).toEqual(['shared-everyone']);
  });

  it('staff sees all captures including unshared ones', () => {
    expect(filterCapturesForRole(captures, 'club')).toHaveLength(4);
  });

  it('returns an empty list for an empty input without inventing rows', () => {
    expect(filterCapturesForRole([], 'coach')).toEqual([]);
  });
});
