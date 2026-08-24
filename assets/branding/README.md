# Logos ProDay — identité officielle (planche brand)

**1 Master Brand** : symbole P incliné + ballon + trait de frappe, wordmark PRODAY (tracking large), tagline **CONNECTER. PROGRESSER. RÉVÉLER.**

Couleurs master : noir `#000`, blanc `#FFF`, or/champagne `#C5A059` (CTA master).

Génération :

```bash
node scripts/generate-app-brand.mjs --lockup [chemin-lockup-officiel.png]
```

## Icône store vs lockup

| Usage | Asset | Contenu |
|-------|--------|---------|
| App Store / home screen / favicon | `proday-app-icon.png` | **Marque seule** (P + ballon) sur `#000` — le wordmark/tagline serait illisible en petit |
| Adaptive Android foreground | `proday-adaptive-foreground.png` | Marque centrée, ~20 % safe padding, fond transparent ; bg `#000` |
| Notification Android | `proday-notification-icon.png` | Marque blanche transparente |
| Splash Expo / iOS | `proday-splash.png` | **Lockup complet** (P + PRODAY + tagline or) sur `#000` |
| Splash Android 12 (cercle) | `drawable-*/splashscreen_logo.png` | Marque seule (le cercle clipperait le texte) |
| Auth / logo officiel | `logo-proday-official.png`, `proday-logo-master-white.png` | Lockup officiel carré |
| UI in-app (petits formats) | `proday-symbol-*.png` | Marque extraite, teintée par pôle |

| Fichier | Usage |
|---------|--------|
| `proday-lockup-official-source.png` | Source de vérité lockup (copie du PNG fourni) |
| `proday-symbol-master-source.png` | Crop marque extrait du lockup |
| `proday-symbol-white.png` | Symbole seul blanc (UI dark) |
| `proday-symbol-black.png` | Symbole seul noir (UI light) |
| `proday-symbol-mark.png` | Symbole carré transparent |
| `proday-logo-master-white.png` | Lockup officiel |
| `proday-logo-master-black.png` | Même lockup (badge sombre) |
| `proday-lockup-horizontal-white.png` | Symbole (compat horizontal) |
| `proday-lockup-horizontal-black.png` | Symbole noir |
| `proday-symbol-pole-*.png` | Symboles teintés pôle |
| `proday-app-icon.png` | Icône app |
| `proday-adaptive-foreground.png` | Adaptive Android |
| `proday-splash.png` | Splash |
| `proday-notification-icon.png` | Notification Android |
| `logo-proday-official.png` | Compat Expo / emails |
| `logo-mark-transparent.png` | Filigrane = symbole master |

## Accents pôle (planche)

| Pôle | Hex |
|------|-----|
| Master / CTA | `#C5A059` |
| Joueurs | `#FFFFFF` |
| Coachs / Président | `#C5A059` |
| Clubs | `#00ADEF` |
| Parents | `#8CC63F` |
| Recruteurs (sponsor) | `#92278F` |
| Événements | `#F7941D` |
| Supporter | `#06B6D4` |
| Admin | `#A3A3A3` |
| Santé | master |

Composants app : `ProDaySymbol` · `ProDayWordmark` · `ProDayLogo` · `ProDayOfficialLockup` (`src/components/branding/`).

Tokens : `src/theme/prodayBrand.ts`.
