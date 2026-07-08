# ProDay — Connecter · Progresser · Réussir

> Plateforme mobile : recrutement (**Mercato**), tournois (**Arena**), matchs amicaux (**Matchs**) et sponsoring (**Sponsors**) pour l'écosystème football amateur et semi-pro.

**Dépôt GitHub :** [alfredgibeau-ahoussinou/PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY)

---

## Pour les collègues non-développeurs

| Document | Description |
|----------|-------------|
| [docs/design/ProDay_Brief.html](docs/design/ProDay_Brief.html) | Brief produit (export PDF via le navigateur) |
| [docs/PRODAY_Restant_et_Ameliorations.pdf](docs/PRODAY_Restant_et_Ameliorations.pdf) | Guide associés — reste à faire, tarifs, roadmap (`npm run docs:guide-restant`) |
| [docs/legal/pactes/](docs/legal/pactes/) | Pactes d'associés (4 exemplaires, `npm run docs:pactes`) |
| [docs/design/mockups/index.html](docs/design/mockups/index.html) | Maquettes interactives + export PDF |
| [docs/design/DESIGN_SYSTEM.md](docs/design/DESIGN_SYSTEM.md) | Logo, couleurs, navigation, composants |
| [docs/design/FIGMA_BRIEF.md](docs/design/FIGMA_BRIEF.md) | Reprise des maquettes PNG dans Figma |
| [assets/branding/](assets/branding/) | Logo light/dark + planches UI |
| [docs/CONVENTION_SPONSOR.md](docs/CONVENTION_SPONSOR.md) | Modèle de convention partenariat magasin / club |

| Commande | Action |
|----------|--------|
| `npm run docs:open-mockups` | Ouvrir les maquettes HTML |
| `npm run docs:open-brief` | Ouvrir le brief HTML |
| `npm run docs:guide-restant` | Générer le guide associés PDF |
| `npm run docs:pactes` | Générer les 4 pactes PDF |
| `npm run docs:pdf` | Générer le brief PDF depuis le Markdown (pandoc) |
| `npm run docs:cv` | Générer un CV joueur HTML (exemple) |

---

## Site vitrine (Next.js)

Site multi-pages interactif (**20 routes**) : univers **Man** (`/homme`), **Woman** (`/woman`), **Pro** (`/pro`), démo 7 onglets, Live Stats, CV, quiz, tarifs, shop, FAQ, beta, etc.

```bash
npm run website:dev
```

→ [http://localhost:3000](http://localhost:3000) — liste complète dans [website/README.md](website/README.md).

Démo navigateur (sans installer l’app) : [localhost:3000/demo](http://localhost:3000/demo) — sélecteur Man / Woman / Pro, 7 onglets comme sur mobile.

---

## Lancer l’app mobile (Expo)

```bash
npm install
npm run web          # navigateur — Expo Web
npm start            # menu Expo (QR code avec Expo Go)
npm run ios          # simulateur iOS
npm run android      # émulateur Android
```

Navigation principale : Accueil, Mercato, Matchs, Covoiturage, Santé, Feed, Messages, Profil (+ Shop). Modules secondaires : Arena, Sponsors.

---

## Pour les développeurs

| Document | Description |
|----------|-------------|
| [docs/STRUCTURE.md](docs/STRUCTURE.md) | Carte du dépôt (arborescence commentée) |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | Diagrammes Mermaid (architecture, validation, données) |
| [docs/DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | Schéma Firestore |
| [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) | Cloud Functions & services |
| [assets/diagrams/](assets/diagrams/) | Sources `.mmd` exportables (GitHub, Notion, etc.) |

### Stack

- **Mobile :** React Native / Flutter (MVP FlutterFlow possible)
- **Backend :** Firebase Auth, Firestore, Storage, FCM
- **Données :** statistiques et listes **réelles** depuis Firestore (pas de mock) — voir [docs/FIREBASE_SETUP.md](docs/FIREBASE_SETUP.md)
- **Logique serveur :** Cloud Functions (`functions/src/index.ts`)
- **Sécurité :** `firebase/firestore.rules` — `is_verified` modifiable admin uniquement

### Structure

Carte complète du dépôt : **[docs/STRUCTURE.md](docs/STRUCTURE.md)** — chaque dossier majeur a son `README.md`.

```
PRODAY/
├── src/                     # App mobile Expo → src/README.md
├── website/                 # Site vitrine Next.js → website/README.md
├── functions/               # Cloud Functions → functions/README.md
├── firebase/                # Règles Firestore / Storage → firebase/README.md
├── docs/                    # Documentation → docs/README.md
├── scripts/                 # Outils CLI → scripts/README.md
├── assets/                  # Branding, diagrammes → assets/README.md
├── .maestro/                # E2E Maestro → .maestro/README.md
└── e2e/                     # Guide tests → e2e/README.md
```

### Validation des profils (point clé Yoan)

Les coachs et agents **ne sont pas auto-validés** à la création :

```
Inscription → Upload diplôme/licence → PENDING → Admin → VERIFIED
```

- Badge orange : *Vérification en cours*
- Messagerie et contact joueurs : **bloqués** tant que `is_verified !== true`
- Implémentation : `src/services/profile.service.ts`, `src/screens/AuthScreen.tsx`

---

## Roadmap

| Phase | Objectif |
|-------|----------|
| Mois 1 | Figma + Firebase + Mercato + lock validation |
| Mois 2–3 | Pilote tournoi local (Arena + live score) |
| Mois 4 | Premier sponsor + marketplace |

---

## Licence

Propriétaire — ProDay © 2026. Tous droits réservés.
