# Captures App Store · Mac (paysage)

Identité : **PRODAY** · **CONNECTER. PROGRESSER. RÉVÉLER.** · [proday75.fr](https://proday75.fr)  
App documentée : **1.0.9**

Répond à l’exigence ASC Mac (aperçus / captures landscape).

## Transparence

**ProDay n’est pas une application Mac native.** L’app est Expo / React Native (iOS / Android). Ces PNG sont des **compositions marketing** :

- **01–07** : fenêtre Mac large + shell desktop (sidebar type Coach/Club). Pas un screenshot Catalyst / AppKit.
- **08–10** : texte objectif + branding uniquement. Aucune UI app.

Ne pas les présenter comme captures d’une app Mac native.

## Dimensions

| Format ASC Mac | Paysage |
|----------------|---------|
| Prioritaire (ce dossier) | **2880 × 1800 px** |
| Legacy optionnel | 2560 × 1600 px |
| Autres acceptés ASC | 1440 × 900 · 1280 × 800 |

PNG générés ici : **2880 × 1800 px**.

App Store Connect → plateforme Mac → Médias → Captures d’écran.

## Fichiers (10 captures)

Même ordre et copy que [`../ios-6.5/`](../ios-6.5/) et [`../ipad-13/`](../ipad-13/).

| # | Type | Fichiers |
|---|------|----------|
| 01–07 | Pôles (composition desktop) | `01-pole-joueur.png` … `07-pole-sponsor.png` |
| 08–10 | Objectif (branding seul) | `08-objectif-*.png` … `10-objectif-*.png` |

## Régénérer

```bash
npm run marketing:app-store-mac
```

Sources : `assets/branding/` · `website/public/images/app/`
