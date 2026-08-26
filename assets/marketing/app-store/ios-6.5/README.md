# Captures App Store — iPhone 6,5" (iOS)

Identité : **PRODAY** · **CONNECTER. PROGRESSER. RÉVÉLER.** · [proday75.fr](https://proday75.fr)

## Dimensions

| Format | Portrait | Paysage |
|--------|----------|---------|
| **Prioritaire** (14 / 13 / 12 Pro Max) | **1284 × 2778 px** | 2778 × 1284 px |
| Legacy (11 Pro Max / XS Max) | 1242 × 2688 px | 2688 × 1242 px |

Tous les PNG de ce dossier font **1284 × 2778 px** (portrait).

App Store Connect → **Médias de l’app** → **Captures d’écran** → **iPhone 6,5"**.

## Fichiers (10 captures)

| # | Fichier | Accroche | Écran réel (v1.0.8) |
|---|---------|----------|----------------------|
| 1 | `01-hero-brand.png` | Lockup officiel + tagline | Marque (pas de téléphone) |
| 2 | `02-joueur-profil-carriere.png` | Profil & carrière | `player/player-profil.jpg` |
| 3 | `03-joueur-mercato.png` | Mercato ciblé | `player/player-menu.jpg` (modules Équipe / Mercato) |
| 4 | `04-joueur-arena.png` | Arena & tournois | `player/player-matchs.jpg` |
| 5 | `05-joueur-pulse-activites.png` | Journal d’activités | `player/player-saison.jpg` |
| 6 | `06-coach-profil-staff.png` | Espace Coach | `coach/coach-profil.jpg` |
| 7 | `07-club-recrutement.png` | Espace Club | `club/club-equipes.jpg` |
| 8 | `08-matchs-amicaux.png` | Matchs amicaux | `club/club-matchs.jpg` |
| 9 | `09-communaute-reels.png` | Communauté & Reels | `player/player-accueil.jpg` |
| 10 | `10-partenaires-sponsors.png` | Partenaires & sponsors | `sponsor/sponsor-accueil.jpg` |

### Template (captures 02–10)

- **En-tête** : symbole P + wordmark **PRODAY**, titre fort, sous-titre accent, ligne de contexte
- **Cadre iPhone** : capture simulateur réelle (pas de stock Unsplash)
- **Pied** : tagline + proday75.fr

Les captures proviennent de `website/public/images/app/` — mêmes visuels que le site marketing (simulateur iOS, app **1.0.8**).

## 3 captures recommandées en premier

1. **`01-hero-brand.png`** — identité ProDay
2. **`02-joueur-profil-carriere.png`** — profil & carrière joueur
3. **`03-joueur-mercato.png`** — Mercato / recrutement

Ensuite : `06-coach-profil-staff.png`, `07-club-recrutement.png`, puis le reste.

## Regénérer

```bash
# 1284 × 2778 (défaut — recommandé)
npm run marketing:app-store-ios

# 1242 × 2688 (legacy 11 Pro Max / XS Max)
npm run marketing:app-store-ios:legacy
```

Script : [`scripts/generate-app-store-screenshots.mjs`](../../../../scripts/generate-app-store-screenshots.mjs)

Sources :

- **Branding** : `assets/branding/proday-symbol-white.png`, `proday-lockup-official-source.png`
- **UI app** : `website/public/images/app/` (réf. `website/src/lib/*AppScreens.ts`)

## Upload App Store Connect

1. **App Store Connect** → votre app → **App iOS** → version en préparation
2. **Médias de l’app** → **Captures d’écran pour iPhone** → **6,5"**
3. Glisser-déposer les PNG **dans l’ordre** ci-dessus (01 → 10)
4. Vérifier l’aperçu : aucun bandeau « dimensions incorrectes »

> Ne pas redimensionner manuellement — regénérer via le script si besoin.
