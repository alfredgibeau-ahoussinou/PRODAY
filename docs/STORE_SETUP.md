# Configuration App Store & Google Play — IAP ProDay

Ce guide aligne **exactement** les SKU des stores avec le code (`src/content/iapProducts.ts` et `functions/src/iapSkus.ts`).

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
- Vérifier que `activateStoreSubscription` (Cloud Function) est déployée et que l’utilisateur est authentifié Firebase avant l’achat.
- Annuler / renouveler les abonnements sandbox accélérés : [documentation Apple](https://developer.apple.com/documentation/storekit/in-app_purchase/testing_in-app_purchases_with_sandbox).

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
- `expo-iap` attend `type: 'subs'` et le SKU exact côté Google.

---

## Validation serveur (`activateStoreSubscription`)

Fonction callable : **`activateStoreSubscription`** (`functions/src/subscriptionIap.ts`).

Flux :

1. L’app achète via `expo-iap` (`src/services/iap.service.ts`).
2. Après `purchaseUpdatedListener`, appel callable avec `planId`, `productId`, `platform`, `transactionId`, `purchaseToken` (Android).
3. Le serveur vérifie que `productId` est un SKU connu (`iapSkus.ts`) et que `planId` correspond — **y compris `sponsor_pro`**.
4. Écrit `subscription_purchases/{platform}_{transactionId}` et met à jour `users/{uid}` :
   - `subscription_tier: 'pro'`
   - `subscription_plan_id: <planId>`
   - `subscription_status: 'active'`
   - `subscription_period_end` (+1 mois ou +1 an)

Déploiement :

```bash
cd functions && npm run build
firebase deploy --only functions:activateStoreSubscription
```

---

## Checklist avant mise en prod

### App Store Connect (16 abonnements)

- [ ] Groupe d’abonnements créé (ex. `proday_pro`)
- [ ] `com.proday.app.player_plus.monthly` — 2,99 €/mois
- [ ] `com.proday.app.player_plus.yearly` — annuel −20 %
- [ ] `com.proday.app.recruiter_pro.monthly` — 7,99 €/mois
- [ ] `com.proday.app.recruiter_pro.yearly`
- [ ] `com.proday.app.coach_pro.monthly` — 7,99 €/mois
- [ ] `com.proday.app.coach_pro.yearly`
- [ ] `com.proday.app.club_pro.monthly` — 11,99 €/mois
- [ ] `com.proday.app.club_pro.yearly`
- [ ] `com.proday.app.agent_elite.monthly` — 29,99 €/mois (offre lancement 19,99 € pour 20 premiers via `claimAgentLaunchSeat`)
- [ ] `com.proday.app.agent_elite.yearly`
- [ ] `com.proday.app.physio_pro.monthly` — 19,99 €/mois
- [ ] `com.proday.app.physio_pro.yearly`
- [ ] `com.proday.app.organizer_pro.monthly` — 14,99 €/mois
- [ ] `com.proday.app.organizer_pro.yearly`
- [ ] `com.proday.app.sponsor_pro.monthly` — 99,00 €/mois
- [ ] `com.proday.app.sponsor_pro.yearly`
- [ ] Contrat fiscal / bancaire actif
- [ ] Capacité In-App Purchase sur l’App ID
- [ ] Localisations FR (nom + description par plan)
- [ ] Fiche store : [APP_STORE_LISTING.md](./APP_STORE_LISTING.md)

### Google Play Console (16 abonnements)

- [ ] `com.proday.app.player_plus.monthly` — 2,99 €/mois
- [ ] `com.proday.app.player_plus.yearly`
- [ ] `com.proday.app.recruiter_pro.monthly` — 7,99 €/mois
- [ ] `com.proday.app.recruiter_pro.yearly`
- [ ] `com.proday.app.coach_pro.monthly` — 7,99 €/mois
- [ ] `com.proday.app.coach_pro.yearly`
- [ ] `com.proday.app.club_pro.monthly` — 11,99 €/mois
- [ ] `com.proday.app.club_pro.yearly`
- [ ] `com.proday.app.agent_elite.monthly` — 29,99 €/mois (lancement 19,99 € × 20)
- [ ] `com.proday.app.agent_elite.yearly`
- [ ] `com.proday.app.physio_pro.monthly` — 19,99 €/mois
- [ ] `com.proday.app.physio_pro.yearly`
- [ ] `com.proday.app.organizer_pro.monthly` — 14,99 €/mois
- [ ] `com.proday.app.organizer_pro.yearly`
- [ ] `com.proday.app.sponsor_pro.monthly` — 99,00 €/mois
- [ ] `com.proday.app.sponsor_pro.yearly`
- [ ] Compte marchand Google Payments lié
- [ ] Piste test interne + comptes licence test
- [ ] Fiche store : [APP_STORE_LISTING.md](./APP_STORE_LISTING.md)

### Code & serveur

- [ ] Prix cohérents app / site / consoles
- [ ] `activateStoreSubscription` déployée (plan Blaze)
- [ ] Test achat sandbox iOS + licence test Android pour au moins `player_plus` et `sponsor_pro`
- [ ] `npm test -- iapProducts` passe (alignement code)

## Formule sponsor Territorial (hors IAP)

La formule **Territorial** (49 €) n’est **pas** un SKU store : demande commerciale + validation admin (`sponsor_upgrade_requests`). L’activation écrit `sponsor_tier: 'territorial'` sur le profil utilisateur — voir `sponsorUpgrade.service.ts`.

La formule **National Pro** (`sponsor_pro`) passe par IAP / `activateStoreSubscription`.
