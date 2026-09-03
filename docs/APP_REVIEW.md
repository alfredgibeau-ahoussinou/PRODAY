# App Review Apple — comptes démo & Notes pour l’examen

Guide pour débloquer l’examen App Store Connect lorsque Apple demande des **identifiants de démonstration**.

Ce n’est **pas** un refus de fonctionnement : les reviewers n’ont pas reçu de login. Il faut renseigner **App Store Connect → version → Informations sur l’examen de l’app**.

Voir aussi : [APP_STORE_LISTING.md](./APP_STORE_LISTING.md) · [STORE_RELEASE.md](./STORE_RELEASE.md)

---

## Identifiants ASC (compte principal)

| Champ ASC | Valeur |
|-----------|--------|
| **Connexion requise** | Oui |
| **Nom d’utilisateur / e-mail** | `player.demo@proday.app` |
| **Mot de passe** | `ProDayDemo2026!` |

Ce compte est un **joueur adulte** (Lucas Démo, FC ProDay Démo, Seniors A) avec données réalistes (profil, membership, stats). E-mail **déjà vérifié** — pas d’OTP, pas de 2FA, pas de validation manuelle.

Mot de passe surchargeable localement (ne jamais committer un secret prod) :

```bash
# .env (gitignoré)
DEMO_REVIEW_PASSWORD=ProDayDemo2026!
DEMO_CLUB_PASSWORD=ProDayDemo2026!
```

---

## Créer / rafraîchir les comptes (Firebase)

Prérequis : clé Admin SDK `firebase/*adminsdk*.json` + `.env` avec `EXPO_PUBLIC_FIREBASE_PROJECT_ID`.

```bash
# Tout le jeu App Review (recommandé)
npm run seed:demo-review -- --force

# Ou un par un
npm run seed:demo-club -- --force
npm run seed:demo-player -- --force
npm run seed:demo-parent -- --force
npm run seed:demo-supporter
TEST_ACCOUNT_PASSWORD='ProDayDemo2026!' npm run partner-account:setup
```

**Important :** `seed:demo-parent` utilise un enfant dédié (`child.demo@proday.app`) et **ne modifie plus** `player.demo@proday.app` (compte ASC principal).

---

## Comptes complémentaires (quel compte teste quoi)

Même mot de passe pour tous sauf mention contraire : `ProDayDemo2026!`

| E-mail | Rôle | Au carousel, choisir | Ce que ça montre |
|--------|------|----------------------|------------------|
| `player.demo@proday.app` | Joueur adulte | **Pro Day Joueur** | Profil, stats, Mercato, matchs, fil, Reels |
| `coach.demo@proday.app` | Coach | **Pro Day Coach** | Banc, convocations, effectif, tactique |
| `club.demo@proday.app` | Club / Président | **Pro Day Club** *ou* **Pro Day Président** | Cockpit club, équipes, licenciés ; shell Président = pilotage |
| `parent.demo@proday.app` | Parent | **Parent / Famille** | Supervision Léo U17, agenda, retards |
| `supporter.demo@proday.app` | Supporter | **Supporter** | Matchs, clubs suivis, vidéos |
| `part@gmail.com` | Sponsor | **Pro Day Sponsor** | Campagnes, réseau, marque |
| `child.demo@proday.app` | Joueur mineur (optionnel) | **Pro Day Joueur** | Univers ado supervisé (lié au parent) |

Il n’y a **pas** de compte multi-univers unique : chaque rôle a son e-mail. Le club et le président partagent `club.demo@proday.app` (même compte, shell selon le pôle choisi au lancement).

---

## Texte « Notes pour l’examen » (copier-coller ASC)

Coller tel quel dans **Informations sur l’examen de l’app → Notes**.

