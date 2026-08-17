import { isStripeCheckoutEnabled } from '../utils/stripeSubscriptions';

describe('stripeSubscriptions', () => {
  const prevEnv = process.env.EXPO_PUBLIC_APP_ENV;
  const prevFlag = process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED;

  afterEach(() => {
    process.env.EXPO_PUBLIC_APP_ENV = prevEnv;
    process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED = prevFlag;
  });

  it('activé en production', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'production';
    process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED = '';
    expect(isStripeCheckoutEnabled()).toBe(true);
  });

  it('activé en dev avec EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED=1', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED = '1';
    expect(isStripeCheckoutEnabled()).toBe(true);
  });

  it('désactivé en dev sans flag', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'development';
    process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED = '';
    expect(isStripeCheckoutEnabled()).toBe(false);
  });

  it('désactivé si flag ≠ 1', () => {
    process.env.EXPO_PUBLIC_APP_ENV = 'staging';
    process.env.EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED = 'true';
    expect(isStripeCheckoutEnabled()).toBe(false);
  });
});
