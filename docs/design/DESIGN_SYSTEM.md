# Design System ProDay

> Basé sur les maquettes officielles (`assets/branding/`, `assets/mockups/`)

## Logo

| Fichier | Usage |
|---------|--------|
| `assets/branding/logo-light.png` | Fond clair (splash, onboarding, PDF) |
| `assets/branding/logo-dark.png` | Fond sombre (écran auth, marketing) |
| `src/components/Logo.tsx` | Composant React Native |

**Éléments de marque :**
- Lettre **P** en dégradé bleu cyan → navy + silhouette coureur
- Wordmark **Pro** (navy) + **Day** (bleu vif), typo inclinée
- Tagline : **CONNECTER • PROGRESSER • RÉUSSIR**

## Palette (UI claire — mockups recrutement / matchs)

| Token | Hex | Usage |
|-------|-----|--------|
| `brand` / `bluePrimary` | `#003399` | CTA, boutons pleins, onglet actif |
| `blueBright` | `#2563EB` | Accents secondaires |
| `navy` | `#0F172A` | Titres, « Pro » |
| `background` | `#F1F5F9` | Fond écran |
| `surface` | `#FFFFFF` | Cartes |
| `success` | `#16A34A` | Vérifié, Disponible |
| `warning` | `#EA580C` | En cours de validation |

Code : `src/theme/designTokens.ts`

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
