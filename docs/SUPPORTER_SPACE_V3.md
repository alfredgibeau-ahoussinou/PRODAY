/**
 * Supporter Space V3 — architecture football (Sportmonks + ProDay).
 *
 * ## API choisie
 * **Sportmonks Soccer API v3** (https://www.sportmonks.com / docs.sportmonks.com/v3)
 *
 * Pourquoi :
 * - Free / freemium avec fixtures, livescores, lineups, events, statistics, teams, leagues, standings
 * - Base REST claire : `https://api.sportmonks.com/v3/football`
 * - Auth `api_token` — proxy Cloud Function recommandé pour garder la clé serveur
 * - Remplace API-Football (api-sports.io) et football-data.org pour le **nouveau** stack Supporter
 *
 * Fallback calendrier uniquement (non branché en Phase 1) : TheSportsDB — pas pour lineups.
 *
 * ## Endpoints utilisés
 * | Méthode façade | Endpoint Sportmonks |
 * |---|---|
 * | getLive | `GET /livescores/inplay?include=participants;scores;periods;events;league.country;round` (`LIVE_INPLAY_INCLUDES`) |
 * | getFixtures / upcoming / finished | `GET /fixtures/between/{from}/{to}` + `FIXTURE_LIST_INCLUDES` |
 * | getMatch / lineups / events / stats | `GET /fixtures/{id}` + `FIXTURE_DETAIL_INCLUDES` |
 *   `participants;scores;state;league;venue;events;lineups.player;lineups.details;lineups.xGLineup;formations;statistics.type;xGFixture` |
 * | getTeams | `GET /teams/search/{query}` |
 * | getTeam | `GET /teams/{id}` |
 * | getCompetitions | `GET /leagues?include=country` |
 * | search competitions | `GET /leagues/search/{query}` |
 * | getStandings | `GET /standings/seasons/{seasonId}` |
 *
 * ## Token
 * 1. Compte Sportmonks → API token
 * 2. **Préféré (serveur)** : `SPORTMONKS_API_TOKEN` ou `FOOTBALL_API_KEY` dans `functions/.env.<projectId>`
 *    puis déployer `supporterFootballProxy`
 * 3. **Dev local (client)** : `EXPO_PUBLIC_SPORTMONKS_API_TOKEN` dans `.env` (jamais committer)
 * 4. **Démo** : uniquement si `EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO=1` → matches `source: 'demo'`
 *    (jamais mélangés silencieusement avec du live Sportmonks ; sans token → Ligues vides + ProDay)
 * 5. **Ligues préférées** (optionnel) : `EXPO_PUBLIC_SPORTMONKS_PREFERRED_LEAGUES=301,8,564,…`
 *    (défaut : Ligue 1, PL, Liga, Serie A, Bundesliga, C1, C3). Fetch `filters=fixtureLeagues:{id}`
 *    seulement pour les IDs **inclus dans l’abonnement**.
 *
 * ### Couverture Free Plan (août 2025+)
 * Le Free Plan Sportmonks ne couvre **que** Superliga (DK, `271`) et Premiership (Écosse, `501`).
 * **Ligue 1 (`301`) n’est pas accessible** tant qu’un plan payant n’ajoute pas cette ligue
 * (Starter 5 ligues / Growth 30 / Pro 120 / Enterprise). L’app affiche les matchs du plan
 * (ex. Premiership) et un bandeau honnête si Ligue 1 / top ligues manquent — jamais de faux L1.
 *
 * Anciennes clés `EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY` / `EXPO_PUBLIC_FOOTBALL_DATA_TOKEN`
 * restent pour d’autres modules legacy — **non utilisées** par Supporter Space V3.
 *
 * ## Navigation mobile
 * Accueil · Matchs · ProDay · Clubs · Profil
 * (`home` · `matchs` · `feed` · `plus` · `profil`)
 *
 * Desktop (Phase 2) : sidebar Accueil / Matchs / ProDay / Mes clubs / Explorer.
 *
 * ## Dossiers
 * - `src/features/supporterSpace/` — thème + composants
 * - `src/screens/supporterSpace/` — pages
 * - `src/services/supporterFootball/` — provider Sportmonks + ProDay + merge UnifiedMatch
 * - `src/hooks/supporterFootball/`
 * - `functions/src/supporterFootballProxy.ts`
 *
 * ## Suppressions Phase 0
 * - `src/screens/footballHub/*`
 * - `src/features/footballHub/*`
 * - `src/components/footballHub/*`
 * - tests `footballHub*.test.ts`
 *
 * Conservé : `formationPitch`, `follows.service`, `SupporterAppShell`, services `externalScores*` (hors nouveau stack).
 *
 * ## Phase 2 (non livré)
 * - WebSocket live Sportmonks
 * - Terrain 3D
 * - Panneau admin football
 * - Sidebar desktop
 * - Pipeline Veo
 * - Classement club complet (saison id dynamique)
 */