```
PRODAY — GUIDE D’EXAMEN (App Review)

IDENTIFIANTS PRINCIPAUX (connexion requise)
• E-mail : player.demo@proday.app
• Mot de passe : ProDayDemo2026!
• Compte permanent de démonstration, e-mail déjà vérifié.
• Aucune authentification à deux facteurs, aucun code SMS / OTP, aucune validation manuelle.

DÉMARRAGE
1. Ouvrir l’app ProDay.
2. Sur le carousel d’univers, choisir « Pro Day Joueur » (pôle Joueur).
3. Se connecter avec l’e-mail et le mot de passe ci-dessus.
4. Vous arrivez dans l’espace joueur (Lucas Démo — FC ProDay Démo, Seniors, milieu #8) avec profil, stats de saison et membership actifs.

PARCOURS JOUEUR (sans achat obligatoire)
• Profil / Pulse / CV : consulter le profil, les stats et le journal d’activités.
• Mercato : parcourir les annonces (consultation gratuite ; pas besoin d’acheter un abonnement pour l’examen).
• Matchs / calendrier / convocations : ouvrir les événements liés au club démo.
• Fil communauté & Reels : consultation du contenu.
• Les paywalls éventuels (Pass Premium, etc.) peuvent être ignorés ou fermés — les fonctionnalités de base restent accessibles.

AUTRES UNIVERS (comptes complémentaires, même mot de passe ProDayDemo2026!)
Pour tester un autre pôle : se déconnecter (Profil → déconnexion), revenir au carousel, choisir le pôle, puis se connecter avec le compte correspondant.

• Coach — coach.demo@proday.app → carousel « Pro Day Coach »
  Effectif, convocations, préparation match (FC ProDay Démo).

• Club — club.demo@proday.app → carousel « Pro Day Club »
  Équipes Seniors + U17, licenciés, annonces club.

• Président — club.demo@proday.app → carousel « Pro Day Président »
  Même compte que Club ; shell exécutif (pilotage / santé du club).

• Parent — parent.demo@proday.app → carousel Parent / Famille
  Supervision de l’enfant démo Léo U17 (agenda, retards, contrôles).

• Supporter — supporter.demo@proday.app → carousel Supporter
  Accueil, matchs, clubs suivis, vidéos.

• Sponsor — part@gmail.com → carousel « Pro Day Sponsor »
  Campagnes / réseau / marque (démo partenaire).

ACHATS INTÉGRÉS
L’app propose des abonnements Pro (StoreKit). Ils ne sont PAS requis pour examiner les fonctionnalités principales listées ci-dessus. Aucun achat n’est nécessaire pour valider la connexion ni la navigation des pôles.

SUPPORT
proday.admin@gmail.com · https://proday75.fr
```

---

## Checklist avant de renvoyer à l’examen

- [ ] `npm run seed:demo-review -- --force` exécuté sur le projet Firebase de **production** (celui de la build store)
- [ ] Connexion testée **sur la build soumise** (TestFlight / build ASC), pas seulement en Expo Go
- [ ] ASC → version → **Connexion requise = Oui** + e-mail / MDP renseignés
- [ ] ASC → **Notes pour l’examen** collées (texte ci-dessus)
- [ ] Pas de 2FA / OTP / file d’attente bêta bloquante sur ces comptes
- [ ] Mode maintenance **désactivé** (`platform_config.maintenance_mode`)
- [ ] Compte `player.demo` : e-mail vérifié, `is_active`, documents onboarding OK (le seed le garantit)
- [ ] Relancer la soumission (« Soumettre pour examen »)

---

## Reply Resolution Center — refus metadata / software / privacy (2.3.6 · 2.5.1 · 2.5.4 · 5.1.1 · 5.1.2)

Coller tel quel dans **Répondre à l’équipe de vérification des apps** (Resolution Center). Texte en anglais.

```
Hello App Review Team,

Thank you for reviewing ProDay and for the feedback on guidelines 2.3.6, 2.5.1, 2.5.4, 5.1.1, and 5.1.2.

We have addressed each point as follows:

1) Guideline 2.3.6 — Accurate Metadata
• App Store screenshots and promotional text have been aligned with the actual current app experience (coach, player, club poles).
• We no longer rely on branding-only slides as representative screenshots of core functionality.
• The in-app Privacy Policy and Terms are available from Profile → Settings → Legal (Confidentialité / Conditions), and on the web at https://proday75.fr/confidentialite and https://proday75.fr/cgu.

2) Guidelines 2.5.1 / 2.5.4 — Software Requirements
• We removed the unused “audio” UIBackgroundModes key. ProDay only plays audio while the app is in the foreground (reels / clips); it does not provide background audio.
• The remaining background mode is remote-notification only (push notifications).
• Usage descriptions for Camera, Microphone, Photo Library, Location, Calendar/Reminders, and HealthKit are present and describe real features (reels, identity/diploma verification uploads, carpool meeting points, calendar sync, optional HealthKit fitness read).
• HealthKit entitlement is declared only for optional read of steps / sleep / resting heart rate; we do not write to Health.

3) Guidelines 5.1.1 / 5.1.2 — Privacy
• Privacy Policy URL in App Store Connect: https://proday75.fr/confidentialite
• We do not track users across apps/websites for advertising (no IDFA / ATT). NSPrivacyTracking = false.
• App Privacy (Nutrition Labels) and the PrivacyInfo.xcprivacy manifest now declare data we collect and link to the user for app functionality, including: Contact Info, Identifiers, Photos/Videos, Audio, User Content, Sensitive Info (identity & diploma verification), Location (carpool, opt-in), Health & Fitness (opt-in HealthKit), Purchases, and Product Interaction.
• Sensitive documents (coach verification) are collected only after account creation, for verification, and are disclosed in the Privacy Policy and in-app Settings → Verification.
• At sign-up, users must accept Terms and Privacy, with tappable links to the live policy pages.
• Data is not sold. Sharing is limited to service providers needed to operate the app (e.g. Firebase hosting/auth/storage, Apple for IAP/push), as described in the Privacy Policy.

Demo account for review (also in App Review Information):
• Email: player.demo@proday.app
• Password: ProDayDemo2026!
• Universe carousel: select “Pro Day Joueur”, then sign in. No 2FA / OTP.
• Coach verification UI (identity & diplomas): coach.demo@proday.app → “Pro Day Coach” → Profile → Settings.

We kindly request review of the new binary once available (background modes + privacy manifest fixes require a new build). Please let us know if anything else is needed.

Best regards,
ProDay Team
proday.admin@gmail.com
```

