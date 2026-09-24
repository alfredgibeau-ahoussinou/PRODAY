# ProDay — Refonte Pôle Club & Admin (checklist persistante)

Version 1 — 15 septembre 2026. Registre de travail de la refonte du pôle **Club/Direction**
et de l'**Admin**. Il complète `docs/proday-requirements.md` (registre global) et
`docs/proday-visual-qa-checklist.md` (recette visuelle) ; il ne les remplace pas.

## Sources de vérité

| Source | Portée |
| --- | --- |
| `DESIGN.md` §1–§7 | Socle Dark Premium (couleurs §2.1–§2.3, typo §3, espacements §4, composants §5, icônes §6, accessibilité §7) |
| `DESIGN.md` §8.3 | Identité du pôle Club : « centre de commandement institutionnel », accent émeraude `#10B981` |
| Brief de refonte Club/Admin (session 15/09) | Navigation 4 destinations, recherche visible Accueil + Menu, dashboard, modules, workflows, permissions, appareils |
| `docs/proday-gaps-report.md` | File transversale (UI-01, ADMIN-01, SPORT-*, CHAT-*) |
| `docs/proday-decisions.md` | D-006 (divergences d'accent assumées) |

## États autorisés

Ceux de `docs/proday-loop-state.md` §D1 : **À examiner · À réaliser · En cours · À vérifier ·
Vérifié dans le périmètre indiqué · Bloqué · Régression**. Aucune ligne ne passe à
« Vérifié » sans preuve explicitement rattachée (niveau de preuve §G du protocole).

---

## 1. Navigation — `CA-NAV`

| ID | Exigence | Constat vérifié (inspection) | Critère d'acceptation | Priorité | État |
| --- | --- | --- | --- | --- | --- |
| CA-01 | Dock bas = **4** destinations : Accueil · Calendrier · Équipes · Menu | Le dock exposait **5** entrées (`Accueil · Équipes · Matchs · Outils · Club`) — `src/features/club/navigation/clubNavConfig.ts` | `CLUB_PRIMARY_NAV_IDS` = `['today','calendar','teams','plus']` ; labels `Accueil/Calendrier/Équipes/Menu` | Majeur | **Vérifié dans le périmètre indiqué** (config + test ; recette visuelle appareil en attente) |
| CA-02 | Les modules retirés du dock restent atteignables | `matches` et `club` ne figuraient dans **aucun** `CLUB_TOOL_GROUPS` — les sortir du dock les aurait rendus inaccessibles | `matches`, `club` dans les groupes Menu ; `primaryTabForClubNav('matches'\|'club') === 'plus'` | Majeur | **Vérifié dans le périmètre indiqué** |
| CA-03 | Pas de raccourci répété | `calendar` et `teams` étaient à la fois onglets du dock et entrées Menu | Les groupes Menu ne répètent pas les destinations du dock | Mineur | **Vérifié dans le périmètre indiqué** (assertion sur chaque id du dock) |
| CA-04 | Menu = accès organisé aux modules restants | Le groupe « Admin » ne contenait pas l'identité du club | Groupe Menu contenant `club` | Majeur | **Vérifié dans le périmètre indiqué** |
| CA-05 | Chrome visible sur mobile | `ClubPageChrome` rendu avec `visible={wide}` seulement — aucune action d'en-tête sur mobile | En-tête (recherche) disponible ≤ breakpoint, sans recouvrir le contenu ni la safe area | Majeur | En cours (barre de recherche désormais rendue sur l'Accueil à toutes les largeurs ; l'en-tête complet reste desktop — safe area à recetter sur appareil) |
| CA-06 | Pas de contrôle non fonctionnel | L'icône d'en-tête « Rechercher » exécutait `onSelect('plus')` : elle naviguait au lieu de chercher | L'action « Rechercher » ouvre la recherche | Majeur | **Vérifié dans le périmètre indiqué** |
| CA-07 | Barre de recherche **visible** sur Accueil | Aucune barre de recherche sur le pane Accueil ; la barre n'existait que dans le Menu | Barre visible en Accueil et dans Menu | Majeur | **Vérifié dans le périmètre indiqué** (Accueil : barre du shell ; Menu : barre branchée sur la même recherche) |
| CA-08 | Pas de recouvrement | Dock flottant + safe area : `ClubTabBar` ajoute `insets.bottom` ; à confirmer avec barre d'onglets système et clavier | Aucune zone interactive recouverte, contenu défilable jusqu'au dernier élément | Majeur | À examiner |
| CA-09 | Cohérence desktop / tablette / mobile | `wide = width >= clubChrome.wideBreakpoint` — un seul seuil, aucune étape tablette | Sidebar desktop, dock mobile, et un rendu tablette sans étirement de texte | Majeur | À examiner |

## 2. Recherche — `CA-SEARCH`

| ID | Exigence | Constat vérifié | Critère d'acceptation | Priorité | État |
| --- | --- | --- | --- | --- | --- |
| CA-10 | Recherche des personnes, équipes, événements, fonctions | `SearchResultCategory` = `all/pages/players/clubs` : **équipes et événements absents** | Catégories `teams` et `events` alimentées par les services réels, filtrées par club autorisé | Majeur | **Vérifié dans le périmètre indiqué** (`searchTeams` → `teamsService.listByClubId`, `searchEvents` → `teamEventsService.listForClub`, sans `clubId` ⇒ aucun résultat) |
| CA-11 | Personne → profil → conversation autorisée | « Envoyer un message » basculait sur l'onglet messages sans reprendre le fil | Depuis un résultat personne : fil existant repris, sinon créé une seule fois, après contrôle des droits | Majeur | En cours (passage par `openContactConversation` : vérification de rôle, permission parentale, `getOrCreateThread` idempotent ; recette à deux comptes requise) |
| CA-12 | Résultats conformes aux droits | `searchPlayers` interrogeait `usersService.listPlayers`, c'est-à-dire **toute** la collection `users` (tous clubs) | Aucun résultat hors périmètre autorisé ; aucune fuite inter-clubs | Critique | En cours — **application fermée**, **règles encore ouvertes** : périmètre résolu par rôle (`resolvePlayerSearchScope`, échec fermé), requête bornée au club (`usersService.listPlayersInClub`), recherche globale réservée à l'administration et aux rôles agent/recruteur ; callable serveur `searchClubMembers` écrit (résout le club depuis `users/{uid}`) mais **non déployé** ; `allow list` sur `/users` reste ouvert à tout compte connecté — resserrement impossible sans migrer les autres annuaires (D-007, `SEARCH-03`) |
| CA-13 | Recherche jamais fictive | Service injoignable ⇒ liste vide (déjà en place pour joueurs/clubs) | Idem pour équipes/événements ; aucun repli démo | Majeur | **Vérifié dans le périmètre indiqué** (test : `searchEvents` renvoie `[]` sans données réelles) |

## 3. Visuel & composants partagés — `CA-UI`

| ID | Exigence | Constat vérifié | Critère d'acceptation | Priorité | État |
| --- | --- | --- | --- | --- | --- |
| CA-20 | Surfaces et accent du pôle | Dock : `rgba(14, 16, 24, 0.72)` + bordure `rgba(255,255,255,0.12)` ; surfaces neutres `#121218`/`#1A1A24` et accent émeraude `#10B981` sans rapport avec la charte fournie | Palette **mesurée au pixel** sur les captures : `surface #191E23`, `raised #262E33`, accent or `#F8D548`, encre noire sur l'accent ; bordures alpha §2.2 conservées | Majeur | **Vérifié dans le périmètre indiqué** (12 fichiers de tests réalignés, gardes qui verrouillent la mesure ; **divergence assumée** de DESIGN.md §2.1 — D-011 ; aucun pixel rendu observé) |
| CA-53 | Encre lisible sur l'accent de pôle | `poleOnAccent('club')` retournait `#FFFFFF` via sa branche `default` — sur l'or `#F8D548` cela donne ~1,4:1 de contraste | Encre noire sur l'or, mesurée sur la référence | Critique | **Vérifié dans le périmètre indiqué** (mesure : `#000000` = 20–29 % des pixels intérieurs du FAB ; `poleOnAccent('club') === PRODAY_MASTER.black`, test) |
| CA-21 | Pas d'accent d'un autre pôle dans le chrome partagé | `GlobalSearchBar`/`GlobalSearchModal` codent `ELITE_COLORS.pitchGreen` en dur sur les lignes joueur | Aucun résidu Elite dans le chrome Club : accent fourni par l'appelant (émeraude Club) | Mineur | **Vérifié dans le périmètre indiqué** (lignes joueur/équipes/événements sur `accent` ; les autres pôles passent leur propre accent, comportement inchangé) |
| CA-22 | Hiérarchie et cartes utiles | L'Accueil empilait 5 blocs hétérogènes dont 3 fabriqués (hero match « RC France », bannière classement « 39 Pts », brief IA narratif) et une grille de 8 tuiles 2 colonnes | Blocs supprimés ; hiérarchie de la référence (encart d'identité → puces → indicateurs réels → prochain rendez-vous → modules → équipes → adhésions) | Majeur | **Vérifié dans le périmètre indiqué** (source + tests de garde : plus aucun littéral fabriqué) |
| CA-23 | Typographie Apple + repli système | **Constat initial FAUX, corrigé** (amendment D-009) : `src/theme/typography.ts` résout `fontFamily` vers `APPLE_FONT_STACK` (`System` iOS / pile SF Pro web / `Roboto` Android) et **aucune police tierce n'est chargée** (pas de `useFonts`/`loadAsync`) — la pile Apple est bien rendue. Le vrai défaut : `ProDayText` **retirait `fontWeight`** du style final (héritage de polices où la graisse était encodée dans le nom de famille) ; comme les 7 alias de famille retournent la même valeur sous la pile système, **tous les titres de l'application retombaient en graisse normale** | La graisse demandée est conservée, la pile système reste imposée, la résolution devient pure et testable | Majeur | **Vérifié dans le périmètre indiqué** — `src/theme/proDayTextStyle.ts` (nouveau, pur), `ProDayText` réécrit, `proDayTextWeight.test.ts` (8 tests dont la prémisse « les alias sont identiques ») ; typecheck 0 erreur, 326 suites / 1836 tests verts. **Reste :** recette appareil du rendu SF (graisses, texte agrandi 200 %) |
| CA-24 | Alignement titres / valeurs / actions | Tableaux et listes Club (effectifs, finances, classements) | Colonnes alignées, valeurs à droite, actions regroupées | Mineur | À examiner |
| CA-25 | Forme de référence — titre sur le canvas | `ClubBrandHeader` rendait le titre dans une **pastille** teintée d'accent avec puce lumineuse, sur un bloc à fond `bg` et rayon de carte | Titre `h1` posé directement sur le canvas, crest conservé, sous-titre `muted` ; plus de pastille ni de puce ; aucun fond/rayon sur le bloc | Majeur | **Vérifié dans le périmètre indiqué** (17 écrans consommateurs ; tests de garde) |
| CA-26 | Forme de référence — listes groupées | Le Menu et l'Accueil rendaient des grilles de tuiles / cartes bordées empilées ; le filet en retrait (36) **coupait le libellé** qu'il séparait | `ClubListGroup` (rayon 22, fond `surface`, **sans bordure ni ombre**) + `ClubActionRow` (icône contour 22, libellé 17, chevron 15 `textDim`, ≥ 62) et filet aligné **sous le libellé** (`separatorInset = marge 18 + icône 22 + écart 12 = 52`) | Majeur | **Vérifié dans le périmètre indiqué** (Menu + Accueil ; capture appareil en attente) |
| CA-27 | Forme de référence — puces et boutons | Puces en colonnes égales avec remplissage plein à l'accent ; actions secondaires en cartes bordées | `ClubSegmentedControl` : sélection = **contour d'accent** + libellé accent (jamais de remplissage) ; `ClubPillRow`/`ClubPill` (pilule 999, hauteur 44, fond `elevated`) ; bouton secondaire = pilule à contour fin sans remplissage | Majeur | **Vérifié dans le périmètre indiqué** |
| CA-28 | Forme de référence — FAB central du dock | `ClubCopilotFab` existait mais n'était **jamais rendu** ; le dock n'avait ni FAB ni forme cible | FAB 56 sur l'arête du dock, branché sur le flux de création existant (`openCreate`), créneau réservé pour ne rien recouvrir | Majeur | **Vérifié dans le périmètre indiqué** (bundle + tests ; rendu appareil en attente) |
| CA-29 | Aucun chiffre de démonstration sur l'Accueil | `ClubHomeScreen` affichait `94 %` de recouvrement, `16 / 16 convoqués`, `39 Pts`, `1er · Zone Montée N3`, un adversaire « RC France » et un brief IA narratif ; effectifs avec repli inventé (`ws.players.length \|\| 24`) | Toutes les valeurs viennent du workspace réel (`useClubWorkspace`), identité FFF affichée uniquement si le champ existe, états vides explicites, aucune valeur de repli inventée | Critique | **Vérifié dans le périmètre indiqué** (garde `clubReferenceForm.test.ts` : littéraux d'origine interdits, valeurs liées aux comptes réels) |
| CA-24 | Alignement titres / valeurs / actions | Tableaux et listes Club (effectifs, finances, classements) | Colonnes alignées, valeurs à droite, actions regroupées | Mineur | À examiner |
| CA-50 | Dock conforme à la forme de référence | Libellés en **capitales 9 px**, encart d'accent derrière l'icône active, **soulignement** sous l'onglet actif, dock au rayon 24 et FAB **enfermé dans** le dock (crenéle interne, 20 px de vide au-dessus) | Capsule à extrémités pleinement arrondies (`dockRadius` 999 / flou clippé au même contour) ; libellés en **bas de casse** 11 px ; icône active **sans encart et sans soulignement** (couleur seule) ; FAB ancré **hors du flux**, dépassant de `fabSize × fabOverlap` (28) sur l'arête, créneau libre réservé dans la rangée | Majeur | **En cours** — forme implémentée et verrouillée par test ; rendu appareil non vu (aucun compte Club de test) |
| CA-51 | Cartes structurelles plates et neutres | Les heroes Calendrier / Matchs / Entraînements / Effectifs / Finances / Coachs et les cartes équipe peignaient un **lavage diagonal de couleur** sur toute la surface, une **bordure teintée** (`tone.color + '55'`), un **rail** de 3–4 px et une **ombre portée** ; le hub peignait un dégradé bleu nuit `rgba(24,28,42,0.95)` et un halo blanc | Une seule surface neutre (`tokens.surface`), rayon unique `clubForm.groupRadius` (22), **sans** dégradé, rail, bordure teintée ni ombre ; la couleur ne circule plus que par les pastilles d'état et les icônes | Majeur | **En cours** — 7 fichiers aplatís + garde-fou ; reste la famille communication/hub (`CA-52`) |
| CA-52 | Famille communication / hub encore lavée | `ClubCommunicationHub` (3 lavages diagonaux + gris hors spec), `ClubPlayerHero` (lavage vertical plein cadre), `ClubHubScreen` (halo blanc) | Même traitement plat que `CA-51` | Mineur | À réaliser |
| CA-54 | Grille de couleurs du chrome Club | 71 occurrences d'émeraude et de gris figés dans `components/club/ui` + `screens/club` : majoritairement des **états sémantiques** (conformité, convocations envoyées, places disponibles, « Confirmer ») — corrects — mais aucun ne passe par `tokens.success`/`warning`/`danger` | Aucun statut codé en dur ; tout passe par les jetons sémantiques du pôle | Mineur | À réaliser |

