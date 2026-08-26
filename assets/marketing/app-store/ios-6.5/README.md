# Captures App Store — iPhone 6,5" (iOS)

Identité : **CONNECTER. PROGRESSER. RÉVÉLER.** · [proday75.fr](https://proday75.fr)

## Dimensions

| Format | Portrait | Paysage |
|--------|----------|---------|
| **Prioritaire** (14 / 13 / 12 Pro Max) | **1284 × 2778 px** | 2778 × 1284 px |
| Legacy (11 Pro Max / XS Max) | 1242 × 2688 px | 2688 × 1242 px |

Tous les PNG de ce dossier font **1284 × 2778 px** (portrait).

App Store Connect → **Médias de l’app** → **Captures d’écran** → **iPhone 6,5"**.

## Fichiers (10 captures)

| # | Fichier | Contenu | Rôle |
|---|---------|---------|------|
| 1 | `01-hero-brand.png` | Lockup + tagline officielle | Marque |
| 2 | `02-joueur-profil-carriere.png` | Profil, score carrière, stats | Joueur |
| 3 | `03-joueur-mercato.png` | Annonces Mercato | Joueur |
| 4 | `04-joueur-arena.png` | Arena & tournois | Joueur |
| 5 | `05-joueur-pulse-activites.png` | Journal d’activités / Pulse | Joueur |
| 6 | `06-coach-profil-staff.png` | Espace coach & staff | Coach |
| 7 | `07-club-recrutement.png` | Recrutement & convocations | Club |
| 8 | `08-matchs-amicaux.png` | Matchs amicaux & RSVP | Joueur |
| 9 | `09-communaute-reels.png` | Fil & Reels | Joueur |
| 10 | `10-partenaires-sponsors.png` | Sponsors & visibilité | Partenaires |

## 3 captures recommandées en premier

Si App Store Connect n’en accepte que quelques-unes ou pour un premier upload :

1. **`01-hero-brand.png`** — identité ProDay (obligatoire pour la cohérence store)
2. **`02-joueur-profil-carriere.png`** — valeur cœur joueur (profil & carrière)
3. **`03-joueur-mercato.png`** — différenciateur Mercato / recrutement

Ensuite : `06-coach-profil-staff.png`, `07-club-recrutement.png`, puis le reste.

## Aperçus app (optionnel, max 3)

Les aperçus vidéo ne sont **pas** générés ici. Pour un aperçu :

- Enregistrer 15–30 s sur simulateur **iPhone 15 Pro Max** (6,7") ou appareil 6,5"
- Ou réutiliser `assets/intro/proday-intro.mp4` (1080×1920) — recadrer si besoin

## Regénérer

```bash
# 1284 × 2778 (défaut — recommandé)
npm run marketing:app-store-ios

# 1242 × 2688 (legacy 11 Pro Max / XS Max)
npm run marketing:app-store-ios:legacy
```

Script : [`scripts/generate-app-store-screenshots.mjs`](../../../../scripts/generate-app-store-screenshots.mjs)

Sources visuelles : `assets/generated/classic/`, `assets/mockups/`, `assets/branding/`.

## Upload App Store Connect

1. **App Store Connect** → votre app → **App iOS** → version en préparation
2. **Médias de l’app** → **Captures d’écran pour iPhone** → **6,5"**
3. Glisser-déposer les PNG **dans l’ordre** ci-dessus (01 → 10)
4. Vérifier l’aperçu : aucun bandeau « dimensions incorrectes »

> Ne pas redimensionner manuellement dans Preview/Figma — regénérer via le script si besoin.
