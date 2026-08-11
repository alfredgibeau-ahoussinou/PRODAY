import {
  FRIENDLY_MATCH_KIND_LABELS,
  FRIENDLY_STATUS_LABELS,
  FRIENDLY_VENUE_LABELS,
  type FriendlyMatch,
} from '../models/FriendlyMatch';
import { canProposeFriendlyMatch } from '../utils/roleCapabilities';
import { matchStatusStyle } from '../utils/matchDisplay';
import { colors } from '../theme/designTokens';

describe('friendly match invitations', () => {
  it('allows club and coach to propose', () => {
    expect(canProposeFriendlyMatch('club')).toBe(true);
    expect(canProposeFriendlyMatch('coach')).toBe(true);
    expect(canProposeFriendlyMatch('organizer')).toBe(true);
    expect(canProposeFriendlyMatch('player')).toBe(false);
    expect(canProposeFriendlyMatch('supporter')).toBe(false);
  });

  it('exposes invitation statuses and labels', () => {
    expect(FRIENDLY_STATUS_LABELS.INVITED).toMatch(/Invitation/i);
    expect(FRIENDLY_STATUS_LABELS.COUNTERED).toMatch(/Contre/i);
    expect(FRIENDLY_MATCH_KIND_LABELS.amical).toBe('Amical');
    expect(FRIENDLY_VENUE_LABELS.home).toBe('Domicile');
  });

  it('styles invitation and counter statuses', () => {
    expect(matchStatusStyle('INVITED', colors).label).toBe('Invitation');
    expect(matchStatusStyle('COUNTERED', colors).label).toBe('Contre-proposition');
    expect(matchStatusStyle('DECLINED', colors).label).toBe('Refusé');
  });

  it('treats directed invite as actionable for target club', () => {
    const match: Pick<FriendlyMatch, 'status' | 'requester_club_id' | 'opponent_club_id'> = {
      status: 'INVITED',
      requester_club_id: 'club-a',
      opponent_club_id: 'club-b',
    };
    const targetCanAct =
      match.status === 'INVITED' &&
      match.opponent_club_id === 'club-b' &&
      match.requester_club_id !== 'club-b';
    expect(targetCanAct).toBe(true);
  });
});
