import { parseSubscriptionCheckoutReturn } from '../utils/subscriptionCheckoutReturn';

describe('subscriptionCheckoutReturn', () => {
  it('parse success avec planId', () => {
    expect(
      parseSubscriptionCheckoutReturn('proday://subscription?status=success&planId=coach_pro'),
    ).toEqual({ status: 'success', planId: 'coach_pro' });
  });

  it('parse cancel', () => {
    expect(parseSubscriptionCheckoutReturn('proday://subscription?status=cancel&planId=club_pro')).toEqual({
      status: 'cancel',
      planId: 'club_pro',
    });
  });

  it('parse manage (portail Stripe)', () => {
    expect(parseSubscriptionCheckoutReturn('proday://subscription?status=manage')).toEqual({
      status: 'manage',
      planId: undefined,
    });
  });

  it('ignore URLs invalides', () => {
    expect(parseSubscriptionCheckoutReturn('https://example.com')).toBeNull();
    expect(parseSubscriptionCheckoutReturn('proday://subscription?status=pending')).toBeNull();
  });
});
