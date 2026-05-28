import {
  canCreateAgentPoll,
  canPublishFeedNews,
  canVoteAgentPoll,
} from '../utils/platformFeedPermissions';

describe('platformFeed permissions', () => {
  it('autorise la publication fil pour staff autorisé', () => {
    expect(canPublishFeedNews('agent')).toBe(true);
    expect(canPublishFeedNews('physio')).toBe(true);
    expect(canPublishFeedNews('player')).toBe(false);
    expect(canPublishFeedNews('sponsor')).toBe(false);
  });

  it('restreint sondages agents', () => {
    expect(canCreateAgentPoll('agent')).toBe(true);
    expect(canCreateAgentPoll('coach')).toBe(false);
    expect(canVoteAgentPoll('agent')).toBe(true);
    expect(canVoteAgentPoll('physio')).toBe(false);
  });
});
