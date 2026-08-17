import { isBetaProRequestEnabled } from '../utils/betaProAccess';

describe('betaProAccess', () => {
  const prev = process.env.EXPO_PUBLIC_APP_ENV;
  const prevStripe = process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED;

  afterEach(() => {
    process.env.EXPO_PUBLIC_APP_ENV = prev;
    process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED = prevStripe;
  });

  it('active hors production', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED = '';
    expect(isBetaProRequestEnabled()).toBe(true);
  });

  it('désactivé en production', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'production';
    process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED = '';
    expect(isBetaProRequestEnabled()).toBe(false);
  });

  it('désactivé si Stripe Checkout activé (priorité Stripe)', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED = '1';
    expect(isBetaProRequestEnabled()).toBe(false);
  });
});
