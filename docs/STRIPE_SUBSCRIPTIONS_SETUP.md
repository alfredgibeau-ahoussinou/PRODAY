# Stripe — abonnements Pro (Checkout + Customer Portal)

Checklist pour activer les paiements récurrents ProDay via Stripe (live ou test).

## Sécurité

- **Ne jamais committer** `sk_live_*`, `rk_live_*`, `pk_live_*` ni `whsec_*`.
- Si une clé secrète a été exposée (chat, screenshot, repo) : **rotation immédiate** dans [Stripe Dashboard → Developers → API keys](https://dashboard.stripe.com/apikeys), puis mise à jour de `functions/.env.proday-155b0` et redéploiement des Functions.
- Côté app : aucune clé secrète — uniquement le flag public `EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED=1` pour tester en dev.

## 1. Cloud Functions

Copier `functions/.env.example` vers `functions/.env.proday-155b0` (gitignored) :

```bash
STRIPE_SECRET_KEY=sk_live_...   # ou sk_test_ pour sandbox
STRIPE_WEBHOOK_SECRET=whsec_...
```

Déployer :

```bash
npm run firebase:deploy:functions
```

Callables exportées : `createSubscriptionCheckoutSession`, `createBillingPortalSession`, webhook `stripeWebhook`.

## 2. Webhook Stripe

Dans Stripe Dashboard → Developers → Webhooks, endpoint :

```
https://REGION-PROJECT.cloudfunctions.net/stripeWebhook
```

Événements minimum :

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.payment_failed` (recommandé)

Copier le signing secret dans `STRIPE_WEBHOOK_SECRET`.

## 3. Customer Portal

Stripe Dashboard → Settings → Billing → Customer portal : activer annulation, changement de plan, historique factures.

Retour app : `proday://subscription?status=manage`.

## 4. App mobile

| Contexte | Variable |
|---|---|
| Production (stores) | `EXPO_PUBLIC_APP_ENV=production` → Stripe auto |
| Dev / preview local | `EXPO_PUBLIC_STRIPE_SUBSCRIPTIONS_ENABLED=1` dans `.env` |

Redémarrer Metro après changement : `npx expo start -c`.

Deep link retour checkout : `proday://subscription?status=success&planId=...` — le bridge rafraîchit profil + quotas.

## 5. Tests

| Mode | Carte |
|---|---|
| Test (`sk_test_`) | `4242 4242 4242 4242`, date future, CVC quelconque |
| Live (`sk_live_`) | vraie carte — **facturation réelle** |

Vérification locale :

```bash
npm run stripe:subscriptions:check
npm test -- stripeSubscriptions subscriptionCheckoutReturn betaProAccess
```

## 6. Repli store

Si Stripe indisponible, l’app propose App Store / Play (RevenueCat / expo-iap). Stripe reste prioritaire quand activé.
