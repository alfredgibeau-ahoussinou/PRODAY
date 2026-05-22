---
title: "ProDay — Brief produit"
subtitle: "Document pour l'équipe et les partenaires"
author: "ProDay © 2026"
date: "Mai 2026"
lang: fr
documentclass: article
geometry: margin=2.2cm
colorlinks: true
linkcolor: "003399"
---

# ProDay — Connecter · Progresser · Réussir

**ProDay** est une application mobile (React Native / Expo) qui relie joueurs, coachs, agents, clubs, organisateurs et sponsors sur un écosystème football. Les données vivent dans **Firebase** (comptes réels, pas de données fictives en production).

## Navigation — 5 onglets

| Onglet | Rôle | Fonctions |
|--------|------|-----------|
| **Accueil** | Hub | Statistiques Firestore, modules Arena & Sponsors |
| **Recherche** | Recrutement | Joueurs, clubs, coachs, annonces, contact |
| **Matchs** | Amicaux | Proposer, chercher, **accepter** un match |
| **Messagerie** | Contact | Conversations entre profils inscrits |
| **Profil** | Compte | Inscription, stats saison, club, vérification |

## Sécurité : profils contrôlés

Pour les **coachs** et **agents** :

1. Choix du rôle à l'inscription.
2. Envoi obligatoire d'un **diplôme** ou **licence** (PDF / image).
3. Badge orange « Vérification en cours » — messagerie limitée.
4. Validation manuelle par un administrateur.
5. Badge vert — accès complet.

## Documents & exports PDF

| Fichier | Export PDF |
|---------|------------|
| `docs/design/mockups/index.html` | Bouton *Exporter maquettes PDF* (impression navigateur) |
| `docs/design/ProDay_Brief.html` | Brief produit mis en page |
| `npm run docs:cv` | CV joueur HTML → Imprimer → PDF |

## Stack technique

- **Mobile :** React Native, Expo 52
- **Backend :** Firebase Auth, Firestore, Storage
- **Design :** `designTokens.ts`, logo `assets/branding/`

## Roadmap

### Mois 1
- Identité visuelle, maquettes, pilote recrutement + validation profils, clubs testeurs.

### Mois 2–3
- Tournoi local (inscriptions et suivi sur l'app).

### Mois 4
- Premier sponsor local.

## Documents associés

| Fichier | Public |
|---------|--------|
| `docs/ARCHITECTURE.md` | Développeurs |
| `docs/design/FIGMA_BRIEF.md` | Design |
| `docs/design/ProDay_Brief.html` | Brief HTML/PDF |
| `docs/ProDay_Brief_NonDev.pdf` | Brief PDF (pandoc) |

## Contact

Dépôt : **https://github.com/alfredgibeau-ahoussinou/PRODAY**
