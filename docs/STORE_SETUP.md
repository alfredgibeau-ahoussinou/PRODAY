# Configuration App Store & Google Play — IAP + RevenueCat

Ce guide aligne **exactement** les SKU des stores avec le code (`src/content/iapProducts.ts` et `functions/src/iapSkus.ts`).

**Décision architecture (2026-08)** : pas de Stripe Billing pour les abonnements Pro (jamais implémenté). Stripe Checkout reste pour shop + cotisations. Les abonnements récurrents passent par **RevenueCat** au-dessus d’App Store / Play (`react-native-purchases`), avec webhook → Firestore `subscription_*`. `expo-iap` reste un repli si les clés RC publiques sont absentes.

Bundle / package : **`com.proday.app`**

**Fiche marketing store** : [APP_STORE_LISTING.md](./APP_STORE_LISTING.md) (description FR, sous-titre, mots-clés).

## Plans payants (8 × 2 cycles = 16 SKU)

| Plan ID | Mensuel (€) | SKU mensuel | SKU annuel |
|---------|-------------|-------------|------------|
| `player_plus` | 2,99 | `com.proday.app.player_plus.monthly` | `com.proday.app.player_plus.yearly` |
| `recruiter_pro` | 7,99 | `com.proday.app.recruiter_pro.monthly` | `com.proday.app.recruiter_pro.yearly` |
| `coach_pro` | 7,99 | `com.proday.app.coach_pro.monthly` | `com.proday.app.coach_pro.yearly` |
| `club_pro` | 11,99 | `com.proday.app.club_pro.monthly` | `com.proday.app.club_pro.yearly` |
| `agent_elite` | 29,99 (lancement 19,99 × 20 premiers) | `com.proday.app.agent_elite.monthly` | `com.proday.app.agent_elite.yearly` |
| `physio_pro` | 19,99 | `com.proday.app.physio_pro.monthly` | `com.proday.app.physio_pro.yearly` |
| `organizer_pro` | 14,99 | `com.proday.app.organizer_pro.monthly` | `com.proday.app.organizer_pro.yearly` |
| `sponsor_pro` | 99,00 | `com.proday.app.sponsor_pro.monthly` | `com.proday.app.sponsor_pro.yearly` |

Convention : `com.proday.app.{plan_id}.monthly` / `com.proday.app.{plan_id}.yearly`

Prix source de vérité : `src/content/subscriptionPlans.ts` — sponsors hors IAP : `src/content/sponsorPricing.ts` (Découverte 0 €, Territorial 49 €, National 99 €).

Les prix affichés dans l’app et sur le site (`website/src/lib/content.ts`) reprennent les mêmes montants.

### Liste copier-coller — 16 identifiants exacts

```
com.proday.app.player_plus.monthly
com.proday.app.player_plus.yearly
com.proday.app.recruiter_pro.monthly
com.proday.app.recruiter_pro.yearly
com.proday.app.coach_pro.monthly
com.proday.app.coach_pro.yearly
com.proday.app.club_pro.monthly
com.proday.app.club_pro.yearly
com.proday.app.agent_elite.monthly
com.proday.app.agent_elite.yearly
com.proday.app.physio_pro.monthly
com.proday.app.physio_pro.yearly
com.proday.app.organizer_pro.monthly
com.proday.app.organizer_pro.yearly
com.proday.app.sponsor_pro.monthly
com.proday.app.sponsor_pro.yearly
```

Vérification automatique : `npm test -- iapProducts`

---

## RevenueCat (obligatoire en prod)

