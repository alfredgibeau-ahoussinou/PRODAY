---
title: "ProDay — Brief produit"
subtitle: "Document pour l'équipe et les partenaires"
author: "ProDay © 2026"
date: "Août 2026"
lang: fr
---

# ProDay — Connecter. Progresser. Révéler.

**ProDay** est l’infrastructure mobile du football amateur et semi-pro (React Native / Expo, version **1.0.8**). Six portes d’entrée — Joueur, Club, Coach, Parent, Supporter, Sponsor — vers le **même** graphe de données. Site : [proday75.fr](https://proday75.fr).

## Positionnement

Pas un outil de plus. Notion organise, Discord discute — ProDay **orchestre** les objets métier du football (convocations, matchs, effectifs, stats, parents, sponsors).

## Six portes d’entrée

| Porte | Rôle |
|-------|------|
| **Joueur** | Progression, saison, Pulse, Mercato |
| **Club** | Équipes, licenciés, tournois |
| **Coach** | Forme, tactique, convocations |
| **Parent** | Agenda, messages, trajets |
| **Supporter** | Scores, compositions, tribune |
| **Sponsor** | Activations, impact |

Agent, recruteur, organisateur et santé restent des **rôles intégrés**.

## Sécurité : profils contrôlés

Pour les rôles à responsabilité (coach, agent, club, sponsor…) :

1. Choix du rôle à l'inscription.
2. Envoi d'un diplôme / licence si requis.
3. Badge « vérification en cours » — accès limité.
4. Validation admin.
5. Badge vérifié — accès complet.

## Stack

- **Mobile :** Expo SDK 54 · React Native · TypeScript — `com.proday.app`
- **Site :** Next.js (`website/`) — [proday75.fr](https://proday75.fr)
- **Backend :** Firebase Auth, Firestore, Storage, Cloud Functions
- **Identité :** `assets/branding/` · lockup horizontal site `website/public/branding/logo-proday-official.png`

## Contact

- Site : https://proday75.fr  
- Email : proday.admin@gmail.com  
- Dépôt privé : https://github.com/alfredgibeau-ahoussinou/PRODAY  
- Doc publique : https://github.com/alfredgibeau-ahoussinou/PRODAY-docs
