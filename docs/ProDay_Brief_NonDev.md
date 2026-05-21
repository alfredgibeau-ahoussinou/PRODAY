---
title: "ProDay — Brief produit"
subtitle: "Document pour l'équipe non technique"
author: "ProDay © 2026"
date: "Mai 2026"
lang: fr
---

# ProDay — Connecter · Progresser · Réussir

**ProDay** est une application mobile qui relie joueurs, coachs, agents, clubs, organisateurs de tournois et sponsors locaux sur un même écosystème.

## Les 4 onglets

| Onglet | Nom | À quoi ça sert |
|--------|-----|----------------|
| 1 | **Mercato** | Recrutement : annonces clubs, candidatures joueurs avec CV PDF |
| 2 | **Arena** | Tournois : calendrier, inscriptions, live score, trophées |
| 3 | **Matchs** | Matchs amicaux : carte des clubs qui cherchent un adversaire |
| 4 | **Sponsors** | Partenariats locaux et financement participatif des clubs |

## Sécurité : profils contrôlés

Pour les **coachs** et **agents**, le profil ne devient pas actif automatiquement :

1. L'utilisateur choisit son rôle à l'inscription.
2. Il doit envoyer une photo de **diplôme** ou de **carte professionnelle**.
3. Son profil affiche **« Vérification en cours »** (badge orange).
4. Un administrateur valide manuellement le document.
5. Après validation (badge vert), il peut contacter les joueurs et utiliser toutes les fonctions.

**Protection légale :** un profil non validé ne peut pas envoyer de messages directs aux mineurs.

## Stack technique (résumé)

- **Mobile :** Flutter / FlutterFlow
- **Backend :** Firebase (Auth, Firestore, Storage, notifications)
- **Coût démarrage :** gratuit ou faible jusqu'à montée en charge

## Roadmap opérationnelle

### Mois 1
- Nom, logo, maquettes Figma
- Prototype Mercato + validation profils
- Démarchage de 3 clubs pilotes

### Mois 2–3
- Pilote sur un tournoi local (inscriptions + classement buteurs sur l'app)

### Mois 4
- Premier sponsor (magasin de sport : réduction membres en échange de visibilité app)

## Documents associés

| Fichier | Public |
|---------|--------|
| `docs/ARCHITECTURE.md` | Développeurs — diagrammes |
| `docs/design/FIGMA_BRIEF.md` | Designer — écrans à maquetter |
| `docs/ProDay_Brief_NonDev.pdf` | Ce document en PDF |

## Contact projet

Dépôt GitHub : **https://github.com/alfredgibeau-ahoussinou/PRODAY**
