# Captures App Store — iPhone 6,5" (iOS)

Identité : **PRODAY** · **CONNECTER. PROGRESSER. RÉVÉLER.** · [proday75.fr](https://proday75.fr)

## Dimensions

| Format | Portrait | Paysage |
|--------|----------|---------|
| **Prioritaire** (14 / 13 / 12 Pro Max) | **1284 × 2778 px** | 2778 × 1284 px |
| Legacy (11 Pro Max / XS Max) | 1242 × 2688 px | 2688 × 1242 px |

Tous les PNG de ce dossier font **1284 × 2778 px** (portrait).

App Store Connect → **Médias de l’app** → **Captures d’écran** → **iPhone 6,5"**.

## Fichiers (10 captures — 7 pôles + 3 objectif)

### Pôles (01–07)

Cadre iPhone + capture simulateur réelle.

| # | Fichier | Pôle | Accroche | Écran réel (v1.0.8) |
|---|---------|------|----------|----------------------|
| 1 | `01-pole-joueur.png` | Joueur | Profil, stats et carrière en ligne | `player/player-profil.jpg` |
| 2 | `02-pole-coach.png` | Coach | Pilotez votre staff et vos séances | `coach/coach-profil.jpg` |
| 3 | `03-pole-club.png` | Club | Équipes, licenciés et recrutement | `club/club-equipes.jpg` |
| 4 | `04-pole-president.png` | Président | Le club en un coup d’œil | `executive/executive-cockpit.jpg` |
| 5 | `05-pole-parent.png` | Parent | Accompagnez sans étouffer | `parent/parent-menu.jpg` |
| 6 | `06-pole-supporter.png` | Supporter | Suivez matchs, scores et favoris | `supporter/supporter-accueil.jpg` |
| 7 | `07-pole-sponsor.png` | Sponsor | Visibilité clubs et marques | `sponsor/sponsor-prospects.jpg` |

\* **Supporter** : capture simulateur du shell réel (dock cyan · Accueil · Matchs · Compét. · Clubs · Vidéos · Profil). Regénérer la source : `npm run marketing:capture-supporter`.

### Objectif / pourquoi ProDay (08–10)

Texte + branding (symbole P · wordmark · lockup). **Pas de cadre téléphone**, **pas de screenshot app** — uniquement le but de ProDay.

| # | Fichier | Thème | Accroche |
|---|---------|-------|----------|
| 8 | `08-objectif-infrastructure.png` | Infrastructure | Pas un outil de plus. · L’infrastructure de votre football. |
| 9 | `09-objectif-centralisation.png` | Centralisation | Tout au même endroit. · Ce que la centralisation change. |
| 10 | `10-objectif-portes.png` | Portes | Six portes d’entrée. · Un seul écosystème. |

**Hors scope App Store public** : Admin (cockpit interne).

### Template

- **Pôles (01–07)** : symbole P + wordmark **PRODAY**, titre, promesse courte · cadre iPhone + UI · pied tagline + proday75.fr
- **Objectif (08–10)** : même en-tête / pied · copy multi-lignes qui explique le but · lockup brand au centre · **aucune UI app**

Les captures UI (pôles) proviennent de `website/public/images/app/` — mêmes visuels que le site marketing (simulateur iOS, app **1.0.8**). Copy aligné sur `website/src/lib/positioning.ts` et le footer site.

## 3 captures recommandées en premier

1. **`01-pole-joueur.png`** — porte d’entrée principale
2. **`02-pole-coach.png`** — staff & séances
3. **`03-pole-club.png`** — cœur écosystème club

Ensuite : Président, Parent, Supporter, Sponsor, puis les 3 objectif (08–10) pour raconter le *pourquoi*.

> Ordre 01–10 conservé pour ne pas casser la séquence pôles déjà en fiche. Les objectif restent en fin de galerie.

## Regénérer

```bash
# 1284 × 2778 (défaut — recommandé)
npm run marketing:app-store-ios

# 1242 × 2688 (legacy 11 Pro Max / XS Max)
npm run marketing:app-store-ios:legacy
```

Script : [`scripts/generate-app-store-screenshots.mjs`](../../../../scripts/generate-app-store-screenshots.mjs)

Sources :

- **Branding** : `assets/branding/proday-symbol-white.png` · `proday-lockup-official-source.png` (08–10)
- **UI app** (pôles uniquement) : `website/public/images/app/` (réf. `website/src/lib/*AppScreens.ts`)

## Upload App Store Connect

1. **App Store Connect** → votre app → **App iOS** → version en préparation
2. **Médias de l’app** → **Captures d’écran pour iPhone** → **6,5"**
3. Glisser-déposer les PNG **dans l’ordre** ci-dessus (01 → 10)
4. Vérifier l’aperçu : aucun bandeau « dimensions incorrectes »

> Ne pas redimensionner manuellement — regénérer via le script si besoin.
