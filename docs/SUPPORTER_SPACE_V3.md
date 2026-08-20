/**
 * Supporter Space V3 — architecture football (Sportmonks + football-data.org + ProDay).
 *
 * ## APIs
 * 1. **Sportmonks Soccer API v3** (https://www.sportmonks.com / docs.sportmonks.com/v3)
 *    — plan Free : Superliga DK (`271`) + Premiership Écosse (`501`) uniquement.
 * 2. **football-data.org v4** (https://www.football-data.org) — **secondaire gratuit**
 *    pour les ligues hors plan Sportmonks Free (Ligue 1, top 5, C1…).
 * 3. **ProDay** — `teamEvents` / tournois (jamais remplacés par de la démo).
 *
 * ### Pourquoi le dual-provider
 * Le Free Plan Sportmonks ne sert **pas** la Ligue 1 (`301`). Sans second provider,
 * les rails Accueil / Matchs Ligues resteraient vides pour le football français.
 * football-data.org Free expose notamment `FL1`, `PL`, `PD`, `SA`, `BL1`, `CL`
 * (12 compétitions, ~10 req/min, scores parfois différés — données **réelles**, pas démo).
 *
 * ## Endpoints Sportmonks
 * | Méthode façade | Endpoint Sportmonks |
 * |---|---|
 * | getLive | `GET /livescores/inplay?include=…` (`LIVE_INPLAY_INCLUDES`) |
 * | getFixtures / upcoming / finished | `GET /fixtures/between/{from}/{to}` |
 * | getMatch / lineups / events / stats | `GET /fixtures/{id}` + `FIXTURE_DETAIL_INCLUDES` |
 * | getTeams / getCompetitions / getStandings | search / leagues / standings seasons |
 *
 * ## Endpoints football-data.org
 * | Méthode | Endpoint |
 * |---|---|
 * | fixtures / upcoming / finished | `GET /v4/matches?competitions=FL1,PL,…&dateFrom=&dateTo=` |
 * | live | `GET /v4/matches?competitions=…&status=LIVE` |
 * | match | `GET /v4/matches/{id}` |
 * | standings | `GET /v4/competitions/{code}/standings` |
 * Header : `X-Auth-Token: <token>`
 *
 * Codes Free utilisés en priorité : `FL1` `PL` `PD` `SA` `BL1` `CL`
 * (+ `DED` `PPL` `ELC` `BSA` `WC` `EC` listés dans le mapper).
 *
 * ## Merge Ligues
 * `CompositeExternalFootballProvider` = Sportmonks ∪ football-data.
 * Dédoublonnage `date UTC + home + away` (noms normalisés) ; on garde le payload le plus riche.
 * Jamais de fixtures `source: 'demo'` sauf `EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO=1`.
 *
 * ## Tokens
 * 1. Sportmonks — préféré serveur : `SPORTMONKS_API_TOKEN` / proxy `supporterFootballProxy`
 *    · Dev : `EXPO_PUBLIC_SPORTMONKS_API_TOKEN`
 * 2. football-data.org — `EXPO_PUBLIC_FOOTBALL_DATA_TOKEN` (compte free sur football-data.org)
 *    · Optionnel : `EXPO_PUBLIC_FOOTBALL_DATA_URL` (défaut `https://api.football-data.org/v4`)
 * 3. Démo uniquement si `EXPO_PUBLIC_SUPPORTER_FOOTBALL_DEMO=1`
 * 4. Sans aucun token → Ligues vides + CTA honnête ; ProDay reste réel.
 *
 * ### Couverture Free Plan Sportmonks
 * Superliga + Premiership seulement. Ligue 1 / top 5 viennent de **football-data**
 * quand le token FD est présent — le bandeau « plan limité » disparaît pour ces ligues.
 *
 * `EXPO_PUBLIC_EXTERNAL_SCORES_API_KEY` (API-Football RapidAPI) reste **legacy**
 * (hors stack V3) — non utilisé comme primaire.
 *
 * ## Navigation mobile
 * Accueil · Matchs · ProDay · Clubs · Profil
 * (`home` · `matchs` · `feed` · `plus` · `profil`)
 *
 * ## Dossiers
 * - `src/features/supporterSpace/` — thème + composants
 * - `src/screens/supporterSpace/` — pages
 * - `src/services/supporterFootball/` — Sportmonks + FootballData + ProDay + merge UnifiedMatch
 * - `src/hooks/supporterFootball/`
 * - `functions/src/supporterFootballProxy.ts`
 *
 * ## Phase 2 (non livré)
 * - WebSocket live Sportmonks
 * - Terrain 3D
 * - Panneau admin football
 * - Sidebar desktop
 * - Pipeline Veo
 */
