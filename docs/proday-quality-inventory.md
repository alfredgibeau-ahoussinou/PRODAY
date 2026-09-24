# ProDay — Inventory Qualité (Vérification & Correction)

> Document de coordination persistant. Mis à jour à chaque session d'audit.
> Dernière mise à jour : 2026-09-21 · Session lead-orchestrator (Buffy/Freebuff)

## Méthode

- **Référence design** : `DESIGN.md` (Dark Premium, tokens obligatoires) + interfaces Coach/Club approuvées comme référence partagée + design Admin plateforme dédié (`src/theme/professionalDesign*`).
- **États** : `To inspect` → `Needs correction` → `In progress` → `Ready to verify` → `Verified` → `Blocked`.
- **Sévérités** : `S1` bloquant (accès/perd données/permissions), `S2` majeur (visuel cassé, incohérence visible), `S3` mineur (polish).
- **Preuves** : chaque correction référence typecheck + suites Jest + inspection live quand applicable.
- Chaque finding a un ID stable `F-XXX`, immuable d'une session à l'autre.

## Limites d'environnement (enregistrées)

1. **Pas de sous-agents Task disponibles** dans cet environnement : les 6 zones (design system, Coach/Club, Joueur/Parent, Admin plateforme, Auth/nav, vérification) sont traitées **séquentiellement** par l'orchestrateur seul.
2. Auth réelle Google/Apple/téléphone : nécessite appareil/simulateur + projets Firebase — **Blocked** ici, vérifié par suites statiques et revue de code.
3. Tests on-device (Veo live, broadcast, push) : hors portée de cet environnement — états documentés honnêtement.

## Inventaire par zone

### Zone 0 — Socle transverse

| ID | Cible | Rôle | État | Constat | Action |
|---|---|---|---|---|---|
| BASE-1 | Baseline repo | tous | ✅ Vérifié | `tsc --noEmit` ✅ · jest **389/389 suites, 2726/2726 tests** ✅ (18s, maxWorkers=1) | — |
| BASE-2 | Git state | tous | ✅ Vérifié | branche `feat/admin-menu-minimal`, ~648 changements non committés (travail en cours préservé, dont `desktop/app-dist` supprimé par un autre flux) | Ne pas toucher aux hunks non-miens |
| BASE-3 | Nav racine | tous | ✅ Vérifié | `App.tsx` (1004 l.) → MainTabs + shells par rôle (club/coach/supporter/parent/sponsor) + `resolveMainTabScreen` par ligne produit | — |

### Zone A — Design system partagé

| ID | Cible | État | Constat | Action |
|---|---|---|---|---|
| F-001 | `src/theme/typography.ts` | ✅ Vérifié | Stack Apple unique (`APPLE_FONT_STACK`), variants mappés sur `APPLE_TYPOGRAPHY` | — |
| F-002 | `src/screens/joueur/PlayerSaisonScreen.tsx` | ✅ Vérifié (corrigé) | 56 overrides `'SF Pro Text/Display'` littéraux → remplacés par `APPLE_FONT_STACK.system/.display` ; import `Platform` devenu inutile retiré | A-1 fait |
| F-003 | `PlayerPageGuideModal` (10), `PlayerCertifiedPassportModal` (12), `PlayerStoryExportModal` (3), `PlayerPageGuideBanner` (4), `ChooseAppSpaceModal` (2) | ✅ Vérifié (corrigé) | Même correction token + imports nettoyés | A-1 fait |
| F-004 | `designTokens.ts` | ✅ Vérifié (corrigé) | `typography.fontFamily/displayFamily/brandFamily` (`Inter_/Syne_/Sora_`) → stack Apple ; polices Google toujours chargées dans App.tsx mais plus rendues nulle part (nettoyage du chargement hors scope, sans effet visuel) | A-2 fait |
| F-005 | Couleurs codées en dur | ⚠️ Partiel | ~240 fichiers avec hex littéraux hors tokens — plafonnés par gardes de tests (`coachProDesignAlignment`, etc.) ; remédiation totale hors scope d'une session, traitée zone par zone | A-3 : suivi par gardes |
| F-006 | Icônes/emojis | ✅ Vérifié | Zéro emoji dans `src/features` — iconographie 100% vectorielle cohérente : `Icon` typé (Ionicons + `FootIcon` football) avec variants outline/filled ; 63 fichiers importent encore `vector-icons` directement (déviation documentée, pas une incohérence) | — |