## 4. Cohérence avec le Coach — `CA-SYNC`

| ID | Exigence | Constat vérifié | Critère d'acceptation | Priorité | État |
| --- | --- | --- | --- | --- | --- |
| CA-30 | Même enregistrement des deux côtés | `ClubTrainingsOversight` / `clubTrainingsModel` et l'oversight coach consomment `teamEventsService` (source unique) ; `teamsService`/`playersService` partagés | Une séance, un joueur, un match ou une compo publiée se réfèrent au même document | Critique | À vérifier |
| CA-31 | Statuts d'événement et filtres identiques | Modèles `club*Model.ts` dupliquent une partie des libellés du coach | Libellés et formats de date issus d'une source commune | Majeur | À examiner |
| CA-32 | Cartes joueur/équipe partagées | `ClubPlayerCard`/`ClubRosterPlayerCard` vs cartes coach | Composant commun ou variantes documentées | Mineur | À examiner |

## 5. Permissions & intégrité — `CA-PERM`

| ID | Exigence | Constat vérifié | Critère d'acceptation | Priorité | État |
| --- | --- | --- | --- | --- | --- |
| CA-40 | Le service fait autorité | `resolveClubNavAccess` ne filtre que par **formule** (`requiresAnyFeature`), pas par rôle ; `ADMIN-01` « À examiner » | Les règles Firestore/Cloud Functions refusent les accès non autorisés ; masquer un onglet ne suffit pas | Critique | À examiner |
| CA-41 | Coach sans détails financiers | `finances` exige `full_admin` (formule) — indépendant du rôle | Un coach sans droit financier reçoit un refus explicite du service | Critique | À examiner |
| CA-42 | Écritures sans doublon | Actions d'invitation/import/convocation | Rejeu sans doublon ; état en attente/réussi/échoué fidèle | Majeur | À examiner |

