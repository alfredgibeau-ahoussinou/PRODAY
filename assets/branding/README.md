# Logos ProDay · identité officielle

<div align="center">

<img src="logo-proday-official.png" alt="ProDay" width="220" />

<br />

**CONNECTER. PROGRESSER. RÉVÉLER.**  
*L’infrastructure de votre football*

</div>

**Master brand** : symbole P (ballon + trait de frappe) · wordmark PRODAY · tagline ci-dessus.

| | |
|--|--|
| Couleurs master | noir `#000` · blanc `#FFF` · or `#C5A059` |
| Version app | **1.0.9** (`app.json`) |
| Site | [proday75.fr](https://proday75.fr) |
| CDN logo | https://proday75.fr/branding/logo-proday-official.png |
| GitHub | [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) (privé) · [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs) (public) |

## Régénération

```bash
node scripts/generate-app-brand.mjs --lockup [chemin-lockup-officiel.png]
# ou
npm run branding:app
```

Source lockup : `proday-lockup-official-source.png`.  
Lockup site / emails : `website/public/branding/` via `npm run branding:official` (préfixe `website/`).

---

## Icône store vs lockup

| Usage | Asset | Contenu |
|-------|--------|---------|
| App Store / home / favicon | `proday-app-icon.png` | Lockup sur charcoal |
| Adaptive Android | `proday-adaptive-foreground.png` | Marque · safe padding ~20 % |
| Notification Android | `proday-notification-icon.png` | Marque blanche transparente |
| Splash Expo / iOS | `proday-splash.png` | Lockup centré sur `#000` |
| Auth / brand in-app | composants `ProDayOfficialLockup` / `ProDayLogo` | Composé natif (pas le PNG store) |
| UI petite | `proday-symbol-*.png` / `ProDaySymbol` | Marque teintée par porte |

| Fichier | Usage |
|---------|--------|
| `proday-lockup-official-source.png` | Source lockup |
| `proday-symbol-master-source.png` | Crop marque |
| `proday-symbol-white.png` / `*-black.png` / `*-mark.png` | Symbole UI |
| `proday-logo-master-white.png` / `*-black.png` | Lockup badge |
| `proday-lockup-horizontal-*.png` | Compat horizontal |
| `proday-symbol-pole-*.png` | Accents par porte |
| `logo-proday-official.png` · `logo-proday-lockup-*.png` | Docs, emails, README |

---

## Accents par porte

Tokens runtime : `src/theme/prodayBrand.ts`.

| Porte / rôle | Hex |
|--------------|-----|
| Master / CTA | `#C5A059` |
| Joueur | `#FFFFFF` |
| Coach / Président | `#C5A059` |
| Club | `#10B981` |
| Parent | `#8CC63F` |
| Supporter | `#06B6D4` |
| Sponsor | `#92278F` |
| Événements | `#F7941D` |
| Admin | `#A3A3A3` |

Six portes produit : **Joueur · Club · Coach · Parent · Supporter · Sponsor**.  
Pas des apps séparées.

Composants app : `ProDaySymbol` · `ProDayWordmark` · `ProDayLogo` · `ProDayOfficialLockup` (`src/components/branding/`).
