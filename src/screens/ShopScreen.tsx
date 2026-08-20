import React, { useMemo, useState } from 'react';
import { Alert, Linking } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { ShopHomeScreen } from '../components/shop/ShopHomeScreen';
import { ShopProductDetailScreen } from '../components/shop/ShopProductDetailScreen';
import {
  formatShopPrice,
  getShopCopy,
  type ShopProduct,
} from '../content/prodayShop';
import { useShopCart } from '../hooks/useShopCart';
import { useShopOrders } from '../hooks/useShopOrders';
import { startShopCheckout } from '../services/shopPayment.service';
import { parseShopCheckoutReturn } from '../utils/shopCheckoutReturn';
import { useRequireAuth } from '../hooks/useRequireAuth';
import { trackV3Event } from '../core/analytics/v3Events';
import { userStateStore } from '../core/state/userState.store';
import { flushBrainState } from '../services/brainState.service';
import { PushScreenTransition } from '../components/motion';
import { JOUEUR_UNAVAILABLE_FEATURES } from '../content/joueurPlusMenu';
import { JoueurUnavailableScreen } from '../components/joueur/JoueurUnavailableScreen';

export const ShopScreen: React.FC = () => {
  const { productLine } = useThemedScreen();
  const { profile } = useAuth();

  if (profile?.role === 'player') {
    const copy = JOUEUR_UNAVAILABLE_FEATURES.shop;
    return (
      <JoueurUnavailableScreen title={copy.title} message={copy.message} icon="bag" />
    );
  }
  const { requireAuth } = useRequireAuth();
  const copy = useMemo(() => getShopCopy(productLine), [productLine]);
  const [selectedProduct, setSelectedProduct] = useState<ShopProduct | null>(null);
  const [paying, setPaying] = useState(false);
  const { cart, cartCount, wishlist, addToCart, setQty, toggleWishlist, clearCart } =
    useShopCart();
  const { orders, loading: ordersLoading, refresh: refreshOrders } = useShopOrders(profile?.uid);

  const onOrder = (product: ShopProduct, size?: string) => {
    const line = cart.find((l) => l.productId === product.id);
    const qty = line?.qty ?? 1;
    const sizeLine = size ? `\n- Taille : ${size}` : '';
    const subject = encodeURIComponent(`Précommande ProDay. ${product.name}`);
    const body = encodeURIComponent(
      `Bonjour,\n\nJe souhaite précommander :\n- ${product.name}\n- Quantité : ${qty}\n- Prix indicatif : ${formatShopPrice(product.priceEur)}${sizeLine}\n- Univers : ${productLine}\n\nMerci !`
    );
    Alert.alert(
      product.name,
      `${formatShopPrice(product.priceEur)}${size ? ` · Taille ${size}` : ''}\n\n${copy.preorderNote}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Précommander par email',
          onPress: () => {
            void Linking.openURL(`mailto:${copy.contactEmail}?subject=${subject}&body=${body}`);
          },
        },
      ]
    );
  };

  const handlePayOnline = async () => {
    if (cart.length === 0) return;
    if (!requireAuth('Connectez-vous pour payer en ligne.')) return;
    setPaying(true);
    try {
      const { url, orderId } = await startShopCheckout(cart, productLine);
      const result = await WebBrowser.openAuthSessionAsync(url, 'proday://shop');
      if (result.type === 'success' && result.url) {
        const parsed = parseShopCheckoutReturn(result.url);
        if (parsed?.status === 'success') {
          clearCart();
          void refreshOrders();
          if (profile) {
            trackV3Event('shop_checkout_success', { items: cart.length });
            const progression = userStateStore.get()?.progression ?? {
              xp: 0,
              level: 1,
              xpToNext: 200,
              xpProgress: 0,
              streakDays: 1,
              badges: [],
              rankLabel: 'Rookie',
            };
            userStateStore.applyAction(
              profile,
              'open_mercato',
              {
                upcomingEventsCount: 0,
                pendingConvocations: 0,
                recentMatchCount: 0,
                streakDays: 1,
                globalScore: 50,
              },
              progression
            );
            void flushBrainState(profile.uid);
          }
          Alert.alert(
            'Merci !',
            orderId
              ? `Commande ${orderId.slice(0, 8)}… confirmée. Vous recevrez un email de confirmation.`
              : 'Votre paiement a été enregistré. Vous recevrez une confirmation par email.'
          );
          return;
        }
        if (parsed?.status === 'cancel') {
          Alert.alert('Paiement annulé', 'Votre panier est conservé. Vous pouvez réessayer quand vous voulez.');
          return;
        }
      }
      if (result.type === 'cancel' || result.type === 'dismiss') {
        Alert.alert('Paiement annulé', 'Votre panier est conservé.');
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Paiement impossible';
      Alert.alert(
        'Paiement Shop',
        msg.includes('Stripe') || msg.includes('failed-precondition')
          ? `${msg}\n\nLe paiement en ligne sera disponible dès que Stripe est configuré côté serveur.`
          : msg
      );
    } finally {
      setPaying(false);
    }
  };

  return (
    <>
      <ShopHomeScreen
        productLine={productLine}
        profile={profile}
        onOpenProduct={setSelectedProduct}
        cartCount={cartCount}
        cart={cart}
        wishlist={wishlist}
        onToggleWishlist={toggleWishlist}
        onAddToCart={addToCart}
        onSetQty={setQty}
        onPayOnline={handlePayOnline}
        paying={paying}
        payCtaLabel={profile ? 'Payer par carte' : 'Se connecter pour payer'}
        shopOrders={orders}
        shopOrdersLoading={ordersLoading}
      />
      <PushScreenTransition active={selectedProduct != null}>
        {selectedProduct ? (
          <ShopProductDetailScreen
            product={selectedProduct}
            productLine={productLine}
            wished={wishlist.has(selectedProduct.id)}
            onBack={() => setSelectedProduct(null)}
            onOrder={(size) => onOrder(selectedProduct, size)}
            onAddToCart={() => addToCart(selectedProduct.id)}
            onToggleWishlist={() => toggleWishlist(selectedProduct.id)}
            onOpenRelated={setSelectedProduct}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );
};
