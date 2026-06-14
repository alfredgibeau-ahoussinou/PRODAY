export type ShopOrderStatus = 'pending' | 'paid' | 'cancelled';

export type ShopOrderLine = {
  product_id: string;
  name: string;
  qty: number;
  unit_eur: number;
};

export type ShopOrder = {
  id: string;
  buyer_uid: string;
  product_line: string;
  lines: ShopOrderLine[];
  total_eur: number;
  status: ShopOrderStatus;
  created_at: Date | null;
};
