# Fiche App Store / Google Play — ProDay

Texte marketing **aligné sur les capacités réelles** de l'application (juin 2026).  
Pour la création des SKU et abonnements : voir [STORE_SETUP.md](./STORE_SETUP.md).

Bundle / package : `com.proday.app`

---

## Sous-titre (iOS, 30 caractères max)

```
Carrière, Mercato & saison
```

(29 caractères)

---

## Mots-clés (iOS, 100 caractères max)

```
foot,mercato,recrutement,club,match,tournoi,carrière,CV,joueur,coach,sponsor,amateur
```

(87 caractères — pas de doublons avec le nom de l'app)

---

## Description promotionnelle courte (170 caractères)

```
ProDay : profil foot, Mercato, journal d'activités, score carrière et saison (matchs, Arena, sponsors). Analyse IA sur vos highlights — pas sur chaque geste.
```

---

## Description complète (FR, ≤ 4000 caractères)

```
ProDay — CONNECTER. PROGRESSER. RÉVÉLER.

ProDay est l'écosystème mobile pour le foot amateur et semi-pro : une seule app pour votre profil, le recrutement, votre saison et votre communauté.

AUJOURD'HUI DANS L'APP

• Profil joueur ou staff : Pulse, CV en ligne, galerie et stats de saison
• Score carrière et timeline de progression
• Journal d'activités : séances, matchs et moments forts
• Analyse IA de vos highlights de séance (vidéo ou image + notes) — pas une analyse automatique de chaque action en match
• Mercato : annonces par poste et niveau, candidatures, suivi pour clubs, coachs, agents et recruteurs
• Matchs amicaux, convocations RSVP et Live Stats vers votre profil
• Arena : tournois locaux, inscriptions et palmarès
• Fil communauté, Reels et question de la semaine
• Espace partenaires / sponsors (visibilité clubs et marques)
• Pôle santé : kinés, coach mental, nutrition — annuaire vérifié
• Covoiturage intégré aux événements
• Contrôle parental et espace famille pour les mineurs
• Vérification diplômes staff et messagerie sécurisée

QUATRE PÔLES

• Joueur — Pro Day Man & ProDay Woman (foot M et F)
• Pro — coach, recruteur, agent, club, organisateur
• Santé — praticiens près des clubs
• Partenaires — sponsors locaux et nationaux

FORMULES (voir aussi l'app)

Gratuit : profil, calendrier, limites Mercato selon le rôle.
Abonnements Pro (mensuel ou annuel −20 %) : Pass Joueur Premium, Coach Pro, Club Amateur / Essentiel, Organisateur Pro, National Pro sponsors. Formules Club Tout inclus et Pro + Veo : sur devis (à partir de 3 € / adhérent).
La formule sponsor Territorial (49 €/mois) passe par un devis commercial — pas par l'App Store.

HONNÊTETÉ PRODUIT

Nous ne promettons pas une détection automatique des talents à l'échelle mondiale ni une analyse vidéo frame-by-frame sur tout le match : ce sont des ambitions roadmap. L'IA actuelle aide à commenter les séances que vous enregistrez volontairement.

ProDay remplace les groupes éparpillés par un calendrier unifié, un CV vivant et un Mercato ciblé — pour progresser et être visible des bons clubs.

Rejoignez la liste d'attente sur proday75.fr si l'app n'est pas encore disponible dans votre région.

Support : proday.admin@gmail.com
Site : https://proday75.fr
```

**Longueur** : ~1 950 caractères (marge confortable sous la limite 4 000).

---

## Notes App Store Connect

| Champ | Valeur suggérée |
|-------|-----------------|
| Catégorie principale | Sports |
| Catégorie secondaire | Réseaux sociaux ou Productivité |
| Classification d'âge | 12+ (messagerie, UGC) |
| **URL confidentialité** | **https://proday75.fr/confidentialite** |
| URL support | https://proday75.fr · proday.admin@gmail.com |

### App Privacy (Nutrition Labels) — à aligner sur l’app

Dans ASC → App Privacy, déclarer **les données collectées** (Linked to User = Yes, Used for Tracking = **No**) :

| Catégorie ASC | Exemples ProDay | Pourquoi |
|---------------|-----------------|----------|
| Contact Info | Email, Name, Phone | Compte / profil |
| Location | Precise + Coarse | Covoiturage (opt-in) |
| Sensitive Info | Pièces d’identité, diplômes | Vérification coach / staff |
| Photos or Videos | Avatar, reels, justificatifs | Galerie / vérif |
| Audio Data | Micro reels / clips | Enregistrement volontaire |
| Health & Fitness | Pas, sommeil, FC (HealthKit) | État forme (opt-in) |
| User Content | Messages, fil, Mercato | Fonctionnalités produit |
| Identifiers | User ID, Device ID | Auth Firebase, push |
| Purchases | Abonnements StoreKit | IAP |
| Usage Data | Product Interaction | Analytics produit internes (pas IDFA) |

**Tracking = No** — pas d’ATT / IDFA / publicité cross-app.  
Manifeste natif : `ios/ProDay/PrivacyInfo.xcprivacy` (+ `expo.ios.privacyManifests` dans `app.json`).

### Examen Apple — connexion requise (obligatoire)

Apple refuse l’examen si aucun identifiant n’est fourni. Détail complet + texte **Notes pour l’examen** prêt à coller : **[APP_REVIEW.md](./APP_REVIEW.md)**.

| Champ ASC | Valeur |
|-----------|--------|
| Connexion requise | **Oui** |
| E-mail | `player.demo@proday.app` |
| Mot de passe | `ProDayDemo2026!` |

Rafraîchir les comptes Firebase : `npm run seed:demo-review -- --force`

## Notes Google Play

| Champ | Valeur suggérée |
|-------|-----------------|
| Catégorie | Sports |
| Public cible | Adolescents et adultes |
| Annonces | Non (sauf évolution future sponsors) |
| Achats intégrés | Oui — abonnements (voir STORE_SETUP.md) |

---

## Cohérence tarifs

Reporter les montants de `src/content/subscriptionPlans.ts` et `src/content/sponsorPricing.ts` dans chaque console. Le site `website/src/lib/content.ts` est synchronisé sur les mêmes prix.

| Plan | Mensuel (€) |
|------|-------------|
| Pass Joueur Premium | 3,99 |
| Recruteur Pro | 7,99 |
| Coach Pro | 7,99 |
| Club Pro | 11,99 |
| Agent Elite | 29,99 (lancement 19,99 × 20 premiers) |
| Pôle santé Pro | 19,99 |
| Organisateur Pro | 14,99 |
| National Pro (sponsor) | 99,00 |
| Sponsor Territorial | 49,00 (hors store) |
| Sponsor Découverte | 0 |

Annuel : −20 % (12 mois facturés d'un coup).

---

## Checklist publication

- [ ] Description FR collée (section ci-dessus)
- [ ] Sous-titre + mots-clés iOS
- [ ] Captures d'écran iPhone 6,5" + iPad 13" — voir section **Captures d'écran App Store** ci-dessous
- [ ] Identifiants + Notes App Review collés dans ASC — [APP_REVIEW.md](./APP_REVIEW.md)
- [ ] 16 SKU créés — [STORE_SETUP.md](./STORE_SETUP.md)
- [ ] Test sandbox iOS + licence test Android sur `player_plus` et `sponsor_pro`
- [ ] `npm test -- iapProducts` vert

---

## Captures d'écran App Store (iOS)

### iPhone 6,5" — dimensions acceptées

App Store Connect exige **exactement** l'une de ces tailles (portrait) :

| Génération | Portrait | Paysage |
|------------|----------|---------|
| **14 / 13 / 12 Pro Max** (recommandé) | **1284 × 2778 px** | 2778 × 1284 px |
| 11 Pro Max / XS Max | 1242 × 2688 px | 2688 × 1242 px |

**Ne pas** uploader des captures redimensionnées à la main (Preview, export Figma sans preset) — regénérer via le script.

Dossier : [`assets/marketing/app-store/ios-6.5/`](../assets/marketing/app-store/ios-6.5/) — voir README du dossier.

### iPad 13" — dimensions acceptées (obligatoire si l’app tourne sur iPad)

Message ASC typique : *« Veuillez charger une capture d’écran adaptée aux iPad munis d’un écran de 13 pouces »*.

| Classe | Portrait | Paysage |
|--------|----------|---------|
| **13" (requis)** — iPad Pro 13" / Air 13" | **2064 × 2752 px** | 2752 × 2064 px |
| 12,9" legacy (optionnel) | 2048 × 2732 px | 2732 × 2048 px |

Dossier : [`assets/marketing/app-store/ipad-13/`](../assets/marketing/app-store/ipad-13/) — **10 PNG 2064 × 2752** (7 pôles cadre tablette + 3 objectif texte).

Upload : **Médias de l’app** → **Captures d’écran pour iPad** → **13 pouces**.

### Contenu commun (iPhone + iPad)

**Guideline 2.3.6** : les captures doivent représenter **l’UI réelle** de la build soumise (pas uniquement des slides branding). Les fichiers `08`–`10` (texte / branding sans UI) ne doivent **pas** être les seules captures ; privilégier 01–07 ou des screenshots device (Simulateur / TestFlight) du coach, joueur, club.

Ordre d’upload (01 → 10) :

1. `01-pole-joueur.png` — Profil, stats et carrière en ligne
2. `02-pole-coach.png` — Pilotez votre staff et vos séances
3. `03-pole-club.png` — Équipes, licenciés et recrutement
4. `04-pole-president.png` — Le club en un coup d'œil
5. `05-pole-parent.png` — Accompagnez sans étouffer
6. `06-pole-supporter.png` — Suivez matchs, scores et favoris
7. `07-pole-sponsor.png` — Visibilité clubs et marques
8. `08-objectif-infrastructure.png` — texte / branding (sans UI)
9. `09-objectif-centralisation.png` — texte / branding (sans UI)
10. `10-objectif-portes.png` — texte / branding (sans UI)

**3 captures prioritaires** si upload partiel : `01`, `02`, `03`.

Pas de capture Admin (cockpit interne).

### Regénérer

```bash
npm run marketing:app-store-ios          # iPhone 1284 × 2778
npm run marketing:app-store-ios:legacy   # iPhone 1242 × 2688
npm run marketing:app-store-ipad         # iPad 13" 2064 × 2752
npm run marketing:app-store-ipad:legacy  # iPad 12,9" 2048 × 2732
```
