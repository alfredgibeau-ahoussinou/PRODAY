# PRODAY Football Hub — reconstruction totale (pôle Supporter)

**Branche :** `feat/admin-menu-minimal`  
**Produit :** Accueil · Matchs · ProDay · Favoris · Profil  
**Date :** 2026-08-20

## Phase 0 — Audit (exécuté)

### Supprimés

- `SupporterFootballHubScreen`, `SupporterHomeScreen`, `SupporterHomeDashboard`
- `SupporterPlusHubScreen`, `SupporterMediaTabBar`, `SupporterLiveTabButton`
- Hub cards V2 : HeroLive, MatchDuJour, ProDayBridge, HubSection, supporterHubTheme
- `supporterPlusMenu`, `supporterNavConfig`, `supporterHomeLayout`
- `SupporterPlusBackBar`, `useSupporterPlusReturn`
- Test `supporterHomeLayout.test.ts`

### Conservés (partagés / data)

- `follows.service`, `externalScores*`, `footballData/*` (évolué + MergedFootballProvider)
- `supporterMatchFilters`, `supporterMatchDetail`, `supporterMatchHub`, hooks match hub
- `supporterVideo*`, prefs, notifications, agent (réexport footballHubAgent)
- `formationPitch` / `MatchHubLineupTab`
- `SupporterAppShell` (réécrit), écrans secondaires Explorer/Videos/Fil/Map/LiveNow
- `SupporterMatchDetailScreen` (legacy, écrans secondaires — Match Center = nouveau)

## Navigation livrée

| Tab FR | MainTabId | Screen |
|--------|-----------|--------|
| Accueil | `home` | `FootballHubHomeScreen` |
| Matchs | `matchs` | `FootballHubMatchsScreen` |
| ProDay | `feed` | `FootballHubProDayScreen` |
| Favoris | `plus` | `FootballHubFavoritesScreen` |
| Profil | `profil` | `FootballHubProfileScreen` |

## Phase 1 — Livré

- Dock 5 onglets : Accueil · Matchs · ProDay · Favoris · Profil
- Theme + primitives `src/features/footballHub/`
- Écrans `src/screens/footballHub/`
- Facade `FootballDataProvider` / `MergedFootballProvider` / `footballDataFacade`
- Match Center + ProDay IA (données disponibles uniquement)
- Empty states FR honnêtes, pas de stats inventées

## Phase 1.5 / 2 — Différé

- Proxy Cloud Functions obligatoire (`FOOTBALL_API_KEY` / football-data token serveur)
- Sidebar desktop
- Pipeline Veo / XbotGo
- UI admin sync compétitions complète
- FCM push matchs

## Admin stub (Phase 1.10)

Flag plateforme / note admin « Football externe » : activer/désactiver la couche scores externe (config existante `platformFeatureFlags` / Admin panel). Sync admin complète = Phase 2.