### Zone B — Coach & Club (audit statique + a11y transverse)
| ID | Cible | État | Constat | Action |
|---|---|---|---|---|
| B-001 | Navigation coach (`messages` vs `com_staff`) | ✅ Vérifié | Dock et outil Menu pointent tous deux vers `MessagesScreen` partagé (tests `coachNavConfig` l'épinglent) — raccourci documenté, pas de destination en double | — |
| B-002 | `ClubMatchesCenter.tsx:1190` | ✅ Vérifié | `#FFFFFF` = bouton-poussoir de toggle (blanc sur fond coloré, sûr en clair/sombre) | — |
| B-003 | Contrôles ico­ne-seule sans nom accessible (repo entier, dont coach/club) | ✅ Vérifié (corrigé) | 67 candidats réels identifiés par scan heuristique + triage manuel ; **57 noms accessibles ajoutés** (44 codemod + 13 manuels dynamiques/chevrons), 11 faux positifs confirmés | Fait |
| B-004 | State vide/chargement partagés | ✅ Vérifié | `DataState` (loading/empty/firebaseMissing) tokenisé via `useAppTheme` | — |

### Zone C — Joueur & Parent
| ID | Cible | État | Constat | Action |
|---|---|---|---|---|
| C-… | (peuplé en cours d'audit) | To inspect | | |

### Zone D — Admin plateforme (distinct Club admin)
| ID | Cible | État | Constat | Action |
|---|---|---|---|---|
| D-001 | Séparation admin plateforme / admin club | ✅ Vérifié | `AdminAppShell` (gate `isAdmin \|\| emailHint`, plateforme) ≠ `PresidentAppShell` (intégré au shell club via `ClubPresidentShellSwitch` + ACL `canAccessPresidentPole`) ; l'aperçu président (`previewUserMode` + `adminPresidentPreview`) n'assouplit pas l'ACL adhérents | — |
| D-002 | Système visuel admin | ✅ Vérifié | Tokens dédiés (`professionalDesign*`, `AdminText`, `OpsDeskStrip`) — design préservé, distinct des pôles | — |

### Zone E — Auth / Adhésion / Navigation
| ID | Cible | État | Constat | Action |
|---|---|---|---|---|
| E-001 | `resolveUserDestination` | ✅ Vérifié | Isolation démo stricte : seuls `isSyntheticUser` (uid `seed_*`/`scale-*`, emails `*.demo@`) atteignent `demo` ; le fallback `profile.club_id` exclut `demo-club`/`club-demo` ; un compte réel sans adhésion → `no_club` (jamais démo) | — |
| E-002 | Destination `multi_club` | ✅ Vérifié (corrigé) | **Défaut réel S2** : destination produite + testée mais **aucun consommateur UI** — un utilisateur multi-clubs retombait silencieusement sur le 1er club, sans sélecteur. Corrigé : routage honore un choix enregistré (`profile.club_id` actif → `active_club`), sinon `multi_club` → nouvel écran `MultiClubSelectorScreen` (choix persisté via `profileService.updateProfile` + `refreshProfile`) ; App.tsx câblé ; 3 tests de routage ajoutés | Fait |
| E-003 | `pending_approval` / `no_club` | ✅ Vérifié | Rendus dans le gate App.tsx (`MembershipPendingScreen`, `NoClubScreen` avec `latestRejected`) | — |
| E-004 | Auth réelle Google/Apple/phone | ⛔ Blocked | Nécessite appareil + projets Firebase — hors environnement (voir verification-results) | Documenté |

### Zone F — Apparence / Responsive
| ID | Cible | État | Constat | Action |
|---|---|---|---|---|
| FV-001 | Source de vérité apparence | ✅ Vérifié | `AppearanceContext` singleton service (`appearanceSettingsService`) : glassMode system/glass/opaque, intensité, reduced-transparency, persistance, abonnement réactif — consommé par l'app ET l'admin (pas de doublon) | — |
| FV-002 | Surcharges lumière hors tokens | ✅ Vérifié (sondage) | Aucune `backgroundColor: '#FFF…'` dans coach/club hors bouton toggle légitime (B-002) ; pôles dark-first cohérents | — |
