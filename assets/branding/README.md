# Logos ProDay — identité officielle (planche brand)

**1 Master Brand** : symbole P incliné + ballon + trait de frappe, wordmark PRODAY (tracking large), tagline **CONNECTER. PROGRESSER. RÉVÉLER.**

Couleurs master : noir `#000`, blanc `#FFF`, or/champagne `#C5A059` (CTA master).

Génération : `node scripts/generate-app-brand.mjs [chemin-planche.png]`

| Fichier | Usage |
|---------|--------|
| `proday-symbol-white.png` | Symbole seul blanc (UI dark) |
| `proday-symbol-black.png` | Symbole seul noir (UI light) |
| `proday-symbol-mark.png` | Symbole carré transparent |
| `proday-logo-master-white.png` | Symbole + wordmark + tagline blanc |
| `proday-logo-master-black.png` | Lockup master noir |
| `proday-lockup-horizontal-white.png` | Symbole + PRODAY même ligne |
| `proday-lockup-horizontal-black.png` | Lockup horizontal noir |
| `proday-symbol-pole-*.png` | Symboles teintés pôle (player, coach, club, parent, sponsor, events, president, supporter, admin) |
| `proday-app-icon.png` | Icône app (symbole blanc sur noir) |
| `proday-adaptive-foreground.png` | Adaptive Android |
| `proday-splash.png` | Splash noir + logo master |
| `proday-notification-icon.png` | Notification Android |
| `logo-proday-official.png` | Compat Expo / emails (logo master paddé) |
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

Composants app : `ProDaySymbol` · `ProDayWordmark` · `ProDayLogo` (`src/components/branding/`).

Tokens : `src/theme/prodayBrand.ts`.
