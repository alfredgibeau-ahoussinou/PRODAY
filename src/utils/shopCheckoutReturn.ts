export type ShopCheckoutReturn = {
  status: 'success' | 'cancel';
  orderId?: string;
};

/** Parse l’URL de retour Stripe Checkout (`proday://shop?...`). */
export function parseShopCheckoutReturn(url: string): ShopCheckoutReturn | null {
  if (!url.startsWith('proday://shop')) return null;
  const query = url.includes('?') ? url.split('?')[1] : '';
  const params = new URLSearchParams(query);
  const status = params.get('status');
  if (status !== 'success' && status !== 'cancel') return null;
  const orderId = params.get('orderId') ?? undefined;
  return { status, orderId };
}