## 6. Modules — `CA-MOD`

| Module | Écran / hook | Constat | État |
| --- | --- | --- | --- |
| Équipes & effectifs | `ClubTeamsScreen`, `ClubTeamsHierarchy`, `clubTeamsModel` | Existe ; import PDF `ClubImportSquadPanel` + `footclubsCsvParser` à recetter (aucun compte créé) | À examiner |
| Suivi entraînements | `ClubTrainingsOversight`, `ClubTrainingsScreen`, `clubTrainingsModel` | Reconnecté à `teamEventsService` (DATA-01) ; programmée / terminée / **annulée** distinguées, recherche + filtres d'état, durée planifiée, même `TeamEvent` que le pôle Coach ; présences testées par modèle (`clubTrainingsModel.test.ts`) — recette écran à faire | Fait au niveau code |
| Covoiturage | `ClubCarpoolBoard`, `ClubCarpoolScreen`, `carpoolOffers.service` | Trajets reliés à un événement et à une équipe, offre / demande de place / acceptation / refus / annulation notifiée, capacité restante ; surbooking, doublon et réservation par le conducteur refusés par test | Fait au niveau code |
| Événements & tournois | `ClubEventOrganization`, `clubTournaments.service`, `ClubTournamentEvent` | Cycle de vie validé, capacité et date limite contrôlées, journal des changements, report/annulation ; **invitations externes sans compte ProDay** (jeton, page publique, approbation organisateur obligatoire) | Fait au niveau code |
| Finances | `ClubFinanceChrome`, `clubFinanceModel`, `useClubFinance` | Encaissements manuels/relances : à recetter, droits inclus | À examiner |
| Matchs & résultats | `ClubMatchesCenter`, `clubMatchesModel` | Scores manuels + cohérence vues autorisées à recetter | À examiner |
| Amicaux | `clubTournaments.service`, invitations | Création sans source FFF à recetter | À examiner |
| Classements | `ClubStandingsScreen`, `clubStandingsModel`, `frenchFootballStandings.service` | Source et horodatage affichés ; correctif manuel **préservé** face aux mises à jour de la source (provenance conservée) ; sync serveur **toutes les 3 h** avec verrou, journal et indicateur d'obsolescence + refresh manuel limité (voir `docs/FFF_SYNC_3H.md`) | Fait au niveau code |
| Messagerie | `ClubCommunicationScreen`, `ClubChannelsHub` | Canaux club ; DM/annonces séparés à recetter | À examiner |
| Réglages club | `ClubHubScreen`, `ClubBrandColorsPanel`, `permissions` | Identité, membres, invitations, connexions VEO | À examiner |
| Vidéo / VEO | `ClubVideoHub`, `ClubVideoProvider` | Aucun flux réel : identifiants Partenaire VEO non délivrés | Bloqué |

