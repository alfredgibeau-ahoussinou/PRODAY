import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const CART_KEY = 'proday_shop_cart_v1';
const WISH_KEY = 'proday_shop_wish_v1';

export type CartLine = { productId: string; qty: number };

export function useShopCart() {
  const [cart, setCart] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        const [cartRaw, wishRaw] = await AsyncStorage.multiGet([CART_KEY, WISH_KEY]);
        if (cartRaw[1]) setCart(JSON.parse(cartRaw[1]));
        if (wishRaw[1]) setWishlist(new Set(JSON.parse(wishRaw[1]) as string[]));
      } catch {
        /* ignore */
      }
      setReady(true);
    })();
  }, []);

  const persistCart = useCallback(async (lines: CartLine[]) => {
    setCart(lines);
    await AsyncStorage.setItem(CART_KEY, JSON.stringify(lines));
  }, []);

  const persistWish = useCallback(async (ids: Set<string>) => {
    setWishlist(ids);
    await AsyncStorage.setItem(WISH_KEY, JSON.stringify([...ids]));
  }, []);

  const addToCart = useCallback(
    (productId: string, qty = 1) => {
      const next = [...cart];
      const idx = next.findIndex((l) => l.productId === productId);
      if (idx >= 0) next[idx] = { ...next[idx], qty: next[idx].qty + qty };
      else next.push({ productId, qty });
      void persistCart(next);
    },
    [cart, persistCart]
  );

  const setQty = useCallback(
    (productId: string, qty: number) => {
      if (qty <= 0) {
        void persistCart(cart.filter((l) => l.productId !== productId));
        return;
      }
      void persistCart(
        cart.map((l) => (l.productId === productId ? { ...l, qty } : l))
      );
    },
    [cart, persistCart]
  );

  const toggleWishlist = useCallback(
    (productId: string) => {
      const next = new Set(wishlist);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      void persistWish(next);
    },
    [wishlist, persistWish]
  );

  const cartCount = cart.reduce((n, l) => n + l.qty, 0);

  return {
    ready,
    cart,
    cartCount,
    wishlist,
    addToCart,
    setQty,
    toggleWishlist,
    clearCart: () => void persistCart([]),
  };
}
