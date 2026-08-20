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
 * | getLive | `GET /livescores/inplay?include=participants;scores;state;league;events;lineups;formations;statistics;venue` |
 * | getFixtures / upcoming / finished | `GET /fixtures/between/{from}/{to}` |
 * | getMatch / lineups / events / stats | `GET /fixtures/{id}` (+ includes) |
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
 * 4. **Démo** : sans token, ou `EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO=1` → matches `source: 'demo'`
 *    (jamais mélangés silencieusement avec du live Sportmonks)
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
