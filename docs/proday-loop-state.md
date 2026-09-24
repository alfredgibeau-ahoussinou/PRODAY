# État de boucle ProDay

Version de travail : 2026-09-16 · branche observée : `feat/admin-menu-minimal`

## Boucle active

**L19 — Refonte Player : rail du portail complet + 2 écrans convertis + 2 défauts corrigés.**
- **PlayerTacticalView** : les onze fictifs (Lloris, Griezmann…) et la pastille
  « EN DIRECT » inventée sont remplacés par les **données réelles partagées** :
  `TeamEvent.lineup` (composition publiée par le staff, via `pickLineupTargetEvent`)
  et `matchTalkService.getForEvent` (causerie + message adressé au joueur). Sans
  publication : états honnêtes (« Composition non publiée », « Aucune causerie
  publiée », coups de pied arrêtés à venir).
- **PlayerWellnessScreen** : conversion socle (0 littéral), ACWR **1.08 fabriqué
  supprimé** (état honnête), score/vigilance toujours calculés des réponses
  réelles, sauvegarde avec confirmation + erreur actionnable, échelles 1–5 aux
  puces du socle (cible 44 pt, `checked`+`selected` pour l'a11y).
- **Défaut corrigé (hors Player, observé au playtest)** : `brainState.mapper.toFirestoreDoc`
  écrivait `last_action: undefined` → `setDoc` levait « Unsupported field value:
  undefined » et la progression n'était pas persistée. Clé omise si absente +
  test de régression dans `phase4Scale.test.ts`.
- **Vérifié** : tsc 0 erreur, **359 suites / 2 343 tests**, bundle HTTP 200 ;
  aperçu réel : Santé (saisie → score 83→73, enregistrement, **persistance après
  rechargement** : « Forte »/73/confirmation), Tactique (états honnêtes, aucun
  nom fictif, pas de débordement horizontal).
- **Reste** : `PlayerSaisonScreen` (120 littéraux), `JoueurPlusHubScreen` (11),
  `PlayerSaisonIcons` (24), `JoueurTacticsCoachScreen` (10),
  `JoueurWhoAreYouGateScreen` (5) ; écrans partagés Coach/Club (`MatchsScreen`,
  `MessagesScreen`) volontairement **non touchés** (propriété workstream partagé).
- **Défauts observés non corrigés** : avatar de démo en `file:///…ImagePicker/*.jpg`
  → image cassée sur web (donnée seedée, propriété profil/seed) ; l'arbre a11y
  RN-Web n'expose pas l'état `checked` des radios (limitation de la lib).

**L18 — Polish Player (pass « expérience »).** Portée : PlayerHomeScreen +
PlayerPageGuideModal uniquement — Coach et Club/Admin intacts.
- **Accueil** : ack immédiat de la réponse convocation (couleur avant le réseau),
  haptique `rsvpConfirm` sur succès, rétablissement du statut réel + message
  d'erreur actionnable en cas d'échec d'écriture, rappel « Le staff attend ta
  réponse » tant que la convocation attend une réponse.
- **États vides** : pastille d'invitation sans convocation (et barre de réponse
  masquée — pas de bouton mort) ; hint de carte adapté à l'invité.
- **Nettoyage** : `deriveRsvp` déduplique le mapping statut (3 sites -> 1),
  refetch fantôme après écriture supprimé, dépendance d'effet resserrée.
- **PlayerPageGuideModal** : `scrollArea` en `flex: 1` — le CTA et le bouton
  fermer restaient sous la ligne de flottaison du bottom-sheet quand le contenu
  déborde (court écran / clavier ouvert) : action primaire injoignable.
- **Vérifié** : tsc 0 erreur, 2 342 tests, bundle HTTP 200 ; sur l'aperçu :
  accueil sans convocation correct (barre RSVP absente, guide présent), session
  Lucas Démo persistée. **Limites** : ré-ouverture du modal non rejouable via
  CDP ce passage (Pressable intermittent, cf. L14) — la géométrie corrigée est
  constatée dans le bundle servi (`flex: 1`) ; re-validation du CTA sur écran
  court à faire ; écriture RSVP toujours non reproduite à l'écran (L14).

**L17 — Refonte Player : socle design partagé + dock 4 destinations + écrans
principaux convertis.** (Le workstream Coach est poursuivi **en parallèle dans un
autre thread** sur le port 8081 ; cette boucle Player a tourné sur un Metro dédié
`http://localhost:8083`, session `screen` `metro-player`, pour ne pas se partager
le même aperçu.)
Statut : **livré et vérifié au niveau code + aperçu navigateur ; le parcours RSVP
n'a pas pu être rejoué à l'écran** (flake RN-Web `Pressable`, voir blocage).

### Point de reprise exact (L17)

- **Livré :**
  - `src/theme/playerDesignSystem.ts` (**nouveau**, socle unique du pôle) : forme
    **Fitness Park** (cartes groupées r22, hero r24, puces 44/999, actions
    52/999, lignes 62, champs 52/18 — parité de mesure avec `clubForm`),
    `playerType` = **références** de `APPLE_TYPOGRAPHY` (pile Apple system, San
    Francisco/SF Pro — identité garantie, aucune police tierce), surfaces
    `PLAYER_DARK`, tons de réponse convocation dérivés de `CLUB_TOKENS`
    (vert/orange/rouge = même registre sémantique que Coach/Club).
  - `components/navigation/PlayerDockTabBar.tsx` (**nouveau**) : dock joueur à
    **4 destinations — Accueil · Calendrier · Ma Carte · Menu** — état actif sur
    la couleur, libellés Apple 11 pt (`playerForm.dockLabelSize`), branché dans
    `BottomTabBar` pour les sessions joueur.
  - Navigation : `AMATEUR_PLAYER_SHELL_TABS` / `PRO_PLAYER_SHELL_TABS` passent
    de 5 à **4 onglets** (`feed` → overflow), `FLAT_RAIL_RULES` alignées, labels
    `getJoueurGameTabLabel` mis à jour (Calendrier · Ma Carte · Menu ; « Ma
    Saison » conserve une entrée dans le Menu via `joueurPlusMenu`).
  - Écrans convertis au socle (**0 couleur littérale**, mesuré) :
    `PlayerPortalScreen` (7→0), `PlayerHomeScreen` (88→0, dégradés hors spec
    retirés, barre de réponse sur `playerResponseTone`, cibles 44, a11y),
    `PlayerStatsScreen` (51→0, KPI « 1 540'/18 titularisations » **inventés
    retirés** → valeur réelle ou « — », période « Saison 2026/2027 »).
  - Garde-fous : `playerDesignSystem.test.ts` (7 tests) et
    `playerVisualAlignment.test.ts` (4 tests, plafond 0 littéral par fichier,
    dock Apple + ordre des 4 destinations).
- **Dernière action réussie :** `npx tsc --noEmit` → **0 erreur** ; `npx jest` →
  **359 suites / 2 342 tests verts** (dont les 11 nouveaux tests Player ; Coach
  et Club/Admin inchangés et verts) ; bundle Metro iOS HTTP 200 (29 835 825
  octets) contenant `playerDesignSystem` / `PlayerDockTabBar`.
- **Mesures relevées en aperçu (730 × 905, compte `player.demo@proday.app`) :**
  dock **4 onglets de 173 × 48**, libellés 12 px bas de casse ; boutons de
  réponse **44 px**, rayon 18 ; cartes `rgb(18,18,24)` rayon **22** / hero **24** ;
  audit DOM complet de l'accueil : **0 débordement horizontal, 0 cible < 30 px**.
  Routes vérifiées à l'écran : Accueil, Calendrier (événement réel jeu. 17 sept.
  18:30 · Lyon · « 1 en attente »), Ma Carte (12 matchs / 3 buts / 5 passes),
  Menu (« Ma Saison » → Progression XP/quêtes). Honnêteté intacte : classement
  « DONNÉES NON DISPONIBLES », feuilles « Pas encore de feuilles de match ».
