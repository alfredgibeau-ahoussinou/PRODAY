# ProDay — Résultats de vérification (preuves)

> Journal des vérifications : ce qui a été testé, comment, résultat honnête.
> Nomenclature : **Passed / Failed / Blocked / Not tested** — jamais de blocage converti en succès.

## Niveaux de preuve utilisés

- `code` : inspection de code source (statique)
- `tests` : suites Jest automatisées locales
- `types` : `tsc --noEmit`
- `live` : application lancée + inspection/interaction réelle (navigateur web Expo)
- `device` : appareil réel — **indisponible dans cet environnement** (noté quand pertinent)

## Journal

| Date | Zone | Cible | Méthode | Résultat | Preuve |
|---|---|---|---|---|---|
| 2026-09-21 | Base | Repo entier | `types` | **Passed** | `/tmp/baseline-tsc.log` exit 0 |
| 2026-09-21 | Base | Repo entier | `tests` (389 suites / 2726 tests) | **Passed** | `/tmp/baseline-jest.log` |
| 2026-09-21 | Base | Nav racine + shells | `code` | **Passed** | App.tsx, resolveMainTabScreen.tsx, mainTabConfig.ts — mapping rôle→écrans cohérent, invité protégé |
| 2026-09-21 | A | Typographie partagée | `code` | **Passed** | `appleTypography.ts` = stack Apple correct (System iOS, -apple-system web, Roboto Android) |
| 2026-09-21 | A | Joueur typo | `code` | **Failed → correction en cours** | 87 overrides `'SF Pro …'` littéraux hors tokens (F-002/F-003) |
| 2026-09-21 | A | designTokens typo | `code` | **Failed → correction en cours** | `'Inter_400Regular'` résiduel (F-004) |

## Auth réelle (Google/Apple/phone)

| Méthode | Statut | Limite |
|---|---|---|
| `device` réel | **Blocked** | nécessite simulateur/appareil + projets Firebase configurés — hors environnement |
| `code` + `tests` statiques | remplace partiellement | revue `membershipRouting.ts` / overlays à faire en Zone E |
