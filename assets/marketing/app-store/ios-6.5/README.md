# Captures App Store · iPhone 6,5" (iOS)

Identité : **PRODAY** · **CONNECTER. PROGRESSER. RÉVÉLER.** · [proday75.fr](https://proday75.fr)  
App documentée : **1.0.9**

## Dimensions

| Format | Portrait | Paysage |
|--------|----------|---------|
| Prioritaire (14 / 13 / 12 Pro Max) | **1284 × 2778 px** | 2778 × 1284 px |
| Legacy (11 Pro Max / XS Max) | 1242 × 2688 px | 2688 × 1242 px |

PNG de ce dossier : **1284 × 2778 px** (portrait).

App Store Connect → Médias de l’app → Captures d’écran → iPhone 6,5".

## Fichiers (10 captures · 7 pôles + 3 objectif)

### Pôles (01–07)

Cadre iPhone + capture simulateur.

| # | Fichier | Pôle | Accroche |
|---|---------|------|----------|
| 1 | `01-pole-joueur.png` | Joueur | Profil, stats et carrière en ligne |
| 2 | `02-pole-coach.png` | Coach | Pilotez votre staff et vos séances |
| 3 | `03-pole-club.png` | Club | Équipes, licenciés et recrutement |
| 4 | `04-pole-president.png` | Président | Le club en un coup d’œil |
| 5 | `05-pole-parent.png` | Parent | Accompagnez sans étouffer |
| 6 | `06-pole-supporter.png` | Supporter | Matchs, scores et favoris |
| 7 | `07-pole-sponsor.png` | Sponsor | Visibilité clubs et marques |

Admin (cockpit interne) : hors scope App Store public.

### Objectif (08–10)

Texte + branding uniquement. Pas de cadre téléphone, pas de screenshot UI.

| # | Fichier | Thème | Accroche |
|---|---------|-------|----------|
| 8 | `08-objectif-infrastructure.png` | Infrastructure | Pas un outil de plus. L’infrastructure de votre football. |
| 9 | `09-objectif-centralisation.png` | Centralisation | Tout au même endroit. |
| 10 | `10-objectif-portes.png` | Portes | Six portes d’entrée. Un seul écosystème. |

## Ordre recommandé en premier

1. `01-pole-joueur.png`  
2. `02-pole-coach.png`  
3. `03-pole-club.png`  

Puis Président · Parent · Supporter · Sponsor · objectif 08–10.

## Régénérer

```bash
npm run marketing:app-store-ios
npm run marketing:app-store-ios:legacy   # 1242 × 2688
```

Script : `scripts/generate-app-store-screenshots.mjs`  
Sources UI : `website/public/images/app/` · branding : `assets/branding/`

## Upload

1. App Store Connect → version iOS en préparation  
2. Médias → Captures iPhone 6,5"  
3. Déposer les PNG dans l’ordre 01 → 10  
4. Ne pas redimensionner manuellement · regénérer via le script
