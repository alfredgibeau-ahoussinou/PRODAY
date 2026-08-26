# Logos ProDay — identité officielle

<div align="center">

<img src="../branding/logo-proday-official.png" alt="ProDay" width="220" />

<br />

**CONNECTER. PROGRESSER. RÉVÉLER.**  
*L’infrastructure de votre football*

</div>

**1 Master Brand** : symbole P incliné + ballon + trait de frappe, wordmark PRODAY (tracking large), tagline officielle ci-dessus.

| | |
|--|--|
| **Couleurs master** | noir `#000` · blanc `#FFF` · or/champagne `#C5A059` |
| **Version app** | **1.0.8** (`app.json`) |
| **Site** | [proday75.fr](https://proday75.fr) |
| **CDN logo** | https://proday75.fr/branding/logo-proday-official.png |
| **GitHub** | [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) (privé) · [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs) (public) |

Régénération app :

```bash
node scripts/generate-app-brand.mjs --lockup [chemin-lockup-officiel.png]
# ou
npm run branding:app
```

Source de vérité lockup : `proday-lockup-official-source.png`.  
Lockup site / emails : généré dans `website/public/branding/` via `npm run branding:official` (préfixe `website/`).

---

## Icône store vs lockup

| Usage | Asset | Contenu |
|-------|--------|---------|
| App Store / home / favicon | `proday-app-icon.png` | Lockup officiel (P + PRODAY + tagline sur charcoal) |
| Adaptive Android | `proday-adaptive-foreground.png` | Marque seule, ~20 % safe padding |
| Notification Android | `proday-notification-icon.png` | Marque blanche transparente |
| Splash Expo / iOS | `proday-splash.png` | Lockup centré sur `#000` |
| Auth / brand in-app | `ProDayOfficialLockup` / `ProDayLogo` | Composé natif — **pas** le PNG carré store |
| UI petite | `proday-symbol-*.png` / `ProDaySymbol` | Marque teintée par porte |

| Fichier | Usage |
|---------|--------|
| `proday-lockup-official-source.png` | Source lockup |
| `proday-symbol-master-source.png` | Crop marque |
| `proday-symbol-white.png` / `*-black.png` / `*-mark.png` | Symbole UI |
| `proday-logo-master-white.png` / `*-black.png` | Lockup badge |
| `proday-lockup-horizontal-*.png` | Compat horizontal |
| `proday-symbol-pole-*.png` | Accents par porte |
| `proday-app-icon.png` · `proday-splash.png` · `proday-adaptive-foreground.png` | Store / splash |
| `logo-proday-official.png` | Docs, emails, README — peut être le badge carré ; le site publie le lockup horizontal |

---

## Accents par porte

Runtime (source code) : `src/theme/prodayBrand.ts`.

| Porte / rôle | Hex (tokens app) |
|--------------|------------------|
| Master / CTA | `#C5A059` |
| Joueur | `#FFFFFF` |
| Coach / Président | `#C5A059` |
| Club | `#10B981` |
| Parent | `#8CC63F` |
| Supporter | `#06B6D4` |
| Sponsor | `#92278F` |
| Événements | `#F7941D` |
| Admin | `#A3A3A3` |

Six portes produit : **Joueur · Club · Coach · Parent · Supporter · Sponsor** — pas huit apps séparées.

Composants : `ProDaySymbol` · `ProDayWordmark` · `ProDayLogo` · `ProDayOfficialLockup` (`src/components/branding/`).
