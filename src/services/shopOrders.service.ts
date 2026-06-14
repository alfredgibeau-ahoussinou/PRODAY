import {
  collection,
  getDocs,
  query,
  where,
  type Timestamp,
} from 'firebase/firestore';
import { getDb } from '../lib/firebase';
import type { ShopOrder, ShopOrderStatus } from '../models/ShopOrder';

function toDate(value: unknown): Date | null {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof (value as Timestamp).toDate === 'function') {
    return (value as Timestamp).toDate();
  }
  return null;
}

function mapOrder(id: string, data: Record<string, unknown>): ShopOrder {
  return {
    id,
    buyer_uid: String(data.buyer_uid ?? ''),
    product_line: String(data.product_line ?? ''),
    lines: Array.isArray(data.lines)
      ? (data.lines as ShopOrder['lines'])
      : [],
    total_eur: Number(data.total_eur ?? 0),
    status: (data.status as ShopOrderStatus) ?? 'pending',
    created_at: toDate(data.created_at),
  };
}

export const shopOrdersService = {
  async listForBuyer(uid: string, limit = 8): Promise<ShopOrder[]> {
    const db = getDb();
    if (!db) return [];

    const snap = await getDocs(
      query(collection(db, 'shop_orders'), where('buyer_uid', '==', uid)),
    );

    return snap.docs
      .map((doc) => mapOrder(doc.id, doc.data() as Record<string, unknown>))
      .sort((a, b) => {
        const at = a.created_at?.getTime() ?? 0;
        const bt = b.created_at?.getTime() ?? 0;
        return bt - at;
      })
      .slice(0, limit);
  },
};
