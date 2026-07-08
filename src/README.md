# Application mobile ProDay (`src/`)

> Code source React Native / Expo. Point d'entrée : `index.js` (racine) → navigation dans `src/navigation/`.

## Rôle

Toute l'app mobile : joueurs, staff, sponsors, admin. Données **réelles** Firestore (pas de mock en prod).

## Structure

| Dossier | Rôle | README |
|---------|------|--------|
| `screens/` | Écrans (routes navigation) | [screens/README.md](./screens/README.md) |
| `components/` | UI réutilisable par domaine | [components/README.md](./components/README.md) |
| `features/` | Modules V3 (home IA, engines) | [features/README.md](./features/README.md) |
| `core/` | Logique métier pure (sans UI) | [core/README.md](./core/README.md) |
| `services/` | Firebase, APIs, IAP | [services/README.md](./services/README.md) |
| `navigation/` | Onglets, shells, routing | [navigation/README.md](./navigation/README.md) |
| `hooks/` | Hooks React partagés | — |
| `context/` | Providers (auth, thème, segment joueur) | — |
| `theme/` | Tokens design Homme / Woman / Pro | — |
| `models/` | Types TypeScript domaine | — |
| `content/` | Textes produit, chapitres, légal embarqué | — |
| `utils/` | Helpers (géo, PDF, pricing…) | — |
| `i18n/` | Traductions (`messages/`) | — |
| `config/` | Feature flags, constantes env | — |
| `__tests__/` | Tests Jest | [../e2e/README.md](../e2e/README.md) |

## Guides

- Navigation détaillée : [STRUCTURE.md](./STRUCTURE.md)
- Carte monorepo : [../docs/STRUCTURE.md](../docs/STRUCTURE.md)
- Architecture : [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md)
- Schéma données : [../docs/DATABASE_SCHEMA.md](../docs/DATABASE_SCHEMA.md)

## Lancer

```bash
npm install
npm run web          # Expo Web
npm start            # Expo Go (QR)
npm run ios          # Simulateur iOS
npm run android      # Émulateur Android
```

## V3 vs legacy

Flag `EXPO_PUBLIC_V3_SHELL=1` active le shell V3 (`V3TabShell`, `features/v3/`). Détail : [STRUCTURE.md](./STRUCTURE.md).
