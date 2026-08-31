import {
  STAFF_NOTIF_DELIVERY_HINT,
  staffNotificationRoute,
  staffNotifsSubtitle,
} from '../utils/staffNotificationRouting';

describe('staffNotificationRouting', () => {
  it('route retard vers effectif événement', () => {
    expect(
      staffNotificationRoute({ type: 'player_late', event_id: 'e1' }),
    ).toEqual({ kind: 'event', eventId: 'e1', hubChapter: 'effectif' });
    expect(
      staffNotificationRoute({ type: 'parent_pickup_late', event_id: 'e2' }),
    ).toEqual({ kind: 'event', eventId: 'e2', hubChapter: 'effectif' });
  });

  it('route sans événement vers nav club', () => {
    expect(staffNotificationRoute({ type: 'friendly_invite' })).toEqual({
      kind: 'clubNav',
      nav: 'matches',
    });
    expect(staffNotificationRoute({ type: 'internal_move' })).toEqual({
      kind: 'clubNav',
      nav: 'players',
    });
    expect(staffNotificationRoute({ type: 'generic' })).toEqual({
      kind: 'clubNav',
      nav: 'communication',
    });
  });

  it('résume le sous-titre et expose un hint honnête', () => {
    expect(staffNotifsSubtitle(0, 0)).toMatch(/alertes/i);
    expect(staffNotifsSubtitle(2, 5)).toContain('2 non lues');
    expect(STAFF_NOTIF_DELIVERY_HINT).toMatch(/locaux/i);
  });
});
