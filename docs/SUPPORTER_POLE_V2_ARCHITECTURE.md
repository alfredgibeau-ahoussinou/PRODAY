# Pôle Supporter PRODAY — Architecture V2

> North star : *Le terrain du football amateur + l'expérience supporter du football mondial.*

## Phase 1 (cette session)

### Routes & navigation

| Onglet shell | Label | Écran | Ancien mapping |
|---|---|---|---|
| `home` | Accueil | `SupporterFootballHubScreen` | `SupporterHomeScreen` / Tribune |
| `matchs` | Matchs | `SupporterMatchsScreen` (enhanced) | inchangé |
| **LIVE** (FAB centre) | Live | → chapitre `live` de Matchs | nouveau |
| `feed` | Explorer | `SupporterExplorerScreen` | `SupporterSuivisScreen` |
| `reels` | Vidéos | `SupporterVideosScreen` | overflow `LazyReelsScreen` |
| `profil` | Profil | `SupporterProfileTabScreen` (enhanced) | inchangé |
| overflow `messages` | Fil | `SupporterTribuneFeedScreen` | barre → hub/profil |

### Couche données — `src/services/footballData/`

```
FootballDataProvider (interface)
├── ProDayFootballDataProvider   — teamEvents, tournois, clubs ProDay
├── ExternalFootballDataProvider — wrap externalScoresService
└── FootballDataFacade           — entrée unifiée supporter
```

Méthodes facade : `listLiveFixtures`, `listUpcomingFixtures`, `searchTeams`, `getMatchDetail`, `fetchMatchCenterData`, `listCompetitionsByCountry`.

**Règle** : aucune liste de matchs hardcodée dans l'UI — toujours via providers.

### Vidéo — droits

```
SupporterVideoRights: AVAILABLE | RESTRICTED | PRIVATE | PROCESSING | UNAVAILABLE
SupporterVideoKind: proday_full | proday_highlights | external_legal | community_clip
```

Player affiché uniquement si `rights === AVAILABLE`. ProDay : `public_watch_url` + reels liés. Externe : lien légal uniquement, jamais de scrape.

### Match Center

`SupporterMatchDetailScreen` → tabs dynamiques : Résumé, Live, Stats, Vidéo, Analyse, Moments.
Tabs masqués si pas de données. Stats via `fixtures/statistics` (cache 5 min) ou « Statistique non disponible ».

### Agent IA

`src/agents/supporterAgent/` — stub local, données publiques match uniquement, disclaimer interprétation.

### Community (scaffold)

`SupporterMatchCommunityPanel` — MOTM poll, prédiction score, réactions (local/Firestore stub).

---

## Pièces réutilisables

| Module | Usage V2 |
|---|---|
| `supporterMatchHub.service` + `useSupporterMatchHub` | Hub accueil + matchs |
| `SupporterMatchCard`, `SupporterClubSearch` | Cartes + recherche |
| `externalScoresService` | Monde via ExternalFootballDataProvider |
| `followsService`, `useFollows` | Personnalisation |
| `communityReels.service` | Clips communauté (droits modérés) |
| `SupporterPageFrame`, `supporterHubTheme` | Chrome media center |
| `formationPitch` / `MatchHubLineupTab` | Compos match center |
| `PoleHelpChatbot` | FAQ + accès IA supporter |

## Code à déprécier (ne pas supprimer Phase 1)

| Fichier | Raison |
|---|---|
| `SupporterHomeScreen` + `SupporterHomeDashboard` | Remplacé par Football Hub |
| `supporterNavConfig` 7 items | Modèle conceptuel non câblé — aligner Phase 2 |
| `getSupporterHomeLayout` flags désactivés | Obsolète avec hub V2 |
| Labels « Tribune » dans `supporterPageIdentity` | Migré vers « Centre du football » |

## Écarts vs spec complète

| Domaine | Phase 1 | Phase 2+ |
|---|---|---|
| Replay timeline seek | stub Moments tab | chapitres vidéo |
| Carte geo matches | stub ProDay bridge | géoloc |
| Notifications smart | prefs existantes | règles contextuelles |
| Admin video rights | modèle seulement | panel admin |
| Community Firestore | local stub | collection complète |
| IA post-match auto | stub Analyse | Cloud Function |
| Couverture mondiale | catalog curated + API | expansion pays |

## Tests Phase 1

- `supporterShell.test.ts` — 5 onglets + overflow
- `footballDataFacade.test.ts` — mock provider
- `supporterVideo.service.test.ts` — gate droits
- `supporterMatchCenter.test.ts` — tabs vides masqués
- `supporterFootballHub.test.ts` — section live
