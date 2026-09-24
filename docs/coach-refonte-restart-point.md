# Pôle Coach — point de reprise exact (refonte complète)

> Mis à jour : 16/09/2026. Ce fichier est le **restart point** du chantier
> « refonte complète de l'espace Coach » : inventaire, état réel, suite exacte.
> Ne pas dupliquer ailleurs ; mettre à jour ce fichier à chaque étape.

## État verrouillé par les tests (16/09/2026)

- Suite complète : **358 suites / 2 337 tests verts** ; `npx tsc --noEmit` propre.
- `coachProDesignAlignment.test.ts` :
  - budgets de couleurs littérales **à 0** pour les 12 fichiers convertis ;
  - `proSemantic` du socle contient `info` (`#0A84FF`) — litéraux tolérés du
    socle : `['#0A84FF', '#FFFFFF']` (info + texte-sur-aplat) ;
  - `coachTeamTheme.ts` exporte `withAlpha` et `COACH_CLEAR_SURFACES`.
- Typographie : **zéro déclaration `fontFamily`** dans
  `src/screens/coach/`, `src/components/coach/`, `src/features/coach/`.
  La pile vit uniquement dans `theme/appleTypography.ts`, consommée par
  `clubType`/`proType` (clubDesignSystem.ts) et imposée par `ProDayText`.
- Séries de données : `proSemantic.info` (bleu) + `PRO_DATA_VIOLET` (violet).
  Le Twin Match Lab encode la série **adverse** (sélecteur de formation
  adverse) sur `PRO_DATA_VIOLET` — plus de collision avec `proSemantic.danger`,
  réservé au rapport de vulnérabilité. Verrouillé par
  `coachProDesignAlignment` (« sépare la série adverse des statuts d'erreur »).
- **Inspection visuelle du Twin Lab (16/09, preview web :8081)** : les
  sélections de formation suivaient un aplat teinté (info@0.2 / violet@0.2)
  avec libellé coloré 10px — violet sur teinte ≈ **3,7:1**, sous AA (4,5) et
  divergent de la recette `proChip` (« contour sur fond transparent, jamais
  un aplat »). Corrigé : contour coloré + libellé **blanc** (≈ 17:1), test
  mis à jour. Au passage, **30 artifacts du codemod corrigés**
  (`'tokens.border'` / `'proSemantic.successSoft'` quotés — invisibles pour
  tsc, cassaient bordures et fonds au runtime) ; le garde-fou mécanique
  contre ce motif reste à écrire (test regex sur les sources).

## Inventaire des écrans (état au 16/09/2026)

Converti aux jetons + typographie centrale (budget 0, tests verrouillés) :
accueil, calendrier, équipe/effectif, entraînements (planificateur refait),
tactique, messagerie (écran fictif supprimé → `MessagesScreen` partagé),
centre de match en direct, Twin Match Lab, Workload & Santé, Scouting,
Mes vidéos, hub d'entraînement, classement (`CoachStandingsTable`),
historique des relances, carpool, copilote, profil.

## Socle partagé (sources uniques)

- `theme/appleTypography.ts` — pile SF/system (iOS `System`, web
  `-apple-system…`, Android `Roboto`/`sans-serif-medium`).
- `features/club/theme/clubDesignSystem.ts` — `clubType` etc. ; ré-exporté par
  `theme/professionalDesign.ts` (`proType`, `proForm`, `proRadius`…,
  `proSemantic` dont `info`).
- `utils/coachTeamTheme.ts` — tokens Coach (`buildCoachThemeTokens`),
  `withAlpha`, `COACH_CLEAR_SURFACES` (variante claire).
- `content/coachPageIdentity.ts` — `COACH_SITE` (surfaces nuit : `#121218` /
  `#1A1A24`) ; les écrans à styles statiques font `const tokens = COACH_SITE`.
- `scripts/codemodCoachColors.js` — codemod idempotent (mapping exhaustif,
  imports automatiques). Réutilisable si de nouveaux littéraux apparaissent.

## Suite exacte (prochaines étapes)

1. **Vérification device/preview** : les 7 écrans + 10 composants codemodés
   n'ont été **vérifiés que par tests + tsc** (couleurs mécaniquement
   converties, JSX réparé par perl). Ouvrir chaque écran dans le shell Coach
   (ids dans `coachNavConfig.ts`) et contrôler contrastes, alphas sur fond
   clair, mode `lightMode` du classement, pelouse des diagrammes (désormais
   `COACH_SITE.pitchDeep`/`pitchLight`).
1 bis. **Composants Coach : conversion terminée (16/09, vague 2)** — les 10
   composants partagés sont à **0** littéral et inscrits aux BUDGETS :
   DrillDiagram, SportEasyPitchSurface, SportEasyPitch, ProfileHub,
   AiTacticsSheet, AccountPanels, PlayerAiPanel, TrainingTeamRoster,
   AccentColorPickerModal, FederationSyncDrawer. La série « violet » des
   schémas vit dans `PRO_DATA_VIOLET` (socle) ; `proSemantic` a gagné
   `successSoft`/`warningSoft`/`dangerSoft`. Nettoyage : `CoachCockpitChrome`
   et `CoachPlayerNoteSheet` supprimés (zéro référence).
   Reste **hors** converti : `features/coach/` (chrome shell) et les
   composants non listés ci-dessus — vérifier avant d'étendre les budgets.
2. **`CoachTacticalBoardScreen`** : drag & drop déjà en place ; vérifier la
   séquence guidée (attaquants → milieux → défenseurs → gardien → banc →
   vue complète) et « enregistrer le brouillon » vs « publier ».
3. **Revue route par route** : les 23 ids de navigation rendent tous un écran
   réel (`CoachAppShell.tsx` lignes ~357-414) ; reste à inspecter le rendu
   visuel un à un dans la preview.
4. **Bloqueur environnement** : `git` est inutilisable dans cette sandbox
   (licence Xcode non acceptée — `sudo xcodebuild -license` à faire par
   l'utilisateur). Aucun commit n'a été fait ; tout est sur le disque.

## Écarts honnêtes connus

- Contrastes des alphas blancs (0.5/0.55) sur la variante **Clair** : dérivés
  mécaniquement, non vérifiés à l'œil.
- Le codemod mappe `#38BDF8`/`#64D2FF`/`#22D3EE` → `proSemantic.info` : les
  « séries » de graphiques partagent désormais la même teinte info. Si une
  distinction visuelle est requise (ex. comparaison A/B du Twin Lab),
  introduire un second token dédié plutôt que de réintroduire des littéraux.
- iOS uniquement dans cette sandbox : les rendus Android/web de la pile
  (`Roboto`, `-apple-system` web) sont déclarés mais non vérifiés ici.
