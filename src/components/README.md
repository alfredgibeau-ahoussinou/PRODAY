# Composants (`src/components/`)

**CONNECTER. PROGRESSER. RÉVÉLER.** — ProDay **1.0.9**

Bibliothèque UI React Native réutilisable. Pas d’accès Firebase ici : données via props, hooks ou `services/`.

## Domaines (aperçu)

| Dossier | Usage |
|---------|--------|
| `ui/` · `cards/` | Primitives & cartes |
| `branding/` | Logos lockup / symboles (assets officiels) |
| `shell/` · `app/` · `navigation/` | Chrome app, tab shells |
| `auth/` · `signup/` | Flux connexion / inscription |
| `joueur/` · `football/` · `recruitment/` | Mercato, joueur, foot |
| `club/` | UI club |
| `home/` · `discover/` · `messages/` | Accueil, découverte, messagerie |
| `video/` | Players / reels |
| `training/` · `health/` | Entraînement & santé |
| `geo/` · `carpool/` | Carte / covoiturage |
| `shop/` · `settings/` · `platform/` | Boutique, réglages, plateforme |
| `aurora/` · `appSpace/` | Ambiances / espaces app |
| `motion/` (souvent via `src/motion`) | Transitions, dialogs animés |

Texte : toujours `ProDayText` — titres Inter, `brand` Syne. Icônes via `Icon` (pas d’emojis device).

## Branding

Sources image dans `assets/branding/` (ex. `proday-app-icon.png`, `proday-lockup-official-source.png`, symboles pôles). Ne pas inventer de chemins hors de ce dossier pour le logo officiel.

## Lancer

```bash
npm start
npm run ios:sim
npm test
```

[PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [proday75.fr](https://proday75.fr) · [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

[`../README.md`](../README.md) · [`../screens/README.md`](../screens/README.md) · [`../theme/`](../theme/)
