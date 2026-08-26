# Assets ProDay (app Expo)

**CONNECTER. PROGRESSER. RÉVÉLER.**

Assets consommés par l’app mobile (icônes store, splash, lockups, mockups, showcase). Version app courante : **1.0.8**.

## branding/

Identité officielle — symbole **P + ballon**, wordmark PRODAY, tagline.  
Guide complet : [branding/README.md](./branding/README.md).

| Fichier clé | Usage |
|-------------|--------|
| `proday-app-icon.png` | Icône App Store / home / favicon (`app.json`) |
| `proday-splash.png` | Splash Expo |
| `proday-adaptive-foreground.png` | Adaptive Android |
| `proday-notification-icon.png` | Notifications Android |
| `logo-proday-official.png` | Lockup carré (docs, emails, présentation) |
| `logo-light.png` / `logo-dark.png` | PDF / fond clair ou sombre |
| `proday-symbol-*.png` | Symbole UI teinté par pôle |

Régénération depuis le lockup source :

```bash
npm run branding:app
```

## mockups/

Planches UI de référence (présentation, PDF, Figma) — [mockups/README.md](./mockups/README.md).

## generated/

Visuels showcase Discover / Arena (classique + Woman) — [generated/README.md](./generated/README.md).

## marketing/

Visuels promo hors store (stories sociales, etc.) — [marketing/social/README.md](./marketing/social/README.md).

## Code app

| | |
|---|---|
| Composants | `src/components/branding/` (`ProDayLogo`, `ProDayOfficialLockup`, `ProDaySymbol`) |
| Tokens | `src/theme/prodayBrand.ts` |
| Requires | `src/content/brandingAssets.ts` |

## Liens

- Code : [github.com/alfredgibeau-ahoussinou/PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY)
- Docs publiques : [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)
- Site : [proday75.fr](https://proday75.fr)