- **Blocage de recette :** le **RSVP n'a pas pu être écrit à l'écran** — deux
  activations (clic CDP sur la puce « Présent », puis focus clavier + Enter sur
  « Répondre : Présent ») n'ont déclenché **aucun RPC d'écriture** (réseau :
  uniquement des Listen 200) ; ni refus de règle ni faux succès. Le code
  (`teamEventsService.updateRsvp`) est inchangé et testé ; cause probable = flake
  RN-Web `Pressable` documenté depuis L14. À recetter avant de déclarer le
  parcours vérifié (et vérifier le reflet côté `coach.demo@proday.app`).
- **Constat signalé, non corrigé (hors périmètre Player) :**
  `components/coach/CoachAiTacticsSheet.tsx` (workstream Coach, édité par
  l'autre thread) a été vu en **erreur de syntaxe** (`'withAlpha(tokens.bg,
  0.75)'` écrit comme chaîne, vers la ligne 422), cassant le bundle du port
  8081. Ne pas intégrer tant que la boucle Coach n'est pas revenue au vert.
- **Non vérifié :** desktop large, tablette, iPhone, portrait/paysage, texte
  200 %, clavier ouvert (DEVICE-01) ; écrans Player restants non convertis
  (liste §4 de `docs/proday-player-checklist.md`) ; parcours recherche→DM,
  groupes, covoiturage, vidéo (bloqué Veo) — détail complet dans
  `docs/proday-player-checklist.md`.
- **Git indisponible** sur la machine (licence Xcode non acceptée) : rien n'a
  été commité ; fichiers touchés listés dans la checklist Player.
- **Prochaine action précise :** (1) recetter le RSVP à l'écran puis vérifier le
  reflet côté Coach ; (2) convertir les écrans Player restants (plafond 0
  littéral ajouté fichier par fichier) ; (3) étendre la recette aux largeurs
  320/390 et au texte agrandi.

---

## Boucle précédente

**L16 — Alertes de charge réelles du tableau de bord Coach.**
Statut : **branché et vérifié sur données réelles ; un jeu de démonstration incohérent empêche la
vérification visuelle des lignes d'alerte.**

Le panneau `CoachLoadAlertsPanel` était écrit, jamais rendu, et le bandeau de vigilance annonçait
« Aucune alerte réelle connectée ». Les deux sont désormais reliés à une source réelle.

### Point de reprise exact (L16)

- **Livré :** `src/utils/coachLoadSignals.ts` (constructeur pur : fenêtre de 7 jours, pointages qui
  font autorité, minutes de la feuille prioritaires et jamais additionnées au déclaré, statut déclaré
  sans détail médical, sources et manques nommés) ; `src/hooks/useCoachLoadAlerts.ts` (lecture de
  l'effectif, des événements de l'équipe active et des `wellness_checkins` des 3 derniers jours) ;
  `LoadAlert.kind` (`load` / `availability` / `missing`) qui **débloque les statuts déclarés
  indisponibles**, auparavant filtrés comme de simples données manquantes ; tableau de bord avec états
  chargement / erreur / vide et **pull-to-refresh réel** (il animait 500 ms sans relire).
- **Dernière action réussie :** `npx tsc --noEmit` → **0 erreur** ; `npx jest` depuis la racine →
  **345 suites / 2 149 tests verts** (dont `coachLoadSignals` 15 tests).
- **Mesures relevées en aperçu (570 × 891) :** équipe **Seniors A** → « Aucune donnée de charge sur
  7 jours — Dernier événement de l'équipe : 8 septembre (entraînement) » ; équipe **U17** (bascule de
  l'équipe active) → « 7 jours : 2 match(s) et 0 entraînement(s) · 0/9 joueur(s) avec données ·
  manque : minutes jouées, check-ins de forme », avec `pointages de présence` **lu** (donc absent des
  manques). Base vérifiée par lecture admin : dernier événement de Seniors A au 8 septembre (7,2 j),
  `wellness_checkins` du club = **0 document**.
- **Blocage de vérification (données, pas code) :** dans le seed, `invitee_uids` ne recoupe pas les
  `player_uid` des appartenances de la même équipe et aucun événement n'a de `rsvp` présent ni de
  minutes : la participation ne peut pas être établie, donc les **lignes** d'alerte ne sont pas
  vérifiables visuellement. Aucune écriture n'a été faite en base pour forcer l'affichage.
- **Prochaine action précise :** soit autoriser l'écriture de données de démonstration identifiées
  (un entraînement daté de la veille avec pointages + un check-in de forme pour l'équipe active) pour
  voir les lignes d'alerte, soit corriger le seed pour aligner appartenances et convocations.
- **Constats signalés, non corrigés :** l'écran **Équipe** du pôle Coach affiche une composition
  écrite en dur ; la règle Firestore `team_events` autorise la lecture à tout compte connecté.

## Boucle précédente

**L15 — Alignement du pôle Coach sur le registre professionnel partagé (Coach ↔ Club/Admin).**
Statut : **démarré et vérifié sur les destinations ouvertes ; le pôle reste incomplet** (voir
`docs/proday-coach-checklist.md`, qui porte l'inventaire route par route).

Le référentiel demande une **seule variante professionnelle** pour Coach et Club/Admin. Or les deux
pôles exprimaient le même registre avec deux socles distincts : un pôle Coach sans échelle de forme,
qui recopiait ses dimensions écran par écran. Trois écarts mesurables en découlaient, tous corrigés :
barre basse à **5 onglets** (dont aucun Calendrier) au lieu des 4 imposées, libellés du dock en
**capitales de 9 px**, et puces de filtre dont la sélection était un **aplat d'accent** — l'inverse de
la règle de forme du pôle Club.

### Point de reprise exact (L15)

- **Livré :** socle neutre partagé `src/theme/professionalDesign.ts` (ré-export littéral du socle
  Club/Admin, donc source unique) ; composition calendrier **extraite** dans
  `src/features/calendar/calendarChrome.tsx` et injectée par thème dans les deux pôles ;
  **onglet Calendrier** réel (`CoachCalendarScreen`) branché sur les événements autorisés du coach ;
  dock Coach ramené à 4 destinations en bas de casse ; puce Coach alignée sur la forme partagée
  (44 / pilule, sélection au contour) dans le helper commun.
- **Intégrité de contenu corrigée :** un **faux résultat IA** (adversaire nommé, pourcentage de
  victoire, buts attendus écrits en dur) et un **faux succès de sauvegarde** avec promesse médicale
  (« pour éviter la blessure ») ont été retirés ; les données inventées du suivi de charge sont
  désormais étiquetées **mode démonstration**, et l'en-tête n'affiche plus l'identifiant Firestore du
  club comme nom d'équipe.
- **Deuxième passe, même jour :** le **second socle** du pôle a été supprimé —
  `components/coach/coachPortalUi.tsx` (15 consommateurs) passe sur `proForm` / `proRadius` /
  `proSemantic` / `proType`, perd son rail d'accent, ses rayons 18, ses hauteurs 32/40 et son rouge
  iOS en dur : **0 couleur littérale**. Le **tableau de bord** (112 couleurs en dur dans une palette
  claire qui produisait des cartes blanches sur fond noir) est fabriqué à partir du thème actif :
  **0 couleur littérale**, cartes `rgb(18,18,24)` / rayon 20, classement rendu en thème sombre du pôle.
- **Dernière action réussie :** `npm run typecheck` → **0 erreur** ; `npm test` → **344 suites /
  2 136 tests verts** (dont `coachProDesignAlignment` 16 tests et `coachChipUi` 5 tests) ; pôle Coach
  ouvert dans l'aperçu avec le compte de démonstration du dépôt.
- **Mesures relevées en aperçu (570 × 891) :** 4 onglets de dock **133 × 45**, libellés **11 px**
  sans capitales ; puces de période et d'équipe **44 px / rayon 999**, sélection au contour accent ;
  cartes du tableau de bord `rgb(18,18,24)` rayon 20 ; action du bandeau d'alertes **149 × 44**
  (elle mesurait 143 × 21) ; action principale **504 × 52** (elle mesurait 45 px / r12).
- **Prochaine action :** poursuivre la reprise des couleurs littérales, dans l'ordre du plafond
  testé — `CoachSquadScreen` (226), `CoachTrainingPlannerScreen` (117), `CoachMessagingScreen` (115),
  `CoachTacticalBoardScreen` (108) — en baissant chaque plafond dans le même commit, puis exercer les
  parcours non testés (convocations, présences, composition, import PDF).
- **Blocage de recette inchangé :** une seule largeur auditable (570). Ni desktop, ni tablette, ni
  iPhone, ni captures d'écran — la webview ne produit pas de frames. La revue repose sur l'audit
  géométrique du DOM dans la page.
- **Non exercé :** convocations, présences, composition dynamique, import PDF, envoi et remise de
  messages, conversation du Copilote. Ces parcours restent « À vérifier ».
- **Fichiers touchés (deuxième passe) :** `src/components/coach/coachPortalUi.tsx`,
  `src/screens/coach/CoachHomeScreen.tsx`, `src/__tests__/coachProDesignAlignment.test.ts`,
  `docs/proday-coach-checklist.md`, `docs/proday-verification.md`.
- **Fichiers touchés (première passe) :** `src/theme/professionalDesign.ts` (nouveau),
  `src/features/calendar/calendarChrome.tsx` (nouveau), `src/features/calendar/calendarModel.ts`
  (nouveau), `src/features/coach/ui/coachCalendarChrome.tsx` (nouveau),
  `src/screens/coach/CoachCalendarScreen.tsx` (nouveau), `src/features/coach/navigation/coachNavConfig.ts`,
  `src/features/coach/shell/CoachTabBar.tsx`, `src/features/coach/shell/CoachAppShell.tsx`,
  `src/content/coachPageIdentity.ts`, `src/utils/coachChipUi.ts`,
  `src/features/club/ui/ClubCalendarChrome.tsx`, `src/screens/coach/CoachHomeScreen.tsx`,
  `src/screens/coach/CoachWorkloadHealthScreen.tsx`, plus 5 fichiers de test et
  `docs/proday-coach-checklist.md` (nouveau).
- **Processus laissés actifs :** Metro en session `screen` sur `:8081`, aperçu sur
  `http://localhost:8081`, **connecté au compte coach de démonstration**. Ne pas supposer leur survie.

---

**L14 — Extension du modèle financier : dû, échéance, moyen de paiement, justificatif, budget.**
Statut : **développé, testé et documenté ; bloqué pour la recette d'écriture par une dépendance
externe précise (règles Firestore/Storage non déployées).**

Le référentiel demandait un « reste à recouvrer », des « impayés », un « prévu vs réalisé » et une
distinction saisie manuelle / paiement confirmé. Ces chiffres étaient **incalculables** :
`club_finance_entries` ne contenait ni montant dû, ni échéance, ni budget. La boucle a donc porté sur
le **modèle de données**, pas sur l'interface.

### Point de reprise exact (L14)

- **Livré :** `club_fees` (montant dû, remise, échéance, saison, adhérent), `club_budgets` (prévu par
  saison et catégorie), `fee_id` / `payment_method` / `payment_provenance` / `receipt` sur les écritures,
  saison définie **une seule fois** dans `src/utils/clubSeason.ts`, logique pure dans
  `clubFeeModel.ts` et `clubBudgetModel.ts`, services avec **identifiants déterministes**, règles
  Firestore + Storage, et les deux sections d'écran (« Cotisations dues », « Budget ») plus le
  rattachement d'un encaissement à une échéance dans le formulaire du registre.
- **Dernière action réussie :** `npm run typecheck` → 0 erreur ; `npm test` → **339 suites / 2 064 tests verts**
  (dont **60 nouveaux tests** : `clubFeeModel` 23, `clubBudgetModel` 14, `clubFinancePlanWrite` 11,
  `clubFinanceRulesContract` 12).
- **Prochaine action :** déployer les règles — `firebase deploy --only firestore:rules` puis
  `--only storage` — **puis** rejouer à l'écran : définir une échéance, encaisser un règlement partiel,
  vérifier que l'échéance reste « En retard », compléter, vérifier « Réglée ».
- **Blocage :** aucune écriture Firestore n'est possible avant ce déploiement ; l'interface le dit
  (« les règles Firestore du module financier ne sont pas encore déployées sur ce projet ») au lieu
  d'annoncer un succès.
- **Décision à confirmer avant publication :** `canManageClubFinance` **retire** au rôle `coach`
  l'accès au registre financier (exigence du référentiel, § D-018). Si un compte coach ou organisateur
  doit conserver cet accès, l'ajouter explicitement à la fonction avant de déployer.
- **Blocage de recette connu :** le pôle Club reste **inaccessible dans l'aperçu** de cette session
  (bascule de pôle impossible sur le `Pressable` de React Native Web). Les deux sections sont donc
  vérifiées par typecheck, tests et relecture — **pas par observation**. Aucune infrastructure de test
  de rendu n'existe dans le dépôt.
- **Fichiers touchés :** `src/utils/clubSeason.ts`, `src/utils/clubFees.ts`, `src/models/ClubFee.ts`,
  `src/models/ClubBudgetLine.ts`, `src/models/ClubFinanceEntry.ts`, `src/utils/clubFinance.ts`,
  `src/features/club/ui/clubFeeModel.ts`, `src/features/club/ui/clubBudgetModel.ts`,
  `src/features/club/ui/clubFinanceModel.ts`, `src/features/club/ui/ClubFinancePlanPanel.tsx`,
  `src/features/club/hooks/useClubFinancePlan.ts`, `src/services/clubFees.service.ts`,
  `src/services/clubBudgets.service.ts`, `src/services/clubFinance.service.ts`,
  `src/services/storage.service.ts`, `src/components/club/ClubFinanceLedgerPanel.tsx`,
  `firebase/firestore.rules`, `firebase/storage.rules`, plus 4 fichiers de test.

---

**L12 — Alignement visuel du pôle Club/Admin sur le système partagé.**
Statut : **en cours, interrompue sur limite d’exécution ; 2 fichiers sur ~14 convertis.**
`ClubTeamsScreen` (60 couleurs en dur → **0**, et surtout `createStyles(_tokens)` : le thème était
reçu puis **ignoré**) et `ClubCommunicationHub` (50 → **0**, palette locale dupliquée supprimée).
Garde-fou ajouté : `src/__tests__/clubAdminStyleAlignment.test.ts`. Inventaire mesuré et ordre de
conversion écrits dans `docs/proday-club-admin-rework.md` (§ L11) — **c’est ce document qui pilote
la suite**, fichier par fichier, avec un recette mécanique en 8 étapes.

### Point de reprise exact (L12)

- **Dernière action réussie :** `ClubTeamsScreen` et `ClubCommunicationHub` convertis aux jetons du thème **actif** (`tokens.*`) au lieu de couleurs littérales. `grep -cE "#[0-9A-Fa-f]{6}|rgba\("` renvoie **0** sur les deux. Typecheck 0 erreur, **334 suites / 1 979 tests verts**.
- **Prochaine action :** convertir `ClubMatchesCenter` (39 couleurs), puis `ClubStandingsScreen` (28), `ClubSecondaryScreens` (20), en suivant la recette du § L11 ; ajouter chaque fichier à `CONVERTED` dans le test de garde. `ClubBrandColorsPanel` (35) demande un **examen préalable** : certains hex y sont du contenu (choix de couleur de club), pas du style.
- **Commande utile :** `npm run typecheck` puis `npm test` (**attendu : 0 erreur, 334 suites / 1 979 tests**), et le nouveau garde-fou `npx jest src/__tests__/clubAdminStyleAlignment.test.ts`.
- **Blocage de recette (le vrai frein) :** le pôle Club **ne peut pas être ouvert** dans l’aperçu depuis cette session. La déconnexion ne se déclenche ni par `preview_click` ni par dispatch de `PointerEvent` sur la barre de shell, et le session reste sur le pôle Coach après rechargement. Conséquence : ces conversions sont vérifiées **par typecheck, tests et relecture du diff**, pas par observation. Deux documents de recette visuelle restent donc non cochés : les cases Club du § L11 et la navigation de recherche du pôle Club (`SEARCH-04`).
- **Un test existant épinglait l’ancien contrat :** `clubChromeTokens.test.ts` exigeait `CLUB_TOKENS.surface` dans `ClubTeamsScreen` — c’est-à-dire la palette **statique** que la conversion remplace par le thème actif. Assertion **renforcée** (`tokens.surface`, et interdiction de `CLUB_TOKENS`), pas retirée.
- **Fichiers touchés par L12 :** `src/screens/club/ClubTeamsScreen.tsx`, `src/features/club/ui/ClubCommunicationHub.tsx`, `src/__tests__/clubAdminStyleAlignment.test.ts` (nouveau), `src/__tests__/clubChromeTokens.test.ts`.
- **Processus laissés actifs :** Metro en session `screen` sur `:8081`, aperçu sur `http://localhost:8081`. Ne pas supposer leur survie.

---

**L11 — Recherche fonctionnelle, messagerie catégorisée et création de groupe.**
Statut : **interrompue sur limite d’exécution, à un point de reprise propre.** `CHAT-03`
(catégories) et `CHAT-02` restent en l’état ; `CHAT-04`/`CHAT-05` (création et gestion de
groupe) sont **Bloqués** par une dépendance externe précise : la règle Firestore déployée
exige exactement deux participants. La règle est **corrigée dans le dépôt, pas déployée**
(`D-014`). `SEARCH-04` est vérifié pour la règle (tests) et le câblage (typecheck), **pas
encore observé en navigation** (voir plus bas).

### Point de reprise exact (L11)

- **Dernière action réussie :** parcours de création de groupe mené de bout en bout dans l’aperçu authentifié (1/3 nom → 2/3 deux membres réels dont un **mineur signalé** → 3/3 relecture → confirmation). Firestore a refusé, et l’interface a affiché le refus **traduit** au lieu de `Missing or insufficient permissions.` — brouillon conservé, aucun faux succès. Voir `CA-T13`.
- **Prochaine action :** (1) faire déployer `firebase deploy --only firestore:rules` par la personne habilitée, puis rejouer la création de groupe depuis l’aperçu et vérifier que **le fil réel s’ouvre** avec ses 3 participants ; (2) rejouer à l’écran la navigation de recherche du pôle Club (recherche → équipe, recherche → **événement ouvert**), seule case non recochée de `SEARCH-04`.
- **Commande utile :** `npm run typecheck` puis `npm test` (**attendu : 0 erreur, 333 suites / 1 974 tests**).
- **Ce qui a changé depuis L10 :** le refus d’un service n’est plus affiché brut ; une catégorie de recherche sans destination ouvrable n’est plus présentée du tout ; l’événement trouvé par la recherche ouvre son propre détail au lieu de déposer l’utilisateur sur l’onglet Calendrier.
- **Fichiers touchés par L11 :** `src/features/search/resultAvailability.ts` (nouveau), `src/components/search/GlobalSearchModal.tsx`, `src/screens/club/ClubCalendarScreen.tsx`, `src/features/club/shell/ClubAppShell.tsx`, `src/features/messaging/groupDraft.ts`, `src/components/messages/CreateGroupSheet.tsx`, `firebase/firestore.rules`, plus `src/__tests__/resultAvailability.test.ts` et `src/__tests__/groupDraft.test.ts` (nouveaux).
- **Processus laissés actifs :** Metro en session `screen` sur `:8081`, aperçu sur `http://localhost:8081`. Ne pas supposer leur survie.

---

**L10 — Refonte de l’espace Vidéo (Coach + Club/Admin), connexion Veo, QR et lecture intégrée.**
Statut : **interrompue sur limite d’exécution, à un point de reprise propre.** `VEO-08`
(module unique), `VEO-09` (point d’entrée « Connecter Veo »), `VEO-10` (QR : rien de simulé),
`VEO-11` (états compte/caméra/flux séparés), `VEO-13` (recherche et filtres) et `VEO-14`
(analyse séparée de la lecture) sont passés à **Vérifié dans le périmètre indiqué**. `VEO-12`
reste **À vérifier** : le lecteur intégré est observé ouvert avec son état d’erreur et sa
reprise, mais **aucun flux Veo réel** n’est lisible (client Veo non délivré). `VEO-01`,
`VEO-06` restent **Bloqués** (accès Partenaire Veo, appareils réels).

### Point de reprise exact

- **Vérifié :** `Vidéo › Appareils & connexions` a été ouvert dans les **deux** pôles (Coach puis Club). Pour chacun, `veo-connection-status`, `veo-state-axes`, `video-no-veo-access-note`, `veo-connect-panel`, `veo-product-facts` et `video-capability-list` apparaissent **une fois et une seule** — doublon corrigé et confirmé à l’écran. Côté Coach : mention « Lecture seule » présente, bouton d’association absent. La séparation des états s’est **auto-démontrée** : côté Coach, « MATÉRIEL · Associée · disponible » cohabite avec « FLUX · Aucun flux », parce que la captation du club de démonstration n’est pas partagée avec les coachs — un compte, une caméra et un flux ne s’impliquent pas l’un l’autre.
- **Prochaine action :** rejouer la recette Vidéo **sur appareil** (iPhone / iPad / PC) — seul niveau manquant pour `VEO-06` ; les états, la recherche et la lecture intégrée sont vérifiés dans l’aperçu navigateur (`CA-T10`), pas sur matériel. Puis trancher `CA-53` (écrans vidéo legacy non atteints).
- **Commande utile :** `npm run typecheck` puis `npm test` (attendu : 0 erreur, 328 suites / 1 880 tests).
- **Comptes de recette (documentés au dépôt) :** `coach.demo@proday.app` et `club.demo@proday.app` — shell authentifié accessible, c’est **nouveau** et cela débloque la recette visuelle des pôles.
- **Ce qui a changé depuis la session précédente :** pour la première fois, le shell authentifié a pu être **vu** (comptes de démonstration trouvés dans `docs/APP_REVIEW.md`) — la limite « aucun pixel observé » qui traînait depuis plusieurs sessions est levée au niveau **aperçu navigateur** ; elle reste entière au niveau **appareil**.
- **Fichiers touchés par L10 :** `src/features/video/VideoWorkspace.tsx` (nouveau), `VideoWorkspacePanels.tsx`, `veoWorkspace.ts`, `videoSurfaceTokens.ts` (nouveau), `src/features/club/ui/ClubVideoHub.tsx` (réécrit, enveloppe), `src/screens/coach/CoachVideoHubScreen.tsx` (réécrit, enveloppe), `src/features/coach/shell/CoachAppShell.tsx` (import mort retiré), `src/__tests__/veoWorkspace.test.ts`, `src/__tests__/videoWorkspaceShared.test.ts` (nouveau).
- **Processus laissés actifs :** Metro sur `:8081`, aperçu sur `http://localhost:8081`. Ne pas supposer leur survie.

### Écarts et décisions pris pendant L10

- **QR :** aucun scanner implémenté — voir `D-012`. Le parcours réel (QR affiché par le premier iPhone Veo Go, scanné par le second ; caméra Veo Cam en Bluetooth) est **décrit dans l’application**, marqué « Hors ProDay ».
- **Deux défauts trouvés en regardant l’écran** (chargement sans fin par dépendance de tableau instable, panneaux dupliqués) — voir `D-013`. Ni le typecheck ni 1 858 tests ne les avaient vus.
- **Legacy non traité :** `CoachMesVideosScreen` (1 158 lignes) est exporté par le baril `screens/coach` mais **plus rendu** depuis que « Mes vidéos » pointe sur le module partagé ; `ClubVideoCenterPanel` / `ClubVideoHardwarePanel` ne sont plus atteints non plus (le pôle Club passe par `ClubVideoScreen` → module partagé). Décision de suppression à prendre : `CA-53`.

## Boucle précédente

**VEO phase 1 — connexion, association club/match et lecture intégrée** (`VEO-01` à `VEO-06`).

## Modifications en cours dans cette session

- Ajout du registre canonique `docs/proday-requirements.md`.
- Audit de `src/services/veo/veo.service.ts`, du modèle vidéo, du lecteur intégré, des hubs Club/Coach et des règles Firestore.
- Correction engagée : ne pas qualifier automatiquement une source de direct/replay ; ne pas générer de métriques ou clips fictifs ; durcir la reconnaissance de domaine VEO.
- Retrait final des replis de démonstration : suppression de `DEMO_VIDEOS`/`DEMO_CLIPS` dans `ClubVideoHub.tsx`, suppression du repli d’URL sample dans `CoachMesVideosScreen.tsx` (nouveau message honnête `coachVideoMissingSourceAlert`), alignement du test `veoIntegration.test.ts` sur le service corrigé (`highlights_ready: false`, `source_verified`, `clips` vides), champ `source` manquant ajouté au repli local de `associateMatch`.
- Association VEO depuis les fiches de match du calendrier : préremplissage de `VeoMatchAssociateModal` (`eventId`/`eventTitle`/`teamLabel`/`scheduledAt`), bouton staff « Associer une captation VEO » dans `MatchHubOverviewTab` et ligne « Captation VEO » dans `CoachMatchSummaryTab`, modale branchée dans `MatchEventHubScreen` et `CoachMatchEventHub` avec rechargement au succès.
- Correctif Jest : mock `react-native-webview` dans `jest.setup.js` (le TurboModule natif est absent sous Jest) ; la suite `clubRedirections` ne charge plus en échec.
- Captation VEO visible sur la fiche de match : nouvelle section « Captation vidéo » dans `CoachMatchSummaryTab` (source `listVideosForEvent`, états vide/honnête, lecteur intégré au clic), filtrée par audience `share_with` selon le rôle (VEO-03 : joueur/parent uniquement si explicitement autorisés).
- Paramètres club → Connexions → VEO : panneau `VeoConnectionPanel` (état véridique, club associé, méthode réellement prise en charge) monté dans la destination « Paramètres » du pôle Club ; entrées vidéo déjà présentes : club « Vidéo & Analyse », coach « Mes vidéos ».
- Onglet « Clips & Buts IA » branché sur source réelle : mapper pur `clubVideoClips.ts` (`buildClipsFromVideos`) dérive les clips des captations persistées (`clips` de `club_match_videos`, minute/URL réelles, catégorie « other » sans invention), filtre « Autres » ajouté, tap sans fichier → refus explicite ; 3 tests unitaires.
- Audit global de l’application (évaluation lead) : typecheck 0 erreur, 1710/1710 tests, navigation 4 onglets et recherche par pôle présentes, module VEO complet mais bloqué en externe, 7 hubs club chargés par défaut sur des fixtures démo (DATA-01).
- Balayage DATA-01 des hubs club : `ClubMatchesCenter` (fixtures/buteurs/classements/amicaux vides par défaut, capture live honnête sans faux score ni faux « DIRECT », message « aperçu local » au lieu du faux succès d’enregistrement, libellés de classement véridiques, état vide matches), `ClubTeamsHierarchy` (équipes + surclassements), `ClubPlayersDirectory`, `ClubTrainingsOversight`, `ClubPitchSchedule`, `ClubChannelsHub` et `ClubCarpoolBoard` (défauts vides + états vides explicites), `ClubVideoHub` (Brief du Lundi sans stats ni récit fictifs, explication phase 2), `ClubMatchesScreen` (plus de repli sur fixtures démo).

## Dernière action réussie

- Inspection du dépôt, de la configuration Firebase, des règles d’accès vidéo et des composants consommateurs.
- `npm test -- --runInBand src/__tests__/veoIntegration.test.ts` : 1 suite, 10 tests passés.
- `npm test -- --runInBand src/__tests__/veoIntegration.test.ts src/__tests__/coachVideoHonesty.test.ts` : 2 suites, 14 tests passés après les modifications de cette session.
- `npm run typecheck` : 0 erreur après les modifications de cette session.
- Recherche finale `gtv-videos|commondatastorage|DEMO_VIDEOS|DEMO_CLIPS` dans `src/` hors tests : 0 résultat.
- `npm test` : 315/315 suites passées, 1707 tests verts (dont 13 `veoIntegration` avec les nouveaux tests de rattachement événement).

## Hypothèse examinée

Une URL de match VEO peut fournir un lecteur intégré uniquement si VEO autorise effectivement cet embed et si la session/diffusion est accessible. Une URL de fiche VEO n’est pas automatiquement un flux HTML5 lisible ; un fichier public d’exemple ne prouve pas un direct VEO.

## Blocages externes

- Aucun `EXPO_PUBLIC_VEO_CLIENT_ID`, `VEO_CLIENT_ID` ou `VEO_CLIENT_SECRET` fourni dans l’environnement inspecté : OAuth Partner VEO bloqué.
- Aucun compte VEO, club/match de test, diffusion en direct ou accès matériel réel fourni : connexion réelle, live et recette sur appareils non vérifiables dans cette session.
- Ces blocages empêchent de déclarer `VEO-01`, `VEO-04`, `VEO-05` et `VEO-06` vérifiés.

## Palette mesurée de la référence — appliquée au pôle Club (`D-011`)

Sur demande explicite (« les mêmes couleurs et le même fond que sur l'image »), la portée de D-008 est étendue : la référence fournit désormais aussi les **couleurs**. La quatrième capture (`IMG_4950.PNG`) n'étant pas lisible par le modèle, la palette a été **extraite des pixels** (Pillow) plutôt que devinée :

| Rôle | Valeur mesurée | Source |
| --- | --- | --- |
| Fond (canvas) | `#000000` | dominante des 4 captures |
| Surface (cartes) | `#191E23` rgb(25,30,35) | 28 % / 36 % / 27 % des pixels |
| Surface élevée | `#262E33` rgb(38,46,51) | 9,8 % / 10,2 % / **49 %** |
| Tons de bord | `#373D42` / `#414A51` | bords de cartes |
| **Accent** | **`#F8D548`** rgb(248,213,72) | **identique à l'octet dans les 4 captures** |
| **Encre sur accent** | **`#000000`** | **26 % / 20 % / 29 % des pixels intérieurs du FAB or** |
| Texte | `#FFFFFF` | 1,0–2,6 % des pixels |

**Défaut de lisibilité trouvé par la mesure :** `poleOnAccent('club')` retournait `#FFFFFF` via sa branche `default`. Du blanc sur `#F8D548` donne ~1,4:1 de contraste — illisible. La référence pose du **noir** (~15:1). Corrigé ; c'est exactement le défaut qu'une copie de palette « à l'œil » aurait laissé passer.

**Application :** `PRODAY_POLE_ACCENTS.club = '#F8D548'` fait suivre tout le pôle (tokens, `CLUB_SITE`, wash du shell, dock `rgba(25,30,35,0.88)`, Menu, dégradés CTA, carte d'univers, barre d'onglets, inscription). Les jetons **sémantiques** (`success`/`warning`/`danger`/`pitch`) restent vert/rouge : les 71 occurrences d'émeraude du chrome Club sont des états de succès, vérifiées une à une.

**Vérifications :** typecheck **0 erreur**, **326 suites / 1839 tests verts**, bundle Metro iOS **HTTP 200 (27 960 008 octets)** contenant `#F8D548`. **Aucun pixel rendu observé** (pas de compte Club de test, pas d'accès invité au shell Club).

**Points à trancher visuellement :** Club, Coach et Président sont désormais tous dans les ors — la distinction par couleur entre ces trois pôles se réduit ; et le contraste des textes sur `#191E23` n'a pas été mesuré à l'écran.

## L22 — Parcours RSVP joueur↔coach prouvé de bout en bout (défauts corrigés)

Re-test de la dernière Section 6 non prouvée, sur les vrais comptes de review
(`docs/APP_REVIEW.md`), écriture Firestore réelle (`proday-155b0`) :

1. **Baseline coach** : convocation « Séance d'entraînement » du 17 sept. →
   *« 25 réponses en attente »*, Lucas Démo listé sans réponse.
2. **Côté joueur** : le clic « Présent » échouait avec
   `FirebaseError: Missing or insufficient permissions` — cause : la branche
   invitée des règles `team_events` exigeait
   `resource.data.match_report_finalized_at == null` alors que ce champ n'est
   jamais écrit à la création (clé absente = **erreur** de règle, pas `null`).
   Correctif : `resource.data.get('match_report_finalized_at', null) == null`
   (même garde dans `isTeamEventStaffManageUpdate`). **Règles déployées** via
   `firebase deploy --only firestore:rules` (déploiement assumé, nécessaire à la
   preuve du parcours ; réversible en restaurant les lignes et redéployant).
3. **Second défaut découvert** : le RSVP s'enregistrait mais la promesse
   rejetait quand même — les effets secondaires post-écriture
   (`ensureTeamThread` → création de `message_threads` refusée au joueur)
   propageaient leur échec. L'utilisateur voyait « Réponse non enregistrée »
   alors que Firestore avait commité. Correctif : effets secondaires isolés
   (`try/catch` + `console.warn`) dans `updateRsvp` et `updateRsvpWithReason`.
4. **Preuve complète** : côté joueur « ✅ Tu es confirmé pour ce match », hub
   « 1 oui · 24 en attente », persistance après rechargement ; côté coach
   **« 25 → 24 réponses en attente »** sur le même enregistrement partagé.

**Bonus substantié (playtest de la déconnexion)** : `Alert.alert` de
react-native-web est un **no-op** (`static alert() {}`) — « Se déconnecter » et
« Supprimer définitivement mon compte » étaient des boutons morts déterministes
sur web. Nouvel utilitaire `src/utils/prodayAlert.ts` (web → `window.confirm`,
natif inchangé), appliqué à `ProfileScreen.handleSignOutPress` et
`useAccountDeletion` (les 9 autres usages `Alert.alert` du fichier restent
no-op web — même classe de défaut, correctif au fil des re-tests). Cela explique
une partie des « flakes Pressable » documentés depuis L14 : des handlers réels
appelaient une fonction vide. Déconnexion re-testée OK côté joueur **et** coach.

**Garde-fous** : contrat de règles étendu (3 tests dans
`clubFinanceRulesContract.test.ts`, même mécanique « inspection de code » que
l'existant — aucun émulateur dans le projet). Suite complète **361 suites /
2 375 tests**, tsc 0 erreur.

## Prochaine action précise

Pôle Club/Admin — **passe de fidélité à la forme de la référence terminée au niveau code** (`CA-50` dock, `CA-51` cartes plates, `CA-26` filet aligné) :

- `clubForm` étendu (`dockRadius: 999`, `dockIconSize: 24`, `dockLabelSize: 11`, `groupPaddingH: 18`, `rowGap: 12`, `separatorInset` **dérivé** = marge + icône + écart, `rowMinHeight` 62) ;
- `ClubTabBar` reconstruit : capsule, libellés en bas de casse, icône active nue (plus d'encart ni de soulignement), **FAB sorti du flux** (`fabAnchor` absolu, `top: -fabProtrusion`, `marginTop: fabProtrusion` sur le root) qui chevauche réellement l'arête du dock ;
- 8 dégradés diagonaux de carte, 5 rails, 7 bordures teintées et les ombres portées retirés sur `ClubCalendarChrome`, `ClubMatchesDay`, `ClubTrainingsDay`, `ClubTeamCard`, `ClubPlayersChrome`, `ClubFinanceChrome`, `ClubCoachesChrome`, `ClubHubChrome` ;
- garde-fou `clubReferenceForm.test.ts` porté à **30 tests** ;
- `npm run typecheck` → 0 erreur ; `npm test` → **325 suites / 1828 tests verts** ; bundle Metro iOS HTTP 200 (27 955 729 octets).

**Prochaines actions, par ordre :**
1. `CA-52` — même aplatissement pour `ClubCommunicationHub`, `ClubPlayerHero`, `ClubHubScreen` (famille communication/hero).
2. L3 — `CA-05`/`CA-08` : en-tête mobile, safe areas et recouvrements (le dock à capsule + FAB chevauchant doit être revérifié à 320 px et en présence du home indicator).
3. ~~Re-tester `CA-23`~~ **FAIT — et le test a renversé le constat (D-009 amendé).** Il n'existe **aucun chargement de police** dans `src/` et `src/theme/typography.ts` résout `fontFamily` vers `APPLE_FONT_STACK` : la pile Apple **est** rendue, l'affirmation « `ProDayText` force Inter » était fausse. Le contrôle a révélé un **défaut réel de rendu à l'échelle de l'application** : `ProDayText` retirait `fontWeight` du style final, et comme les 7 alias de famille pointent tous vers la même valeur sous la pile système, **tous les titres de tous les pôles s'affichaient en graisse normale**. Correctif : résolution extraite dans `src/theme/proDayTextStyle.ts` (module **pur**), `fontWeight` conservé, garde-fou `proDayTextWeight.test.ts` (8 tests dont un test de prémisse sur l'unicité des alias). `CA-23` passe de « Bloqué » à « Vérifié dans le périmètre indiqué » ; **reste la recette appareil** du rendu SF (graisses, texte agrandi 200 %) — item transverse de la checklist visuelle.
4. L7/L8 — recette module par module et matrice appareils : **bloqués** faute de compte Club de test et d'appareils.

**Blocage de preuve levé au niveau navigateur (L10) :** il n’existe pas d’accès invité au shell Club (`src/navigation/guestAccess.ts` ne couvre pas ce pôle), mais les **comptes de démonstration documentés au dépôt** (`docs/APP_REVIEW.md` : `coach.demo@proday.app`, `club.demo@proday.app`) ouvrent le shell authentifié dans l’aperçu. La conformité visuelle passe donc de *inspection de code + test + bundle* à **rendu observé dans l’aperçu navigateur** — elle reste **non vérifiée sur appareil**. Captures d’écran indisponibles dans cet environnement (webview non composité) : la preuve est l’arbre d’accessibilité du DOM rendu. `docs/proday-visual-qa-checklist.md` items `CL-10`→`CL-18` restent à cocher sur appareil.

Recette visuelle : `docs/proday-visual-qa-checklist.md` (socle transverse T-01→T-20 + items par pôle J-/C-/CL-/PA-/S-/SP-/PR-/AD-/EV-) est le point d'entrée de la prochaine recette sur appareil ; chaque case cochée alimente `docs/proday-verification.md`.

Refonte **Pôle Club & Admin** — registre dédié : `docs/proday-club-admin-rework.md` (IDs CA-NAV · CA-SEARCH · CA-UI · CA-SYNC · CA-PERM · CA-MOD · CA-DEV). Loops L1 et L2 exécutées : dock à 4 destinations (Accueil · Calendrier · Équipes · Menu) avec Matchs et Club déplacés au Menu sans perte d'accès, et recherche club réelle (barre visible Accueil + Menu, catégories équipes/événements limitées au club autorisé, résultat personne → fil existant ou unique). Typecheck 0 erreur, 323 suites / 1778 tests verts.

Reprise recommandée, dans l'ordre :

1. ~~**Pôle Club**~~ **fait (`CLUB-T03`)** — `CLUB_TOKENS` aligné sur DESIGN.md §2.1/§2.2/§2.3 (`bgElevated #0A0A0F`, `surface #121218`, `elevated`/`raised #1A1A24`, `borderStrong 0.14`, `foreground #FFFFFF`, `faint`=`textDim`) ; 41 surfaces navy/charcoal remplacées par les tokens dans 10 fichiers du chrome Club ; garde-fou `clubChromeTokens.test.ts` (7 tests) ; typecheck 0 erreur, 322 suites / 1757 tests. Suite : recette visuelle de confirmation (CL-05).
2. ~~**Autres fuites de gris hors pôles**~~ **fait (`UI-T04`)** — étape 2 terminée : thèmes de pôle (`prodayBrand`, `prodayAmateurTheme`, `prodayParentTheme`, `prodaySanteTheme`, `prodaySupporterTheme`, `prodayWomanTheme`, `playerSegmentTheme`, `playerDarkPremium`, `universeTheme`, `universeGradients`) alignés §2.1, puis 43 dernières surfaces locales remplacées dans `screens/AmateurClubScreen` (8), `screens/TeamManagementScreen` (16), `components/matchs/MatchNextUpCard` (3) et `MatchWeekStrip` (2), `screens/joueur/PlayerSaisonScreen` (1), `screens/player/PlayerHomeScreen` (1), plus les dégradés (`proClub.card`, `ambient`, `flashAmbient`, `gradientEnd`, `shieldGradient`). Garde-fou `poleSurfaceConsistency.test.ts` étendu (17 tests). Scan app-wide : **zéro** gris hors spec hors exceptions documentées. Typecheck 0 erreur, 323 suites / 1774 tests.
3. **Refonte Club/Admin** — loops restantes du registre : L3 (`CA-05`, `CA-08` en-tête mobile, recouvrements, safe areas), L4 (`CA-20`/`CA-21` faits ; reste `CA-22`→`CA-24` hiérarchie et alignements), L5 (`CA-30`→`CA-32` cohérence des enregistrements avec le Coach), L6 (`CA-40`→`CA-42` ; `CA-12` **critique traité** : périmètre par rôle, requête bornée au club, échec fermé, callable serveur testé — reste le resserrement des règles `/users`, bloqué sur migration + déploiement, `SEARCH-03`), L7 (recette module par module), L8 (matrice appareils, bloquée).
4. File DATA-01 restante puis file du rapport `docs/proday-gaps-report.md` par ID (SPORT-02, CHAT-01/02, SPORT-01/03, NOTIF-01, LINEUP-01/02, ADMIN-01, PDF-02, matrice UI/DEVICE).

Boucle **L9 — forme de la référence** exécutée sur le pôle Club/Admin (registre `docs/proday-club-admin-rework.md`) : `clubForm` (contrat de forme : rayon de groupe 22, ligne 68, icône 22, chevron 15, filet en retrait 36, champ 52/18, puce 44/999, action 52/999, FAB 56), nouvelles primitives `ClubSectionHeader` (libellé capitales + action alignée à droite), `ClubPillRow`/`ClubPill` (pilule sur fond élevé, sélection par contour d'accent), `ClubFeatureCard` (rendue seulement avec un visuel réel) et `ClubStatusPill` pleine ; `ClubBrandHeader` pose désormais le titre **sur le canvas** (pastille et puce lumineuse supprimées) ; `ClubHomeScreen` **réécrit** sur le workspace réel (plus de `94 %`, `16 / 16`, `39 Pts`, « RC France », brief IA narratif, ni de repli inventé `|| 24`). Vérifications : typecheck 0 erreur, **325 suites / 1820 tests verts** (`clubReferenceForm.test.ts` : 22 tests), bundle Metro iOS HTTP 200. Prochaine action du registre : **L3** (`CA-05`, `CA-08` — en-tête mobile, recouvrements, safe areas), puis **L7** (recette module par module). `CA-23` (typographie Apple) est **bloqué sur décision produit** : D-009 consigne que `ProDayText` force Inter et que la bascule SF/system exige un arbitrage plus une recette Apple. Limite inchangée : aucun pixel du pôle Club observé (écran de connexion Club dans l'aperçu, aucun compte de test) — items CL-10→CL-15 de la checklist à cocher sur appareil.

Blocages externes inchangés : identifiants Partenaire Veo non délivrés, aucune diffusion réelle de test, appareils iPhone/tablette non fournis (VEO-01/VEO-06 bloqués). **Mise à jour L10 :** la recette visuelle authentifiée Coach/Club **est désormais possible** dans l’aperçu (comptes de démonstration du dépôt) et a été exécutée pour l’espace Vidéo — voir `CA-T10`. Elle reste à faire pour les autres écrans du pôle Club, et reste impossible sur appareil.

## Services/processus

Serveur Metro de développement à l'écoute sur `:8081` (`npx expo start --localhost --port 8081`) : bundle iOS vérifié HTTP 200 (**28 031 936 octets**), contenant les repères de l’espace Vidéo — `veo-connect-panel`, `veo-state-axes`, `video-library-search`, `Connecter Veo` — et les étapes Veo Go réellement documentées (« Start Recording », « Join Recording »). Aperçu enregistré sur `http://localhost:8081`. Ne pas supposer sa survie à la session : si le port est libre, relancer Metro, puis se connecter avec un compte de démonstration du dépôt pour voir le shell authentifié.

## Décisions en attente

- Fournir les accès officiels VEO Partner OAuth ou confirmer que le périmètre autorisé est limité à un embed/public share.
- Fournir un compte club/match VEO de test et une diffusion réelle autorisée pour mesurer ouverture, latence, interruptions et droits.
- Fournir les appareils réels ou accepter une recette limitée aux environnements disponibles ; une simulation ne validera pas iPhone/tablette.

---

## L13 — Copilote Club (historique) et Finances Club (périodes + ventilation)

**Ce qui existait déjà** (ne pas refaire) : `CopilotChat` est un composant **partagé** par tous les
pôles, avec composer multiligne ancré, Envoyer/Stop, copier, réessayer, persistance cloisonnée par
portée, et — déjà présent — un panneau d’historique (`historySide` en large, `historySheet` en
étroit) avec sélection et suppression.

**Ajouté et vérifié à l’écran (pôle Coach, composant partagé) :**

| Élément | Preuve |
| --- | --- |
| Recherche dans l’historique | Saisie de `zzz-introuvable` → « Aucune conversation ne correspond à “zzz-introuvable”. » — état vide explicite, aucun résultat fabriqué |
| Regroupement par jour | Section **AUJOURD’HUI** rendue au-dessus de la liste |
| Aperçu de liste | Corrigé : affiche la **dernière** question (« Et quels sont les prochains matchs de l'equipe ? »), plus le premier message qui dupliquait le titre |

**Décision prise en cours de route :** la première version de `conversationExcerpt` renvoyait le
**premier** message utilisateur — c’est-à-dire exactement ce dont `deriveConversationTitle` tire le
titre. L’écran a montré la redondance (titre et aperçu quasi identiques). L’aperçu porte désormais la
dernière question et **disparaît** quand la conversation n’a qu’un tour : une ligne qui ne dit rien
de plus est du bruit.

**Manques du Copilote, assumés et non simulés :** pas de pièces jointes (aucun contrôle décoratif
n’est affiché à la place) ; pas de streaming — le service est en requête/réponse, et le composant
refuse déjà d’animer une fausse frappe ; pas de renommage (le titre est dérivé).

**Finance Club — la découverte qui commande tout :** le modèle `ClubFinanceEntry` est un **registre**
(`type`, `amount_eur`, `label`, `category`, `entry_date`, `member_*`, `status`). Il n’a **ni montant
dû, ni échéance, ni moyen de paiement, ni justificatif, ni budget, ni confirmation de prestataire**.
Conséquence directe : « reste à recouvrer », « impayé », « en retard », « budget prévu/réalisé » et
« reçu » **ne peuvent pas être calculés honnêtement** — les produire demanderait d’inventer un
montant par défaut et une date d’échéance, c’est-à-dire exactement ce que l’invariant « aucune
donnée de démonstration » interdit. Ces fonctions demandent d’abord une **extension de schéma**
(Firestore + règles), pas du code d’interface.

**Ajouté à la place, calculable depuis les données réelles :** filtre de **période** (Ce mois / Mois
dernier / Saison, avec l’intervalle écrit sous les puces — la saison est définie du 1er août au
31 juillet dans une constante, jamais choisie implicitement) ; **ventilation par catégorie** avec
entrées, sorties et net, triée par poids ; net de la période ; et **deux limites dites à l’écran** :
toute écriture est une saisie manuelle (aucun rapprochement bancaire), et aucun « reste à recouvrer »
n’est calculé, avec la raison. Les écritures annulées ou supprimées sont écartées des totaux.

**Vérifications :** typecheck 0 erreur ; **335 suites / 2 004 tests verts** (12 nouveaux
`copilotHistory`, 11 nouveaux sur périodes/ventilation dans `clubFinanceModel`).

**Reste à faire — Finance :** budget prévu/réalisé, échéances et impayés, relances avec relecture du
destinataire, justificatifs/reçus, exports filtrés par période et périmètre, historique des
modifications. **Chacun de ces éléments dépend d’une extension du modèle de données.**

**Processus laissés actifs :** Metro en session `screen` sur `:8081`, aperçu sur `http://localhost:8081`.

---

## Boucle « Club & Admin » — Covoiturage, Entraînements, Événements & Tournois, sync FFF 3 h

Poursuite de la refonte du pôle **Club/Admin** sur les trois modules encore en chantier, plus la
planification FFF. Chaque module a suivi le cycle *inspecter → implémenter → tester → corriger*.

**Covoiturage** (`ClubCarpoolBoard` réécrit) : trajets reliés à un événement et à une équipe, offre avec
point de départ / heure / places / consignes, demande de place, acceptation ou refus par le conducteur,
passagers confirmés et capacité restante, annulation de trajet avec notification des passagers en attente
et confirmés, accès à l'événement et à la conversation autorisée. **Garde-fous testés (11 tests)** : pas de
surbooking, pas de doublon, pas de réservation par le conducteur de son propre véhicule, trajet fermé ou en
cours refusé, validation réservée au conducteur.

**Entraînements** (`ClubTrainingsScreen` + `clubTrainingsModel`) : distinction explicite programmée /
terminée / **annulée** (l'annulation est un `live_state.status = 'cancelled'` sur la même `TeamEvent` que
côté Coach — une seule séance sous-jacente), recherche par équipe / lieu / titre / organisateur, filtres
d'état avec compteurs, durée planifiée, actions détaillées. Les séances annulées restent visibles sous
« Toutes » avec leur pastille mais ne sont jamais mises en avant tant qu'une séance active existe.

**Événements & Tournois** (`ClubEventOrganization` réécrit + `clubTournaments.service`) : création,
cycle de vie complet (brouillon → inscriptions ouvertes → fermées → confirmé → en cours → terminé, plus
annulation), dates / lieu / catégories / format / capacité / date limite / conditions, équipes inscrites,
calendriers et résultats, report et annulation journalisés. **Transitions, capacité et date limite sont
validées côté service** (16 tests).

**Participation sans compte ProDay** : invitation avec jeton, page publique
`/tournoi/[id]/invitation/[token]` (aucune création de compte, aucune donnée privée du club), acceptation
ou refus, **jamais « confirmé » sans approbation organisateur** (`pending_approval`), expiration,
révocation, doublon d'inscription et capacité contrôlés. La fonction publique
`tournamentExternalInvite` applique CORS restreint et rate limit par IP.

**Synchronisation FFF** : la planification quotidienne est remplacée par **toutes les 3 heures**
(`scheduledFffStandingsSync`, indépendante de l'app), avec verrou anti-chevauchement, reprises sur erreur
temporaire, journal `sync_runs`, méta `fff_league_standings/_sync_meta` et refresh manuel admin limité à
15 min. Un échec **conserve** le dernier classement valide et son horodatage ; `last_success_at` n'est
jamais inventé. Le badge client (`describeStandingsFreshness`) affiche l'ancienneté réelle et bascule en
obsolète au-delà de deux cadences. Le worker quotidien historique a été réduit à la création de documents
manquants : c'est lui qui écrivait des `lastSyncAt` frais sur des lignes anciennes. Les limites de source
sont documentées dans `docs/FFF_SYNC_3H.md` (API-Football payante, DOFA non officielle et non documentée).

**Vérifications :** typecheck app **0 erreur**, typecheck Functions **0 erreur**, typecheck site **0 erreur** ;
**342 suites / 2 101 tests verts** (+ 4 suites : `carpoolSeatWorkflow` 11, `clubTournamentWorkflow` 16,
`fffStandingsFreshness` 6, `clubTrainingsModel` étendu) ; **7/7** tests `node --test` sur le moteur de sync ;
bundle Metro iOS **HTTP 200 (29 574 631 octets)**.

**Déploiement (même session) :** `scheduledFffStandingsSync`, `syncFffStandingsNow` et
`processFffEnterpriseDailyStandingsWorker` sont **déployées** sur `proday-155b0`. Le job Cloud Scheduler est
`ENABLED` en `every 3 hours` (TZ Europe/Paris) — il portait auparavant `every day 04:15`. Quatre passages
réels ont été exécutés et journalisés (`sync_runs` : `trigger=scheduled`, `maj=0 échecs=4 ignorés=10` avec le
**motif** de chaque échec) ; `_sync_meta` porte `schedule = every 3 hours`, `last_trigger = scheduled`,
`sync_health = error` et **aucun** `last_success_at` ; aucun verrou orphelin. Contrôle reproductible :
`npm run fff:status` (lecture seule, `scripts/fff-sync-status.mjs`).

**Suite (même session) — le pôle Club devient visible :** le compte démo officiel du dépôt
(`club.demo@proday.app`, club `proday_demo_club`) a été ouvert dans l'aperçu live en vidant la persistance
Auth du navigateur puis en se connectant : le pôle Club est désormais **affiché sur le compte démo**, donc
consultable par l'utilisateur dans l'onglet Preview. Un audit géométrique du DOM (rognage sans ellipse,
cibles tactiles réelles, débordement, chevauchement) a été passé sur 12 routes : aucun défaut de mise en
page réel, rayons et surfaces conformes. **2 défauts corrigés** : actions de section à 21 px sans `hitSlop`
(toutes les pages concernées) et navigation dupliquée dans le Menu (« Rôles & Permissions » deux fois,
« Profil club » doublant « Identité du club »). Inventaire complet : `docs/proday-club-checklist.md`.

**Limites :** aucune capture d'écran possible (webview sans frames) et **une seule largeur auditée
(570 × 891)** — desktop, tablette et iPhone non vérifiés ; **8 écrans et 20 panneaux/dialogues restent non
inspectés** (liste explicite dans `docs/proday-club-checklist.md` §7) ; **aucune source FFF
n'est configurée** (`EXTERNAL_SCORES_API_KEY`, `DOFA_COMPET_IDS`), donc la cadence tourne mais ne rapatrie
encore aucun classement — et l'app le dit honnêtement ; la **prochaine occurrence purement planifiée** est à
`2026-09-15T21:30:00Z` (à relire avec `npm run fff:status`) ; les règles Firestore ne sont pas déployées et le
parcours invité externe n'a pas été exécuté de bout en bout ; l'envoi réel des notifications d'annulation de
trajet n'est pas exécutable sous Jest (import dynamique).
