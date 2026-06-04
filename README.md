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

## Lancer la démo (voir l’app)

```bash
cd /Users/gibeau--ahoussinou/PRODAY
npm install
npm run web
```

Le navigateur s’ouvre avec ProDay (5 onglets : Accueil, Recrutement, Matchs, Messages, Profil).

Autres commandes :
- `npm start` — menu Expo (QR code téléphone avec app Expo Go)
- `npm run ios` / `npm run android` — simulateur

---

## Pour les développeurs

| Document | Description |
|----------|-------------|
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

```
PRODAY/
├── docs/                    # Architecture, brief, Figma, PDF
├── src/
│   ├── models/              # User, Club, Tournament, …
│   ├── services/            # auth, profile, tournament, notification
│   ├── screens/             # 4 onglets + Auth
│   ├── components/          # ProfileCard, VerificationBadge, …
│   ├── navigation/          # MainTabs (4 icônes)
│   └── utils/               # géofencing, PDF CV
├── firebase/                # firestore.rules
├── functions/               # Cloud Functions TypeScript
└── assets/diagrams/         # Mermaid
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
