# Captures App Store · iPad 13" (iOS)

Identité : **PRODAY** · **CONNECTER. PROGRESSER. RÉVÉLER.** · [proday75.fr](https://proday75.fr)  
App documentée : **1.0.9**

Répond à l’exigence ASC : capture adaptée aux iPad 13 pouces.

## Dimensions

| Format | Portrait | Paysage |
|--------|----------|---------|
| Prioritaire (iPad Pro / Air 13") | **2064 × 2752 px** | 2752 × 2064 px |
| Legacy (iPad Pro 12,9" 2ᵉ gén.) | 2048 × 2732 px | 2732 × 2048 px |

PNG de ce dossier : **2064 × 2752 px** (portrait).

App Store Connect → Médias → Captures iPad → 13 pouces.

Apple peut redimensionner vers les classes iPad plus petites si aucun set dédié n’est uploadé.

## Fichiers (10 captures · 7 pôles + 3 objectif)

Même ordre et copy que [`../ios-6.5/`](../ios-6.5/).

### Pôles (01–07)

Cadre tablette + UI simulateur (mêmes sources que l’iPhone).

| # | Fichier | Pôle |
|---|---------|------|
| 1–7 | `01-pole-joueur.png` … `07-pole-sponsor.png` | Joueur · Coach · Club · Président · Parent · Supporter · Sponsor |

### Objectif (08–10)

Branding + texte. Pas de cadre tablette, pas de screenshot UI.

| # | Fichier |
|---|---------|
| 8–10 | `08-objectif-infrastructure.png` · `09-objectif-centralisation.png` · `10-objectif-portes.png` |

## Régénérer

```bash
npm run marketing:app-store-ipad
```

Script partagé avec les autres sets sous `scripts/`.  
Branding : `assets/branding/` · UI : `website/public/images/app/`
