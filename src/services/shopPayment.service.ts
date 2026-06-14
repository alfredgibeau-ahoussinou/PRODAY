import { callFunction } from '../lib/firebaseFunctions';
import type { CartLine } from '../hooks/useShopCart';
import type { ProductLineId } from '../models/ProductLine';

export async function startShopCheckout(
  lines: CartLine[],
  productLine: ProductLineId
): Promise<{ url: string; orderId: string }> {
  return callFunction<
    { lines: CartLine[]; productLine: ProductLineId },
    { url: string; orderId: string }
  >('createShopCheckoutSession', { lines, productLine });
}
