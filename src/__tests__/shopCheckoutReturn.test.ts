import { parseShopCheckoutReturn } from '../utils/shopCheckoutReturn';

describe('shopCheckoutReturn', () => {
  it('parse le succès Stripe', () => {
    expect(
      parseShopCheckoutReturn('proday://shop?status=success&orderId=abc123')
    ).toEqual({ status: 'success', orderId: 'abc123' });
  });

  it('parse l’annulation', () => {
    expect(parseShopCheckoutReturn('proday://shop?status=cancel&orderId=xyz')).toEqual({
      status: 'cancel',
      orderId: 'xyz',
    });
  });

  it('ignore les URLs invalides', () => {
    expect(parseShopCheckoutReturn('https://example.com')).toBeNull();
    expect(parseShopCheckoutReturn('proday://shop?status=pending')).toBeNull();
  });
});