## 7. Appareils — `CA-DEV`

Matrice à cocher uniquement avec preuve : PC Windows (Edge/Chrome 1024–1920), Mac
(Safari/Chrome), iPad + tablette Android (768–1024), iPhone (320–430). Tester : tactile,
souris, clavier/focus, noms longs, états vides, chargements, texte agrandi 200 %,
rotation, clavier à l'écran. Une simulation navigateur ne vaut pas test sur appareil.

---

## Boucles d'implémentation

| Boucle | Contenu | État |
| --- | --- | --- |
| L1 | `CA-01`→`CA-04` : dock 4 destinations, modules déplacés au Menu, groupes sans doublon | **Fait** — config + tests (`clubNavConfig.test.ts` : dock à 4, labels, aucun raccourci répété, `matches`/`club` joignables) |
| L2 | `CA-06`, `CA-07`, `CA-10`, `CA-11`, `CA-13` : recherche réelle visible Accueil + Menu, catégories équipes/événements, personne → fil | **Fait au niveau code** — shell Club propriétaire de la recherche (`GlobalSearchModal` avec `clubId`), barre visible Accueil + Menu, service étendu, `CA-11` en recette |
| L3 | `CA-05`, `CA-08` : en-tête mobile, recouvrements, safe areas | À réaliser |
| L4 | `CA-20`, `CA-21` : surfaces et accents du chrome Club | À réaliser |
| L5 | `CA-30`→`CA-32` : cohérence des enregistrements et composants avec le Coach | À vérifier |
| L6 | `CA-40`→`CA-42` : permissions côté service, écritures sans doublon | À examiner |
| L7 | `CA-MOD` : recette module par module (open → filtre → inspecte → agit → persiste → rouvre) | À examiner |
| L8 | `CA-DEV` : matrice appareils | Bloqué (appareils non fournis) |
| L9 | `CA-22`, `CA-25`→`CA-29` : forme de la référence (titre sur canvas, listes groupées, puces, boutons, FAB, Accueil sans démonstration) | **Fait au niveau code** — primitives étendues, Accueil réécrit sur données réelles, en-tête d'écran réaligné ; recette pixel appareil en attente |
| L10 | `CA-23` : typographie Apple vs Inter | **Rouverte puis traitée** — le constat de D-009 était faux (aucune police tierce chargée, la pile Apple est rendue) et cachait un vrai défaut : la graisse était retirée du style final, donc **tous les titres s'affichaient en graisse normale**. Résolution extraite dans `src/theme/proDayTextStyle.ts` (pure), `fontWeight` conservé, `proDayTextWeight.test.ts` (8 tests). Recette appareil du rendu SF encore à faire |
| L11 | `CA-50`, `CA-51`, `CA-53` : passe de fidélité au dock, aux cartes et **à la palette** | **Fait au niveau code** — dock reconstruit (capsule, libellés bas de casse, icône nue, FAB chevauchant), 7 fichiers de cartes aplatís, palette mesurée appliquée au pôle (fond noir, surfaces gris bleuté froid, or `#F8D548`, encre noire sur l'or), garde-fous portés à 30 tests + 12 fichiers réalignés ; recette pixel appareil non disponible |
| L12 | `CA-30`→`CA-33` (covoiturage), `CA-34`→`CA-37` (entraînements), `CA-38`→`CA-49` (événements/tournois + invités externes), `CA-05` (sync FFF 3 h) | **Fait au niveau code** — `ClubCarpoolBoard` reconstruit (workflow relié à l'événement, capacité, annulation notifiée), entraînements avec états explicites et recherche, `ClubEventOrganization` reconstruit (cycle de vie, équipes, report/annulation, invitation externe partageable), page publique d'invitation sans compte ProDay, sync FFF passée à 3 h avec verrou/retries/obsolescence honnête. Preuves : 4 nouvelles suites (11 + 16 + 6 tests + extension `clubTrainingsModel`), 7 tests `node --test` Functions, typecheck app/Functions/site à 0 erreur, 342 suites / 2 101 tests verts, bundle Metro iOS HTTP 200 ; registre de preuves `CA-T10`→`CA-T12` et `FFF-T06`. **Reste :** recette écran (pôle Club inaccessible dans l'aperçu) et déploiement des fonctions planifiées |

## Journal d'exécution

### Session du 15 septembre 2026 — loops L1 et L2

| Élément | Valeur |
| --- | --- |
| Exigences traitées | `CA-01`→`CA-04`, `CA-06`, `CA-07`, `CA-10`, `CA-11`, `CA-13`, `CA-20`, `CA-21` |
| Fichiers modifiés | `src/features/club/navigation/clubNavConfig.ts`, `src/features/club/navigation/resolveClubNavAccess.ts`, `src/features/club/shell/ClubShellNavContext.tsx`, `src/features/club/shell/ClubAppShell.tsx`, `src/features/club/shell/ClubMenuPane.tsx`, `src/features/club/shell/ClubTabBar.tsx`, `src/components/search/GlobalSearchModal.tsx`, `src/services/globalSearch.service.ts` |
| Tests mis à jour / ajoutés | `clubNavConfig.test.ts` (dock 4, labels, aucun raccourci répété, modules joignables), `clubChromeTokens.test.ts` (+2 : dock §2.1/§2.2, 4 destinations), `globalSearch.test.ts` (+4 : périmètre club, équipes réelles, aucun événement inventé, payload) |
| Vérifications exécutées | `npm run typecheck` → 0 erreur ; `npm test` → 323 suites / 1780 tests verts ; bundle Metro iOS HTTP 200 (27 979 750 octets, contient `searchTeams` et `openContactConversation`) |
| Régression recherchée | Consommateurs du composant partagé : `ElitePlayerCockpitScreen`, `JoueurPlusHubScreen`, `CoachMenuPane` passent sans `clubId` ⇒ aucun onglet ni résultat supplémentaire ; accents par défaut inchangés pour eux |
| Limite de preuve | **Aucune recette visuelle du pôle Club** : l'aperçu navigateur s'arrête à l'écran de connexion Club (aucun compte Club de test, pas d'accès invité au shell Club — `guestAccess.ts` ne couvre pas ce pôle). Le dock, la barre de recherche d'Accueil et la fiche personne n'ont donc pas été vus rendus. |
| Prochaine action | L3 (`CA-05` en-tête mobile et safe areas) puis L7 (recette module par module) |
| Suite `CA-12` | La boucle critique est traitée côté service (périmètre par rôle, requête bornée, échec fermé) et côté serveur (`searchClubMembers`, 9 tests). Reste le **resserrement des règles** `/users` : impossible tant que les autres annuaires reposent sur `allow list` — migration à planifier (D-007, `SEARCH-03`), puis `firebase deploy --only functions` |

### Session du 15 septembre 2026 — boucle L9 (forme de la référence)

| Élément | Valeur |
| --- | --- |
| Exigences traitées | `CA-22`, `CA-25`, `CA-26`, `CA-27`, `CA-28`, `CA-29` ; `CA-23` documenté (bloqué sur décision) |
| Référence | Captures fournies le 15/09 (écrans « Moi », « Training », « Club ») — **forme uniquement** : l'accent reste l'émeraude ProDay (D-006/D-008), la couleur de la référence n'est pas reprise |
| Fichiers modifiés | `src/features/club/theme/clubDesignSystem.ts` (`clubForm`), `src/features/club/ui/clubUi.tsx` (`ClubSectionHeader`, `ClubPill`/`ClubPillRow`, `ClubFeatureCard`, `ClubStatusPill` plein, formes `group`/`card`/`empty`/`smart`/`search`/`segment`), `src/features/club/shell/ClubTabBar.tsx` (FAB central), `src/features/club/shell/ClubAppShell.tsx` (branchement `openCreate`), `src/features/club/shell/ClubMenuPane.tsx` (sections groupées), `src/features/club/ui/ClubBrandHeader.tsx` (titre sur canvas), `src/screens/club/ClubHomeScreen.tsx` (**réécrit** sur données réelles) |
| Tests ajoutés | `src/__tests__/clubReferenceForm.test.ts` — 22 tests : valeurs de forme, liste groupée, ligne de réglage, Menu sans grille de tuiles, sélection par contour, action en pilule, état vide centré, cartes plates, en-tête de section + action, rangée de puces, carte visuelle sans visuel ⇒ rien, pastille pleine, Accueil (structure, absence de littéraux fabriqués, périodes et états vides, identité FFF conditionnelle), FAB du dock |
| Vérifications exécutées | `npm run typecheck` → **0 erreur** ; `npm test` → **325 suites / 1820 tests verts** ; bundle Metro iOS rechargé **HTTP 200 (27 961 144 octets)** contenant `club-identity-card`, `club-pill-row`, `club-feature-card`, `club-section-header`, plus **aucune** occurrence de `Cockpit Exécutif` ; aperçu navigateur rechargé : l'application démarre sans erreur |
| Régression recherchée | 17 écrans consomment `ClubBrandHeader` (le titre change de traitement partout, vérifié par typecheck + suite complète verte) ; `ClubSectionCard`/`ClubSmartCard`/`ClubEmptyState` sont partagés par les autres écrans Club : les nouvelles formes restent des surfaces plates `surface` au rayon 22, sans bordure ⇒ aucun écran ne perd de contraste ; les autres pôles ne consomment pas `clubUi` |
| Limite de preuve | **Aucun pixel vu.** L'aperçu navigateur s'arrête à l'écran de connexion Club (aucun compte Club de test ; l'univers « Club » en mode invité renvoie à la connexion). La conformité est donc établie au niveau **inspection de code + test automatisé + bundle compilé**, pas au niveau navigateur authentifié ni appareil : `docs/proday-visual-qa-checklist.md` items **CL-10 à CL-15** sont à cocher sur appareil. |
| Prochaine action | L3 (`CA-05`, `CA-08` : en-tête mobile, recouvrements, safe areas) puis L7 (recette module par module) ; L8 reste bloqué (appareils) et L10 sur décision produit |

### Session du 15 septembre 2026 — passe de fidélité (loops L11)

| Élément | Valeur |
| --- | --- |
| Exigences traitées | `CA-50` (dock), `CA-51` (cartes plates), `CA-26` (filet aligné) ; `CA-52` identifié |
| Déclencheur | Retour utilisateur « pas encore parfait » avec les mêmes captures de référence — la passe L9 avait aligné les primitives mais laissait le dock et les cartes non conformes |
| Constats vérifiés (mesurés sur les captures) | Dock : libellés en capitales 9 px poids 800 (référence : bas de casse 11 px) ; encart d'accent 44×44 derrière l'icône active (référence : icône nue) ; barre de soulignement 18×2 (absente de la référence) ; rayon 24 (référence : capsule) ; FAB rendu **dans** le flux de la rangée avec `marginBottom: 20`, donc enfermé dans le dock au lieu de chevaucher son arête. Cartes : lavage diagonal `[tone.soft, tokens.surface]` sur 7 fichiers, bordure `tone.color + '55'`, rail 3–4 px, `clubShadow.lift`/`soft`, plus un dégradé bleu nuit et un halo blanc dans le hub |
| Fichiers modifiés | `src/features/club/theme/clubDesignSystem.ts` (`clubForm` : `groupPaddingH`, `rowGap`, `separatorInset` dérivé, `rowMinHeight` 62, `dockRadius`, `dockIconSize`, `dockLabelSize` ; `clubType.label` letterSpacing 1,15 → 0,7), `src/features/club/ui/clubUi.tsx` (groupe/separateur/ligne, `itemOn` sans remplissage), `src/features/club/shell/ClubTabBar.tsx` (dock reconstruit + FAB ancré), `ClubCalendarChrome.tsx`, `ClubMatchesDay.tsx`, `ClubTrainingsDay.tsx`, `ClubTeamCard.tsx`, `ClubPlayersChrome.tsx`, `ClubFinanceChrome.tsx`, `ClubCoachesChrome.tsx`, `ClubHubChrome.tsx` |
| Tests mis à jour / ajoutés | `clubReferenceForm.test.ts` : valeurs de forme étendues (dont l'invariant `separatorInset === marge + icône + écart`), capsule du dock, « pas d'encart ni de soulignement sur l'icône active », libellés en bas de casse, puce sélectionnée sans aplat, et le nouveau bloc « cartes plates et neutres » (aucun dégradé, aucun rail, aucune ombre, rayon unique, un seul dégradé restant — le crest de repli du hub) → **30 tests** |
| Vérifications exécutées | `npm run typecheck` → **0 erreur** ; `npm test` → **325 suites / 1828 tests verts** ; bundle Metro iOS rechargé **HTTP 200 (27 955 729 octets)** |
| Régression recherchée | `clubChromeTokens.test.ts` (surfaces §2.1/§2.2 et isolation du pôle Player) reste vert ; les 7 écrans de cartes sont consommés par Calendrier/Matchs/Entraînements/Équipes/Effectifs/Finances/Coachs — le typecheck couvre leurs props, la suite complète leurs modèles ; `ClubFeatureCard` conserve sa règle « rendu seulement si visuel réel » (aucune image fabriquée) |
| Limite de preuve | **Toujours aucun pixel vu.** L'univers « Club » du mode invité renvoie à la connexion (`src/navigation/guestAccess.ts` ne couvre pas ce pôle) et aucun compte Club de test n'est disponible : la conformité est établie au niveau **inspection de code + test automatisé + bundle compilé**. Les items `CL-10` à `CL-18` de `docs/proday-visual-qa-checklist.md` restent à cocher sur appareil. La géométrie du FAB est en revanche **déterministe par construction** (`top: -fabSize × fabOverlap` + `marginTop` de même valeur), et non estimée à l'œil |
| Prochaine action | `CA-52` (famille communication/hub) puis L3 (`CA-05`, `CA-08` : en-tête mobile, recouvrements, safe areas) ; re-tester `CA-23` avant de laisser `L10` « bloqué » (l'audit suggère que la pile Apple est déjà rendue) |

### Session du 15 septembre 2026 — palette mesurée de la référence (demande explicite)

| Élément | Valeur |
| --- | --- |
| Exigences traitées | `CA-20` (étendu : surfaces **et** accent), `CA-53` (encre sur l'accent) ; `CA-54` identifié |
| Déclencheur | « je veux les mêmes couleurs et le même fond que sur l'image », avec la capture `IMG_4950.PNG` — **la seule que le modèle ne peut pas lire**. Réponse : extraction des pixels, pas d'interprétation |
| Méthode | `Pillow` sur les **quatre** captures : fréquence des couleurs quantifiées, plans de saturation, bandes horizontales (structure verticale), grille 8×22 (structure 2D de `IMG_4950`), puis centroïde et palette interne du FAB or |
| Palette extraite | `bg #000000` · `surface #191E23` · `raised #262E33` · bords `#373D42`/`#414A51` · accent `#F8D548` · texte `#FFFFFF` ; surfaces **froides** (`B > G > R`) |
| Découverte | Le contenu sur l'or est **noir** : `#000000` = 26 / 20 / 29 % des pixels intérieurs du FAB selon la capture. `poleOnAccent('club')` renvoyait `#FFFFFF` (~1,4:1) ⇒ correction de lisibilité, défaut qu'une simple copie de palette aurait introduit |
| Fichiers modifiés | `src/theme/prodayBrand.ts` (`PRODAY_POLE_ACCENTS.club`, `poleOnAccent`), `src/features/club/theme/clubTokens.ts`, `src/content/clubPageIdentity.ts` (`glow`), `src/theme/universeGradients.ts` (`proClubGradients`), `src/features/club/shell/ClubTabBar.tsx`, `src/features/club/shell/ClubMenuPane.tsx` |
| Tests mis à jour | 12 fichiers : `clubChromeTokens` (palette mesurée + non-fuite dans les jetons sémantiques), `clubReferenceForm` (l'accent **est** l'or), `prodayBrand` (encre noire, accent), `signupVisualSystem` (wash + encre), `universeEntryAuth`, `universeSelectorBrand`, `discoverPoleHome`, `poleSurfaceConsistency` (palette Club ≠ socle neutre, avec un test qui échoue si on la « réaligne »), `clubDynamicTheme`, `clubPageIdentity`, `clubAssistantChat` |
| Vérifications exécutées | `npm run typecheck` → **0 erreur** ; `npm test` → **326 suites / 1839 tests verts** ; bundle Metro iOS rechargé **HTTP 200 (27 960 008 octets)** contenant `#F8D548` |
| Régression recherchée | Les **71 occurrences d'émeraude** du chrome Club ont été classées une à une : ce sont des états sémantiques (« conforme », « convocations envoyées », « places disponibles », « Confirmer »), pas des accents ⇒ conservées vertes volontairement, et `tokens.success` reste `#10B981` (test explicite). Les autres pôles ne consomment pas `CLUB_TOKENS` ; `poleTabBarTheme`/`signupVisualSystem`/`ProSegmentLogo` suivent l'accent de pôle et ont été vérifiés par la suite complète |
| Limite de preuve | **Aucun pixel rendu observé.** La palette est prouvée dans les jetons, les tests et le bundle — pas à l'écran (aucun compte Club de test, pas d'accès invité au shell Club). Deux points à trancher visuellement : la convergence **Club ↔ Coach ↔ Président tous en or**, et le contraste réel des textes sur `#191E23` (items `T-*`) |

## Format de preuve

Chaque ligne passée à « Vérifié » produit une entrée dans `docs/proday-verification.md` :
ID, exigence liée, préconditions, rôle, données, étapes, attendu, observé, environnement,
version, preuve, limites. Niveaux de preuve : inspection de code < test automatisé local <
intégration simulée < navigateur avec données réelles < appareil réel.

---

## L11 — Alignement visuel : inventaire mesuré et ordre de conversion

Mesure : `grep -cE "#[0-9A-Fa-f]{6}|rgba\("` par fichier (couleurs littérales) opposée au nombre
d'usages du système partagé (`clubForm`/`clubRadius`/`clubSpace`/`clubSurfaceCard` + primitives).
Un nombre élevé de couleurs littérales, surtout quand `createStyles` reçoit `_tokens` **sans
l'utiliser**, signe un écran resté sur l'ancien style.

### Converti et verrouillé (cette session)

| Fichier | Avant | Après | Note |
| --- | --- | --- | --- |
| `src/screens/club/ClubTeamsScreen.tsx` | 60 couleurs en dur, `createStyles(_tokens)` | **0** | Le thème était reçu puis **ignoré** ; canvas `#09090D` → transparent ; boutons blancs → accent ; `CLUB_TOKENS` statique → thème actif |
| `src/features/club/ui/ClubCommunicationHub.tsx` | 50 couleurs en dur | **0** | Palette locale dupliquée supprimée (tons ambre/bleu/rouge → `warning`/`accent`/`danger`) ; dégradés en dur → `elevated`/`surface` |

Garde-fou : `src/__tests__/clubAdminStyleAlignment.test.ts` (5 tests) échoue si une couleur en dur
ou la palette du pôle réapparaît dans un fichier converti. La liste `CONVERTED` s'allonge à chaque
conversion — c'est le mécanisme prévu.

### Reste à convertir, par impact décroissant

| Fichier | Couleurs en dur | Destination / module |
| --- | --- | --- |
| `src/features/club/ui/ClubMatchesCenter.tsx` | 39 | Résultats, détail de match |
| `src/features/club/ui/ClubBrandColorsPanel.tsx` | 35 | Réglages — **inspecter d'abord** : des hex peuvent être du contenu légitime (choix de couleur de club), pas du style |
| `src/screens/club/ClubStandingsScreen.tsx` | 28 | Classements |
| `src/screens/club/ClubSecondaryScreens.tsx` | 20 | Pages de détail secondaires (forte couverture) |
| `src/features/club/ui/ClubPitchSchedule.tsx` | 16 | Terrains |
| `src/features/club/ui/ClubTeamsHierarchy.tsx` | 15 | Catégories / équipes |
| `src/features/club/ui/ClubCarpoolBoard.tsx` | 12 | Covoiturage |
| `src/features/club/ui/ClubChannelsHub.tsx` | 12 | Canaux |
| `src/features/club/ui/ClubPlayersDirectory.tsx` | 10 | Annuaire joueurs |
| `src/features/club/ui/ClubAuxiliaryModules.tsx`, `ClubTrainingsOversight.tsx` | 8 chacun | Modules auxiliaires, encadrement des séances |
| `src/features/club/ui/ClubTeamCard.tsx` | 7 | Carte d'équipe **partagée** — vérifier Coach/Joueur après |
| `src/screens/club/ClubStatsScreen.tsx`, `ClubHubScreen.tsx` | 8 / 5 | Statistiques, hub |

Déjà propres (0 couleur littérale) : `ClubCarpoolScreen`, `ClubMatchesScreen`, `ClubRecruitmentScreen`,
`ClubVideoScreen`, `ClubPlayerCard`, `ClubNotifChrome`, `ClubBrandHeader`, `ClubPageChrome`,
`ClubCoachesScreen`, `ClubCommunicationScreen`, `ClubTrainingsScreen`, `ClubTeamSpaceScreen`,
`ClubPlayersChrome`, `ClubCoachesChrome`, `ClubCalendarChrome`, `ClubFinanceChrome`, `ClubMatchesDay`,
`ClubTrainingsDay`, `ClubImportSquadPanel`, `ClubPlayerHero`.

### Recette mécanique (à répéter fichier par fichier)

1. `createStyles` doit s'appeler `(tokens: ClubThemeTokens)` et **utiliser** `tokens` — `_tokens` est le défaut à corriger.
2. `root: { flex: 1, backgroundColor: 'transparent' }` : le canvas est peint par le shell.
3. Couleurs → `tokens.foreground` / `muted` / `surface` / `elevated` / `border` / `accent` / `accentSoft` / `success` / `warning` / `danger` / `scrim`.
4. **Sélection** → `backgroundColor: tokens.accentSoft` + `borderColor: tokens.accent` + libellé `tokens.accent` (convention de la référence).
5. Action principale → `backgroundColor: tokens.accent`, texte `tokens.onAccent`, rayon `clubRadius.pill`.
6. Rayons → `clubRadius` ; espacements → `clubSpace` ; formes → `clubForm`.
7. Rajouter le fichier à `CONVERTED` dans `clubAdminStyleAlignment.test.ts`.
8. `npm run typecheck` puis la suite : le garde-fou vient de gagner en couverture.

### Limite de vérification (inchangée et importante)

La recette visuelle est **bloquée pour le pôle Club** : ni `preview_click`, ni le dispatch de
`PointerEvent` synthétique ne déclenchent la déconnexion dans l'aperçu React Native Web, et la
technique qui fonctionne pour un `Pressable` de contenu ne fonctionne pas sur la barre de shell.
Les deux conversions ci-dessus sont donc **vérifiées par typecheck + tests + relecture du diff**,
**pas par observation pixels**. Toute case visuelle du pôle Club reste à cocher sur appareil ou
dans un aperçu où la bascule de compte est possible.
