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

Présentent **pourquoi ProDay existe** (infrastructure · centralisation · portes), pas des pôles supplémentaires.

| # | Fichier | Thème | Accroche | Visuel |
|---|---------|-------|----------|--------|
| 8 | `08-objectif-infrastructure.png` | Promesse | Pas un outil de plus. · L’infrastructure de votre football. | Hero lockup brand |
| 9 | `09-objectif-centralisation.png` | Centralisation | Une seule app · Plus de WhatsApp · tableurs · docs | `club/club-outils.jpg` |
| 10 | `10-objectif-portes.png` | Portes | Six portes d’entrée · Un seul écosystème | `player/player-accueil.jpg` |

**Hors scope App Store public** : Admin (cockpit interne).

### Template

- **En-tête** : symbole P + wordmark **PRODAY**, titre, promesse courte
- **Cadre iPhone** : capture simulateur réelle (pôles + 09–10) · **hero lockup** (08)
- **Pied** : tagline + proday75.fr

Les captures UI proviennent de `website/public/images/app/` — mêmes visuels que le site marketing (simulateur iOS, app **1.0.8**). Copy aligné sur `website/src/lib/positioning.ts` et le footer site.

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

- **Branding** : `assets/branding/proday-symbol-white.png` · `proday-lockup-official-source.png` (08)
- **UI app** : `website/public/images/app/` (réf. `website/src/lib/*AppScreens.ts`)

## Upload App Store Connect

1. **App Store Connect** → votre app → **App iOS** → version en préparation
2. **Médias de l’app** → **Captures d’écran pour iPhone** → **6,5"**
3. Glisser-déposer les PNG **dans l’ordre** ci-dessus (01 → 10)
4. Vérifier l’aperçu : aucun bandeau « dimensions incorrectes »

> Ne pas redimensionner manuellement — regénérer via le script si besoin.
