# Design System ProDay

> Basé sur les maquettes officielles (`assets/branding/`, `assets/mockups/`)

## Logo

Identité officielle : **P + ballon + trait de frappe**, wordmark PRODAY, or `#C5A059`.  
Source de vérité : `assets/branding/proday-lockup-official-source.png` — détail : [`assets/branding/README.md`](../../assets/branding/README.md).

| Fichier | Usage |
|---------|--------|
| `assets/branding/proday-app-icon.png` | Icône store / home / favicon Expo |
| `assets/branding/proday-splash.png` | Splash Expo / iOS |
| `assets/branding/logo-proday-official.png` | Lockup carré (docs, emails, présentation) |
| `assets/branding/logo-light.png` / `logo-dark.png` | PDF, fond clair / sombre |
| `src/components/branding/` | `ProDayLogo`, `ProDayOfficialLockup`, `ProDaySymbol` |

**Éléments de marque :**
- Symbole **P** blanc + ballon + traits de vitesse (plus de coureur bleu legacy)
- Wordmark **PRODAY** tracking large
- Tagline : **CONNECTER. PROGRESSER. RÉVÉLER.**

## Palette master (app)

| Token | Hex | Usage |
|-------|-----|--------|
| Or / CTA master | `#C5A059` | CTA, accents master |
| Noir | `#000000` | Fonds splash / adaptive |
| Blanc | `#FFFFFF` | Symbole, wordmark |
| Surface | `#141414` | Surfaces dark |

Code : `src/theme/prodayBrand.ts` (+ `designTokens.ts` pour l’UI).

## Navigation (maquettes)

Barre basse **5 onglets** :

1. **Accueil**
2. **Recrutement** (joueurs, clubs, annonces)
3. **Matchs amicaux**
4. **Messages**
5. **Profil**

> Arena & Sponsors (roadmap Yoan) : accessibles depuis l’accueil ou une V2 — voir `src/navigation/MainTabs.tsx`.

## Écrans de référence

| Mockup | Fichier |
|--------|---------|
| Recrutement + Matchs amicaux | `assets/mockups/mockup-recrutement-matchs.png` |
| Coachs, agents, vérification diplômes, contrôle parental | `assets/mockups/mockup-coach-verification.png` |

### Module Recrutement
- Accueil : recherche, cartes Joueurs / Clubs, annonces populaires, FAB « + Créer une annonce »
- Liste joueurs : chips Poste / Niveau / Localisation → `PlayersListScreen.tsx`
- Profil joueur : stats, galerie, **Contacter** / favoris → `PlayerProfileScreen.tsx`
- Liste coachs/agents : toggle Coachs · Agents → `CoachesListScreen.tsx`
- Profil coach/agent : onglets Profil / Expérience / Diplômes / Avis, **Contacter** / **Engager** → `CoachProfileScreen.tsx`

### Module Matchs amicaux
- Accueil : Proposer / Rechercher un match, matchs à venir (badges statut)
- Formulaire proposition : club, date, lieu, niveau (Loisir / Compétition / Mixte)

### Vérification diplômes
- Timeline : Document reçu → Authenticité → Établissement → Résultat
- Badge **Vérifié** vert sur profils coach/agent

### Contrôle parental (V2)
- Contacts approuvés / en attente, limite de temps, rapport d’activité

## Composants UI

| Composant | Fichier |
|-----------|---------|
| Logo | `src/components/Logo.tsx` |
| Carte profil | `src/components/ProfileCard.tsx` |
| Badge vérification | `src/components/VerificationBadge.tsx` |
| Carte tournoi / match | `TournamentCard`, `MatchCard` |

## Typographie

- Police : **Inter** (ou SF Pro sur iOS)
- Titres écran : 22–28 pt, bold
- Corps : 15 pt
- Chips filtres : 11–12 pt

## Rayons & ombres

- Cartes : `borderRadius: 12–16`, ombre légère (`designTokens.shadows.card`)
- Bouton principal : plein bleu, radius 12, ombre FAB pour le « + »

## Documents HTML / PDF

| Ressource | Chemin | Export PDF |
|-----------|--------|------------|
| Maquettes app | `docs/design/mockups/index.html` | Bouton « Exporter maquettes PDF » |
| Brief produit | `docs/design/ProDay_Brief.html` | Bouton « Exporter en PDF » |
| CV joueur | `src/utils/pdfGenerator.ts` + `npm run docs:cv` | Impression navigateur (A4) |

Le logo officiel (`logo-light.png`) est utilisé dans tous les exports HTML.
