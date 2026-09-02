# Assets ProDay (`assets/`)

Identité visuelle, marketing stores / réseaux, vidéo d’intro et maquettes.  
**CONNECTER. PROGRESSER. RÉVÉLER.** · app **1.0.9** · [proday75.fr](https://proday75.fr)

## Organisation

```
assets/
├── branding/              Logos et icônes officiels (source de vérité)
├── intro/                 Vidéo Motion verticale + musique
├── marketing/
│   ├── app-store/         Captures iPhone · iPad · Mac (compositions)
│   ├── instagram_stories/ Stories 9:16
│   └── social/            Stories promo (merci, mercato…)
├── mockups/               Planches UI présentation / Figma
├── generated/             Showcase Discover / Arena (local)
└── diagrams/              Schémas éventuels
```

## Branding

Voir [`branding/README.md`](./branding/README.md).

Fichiers clés :

- `branding/logo-proday-official.png` · lockups noir / blanc  
- `branding/proday-app-icon.png` · splash · adaptive · notification  
- CDN public : https://proday75.fr/branding/logo-proday-official.png

## Intro vidéo

`intro/proday-intro.mp4` (vertical 1080×1920). Régénération éventuelle via scripts Python sous `scripts/` (voir scripts du monorepo).

## Marketing

| Dossier | README |
|---------|--------|
| Stories sociales | [`marketing/social/README.md`](./marketing/social/README.md) |
| App Store iPhone 6,5" | [`marketing/app-store/ios-6.5/README.md`](./marketing/app-store/ios-6.5/README.md) |
| App Store iPad 13" | [`marketing/app-store/ipad-13/README.md`](./marketing/app-store/ipad-13/README.md) |
| App Store Mac | [`marketing/app-store/mac/README.md`](./marketing/app-store/mac/README.md) |

## Palette (référence)

| Nom | Hex | Usage |
|-----|-----|--------|
| Noir | `#000000` | Fond app / splash |
| Blanc | `#FFFFFF` | Contraste |
| Or master | `#C5A059` | Logo, CTA prestige |
| Fond site (nuit) | `#07100C` | Marketing web |
| Or vif site | `#F5D04A` | Accents site |

Accents par porte : voir `branding/README.md` et tokens app (`src/theme/`).

## Liens

- [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) (privé)  
- [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs) (public)
