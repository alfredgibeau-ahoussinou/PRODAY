# Captures App Store — iPhone 6,5" (iOS)

Identité : **PRODAY** · **CONNECTER. PROGRESSER. RÉVÉLER.** · [proday75.fr](https://proday75.fr)

## Dimensions

| Format | Portrait | Paysage |
|--------|----------|---------|
| **Prioritaire** (14 / 13 / 12 Pro Max) | **1284 × 2778 px** | 2778 × 1284 px |
| Legacy (11 Pro Max / XS Max) | 1242 × 2688 px | 2688 × 1242 px |

Tous les PNG de ce dossier font **1284 × 2778 px** (portrait).

App Store Connect → **Médias de l’app** → **Captures d’écran** → **iPhone 6,5"**.

## Fichiers (7 captures — 1 par pôle)

| # | Fichier | Pôle | Accroche | Écran réel (v1.0.8) |
|---|---------|------|----------|----------------------|
| 1 | `01-pole-joueur.png` | Joueur | Profil, stats et carrière en ligne | `player/player-profil.jpg` |
| 2 | `02-pole-coach.png` | Coach | Pilotez votre staff et vos séances | `coach/coach-profil.jpg` |
| 3 | `03-pole-club.png` | Club | Équipes, licenciés et recrutement | `club/club-equipes.jpg` |
| 4 | `04-pole-president.png` | Président | Le club en un coup d’œil | `executive/executive-cockpit.jpg` |
| 5 | `05-pole-parent.png` | Parent | Accompagnez sans étouffer | `parent/parent-accueil.jpg` |
| 6 | `06-pole-supporter.png` | Supporter | Suivez matchs, scores et favoris | `player/player-matchs.jpg` * |
| 7 | `07-pole-sponsor.png` | Sponsor | Visibilité clubs et marques | `sponsor/sponsor-accueil.jpg` |

\* **Supporter** : UI Centre Match en attendant une capture simulateur dédiée au pôle Supporter (scaffold en cours).

**Hors scope App Store public** : Admin (cockpit interne).

### Template

- **En-tête** : symbole P + wordmark **PRODAY**, nom du pôle, promesse courte
- **Cadre iPhone** : capture simulateur réelle (pas de stock Unsplash)
- **Pied** : tagline + proday75.fr

Les captures proviennent de `website/public/images/app/` — mêmes visuels que le site marketing (simulateur iOS, app **1.0.8**).

## 3 captures recommandées en premier

1. **`01-pole-joueur.png`** — porte d’entrée principale
2. **`02-pole-coach.png`** — staff & séances
3. **`03-pole-club.png`** — cœur écosystème club

Ensuite : Président, Parent, Supporter, Sponsor.

## Regénérer

```bash
# 1284 × 2778 (défaut — recommandé)
npm run marketing:app-store-ios

# 1242 × 2688 (legacy 11 Pro Max / XS Max)
npm run marketing:app-store-ios:legacy
```

Script : [`scripts/generate-app-store-screenshots.mjs`](../../../../scripts/generate-app-store-screenshots.mjs)

Sources :

- **Branding** : `assets/branding/proday-symbol-white.png`
- **UI app** : `website/public/images/app/` (réf. `website/src/lib/*AppScreens.ts`)

## Upload App Store Connect

1. **App Store Connect** → votre app → **App iOS** → version en préparation
2. **Médias de l’app** → **Captures d’écran pour iPhone** → **6,5"**
3. Glisser-déposer les PNG **dans l’ordre** ci-dessus (01 → 07)
4. Vérifier l’aperçu : aucun bandeau « dimensions incorrectes »

> Ne pas redimensionner manuellement — regénérer via le script si besoin.