1. Créer un projet [RevenueCat](https://app.revenuecat.com) + apps iOS / Android (`com.proday.app`).
2. Importer les **16 produits** (mêmes IDs que ci-dessus) depuis App Store Connect / Play Console.
3. Créer un entitlement **`pro`** et y attacher tous les produits d’abonnement.
4. (Optionnel) Offerings par rôle — l’app peut aussi acheter par `productIdentifier` direct.
5. Clés publiques SDK → `.env` / EAS secrets :
   - `EXPO_PUBLIC_REVENUECAT_IOS_API_KEY=appl_…`
   - `EXPO_PUBLIC_REVENUECAT_ANDROID_API_KEY=goog_…`
6. Webhook :
   - URL : `https://REGION-PROJECT.cloudfunctions.net/revenueCatWebhook`
   - Authorization : valeur = `REVENUECAT_WEBHOOK_AUTH` (functions `.env.<projectId>`)
   - Événements : INITIAL_PURCHASE, RENEWAL, CANCELLATION, UNCANCELLATION, EXPIRATION, PRODUCT_CHANGE, BILLING_ISSUE
7. L’app appelle `Purchases.logIn(firebaseUid)` pour lier l’utilisateur (voir `revenueCat.service.ts`).

Déploiement functions :

```bash
cd functions && npm run build
firebase deploy --only functions:activateStoreSubscription,functions:revenueCatWebhook
```

---

## App Store Connect (iOS)

1. **App** : créer l’app `com.proday.app` si ce n’est pas déjà fait.
2. **Abonnements auto-renouvelables** : Monétisation → Abonnements → créer un **groupe d’abonnements** (ex. `proday_pro`).
3. Pour **chaque** SKU du tableau ci-dessus :
   - Référence produit = identifiant exact (ex. `com.proday.app.sponsor_pro.monthly`)
   - Durée : 1 mois ou 1 an selon le suffixe
   - Prix : caler sur `subscriptionPlans.ts`
   - Localisation FR (et EN si besoin) : nom + description du plan
4. **Contrat fiscal / bancaire** : actif avant tout test d’achat.
5. **Capacité In-App Purchase** : activée sur l’identifiant App ID dans le portail développeur Apple.

### Sandbox & TestFlight

- Créer des **comptes Sandbox** (Utilisateurs et accès → Sandbox).
- Sur l’appareil de test : Réglages → App Store → Compte sandbox (iOS 18+) ou se connecter lors du premier achat.
- **TestFlight** : les builds distribués utilisent l’environnement sandbox pour les IAP ; aucun prélèvement réel.
- Vérifier que `activateStoreSubscription` + `revenueCatWebhook` sont déployés et que l’utilisateur est authentifié Firebase avant l’achat.
- Annuler / renouveler : deep link in-app « Gérer / annuler / renouveler » ou [sandbox Apple](https://developer.apple.com/documentation/storekit/in-app_purchase/testing_in-app_purchases_with_sandbox).

---

## Google Play Console (Android)

1. **Application** : `com.proday.app`.
2. **Monétisation** → **Abonnements** → créer un abonnement par SKU (même identifiant que le tableau).
3. Pour chaque abonnement :
   - ID de base = SKU complet (ex. `com.proday.app.club_pro.yearly`)
   - Période : mensuelle ou annuelle
   - Prix : aligné sur `subscriptionPlans.ts`
4. Lier un **compte marchand** Google Payments.

### Tests internes & licence test

- **Piste de test interne** : publier un AAB signé, ajouter des testeurs (liste e-mails).
- **Licence de test** : Paramètres → Licence de test → ajouter les comptes Google des testeurs (achats sans facturation réelle).
- Les achats de test expirent plus vite ; utiliser « Annuler l’abonnement » dans Play Store pour réinitialiser.
- RevenueCat (ou `expo-iap` en repli) attend le SKU exact côté Google.

---

## Validation serveur

### Achat immédiat — `activateStoreSubscription`

Callable (`functions/src/subscriptionIap.ts`) après achat client (RC ou expo-iap) :

1. Vérifie SKU connu + cohérence `planId`.
2. Écrit `subscription_purchases/{…}` et `users/{uid}` :
   - `subscription_tier: 'pro'`
   - `subscription_plan_id`
   - `subscription_status: 'active'`
   - `subscription_period_end`

### Renouvellements / annulations — `revenueCatWebhook`

HTTP (`functions/src/revenueCatWebhook.ts`) :

| Événement RC | Effet Firestore |
|--------------|-----------------|
| INITIAL_PURCHASE / RENEWAL / UNCANCELLATION / PRODUCT_CHANGE | tier `pro`, status `active`, period_end |
| CANCELLATION | status `canceled` (accès jusqu’à period_end) |
| BILLING_ISSUE | status `past_due` |
| EXPIRATION | tier `free`, status `canceled` |

L’app applique aussi `period_end` / `status` via `isSubscriptionAccessActive` (`subscriptionLogic.ts`).

---

## Checklist avant mise en prod

### App Store Connect (16 abonnements)
- [ ] Groupe d’abonnements + 16 produits
- [ ] Prix alignés (agent launch 19,99 → 29,99)
- [ ] Sandbox OK

### Google Play (16 abonnements)
- [ ] 16 abonnements + licence test

### RevenueCat
- [ ] Produits + entitlement `pro`
- [ ] Clés `EXPO_PUBLIC_REVENUECAT_*` en EAS
- [ ] Webhook + `REVENUECAT_WEBHOOK_AUTH`
- [ ] `activateStoreSubscription` + `revenueCatWebhook` déployés

### App
- [ ] Build EAS (pas Expo Go)
- [ ] Bouton « Gérer / annuler / renouveler » → stores
- [ ] Restaurer un achat

La formule **National Pro** (`sponsor_pro`) passe par le store / RevenueCat. Territorial reste commercial (devis).
