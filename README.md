<div align="center">

<img src="website/public/branding/logo-proday-official.png" alt="ProDay" width="360" />

<br /><br />

**CONNECTER • PROGRESSER • RÉUSSIR**

<br />

*Profil, Mercato, journal d'activités et saison — une app mobile honnête sur ce qui est livré aujourd'hui.*

<br />

[![Site](https://img.shields.io/badge/Site-proday75.fr-22d3ee?style=flat-square)](https://proday75.fr)
[![Bêta](https://img.shields.io/badge/Bêta-Inscription-0891b2?style=flat-square)](https://proday75.fr/beta/inscription)

<br />

**© ProDay 2026 — Tous droits réservés** · Code propriétaire — reproduction interdite sans autorisation
<br />

📖 **Documentation publique :** [github.com/alfredgibeau-ahoussinou/PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

</div>

---

## Sommaire

1. [ProDay en bref](#proday-en-bref)
2. [Vision & mission](#vision--mission)
3. [Les sept univers ProDay](#les-sept-univers-proday)
4. [Parcours utilisateur](#parcours-utilisateur)
5. [Fonctionnalités clés](#fonctionnalités-clés)
6. [Sécurité & validation](#sécurité--validation)
7. [Programme bêta fermée](#programme-bêta-fermée)
8. [État actuel & roadmap](#état-actuel--roadmap)
9. [Architecture technique](#architecture-technique)
10. [Stack détaillée](#stack-détaillée)
11. [Structure du monorepo](#structure-du-monorepo)
12. [Démarrage développeur](#démarrage-développeur)
13. [Scripts & commandes](#scripts--commandes)
14. [Documentation](#documentation)
15. [FAQ rapide](#faq-rapide)
16. [Contact](#contact)

---

## ProDay en bref

ProDay relie **carrière, club et communauté** dans le foot amateur et semi-pro. Une seule application mobile couvre convocations, recrutement (Mercato), matchs, tournois Arena, visibilité joueur (Pulse), communauté (Fil & Reels) et espace partenaires — avec un site vitrine sur [proday75.fr](https://proday75.fr) qui décrit le produit avec la même honnêteté.

> Les chiffres affichés sur le site (9+ onglets, 12 modules…) décrivent **l'architecture produit**, pas une audience en temps réel. L'analyse IA porte sur vos **highlights de séance** (vidéo ou poster + notes), pas sur chaque geste en match.

**Pour qui ?** Joueurs et joueuses, coachs amateur, supporters, praticiens santé, joueurs pro, clubs, staff (agent · recruteur · coach · organisateur) et sponsors — chacun avec un **pôle** et une coque adaptés.

Pages détaillées : [Fonctionnalités](https://proday75.fr/fonctionnalites) · [Vision](https://proday75.fr/vision) · [Roadmap](https://proday75.fr/roadmap) · [Partenaires](https://proday75.fr/partenaires)

---

## Vision & mission

**Mission** — *Connecter • Progresser • Réussir* : donner à chaque acteur du foot amateur les outils du haut niveau, **sans surestimer l'IA**.

ProDay naît d'un constat simple : une équipe U17 jongle entre cinq groupes WhatsApp, un tableur Excel pour les convocations et des annonces Mercato éparpillées sur les réseaux. ProDay **unifie** ces flux dans une app mobile React Native / Expo, avec des données **réelles** depuis Firestore (pas de mock en production).

| Pilier | Ce que ça signifie concrètement |
|--------|----------------------------------|
| **Plateforme unifiée** | Carrière, club, convocations, matchs et tournois — tout au même endroit |
| **Confiance ProDay** | Diplômes staff validés avant messagerie complète ; contrôle parental pour les mineurs |
| **CV vivant** | Chaque match nourrit le profil ; export PDF professionnel en un geste |
| **IA honnête** | Analyse Mistral sur les séances enregistrées dans le journal — pas une promesse frame-by-frame sur tout le terrain |
| **Demain** | Repérage talent mondial, paiements tournois, push géo agents — voir [roadmap](#état-actuel--roadmap) |

**Aujourd'hui vs demain** — Le produit distingue clairement ce qui est livré de ce qui est ambition :

- **Aujourd'hui** : profil & Pulse, score carrière, journal d'activités, analyse IA highlights, Mercato, matchs & Live Stats, Arena, Fil & Reels, sponsors, pôle santé, covoiturage, contrôle parental, admin.
- **Demain** (non promis) : analyse vidéo frame-by-frame avancée, détection automatique des talents, notifications géo agents à grande échelle, paiements tournois intégrés, couverture IAP complète.

---

## Les sept univers ProDay

Comme sur [proday75.fr](https://proday75.fr), le produit s’organise autour de **pôles métier**. Le carousel marketing en affiche six ; le **pôle Sponsor** est aussi une coque app dédiée — [proday75.fr/sponsor](https://proday75.fr/sponsor). Voir [docs/ECOSYSTEM_POLES_EVOLUTION.md](docs/ECOSYSTEM_POLES_EVOLUTION.md).

### Tableau des pôles

| Pôle | Public | Tagline | En détail |
|------|--------|---------|-----------|
| **Joueur** | Joueurs (amateur → pro) | *AMATEUR • CENTRE • PRO* | Un seul espace. Badges Amateur (bleu), Centre / Aspirant (vert), Professionnel (jaune). Signature pro = badge uniquement. Genre H/F à l'inscription. |
| **Supporter** | Fans & communauté | *SUIVRE • VIBRER • PARTAGER* | Tribune **100 % gratuite** — matchs live, suivis, débats, Reels. Sans Mercato ni abonnement store. |
| **Santé** | Praticiens & staff médical | *SOIGNER • ACCOMPAGNER • PERFORMER* | 7 métiers — annuaire vérifié, RDV près des clubs. |
| **Club** | Structures & équipes | *STRUCTURE • RECRUTEMENT • VITRINE* | Pipeline candidatures kanban, multi-équipes, vitrine. Calendrier & convocations → Staff. |
| **Staff** | Agent · Recruteur · Coach | *MANDATS • SCOUTING • CONVOCATIONS* | Calendrier structure, convocations premium, Mercato. Agent : 19,99 € (20 premiers) puis 29,99 €. |
| **Événements** | Organisateurs | *TOURNOIS • ACADÉMIES • DÉTECTIONS* | Création, inscriptions, listes, résultats, médias (paiements à brancher). |
| **Sponsor** | Marques & partenaires | *VISIBILITÉ • ROI • TERRAIN* | Découverte (0 €), Territorial (49 €/mois), National Pro (99 €/mois). |

### Écosystème des pôles

```mermaid
mindmap
  root((ProDay))
    Joueur
      Badges Amateur Centre Pro
      Mercato filtres
      Joueur vérifié
    Supporter
      Live scores
      Suivis illimités
      100% gratuit
    Santé
      Annuaire vérifié
      RDV en ligne
    Club
      Pipeline kanban
      Vitrine publique
    Staff
      Calendrier structure
      Convocations premium
      Agent 19.99 lancement
    Événements
      Tournois camps
      Inscriptions
    Sponsor
      Découverte 0€
      Territorial 49€
      National Pro 99€
```

> **Genre H/F** — Segment UI sur le Pôle Joueur, pas un pôle produit. `/homme`, `/woman`, `/amateur`, `/pro-joueur` → `/joueur`.

---

## Parcours utilisateur

Après inscription, l'utilisateur choisit son **pôle** puis accède aux **modules** visibles selon son rôle. L'app expose jusqu'à **9 onglets dynamiques** (Accueil, Candidater/Mercato, Matchs, Reels, Fil, Covoit., Santé, Messages, Profil) — certains masqués selon l'univers.

```mermaid
flowchart TD
    A([Visiteur ou nouveau compte]) --> B{Inscription}
    B --> C[Choix du pôle / univers]
    C --> D1[Amateur]
    C --> D2[Supporter]
    C --> D3[Santé]
    C --> D4[Pro Joueur]
    C --> D5[Pro Club]
    C --> D6[Pro Staff]
    C --> D7[Sponsor]

    D1 --> E[Profil + Pulse + CV]
    D2 --> F[Clubs favoris + live]
    D3 --> G[Spécialité + zone]
    D4 --> H[Portfolio + carrière]
    D5 --> I[Structure + équipes]
    D6 --> J[Mercato + mandats]
    D7 --> S[Campagnes + ROI]

    E --> K{Modules transverses}
    F --> K
    G --> K
    H --> K
    I --> K
    J --> K
    S --> K

    K --> M1[Mercato & candidatures]
    K --> M2[Matchs & convocations RSVP]
    K --> M3[Arena tournois]
    K --> M4[Fil & Reels]
    K --> M5[Covoiturage]
    K --> M6[Messages sécurisés]
    K --> M7[Pulse & score carrière]

    M2 --> L[Live Stats → profil]
    M1 --> N[Pipeline staff / recruteurs]
```

<details>
<summary>Parcours détaillé par rôle (coach, recruteur, agent, club, parent, partenaire…)</summary>

| Rôle | Étapes clés |
|------|-------------|
| **Coach** | Vérification diplôme → effectif → annonces → convocations & Live Stats |
| **Recruteur** | Profil vérifié → territoire → Mercato Pro → pipeline candidatures |
| **Agent** | Profil vérifié → repérage & mandats → contacts → pipeline mandats |
| **Club** | Profil & équipes → annonces Mercato → candidatures → convocations |
| **Parent** | Supervision → contacts approuvés → limite de temps → rapport |
| **Partenaire** | Profil sponsor → offres & campagnes → visibilité Sponsors → stats |

</details>

Démo navigateur sans installer l'app : [proday75.fr/demo](https://proday75.fr/demo) — sélecteur Homme / Woman / Pro, 9 onglets comme sur mobile.

---

## Fonctionnalités clés

Chaque module est documenté sur [proday75.fr/fonctionnalites](https://proday75.fr/fonctionnalites). Voici l'essentiel :

### Profil, Pulse & carrière

- **Pulse ProDay** — Score de visibilité combinant profil, activité et confiance ; signature exclusive de la plateforme.
- **CV en ligne** — Stats saison, galerie, timeline de progression ; export PDF depuis l'onglet Profil.
- **Journal d'activités** — Séances, matchs, highlights enregistrés ; analyse IA Mistral sur miniature vidéo ou poster + tags.

### Mercato (recrutement intelligent)

- Annonces ciblées par poste, niveau et ville.
- Candidature depuis l'app, suivi des réponses.
- **Mercato M / F / Amateur / Pro** — filtres et permissions selon l'univers.
- Pipeline staff pour recruteurs, coachs, agents et clubs.

### Matchs, convocations & Arena

- **Matchs amicaux & détections** — calendrier unifié, RSVP (présent / absent / peut-être), relances.
- **Live Stats** — Buts, passes, cartons en direct ; alimentation automatique du profil et du CV.
- **Arena** — Création tournoi, inscriptions club, tableaux, scores et palmarès publiés.

### Communauté & visibilité

- **Fil** — Publications clubs et joueurs, réactions, question hebdo.
- **Reels** — Vidéos courtes verticales pour moments forts et visibilité profil.
- **Dashboard IA d'accueil** — Recommandations matchs, progression, alertes.

### Transversal

- **Covoiturage** — Trajets match & détection intégrés aux événements (style BlaBlaCar).
- **Pôle santé** — Annuaire praticiens vérifiés ; contact sécurisé joueur ↔ pro.
- **Espace partenaires** — Découverte (0 €), Territorial (49 €), National Pro (99 €/mois) ; impressions et conversions suivies.
- **Famille & mineurs** — Contrôle parental, portail tuteur, espace jeunes.
- **ProDay Shop** — Trépieds, textile et maillots par univers ; précommande en attendant IAP complet.

---

## Sécurité & validation

ProDay applique une politique de **confiance graduée** : les joueurs et supporters accèdent rapidement ; les rôles à responsabilité (coach, agent, recruteur, praticien santé, club, sponsor) passent par une **revue admin** avant déblocage complet.

```mermaid
flowchart TD
    A([Inscription]) --> B{Type de profil}
    B -->|Joueur / Supporter| C[Accès immédiat — rôle limité]
    B -->|Coach / Agent / Staff / Santé / Club| D[Upload diplôme ou licence]
    D --> E[(Firestore: is_verified = false\nstatus = PENDING)]
    E --> F[Badge orange — En cours de vérification]
    F --> G{Revue admin}
    G -->|Validé| H[(is_verified = true\nstatus = VERIFIED)]
    G -->|Rejeté| I[(status = REJECTED)]
    H --> J[Badge vert — Messagerie complète]
    I --> K[Email rejet + nouvelle soumission]
```

| Étape | Détail |
|-------|--------|
| 1. Document reçu | Photo ou scan du diplôme / carte pro |
| 2. Authenticité | Contrôle manuel ou semi-automatisé |
| 3. Établissement | Vérification de l'organisme émetteur |
| 4. Badge vérifié | Messagerie complète, annonces Mercato actives selon le plan |

**Firestore rules** — `firebase/firestore.rules` impose l'authentification, la propriété des documents et des champs sensibles (ex. `is_verified`, `subscription_tier`) modifiables uniquement par admin ou Cloud Functions.

**Mineurs** — Espace jeunes avec supervision parentale : contacts approuvés, limites de temps, rapport d'activité. Voir [proday75.fr/confiance](https://proday75.fr/confiance).

---

## Programme bêta fermée

ProDay est en **bêta fermée** : l'app n'est pas encore sur les stores publics. Les testeurs s'inscrivent sur la liste d'attente et reçoivent un accès prioritaire (TestFlight iOS / APK Android).

> **Bêta iOS** : ouverture **11 août 2026 à 18 h** via TestFlight — détails opérateur dans [docs/BETA_IOS_LAUNCH.md](docs/BETA_IOS_LAUNCH.md).

> Inscrivez-vous sur la [liste d'attente](https://proday75.fr/beta/inscription) pour suivre l'avancement du produit et accéder en priorité au lancement.

### Parcours waitlist → app

```mermaid
flowchart LR
    A[Visiteur site] -->|CTA Accès anticipé| B["/beta/inscription"]
    B -->|POST /api/beta| C[Email de bienvenue]
    C -->|lien ?token=| D["/api/beta/access"]
    D -->|cookie 90j| E["/beta/programme"]
    E --> F["/beta/installer"]
    E --> G["/beta/aide"]
    F --> H[TestFlight / APK]
    H --> I[App mobile ProDay]
```

| URL | Accès | Rôle |
|-----|-------|------|
| [proday75.fr/beta/inscription](https://proday75.fr/beta/inscription) | Public | Inscription waitlist |
| [proday75.fr/beta/programme](https://proday75.fr/beta/programme) | Cookie bêta | Programme — 7 pôles, modules |
| [proday75.fr/beta/installer](https://proday75.fr/beta/installer) | Cookie bêta | Guides APK / TestFlight |
| [proday75.fr/beta/aide](https://proday75.fr/beta/aide) | Cookie bêta | FAQ et support bêta |

**Règle nav site** — Tous les CTA « Accès anticipé » pointent vers `/beta/inscription` uniquement, jamais vers `/beta` directement.

### Checklist opérateur

```bash
npm run beta:check   # Firebase, typecheck, Jest, règles Firestore, pages légales
```

Guides complets : [docs/BETA_LAUNCH.md](docs/BETA_LAUNCH.md) · [docs/BETA_GUIDE.md](docs/BETA_GUIDE.md) · [docs/BETA_WAITLIST.md](docs/BETA_WAITLIST.md)

---

## État actuel & roadmap

Statut honnête au moment de la bêta — aligné sur [docs/BETA_LAUNCH.md](docs/BETA_LAUNCH.md) et la [roadmap site](https://proday75.fr/roadmap).

| Phase | Statut | Exemples |
|-------|--------|----------|
| **Livré** | ✅ | Dashboard IA, profil & Pulse, score carrière, journal, analyse IA highlights, Mercato, matchs & Live Stats, covoiturage, pôle santé, Arena, Fil & Reels, sponsors, contrôle parental, admin & vérif. staff |
| **En cours** | 🔄 | Cloud Functions Blaze & Storage, site vitrine aligné produit, IAP store (16 SKU), push géo partenaires (bêta) |
| **À venir** | 📋 | Analyse vidéo frame-by-frame, détection talent mondiale, notifications géo agents, paiements tournois |

**Accès Pro en bêta** — Sans IAP actif, les testeurs Pro sont activés manuellement dans Firestore (`subscription_tier = "pro"`). Voir [docs/PRICING_STRATEGY.md](docs/PRICING_STRATEGY.md).

**Builds mobile** — Profil EAS `preview` avec `EXPO_PUBLIC_V3_SHELL=1` (UI V3). Package : `com.proday.app`.

---

## Architecture technique

Le monorepo regroupe **app mobile Expo**, **site Next.js** et **backend Firebase** — une seule source de vérité Firestore pour les données utilisateur.

```mermaid
flowchart TB
    subgraph Clients
        APP["📱 App mobile\nExpo SDK 54 · RN 0.81"]
        WEB["🌐 Site vitrine\nNext.js · proday75.fr"]
        DEMO["🖥️ Démo navigateur\n/demo — 9 onglets"]
    end

    subgraph Firebase["☁️ Firebase · proday-155b0"]
        AUTH[Firebase Auth]
        FS[(Firestore)]
        ST[Cloud Storage]
        FCM[FCM Push]
        CF[Cloud Functions TS]
    end

    subgraph Functions["functions/src/"]
        BETA[betaWaitlist]
        IAP[subscriptionIap]
        AI[analyzeActivityHighlight]
        GEO[sponsorGeoPush]
        MAIL[authCustomEmails]
    end

    subgraph Externe
        MISTRAL[Mistral IA]
        APIFOOT[API-Football]
        EMAIL[EmailJS]
    end

    APP --> AUTH
    APP --> FS
    APP --> ST
    APP --> FCM
    WEB --> FS
    WEB --> CF
    DEMO --> APP

    CF --> BETA
    CF --> IAP
    CF --> AI
    CF --> GEO
    CF --> MAIL

    AI --> MISTRAL
    WEB --> EMAIL
    APP --> APIFOOT

    FS --> CF
```

**Principes**

- Données **réelles** depuis Firestore — pas de mock en production.
- Règles de sécurité dans `firebase/firestore.rules` et `firebase/storage.rules`.
- Site déployé depuis `website/` (Netlify). App distribuée via EAS Build.
- Diagrammes exportables : `assets/diagrams/`. Doc détaillée : [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## Stack détaillée

| Couche | Technologie | Rôle dans ProDay |
|--------|-------------|------------------|
| **Mobile** | Expo SDK 54 · React Native 0.81 · TypeScript | App iOS / Android / Web — 9 onglets, shells par univers (Homme, Woman, Pro, Sponsor, Admin) |
| **Site vitrine** | Next.js App Router (`website/`) | Marketing, tarifs, bêta waitlist, démo navigateur, pages légales — [21+ routes](website/README.md) |
| **Auth** | Firebase Auth | Email, Apple Sign-In ; sessions sécurisées app + site |
| **Base de données** | Cloud Firestore | Profils, Mercato, matchs, convocations, waitlist bêta, abonnements |
| **Fichiers** | Firebase Storage | Diplômes, highlights vidéo, assets profil |
| **Push** | FCM via Cloud Functions | Relances convocations, alertes Mercato, push géo sponsors (bêta) |
| **Serveur** | Cloud Functions TypeScript | IAP validation, analyse IA, sync activités, emails Auth brandés, waitlist |
| **IA** | Mistral (via CF) | Analyse des highlights de séance enregistrés dans le journal |
| **Paiements** | expo-iap · 16 SKU | Abonnements Joueur Plus, Coach Pro, Agent Elite, etc. — déploiement progressif |
| **Builds store** | EAS Build · `com.proday.app` | TestFlight (preview) et production |
| **Tests** | Jest · Maestro | Unitaires + E2E mobile (`.maestro/`) |
| **CI** | GitHub Actions | Checks, déploiement site |

Configuration Firebase : [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) · Schéma données : [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md)

---

## Structure du monorepo

```
PRODAY/                          Monorepo ProDay (app + site + backend)
├── src/                         App mobile Expo → src/README.md
│   ├── screens/                 Écrans (1 fichier ≈ 1 route)
│   ├── components/              UI par domaine (mercato, matchs, profile…)
│   ├── features/                Modules V3 (home IA, engines)
│   ├── services/                Accès Firebase et APIs externes
│   ├── navigation/              Onglets, shells joueur / sponsor / admin
│   └── theme/                   Tokens Homme / Woman / Pro
├── website/                     Site vitrine Next.js → website/README.md
│   ├── src/app/                 Routes App Router (beta, univers, tarifs…)
│   ├── src/lib/                 content.ts, poles.ts, API bêta
│   └── public/branding/         Logos officiels (source de vérité visuelle)
├── functions/                   Cloud Functions → functions/README.md
├── firebase/                    Règles Firestore / Storage → firebase/README.md
├── docs/                        Documentation → docs/README.md
├── scripts/                     Outils CLI → scripts/README.md
├── assets/                      Branding, diagrammes Mermaid → assets/README.md
├── .maestro/                    Flows E2E mobile → .maestro/README.md
└── e2e/                         Guide tests → e2e/README.md
```

| Dossier | Contenu principal | Quand le consulter |
|---------|-------------------|--------------------|
| `src/` | Toute l'app mobile | Feature mobile, navigation, écrans |
| `website/src/lib/content.ts` | Copy produit site (source marketing) | Textes pôles, tarifs, FAQ |
| `website/src/lib/poles.ts` | Définition des 6 pôles carousel + Sponsor | Navigation site, pricing par pôle |
| `functions/src/` | Logique serveur (IAP, IA, bêta, push) | Backend, webhooks, triggers |
| `firebase/` | Règles sécurité + index Firestore | Permissions, déploiement rules |
| `docs/` | Guides opérateur, architecture, juridique | Bêta, stores, admin |

Carte commentée complète : [docs/STRUCTURE.md](docs/STRUCTURE.md) · Pôles produit : [docs/PRODAY_POLES_ARCHITECTURE.md](docs/PRODAY_POLES_ARCHITECTURE.md)

---

## Démarrage développeur

### Prérequis

| Outil | Version | Pourquoi |
|-------|---------|----------|
| **Node.js** | 20+ | Scripts npm, Next.js, Expo, Cloud Functions |
| **Expo CLI** | via `npx expo` | Dev server, builds, simulateurs |
| **Compte Firebase** | projet `proday-155b0` | Auth, Firestore, Storage — backend partagé app + site |
| **EAS CLI** *(optionnel)* | pour builds store | TestFlight / APK bêta |

### Installation pas à pas

```bash
# 1. Cloner le dépôt
git clone https://github.com/alfredgibeau-ahoussinou/PRODAY.git
cd PRODAY

# 2. Installer les dépendances racine + site
npm install

# 3. Configurer Firebase (obligatoire — sans .env l'app ne se connecte pas)
cp .env.example .env
# → Remplir les clés depuis la console Firebase proday-155b0
```

**Pourquoi `.env` ?** L'app et le site lisent les clés Firebase au build/runtime. Sans elles, Auth et Firestore échouent silencieusement ou au démarrage. Voir [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md).

### Lancer l'app mobile

```bash
npm start            # Menu Expo — QR code avec Expo Go
npm run web          # Expo Web dans le navigateur
npm run ios          # Simulateur iOS (macOS)
npm run android      # Émulateur Android
```

**Pourquoi `npm start` d'abord ?** Expo bundler hot-reload ; le QR code permet de tester sur device physique sans build natif.

### Lancer le site vitrine

```bash
npm run website:dev  # → http://localhost:3000
```

Le site partage la logique produit (`website/src/lib/content.ts`) avec les pages publiques. La démo `/demo` simule l'app sans Firebase complet côté mobile.

### Vérifier que tout est OK

```bash
npm run typecheck    # TypeScript sans erreur
npm test             # Tests Jest
npm run beta:check   # Checklist bêta complète (recommandé avant PR)
```

<details>
<summary>Annexe — comptes test & admin</summary>

```bash
npm run admin:setup              # Compte admin Firestore
npm run test-account:setup       # Compte test générique
npm run partner-account:setup    # Compte sponsor test
npm run firebase:seed            # Données de démo Firestore
```

Voir [docs/ADMIN_SETUP.md](docs/ADMIN_SETUP.md) pour la console admin in-app.

</details>

---

## Scripts & commandes

| Commande | Description |
|----------|-------------|
| `npm start` | Dev server Expo (QR, iOS, Android, web) |
| `npm run website:dev` | Site Next.js en local (:3000) |
| `npm run beta:check` | Checklist bêta (env, tests, règles, légal) |
| `npm run firebase:deploy` | Déploie règles + index Firestore |
| `npm run firebase:deploy:functions` | Déploie Cloud Functions |
| `npm run eas:build:preview` | Build TestFlight / APK interne |
| `npm run typecheck` | Vérification TypeScript |
| `npm test` | Tests Jest unitaires |
| `npm run test:e2e:maestro` | Flows E2E mobile (Maestro) |
| `npm run website:build` | Build production site Next.js |

<details>
<summary>Toutes les commandes npm (Firebase, EAS, docs, branding…)</summary>

| Groupe | Commandes |
|--------|-----------|
| **Dev** | `npm run test:watch`, `npm run web`, `npm run ios`, `npm run android` |
| **Bêta & qualité** | `npm run test:e2e`, `npm run firebase:rules:test`, `npm run test:scale` |
| **Firebase** | `firebase:deploy:storage`, `firebase:health`, `firebase:seed`, `firebase:deploy:check` |
| **EAS** | `eas:build:production`, `eas:submit:production` |
| **Site** | `cd website && npm run netlify:deploy` |
| **Docs & assets** | `docs:legal`, `docs:cv`, `branding:logos`, `docs:pactes` |
| **Comptes** | `admin:setup`, `test-account:setup`, `partner-account:setup` |

Liste complète : `package.json` · [scripts/README.md](scripts/README.md)

</details>

---

## Documentation

| Document | Description en une ligne |
|----------|--------------------------|
| [docs/README.md](docs/README.md) | Index de toute la documentation |
| [docs/STRUCTURE.md](docs/STRUCTURE.md) | Carte commentée du monorepo |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagrammes techniques et flux |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Collections et champs Firestore |
| [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md) | Configuration projet Firebase |
| [docs/BETA_LAUNCH.md](docs/BETA_LAUNCH.md) | Checklist go/no-go lancement bêta |
| [docs/BETA_GUIDE.md](docs/BETA_GUIDE.md) | Guide opérateur bêta (URLs, parcours, env) |
| [docs/PRODAY_POLES_ARCHITECTURE.md](docs/PRODAY_POLES_ARCHITECTURE.md) | Architecture des sept pôles produit |
| [docs/PRICING_STRATEGY.md](docs/PRICING_STRATEGY.md) | Grille tarifaire et IAP |
| [docs/design/DESIGN_SYSTEM.md](docs/design/DESIGN_SYSTEM.md) | Logo, couleurs, composants UI |
| [src/README.md](src/README.md) | Guide navigation app mobile |
| [website/README.md](website/README.md) | Routes site et déploiement |

---

## FAQ rapide

**ProDay remplace-t-il WhatsApp pour mon équipe ?**
ProDay unifie convocations, matchs, Mercato et stats — fini les groupes éparpillés. La messagerie sert aux échanges directs entre profils inscrits.

**L'app est-elle gratuite ?**
Oui — un compte gratuit couvre profil, Pulse, calendrier, Arena en consultation et limites Mercato. Les offres Pro débloquent candidatures illimitées, multi-équipes, etc.

**Comment fonctionne la vérification coach ?**
Diplôme ou licence obligatoire à l'inscription. Badge orange pendant la revue, badge vert après validation admin — messagerie complète débloquée.

**Qu'est-ce que le Pulse ProDay ?**
Score de visibilité combinant profil, stats saison, candidatures et confiance. Plus il monte, plus vous êtes visible des clubs.

**ProDay analyse-t-il chaque action en vidéo ?**
Non. L'analyse IA porte sur les highlights enregistrés dans le journal (miniature vidéo ou image + notes). L'analyse frame-by-frame automatique est une ambition future.

**Comment contribuer ou tester en bêta ?**
Inscrivez-vous sur [proday75.fr/beta/inscription](https://proday75.fr/beta/inscription). Développeurs : clonez le repo, configurez `.env`, lancez `npm run beta:check` avant toute PR.

---

## Contact

[proday75.fr](https://proday75.fr) · [contact@proday.app](mailto:contact@proday.app) · [partenaires@proday.app](mailto:partenaires@proday.app) · [Code source — dépôt **privé**](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [Documentation publique — PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

**ProDay © 2026** — Tous droits réservés · Code propriétaire — reproduction interdite sans autorisation · [LICENSE](./LICENSE) · [SECURITY.md](./SECURITY.md)
