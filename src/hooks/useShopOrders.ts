import { useCallback, useEffect, useState } from 'react';
import type { ShopOrder } from '../models/ShopOrder';
import { shopOrdersService } from '../services/shopOrders.service';

export function useShopOrders(uid: string | undefined) {
  const [orders, setOrders] = useState<ShopOrder[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!uid) {
      setOrders([]);
      return;
    }
    setLoading(true);
    try {
      const list = await shopOrdersService.listForBuyer(uid);
      setOrders(list);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  }, [uid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { orders, loading, refresh };
}
