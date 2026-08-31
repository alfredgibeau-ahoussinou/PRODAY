# Design System ProDay

> Source de vérité visuelle : `assets/branding/` (app) · `website/public/branding/` (site).  
> Génération site : `cd website && npm run branding:official`.

## Logo & identité

| Fichier | Usage |
|---------|--------|
| `assets/branding/proday-lockup-official-source.png` | Lockup master app (carré store / splash) |
| `assets/branding/proday-symbol-white.png` / `…-black.png` | Symbole seul (UI) |
| `assets/branding/proday-app-icon.png` | Icône App Store / home |
| `website/public/branding/logo-proday-official.png` | Lockup **horizontal** OG / emails / README (637×172) |
| `website/public/branding/logo-proday-mark-*.png` | Symboles teintés par porte |
| `website/public/favicon.ico` + `icons/icon-*.png` | Favicon / PWA |

**Éléments de marque :**

- Symbole **P** incliné + ballon + trait de frappe
- Wordmark **PRODAY** (tracking large)
- Tagline : **CONNECTER. PROGRESSER. RÉVÉLER.**
- Positionnement site : *L'infrastructure de votre football*

**Ne pas** confondre le badge carré store (`logo-proday-official.png` dans `assets/` peut être le lockup carré) avec le lockup **horizontal** servi sur proday75.fr.

## Palette master

| Token | Hex | Usage |
|-------|-----|--------|
| Noir | `#000000` | Fonds, splash |
| Blanc | `#FFFFFF` | Texte / symbole sur dark |
| Or / champagne | `#C5A059` | CTA master |
| Joueur | `#FFFFFF` | Accent porte |
| Coach / Président | `#C5A059` / `#E8B923` | Accent |
| Club | `#00ADEF` / `#2563EB` | Accent |
| Parent | `#8CC63F` / `#84CC16` | Accent |
| Supporter | `#06B6D4` / `#8B5CF6` | Accent |
| Sponsor | `#EF4444` | Accent |
| Événements | `#F7941D` | Rôle intégré |
| Admin | `#A3A3A3` | Console |

Tokens app : `src/theme/prodayBrand.ts`. Couleurs site : `website/src/lib/brandColors.ts`.

## Portes d’entrée (vitrine)

Joueur · Club · Coach · Parent · Supporter · Sponsor — **six portes**, un écosystème.  
Agent, recruteur, organisateur, santé = rôles intégrés (pas des produits séparés).

## Typographie (site)

Polices runtime via `<link>` + variables CSS dans `website/src/app/layout.tsx` / `globals.css` — **pas** `next/font` Google Fonts (Turbopack).

## Documents HTML / PDF

| Ressource | Chemin |
|-----------|--------|
| Brief produit | `docs/design/ProDay_Brief.html` |
| CV joueur | `npm run docs:cv` |
| Logo emails | `https://proday75.fr/branding/logo-proday-official.png` |

Composants site : `ProdayMark`, `ProdayNavLogo`, `ProdayLockup` (`website/src/components/branding/`).  
Composants app : `ProDaySymbol`, `ProDayWordmark`, `ProDayLogo`, `ProDayOfficialLockup`.
