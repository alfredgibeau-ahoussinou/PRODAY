# Facturation club (Stripe Invoices) — contrat app / site

Source de vérité Stripe : **Firebase Cloud Functions** (`STRIPE_SECRET_KEY` serveur uniquement).  
Le site Netlify et l’app mobile **ne voient jamais** la clé secrète.

## App mobile (prioritaire)

Callables (`europe-west1`), claim Firebase `admin` :

| Callable | Rôle |
|----------|------|
| `adminSetClubCommercialAmount` | Fixe `commercial_*` sur `clubs/{clubId}` |
| `adminCreateClubStripeInvoice` | Crée + envoie Stripe Invoice |

Client : `src/services/clubCommercialBilling.service.ts`  
Offres : `club_premium` · `club_video_pro` · `club_live_duo` (2 lives) — `src/content/clubLivePacks.ts`

Voir aussi `docs/API_CONTRACTS.md`.

```ts
await callFunction('adminSetClubCommercialAmount', {
  clubId, amountEur: 890, offerId: 'club_live_duo', note: '…',
});
await callFunction('adminCreateClubStripeInvoice', {
  clubId, send: true, daysUntilDue: 30,
});
```

Statut : lire `clubs/{id}.stripe_invoice_status` / `stripe_invoice_hosted_url` (Firestore) — mis à jour aussi par webhook.

## Site Control Center (proxy HTTP)

Auth : cookie session PIN **ou** `x-proday-mobile-key`.

| Route | Rôle |
|-------|------|
| `POST /api/admin/billing/price` | upsert montant (écrit `clubs/{id}` si le club existe) |
| `GET /api/admin/billing/price?clubId=` | liste / détail prix |
| `POST /api/admin/billing/invoice` | create+send (même core que le callable) |
| `GET /api/admin/billing/invoice?clubId=` | historique `club_stripe_invoices` |
| `POST …/invoice` `{ refresh: true, invoiceId }` | re-sync Stripe |

Upstream CF : `websiteClubBillingAdmin` (+ optionnel `adminClubBilling` multi-action).  
Alias `veo_lives_2` → `club_live_duo`.

UI : `/admin/finances` · `/admin/commercial/pricing`.

## Déploiement

1. Functions : `adminSetClubCommercialAmount`, `adminCreateClubStripeInvoice`, `websiteClubBillingAdmin`, `stripeWebhook`
2. Netlify : `BETA_WEBSITE_ADMIN_SECRET` ; optionnel `CLUB_BILLING_ADMIN_FUNCTION_URL`
3. Stripe webhook events : `invoice.paid`, `invoice.finalized`, `invoice.voided`, `invoice.payment_failed`, `invoice.sent`, `invoice.marked_uncollectible`

## Firestore

| Chemin | Contenu |
|--------|---------|
| `clubs/{id}` | `commercial_*` + `stripe_invoice_*` (source app) |
| `club_stripe_invoices/*` | historique factures |
| `club_billing_prices/*` | miroir prix (site, si pas de doc club) |

## Ne pas faire

- Pas de fake payment / Payment Link inventé côté client
- Pas de `sk_` en `NEXT_PUBLIC_*` / `EXPO_PUBLIC_*`
- Ne pas dupliquer une 2ᵉ implémentation Stripe hors Functions
