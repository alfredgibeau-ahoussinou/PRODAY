# Assets ProDay

## branding/

Identité officielle (P + ballon, tagline **CONNECTER. PROGRESSER. RÉVÉLER.**).  
Détail et tableau d’usage : [branding/README.md](./branding/README.md).

| Fichier clé | Usage |
|-------------|--------|
| `proday-app-icon.png` | Icône App Store / home / favicon (`app.json`) |
| `proday-splash.png` | Splash Expo |
| `proday-adaptive-foreground.png` | Adaptive Android |
| `proday-notification-icon.png` | Notifications Android |
| `logo-proday-official.png` | Lockup carré (docs, emails, présentation) |
| `logo-light.png` / `logo-dark.png` | PDF / fond clair ou sombre |
| `proday-symbol-*.png` | Symbole UI teinté par pôle |

Régénération : `npm run branding:app` (`scripts/generate-app-brand.mjs`).

## mockups/

Copies des planches UI pour présentation (README, PDF, Figma).

## Code app

- Composants : `src/components/branding/` (`ProDayLogo`, `ProDayOfficialLockup`, `ProDaySymbol`)
- Tokens : `src/theme/prodayBrand.ts`
- Mapping requires : `src/content/brandingAssets.ts`

## GitHub

- Code : https://github.com/alfredgibeau-ahoussinou/PRODAY  
- Docs publiques : https://github.com/alfredgibeau-ahoussinou/PRODAY-docs