### Checklist ASC avant renvoi (privacy + metadata)

- [ ] **Privacy Policy URL** = `https://proday75.fr/confidentialite` (App Information)
- [ ] **App Privacy** mis à jour (tableau ci-dessus dans [APP_STORE_LISTING.md](./APP_STORE_LISTING.md)) — Tracking = **No**
- [ ] Captures iPhone 6,5" + iPad 13" = UI réelle (pas seulement slides 08–10 branding)
- [ ] Description FR alignée sur [APP_STORE_LISTING.md](./APP_STORE_LISTING.md) (pas de promesses roadmap non livrées)
- [ ] Connexion requise + notes démo (section plus haut)
- [ ] **Nouvelle build TestFlight** soumise (retrait `audio` background + PrivacyInfo) puis « Soumettre pour examen »

---

## Reply Resolution Center — identifiants manquants (historique)

Coller tel quel dans **Répondre à l’équipe de vérification des apps** (Resolution Center). Texte en anglais (standard App Review).

```
Hello App Review Team,

Thank you for your message. We apologize for the missing demo credentials.

Sign-in is required. Demo account (also filled in App Review Information for this version):

• Username / email: player.demo@proday.app
• Password: ProDayDemo2026!

How to access the app:
1. Open ProDay.
2. On the universe carousel, select “Pro Day Joueur”.
3. Sign in with the credentials above.
4. You will land in the adult player space (Lucas Démo — FC ProDay Démo) with profile, stats, and membership data. No 2FA, OTP, or manual approval.

Other poles (same password ProDayDemo2026!): sign out → return to the carousel → pick the pole → sign in with the matching account (coach.demo@proday.app, club.demo@proday.app, parent.demo@proday.app, supporter.demo@proday.app, part@gmail.com for Sponsor). Full step-by-step notes are in App Review Information → Notes.

In-app purchases / Pro subscriptions are optional and not required to review core features.

We kindly request that you resume review of this build (1.0.9). Please let us know if you need anything else.

Best regards,
ProDay Team
proday.admin@gmail.com
```

---

## Procédure App Store Connect (rappel)

1. [App Store Connect](https://appstoreconnect.apple.com) → mon app **ProDay** → version en attente / refusée.
2. Section **Informations sur l’examen de l’app** (App Review Information).
3. Cocher **Connexion requise** / Sign-in required.
4. Renseigner utilisateur + mot de passe (tableau en tête de ce doc).
5. Coller les **Notes pour l’examen**.
6. Répondre au message Resolution Center avec le texte de la section ci-dessus.
7. **Soumettre de nouveau** pour examen si la version n’est plus en file (sinon la réponse Resolution Center peut suffire).

---

## Maintenance

| Action | Commande |
|--------|----------|
| Rafraîchir tous les comptes review | `npm run seed:demo-review -- --force` |
| Nettoyer données démo (attention) | `npm run cleanup:demo` |
| Doc scripts | [../scripts/README.md](../scripts/README.md) |

Ne pas committer `.env`, `firebase/*adminsdk*.json`, ni un mot de passe différent du défaut documenté ici sans le mettre à jour dans ASC **et** dans ce fichier.
