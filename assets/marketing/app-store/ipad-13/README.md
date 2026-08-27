# Captures App Store — iPad 13" (iOS)

Identité : **PRODAY** · **CONNECTER. PROGRESSER. RÉVÉLER.** · [proday75.fr](https://proday75.fr)

Répond à l’exigence App Store Connect : *« Veuillez charger une capture d’écran adaptée aux iPad munis d’un écran de 13 pouces »*.

## Dimensions

| Format | Portrait | Paysage |
|--------|----------|---------|
| **Prioritaire** (iPad Pro 13" / Air 13" — classe 13") | **2064 × 2752 px** | 2752 × 2064 px |
| Legacy (iPad Pro 12,9" 2ᵉ gén.) | 2048 × 2732 px | 2732 × 2048 px |

Tous les PNG de ce dossier font **2064 × 2752 px** (portrait).

App Store Connect → **Médias de l’app** → **Captures d’écran pour iPad** → **13 pouces** (ou libellé équivalent « iPad 13" »).

> Apple redimensionne automatiquement ce set vers les classes iPad plus petites si vous n’uploadez pas de tailles dédiées (11", etc.).

## Fichiers (10 captures — 7 pôles + 3 objectif)

### Pôles (01–07)

Cadre **tablette** + capture UI (mêmes sources simulateur que le set iPhone).

| # | Fichier | Pôle | Accroche |
|---|---------|------|----------|
| 1 | `01-pole-joueur.png` | Joueur | Profil, stats et carrière en ligne |
| 2 | `02-pole-coach.png` | Coach | Pilotez votre staff et vos séances |
| 3 | `03-pole-club.png` | Club | Équipes, licenciés et recrutement |
| 4 | `04-pole-president.png` | Président | Le club en un coup d’œil |
| 5 | `05-pole-parent.png` | Parent | Accompagnez sans étouffer |
| 6 | `06-pole-supporter.png` | Supporter | Suivez matchs, scores et favoris |
| 7 | `07-pole-sponsor.png` | Sponsor | Visibilité clubs et marques |

### Objectif / pourquoi ProDay (08–10)

Texte + branding (symbole P · wordmark · lockup). **Pas de cadre tablette**, **pas de screenshot app**.

| # | Fichier | Thème | Accroche |
|---|---------|-------|----------|
| 8 | `08-objectif-infrastructure.png` | Infrastructure | Pas un outil de plus. · L’infrastructure de votre football. |
| 9 | `09-objectif-centralisation.png` | Centralisation | Tout au même endroit. · Ce que la centralisation change. |
| 10 | `10-objectif-portes.png` | Portes | Six portes d’entrée. · Un seul écosystème. |

**Hors scope App Store public** : Admin (cockpit interne).

### Template

- **Pôles (01–07)** : symbole P + wordmark **PRODAY**, titre, promesse courte · cadre iPad + UI · pied tagline + proday75.fr
- **Objectif (08–10)** : même en-tête / pied · copy multi-lignes · lockup brand au centre · **aucune UI app**

Sources UI : `website/public/images/app/` (simulateur iOS, app **1.0.8**) — aligné sur le set [`../ios-6.5/`](../ios-6.5/).

## 3 captures recommandées en premier

1. **`01-pole-joueur.png`**
2. **`02-pole-coach.png`**
3. **`03-pole-club.png`**

Puis Président → Parent → Supporter → Sponsor → objectif 08–10.

## Regénérer

```bash
# 2064 × 2752 (défaut — requis ASC « iPad 13 pouces »)
npm run marketing:app-store-ipad

# 2048 × 2732 (legacy 12,9" — optionnel)
npm run marketing:app-store-ipad:legacy
```

Script : [`scripts/generate-app-store-screenshots.mjs`](../../../../scripts/generate-app-store-screenshots.mjs) (`--ipad`).

## Upload App Store Connect

1. **App Store Connect** → votre app → **App iOS** → version en préparation
2. **Médias de l’app** → **Captures d’écran pour iPad** → slot **13 pouces** / **13"**
3. Glisser-déposer les PNG **dans l’ordre** 01 → 10
4. Vérifier l’aperçu : aucun bandeau « dimensions incorrectes »

> Ne pas redimensionner manuellement — regénérer via le script si besoin.
> Ne pas uploader le set iPhone (1284×2778) dans le slot iPad.
