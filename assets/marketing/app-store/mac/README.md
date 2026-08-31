# Captures App Store — Mac (paysage)

Identité : **PRODAY** · **CONNECTER. PROGRESSER. RÉVÉLER.** · [proday75.fr](https://proday75.fr)

Répond à l’exigence App Store Connect Mac : *« Faites glisser jusqu’à 3 aperçus d’app et 10 captures d’écran ici »* — formats landscape acceptés.

## Transparence (important)

**ProDay n’est pas une application Mac native.** L’app est Expo / React Native (iOS / Android) ; un usage desktop large / web peut exister, mais ces PNG sont des **compositions marketing** :

- **01–07** : fenêtre Mac large + **shell desktop** (sidebar type Coach/Club + colonnes UI simulateur) — **pas** d’iPhone centré / letterbox dans la fenêtre
- **08–10** : texte objectif + branding uniquement — **aucune UI app**, aucun cadre fenêtre

Ne pas présenter ces captures comme des screenshots d’une app Mac Catalyst / AppKit native.

## Dimensions

| Format ASC Mac | Paysage |
|----------------|---------|
| **Prioritaire (ce dossier)** | **2880 × 1800 px** (Retina haute) |
| Legacy optionnel | 2560 × 1600 px |
| Autres acceptés ASC | 1440 × 900 · 1280 × 800 |

Tous les PNG générés ici font **2880 × 1800 px** (paysage).

App Store Connect → plateforme **Mac** → **Médias de l’app** → **Captures d’écran**.

## Fichiers (10 captures — 7 pôles + 3 objectif)

Même ordre et même copy que les sets [`../ios-6.5/`](../ios-6.5/) et [`../ipad-13/`](../ipad-13/).

### Pôles (01–07)

Layout **desktop PC** : barre de titre Mac · sidebar (nav pôle) · toolbar · split-view master/détail (captures simulateur, status/dock mobile retirés) — **pas** d’iPhone letterboxé.

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

Texte + branding (symbole P · wordmark · lockup). **Pas de fenêtre Mac**, **pas de screenshot app**. Composition landscape soignée.

| # | Fichier | Thème | Accroche |
|---|---------|-------|----------|
| 8 | `08-objectif-infrastructure.png` | Infrastructure | Pas un outil de plus. · L’infrastructure de votre football. |
| 9 | `09-objectif-centralisation.png` | Centralisation | Tout au même endroit. · Ce que la centralisation change. |
| 10 | `10-objectif-portes.png` | Portes | Six portes d’entrée. · Un seul écosystème. |

**Hors scope App Store public** : Admin (cockpit interne).

### Template

- **Pôles (01–07)** : symbole P + wordmark **PRODAY**, titre, promesse · fenêtre large + shell desktop (sidebar + UI) · pied tagline + proday75.fr
- **Objectif (08–10)** : même en-tête / pied · copy multi-lignes · lockup brand · **aucune UI app**

Sources UI : `website/public/images/app/` (simulateur iOS, app **1.0.8**).

## 3 captures recommandées en premier

1. **`01-pole-joueur.png`**
2. **`02-pole-coach.png`**
3. **`03-pole-club.png`**

Puis Président → Parent → Supporter → Sponsor → objectif 08–10.

> Les « jusqu’à 3 aperçus d’app » (App Previews vidéo) sont hors scope de ce dossier — uniquement des captures PNG.

## Regénérer

```bash
# 2880 × 1800 (défaut — recommandé ASC Mac)
npm run marketing:app-store-mac

# 2560 × 1600 (legacy optionnel)
npm run marketing:app-store-mac:legacy
```

Script : [`scripts/generate-app-store-screenshots.mjs`](../../../../scripts/generate-app-store-screenshots.mjs) (`--mac`).

## Upload App Store Connect

1. **App Store Connect** → votre app → plateforme **Mac** → version en préparation
2. **Médias de l’app** → zone *« Faites glisser jusqu’à 3 aperçus d’app et 10 captures d’écran ici »*
3. Glisser-déposer les PNG **dans l’ordre** 01 → 10 (max 10 captures)
4. Vérifier : **2880 × 1800** accepté ; aucun bandeau « dimensions incorrectes »

> Ne pas redimensionner manuellement — regénérer via le script si besoin.
> Ne pas uploader le set iPhone (portrait 1284×2778) ni iPad dans le slot Mac.
