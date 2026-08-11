import { LATE_INTENT_TO_RSVP, isLateRsvp } from '../models/TeamEvent';
import type { ParentalPrivacySettings } from '../models/ParentalSettings';

/** Miroir de parentPortalService.canParentReadMessages — sans Firebase. */
function canParentReadMessages(privacy?: ParentalPrivacySettings | null): boolean {
  return privacy?.parent_can_read_messages !== false;
}

describe('parent late report kinds', () => {
  it('mappe les intents retard → RSVP', () => {
    expect(LATE_INTENT_TO_RSVP.under_10).toBe('late_under_10');
    expect(LATE_INTENT_TO_RSVP.over_10).toBe('late_over_10');
    expect(LATE_INTENT_TO_RSVP.unknown).toBe('late_unknown');
  });

  it('détecte un RSVP retard', () => {
    expect(isLateRsvp('late_under_10')).toBe(true);
    expect(isLateRsvp('yes')).toBe(false);
  });
});

describe('parent message privacy', () => {
  it('autorise par défaut, refuse si privacy false', () => {
    expect(canParentReadMessages({ parent_can_read_messages: true })).toBe(true);
    expect(canParentReadMessages({ parent_can_read_messages: false })).toBe(false);
    expect(canParentReadMessages({})).toBe(true);
    expect(canParentReadMessages(undefined)).toBe(true);
  });
});
