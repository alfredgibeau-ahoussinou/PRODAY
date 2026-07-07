import {
  filterSupporterNotifications,
  notifKindToPreferenceKey,
  shouldDeliverSupporterNotification,
} from '../utils/supporterNotificationFilter';

const DEFAULT_PREFS = {
  goalAlerts: true,
  kickoffAlerts: true,
  matchReminders: true,
  communityDigest: false,
};

describe('supporterNotificationFilter', () => {
  it('mappe les kinds vers la bonne préférence', () => {
    expect(notifKindToPreferenceKey('goal_live')).toBe('goalAlerts');
    expect(notifKindToPreferenceKey('followed_player')).toBe('goalAlerts');
    expect(notifKindToPreferenceKey('kickoff_favorite')).toBe('kickoffAlerts');
    expect(notifKindToPreferenceKey('match_reminder')).toBe('matchReminders');
    expect(notifKindToPreferenceKey('debate')).toBe('communityDigest');
  });

  it('respecte les toggles par défaut', () => {
    expect(shouldDeliverSupporterNotification(DEFAULT_PREFS, 'goal_live')).toBe(true);
    expect(shouldDeliverSupporterNotification(DEFAULT_PREFS, 'community_digest')).toBe(false);
  });

  it('filtre une liste de notifications candidates', () => {
    const prefs = { ...DEFAULT_PREFS, goalAlerts: false };
    const items = [
      { id: 'a', kind: 'goal_live' as const },
      { id: 'b', kind: 'match_reminder' as const },
      { id: 'c', kind: 'debate' as const },
    ];
    expect(filterSupporterNotifications(prefs, items)).toEqual([
      { id: 'b', kind: 'match_reminder' },
    ]);
  });
});
