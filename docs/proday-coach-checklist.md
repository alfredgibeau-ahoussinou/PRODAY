# Checklist du pôle Coach — route par route

Inventaire et état réel du pôle Coach après la boucle **L15** (alignement sur le
registre professionnel partagé Coach ↔ Club/Admin). Mêmes conventions que
`proday-club-checklist.md` : un écran n'est coché que si **forme et
fonctionnement** ont été constatés, et une ligne reste non cochée tant qu'elle
n'a pas été ouverte.

## Méthode et limites

| Élément | Valeur réellement utilisée |
| --- | --- |
| Aperçu | Metro `http://localhost:8081`, onglet Preview de cette session |
| Compte | `coach.demo@proday.app` (enregistré par `scripts/seed-demo-club.mjs`, mot de passe de démo du dépôt) |
| Contexte | Club `FC ProDay Démo` (`proday_demo_club`), équipe active **Seniors A**, saison 2026-2027 |
| Mesure | Audit DOM exécuté dans la page (rectangles, rayons, couleurs calculées, rognage, débordement) |
| Largeur auditée | **570 × 891 uniquement** — la fenêtre ne se redimensionne pas et l'émulation de `innerWidth` ne réveille pas les points de rupture React Native Web |
| Captures d'écran | **Impossibles** : la webview ne produit pas de frames. La revue visuelle est donc géométrique, jamais pixel-à-pixel |

Conséquence à assumer : **desktop, tablette et iPhone ne sont pas vérifiés**.
Toute mention « ✅ » ci-dessous signifie « vérifié à 570 × 891, avec les données
réelles du club de démonstration ».

## Barre de navigation basse

| Attendu (README §0.2) | Avant L15 | Après L15 |
| --- | --- | --- |
| 4 destinations | **5** : Accueil, Équipe, IA, Menu, Profil | **4** : Accueil, Calendrier, Équipe, Menu |
| Calendrier présent | ✗ absent | ✅ onglet réel, branché sur `CoachCalendarScreen` |
| Menu en dernière position | ✅ | ✅ |
| Libellés en bas de casse | ✗ capitales (`.toUpperCase()`) | ✅ bas de casse, `proForm.dockLabelSize` |
| Taille de libellé | 9 px | **11 px** (mesuré) |
| Surface du dock | palette du pôle Joueur (figée), thème clair ignoré | jetons Coach + `withAlpha(tokens.surface, 0.88)` |
| État actif | encart + soulignement | couleur de l'icône et du libellé uniquement |

Mesure en aperçu après correction : 4 onglets de **133 × 45 px**, libellés à
**11 px**, `text-transform: none`.

## Inventaire des destinations réelles

| Destination | Écran rendu | État |
| --- | --- | --- |
| `plus` → `gestion` (Gestion d’équipe) | `TeamManagementScreen` | ⛔ non ouvert |
| `today` (Accueil) | `CoachHomeScreen` | ✅ ouvert et vérifié ; **0 couleur littérale**, thème du pôle actif, actions à la géométrie cible |
| `calendrier` | `CoachCalendarScreen` | ✅ **nouveau** — données réelles, états chargement / échec / période vide |
| `equipe` | `CoachSquadScreen` (2 762 l.) | ⛔ non ouvert cette passe (222 couleurs littérales) |
| `plus` (Menu) | `CoachMenuPane` | ✅ ouvert : 12 entrées + compte, recherche universelle |
| `match_center` | `CoachLiveMatchCenterScreen` | ⛔ non ouvert |
| `entrainements` | `CoachTrainingPlannerScreen` | ⛔ non ouvert (115 couleurs littérales) |
| `joueurs` | `CoachScoutingGrowthScreen` | ⛔ non ouvert |
| `forme` | `CoachWorkloadHealthScreen` | 🟡 ouvert, contenu fictif retiré, jeu de démonstration identifié |
| `com_staff` | `CoachMessagingScreen` | ⛔ non ouvert (109 couleurs littérales) |
| `coach_ia` | `CoachTwinMatchLabScreen` | ⛔ non ouvert |
| `copilot_chat` | `CoachAiHubScreen` | 🟡 atteint depuis l'Accueil ; conversation non exercée |
| `mes_videos` | `CoachVideoHubScreen` | ⛔ non ouvert |
| `gestion` | `TeamManagementScreen` | ⛔ non ouvert |
| `coaching_perso` | `CoachHourlyPane` | ⛔ non ouvert |
| `carpool` | `CarpoolScreen` | ⛔ non ouvert (module partagé avec le pôle Club) |
| `messages` | `MessagesScreen` | ⛔ non ouvert |
| `profil` | `ProfilTabScreen` / `CoachProfileScreen` | ⛔ non ouvert |
| Hub événement | `CoachEventHubRouter` → `CoachMatchEventHub`, `CoachTrainingEventHub`, `CoachDetectionEventHub` | ⛔ non ouvert |

## Contrôles exécutés

| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | **0 erreur** |
| `npx jest` | **344 suites / 2 136 tests verts** (344ᵉ suite : `coachProDesignAlignment`) |
| Nouveaux garde-fous | `coachProDesignAlignment.test.ts` (16 tests), `coachChipUi.test.ts` renforcé (5 tests) |
| Aperçu | pôle Coach ouvert ; dock, Calendrier, Accueil converti, bandeau d'alertes et CTA mesurés |

Fichiers passés à **zéro couleur littérale** pendant cette passe : `screens/coach/CoachHomeScreen.tsx`,
`components/coach/coachPortalUi.tsx`, `screens/coach/CoachCalendarScreen.tsx`,
`features/coach/ui/coachCalendarChrome.tsx`, `features/coach/shell/CoachTabBar.tsx`,
`features/calendar/calendarChrome.tsx`, `utils/coachChipUi.ts`.

## Comptes de test

| Rôle | Compte | Ce qui a été fait |
| --- | --- | --- |
| Coach | `coach.demo@proday.app` | connexion, Accueil, Calendrier, Menu |
| Club | `club.demo@proday.app` | connexion utilisée pour vérifier que le pôle Club n'a pas régressé après l'extraction du chrome calendrier |

Aucun message, invitation ou envoi réel n'a été déclenché.

## Défauts corrigés pendant L15

| Défaut | Preuve | Correctif |
| --- | --- | --- |
| Puce de filtre du pôle Coach en **aplat accent** à la sélection, l'inverse du pôle Club | `coachChipContainerStyle` (thème sombre) renvoyait `backgroundColor: tokens.accent` | sélection = **contour d'accent** sur fond transparent, dans le helper partagé |
| Puces du nouveau calendrier à **16 px de haut, rayon 0** | mesure DOM : `{h: 16, radius: '0px'}` | géométrie portée par `coachChipContainerStyle` : `minHeight: 44`, `borderRadius: 999` ; remesuré à **44 / 999 px** |
| Barre basse à 5 onglets, sans Calendrier, libellés en capitales à 9 px | `coachNavConfig` + `CoachTabBar` | 4 onglets, libellés 11 px en bas de casse, jetons Coach |
| **Faux résultat IA** sur le tableau de bord : adversaire nommé, système conseillé, « probabilité de victoire », « xG prédit » | valeurs écrites en dur dans `CoachHomeScreen` | carte remplacée par une entrée honnête vers le Copilote réel, sans chiffre inventé |
| **Faux succès de sauvegarde** et promesse médicale : « Charge Auto-Ajustée avec Succès », « pour éviter la blessure » | `CoachWorkloadHealthScreen` | messages remplacés : ajustement local, non enregistré, non transmis au joueur |
| Revendication d'intégration inexistante « GPS PlayerData™ Intégré » | même écran | remplacée par « Mode démonstration / Aucune source connectée » |
| En-tête affichant l'**identifiant Firestore du club** comme nom d'équipe | `{profile?.profile.club_id}` rendu sur l'Accueil | nom d'équipe réel + nom du coach + saison partagée |
| Deux implémentations du calendrier (une par pôle) | duplication à venir | composition extraite dans `features/calendar/calendarChrome`, injectée par thème |
| **Deux socles** dans le pôle Coach : le kit `coachPortalUi` portait rayons 18, hauteurs 32/40 et un rail d'accent à gauche | balayage source | kit ramené sur `proForm` / `proRadius` / `proSemantic` / `proType` : **0 couleur littérale**, rail décoratif retiré, sélection au contour, hauteur de ligne 62 |
| Tableau de bord en **palette claire** (cartes blanches sur fond noir) | mesure DOM : cartes `rgb(255,255,255)`, bordure `#E2E8F0` | styles fabriqués à partir du thème actif : cartes `rgb(18,18,24)`, rayon 20, bordure `rgba(255,255,255,0.14)` ; **0 carte blanche** |
| Action du bandeau d'alertes à **21 px de haut** (sous la cible de 44) | mesure DOM : `143 × 21`, rayon 8 | `149 × 44`, rayon 999 |
| Action principale « Ajuster la Composition & Tactique » à **45 px / rayon 12** | mesure DOM | `504 × 52`, rayon 999 |
| Classement affiché en `lightMode` isolé dans le shell sombre | lecture source | table de classement rendue dans le thème du pôle |

## Défauts restants, non corrigés

1. **Couleurs littérales restantes** — `CoachSquadScreen` (226 occurrences), `CoachTrainingPlannerScreen`
   (117), `CoachMessagingScreen` (115), `CoachTacticalBoardScreen` (108), `CoachLiveMatchCenterScreen`
   (69), `CoachStandingsTable` (69), `CoachTwinMatchLabScreen` (67), `CoachWorkloadHealthScreen` (64),
   `CoachScoutingGrowthScreen` (54), `CoachMesVideosScreen` (53). Un **plafond par fichier** est
   désormais testé : il ne peut que baisser (`coachProDesignAlignment`).
2. **Convocations / présences / composition dynamique** — parcours non exercés : ni convocation
   envoyée, ni composition enregistrée, ni publication vérifiée dans cette passe.
4. **PDF (joueurs et tactiques)** — aucun import exécuté : ni extraction, ni rapprochement de
   doublons, ni correction avant confirmation.
5. **Messagerie et Copilote** — écrans atteignables, conversation et remise de message non testées.
6. **Largeurs** — une seule largeur auditée (570). Desktop, tablette et iPhone restent non vérifiés.

### Modules Coach écrits mais **inatteignables**

Balayage d'imports (aucune référence hors de leur propre fichier) : ces modules existent, sont
atteignables par personne, et ne sont **pas** supprimés parce que deux d'entre eux portent des
fonctionnalités exigées par le référentiel :

| Module | Lignes | Enjeu |
| --- | --- | --- |
| `components/coach/CoachPlayerNoteSheet.tsx` | 587 | Notes d'observation joueur (Scouting Vocal / observations de match) |
| `components/coach/CoachCockpitChrome.tsx` | 368 | Chrome du cockpit (briefing du jour) |
| `components/coach/FederationSyncDrawer.tsx` | 381 | Panneau de synchronisation fédérale |
| `components/coach/CoachLoadAlertsPanel.tsx` | 92 | ✅ **branché** (15 septembre) : rendu par le tableau de bord et alimenté par `buildCoachLoadSignals` — matchs, pointages, feuilles de match et `wellness_checkins` de l'équipe active. Le bandeau annonce désormais l'état réel et non plus une attente de branchement |
| `features/coach/shell/CoachMorePane / CoachNavRow / CoachToolsList / CoachMenuToolGrid` | 482 | Ancienne composition du menu, remplacée par `CoachMenuPane` |

C'est le même défaut de classe que le chat du Copilote, déjà corrigé : une brique importée mais
jamais rendue. Le premier de ces modules est **branché** (alertes de charge, 15 septembre) ; il reste
les notes d'observation joueur, le cockpit, la synchronisation fédérale et l'ancienne composition du
menu. Le prochain travail utile n'est pas d'écrire du nouveau code ici, mais de **brancher** ces
modules (notes d'observation depuis une séance), ou de les retirer si le parcours est abandonné.

## Régressions recherchées

| Risque | Vérification | Résultat |
| --- | --- | --- |
| Le pôle Club perd son calendrier en déplaçant la composition | `ClubCalendarScreen` inchangé, wrappers de thème, styles identiques (`proForm` = `clubForm`) ; tests `clubReferenceForm` et `clubCalendarModel` verts | ✅ aucune perte |
| Une destination Coach devient inatteignable en retirant IA / Profil de la barre | IA, Copilote, Messagerie et Profil restent dans le catalogue, listés au Menu ; test dédié | ✅ atteignables |
| Le soulignement du bon onglet casse pour une destination hors barre | `primaryTabForCoachNav` : plus d'onglet « Profil » spécial, tout passe par Menu | ✅ `messages`, `profil`, `coach_ia` → `plus` |

## Prochaine boucle

1. Convertir `coachPortalUi` sur `proForm` / `proRadius` (supprimer le second socle Coach).
2. Poursuivre la conversion des couleurs littérales, écran par écran, avec un garde-fou qui
   interdit d'en ajouter (`coachAdminStyleAlignment`).
3. Ouvrir `CoachSquadScreen` et `CoachTrainingPlannerScreen` pour vérifier la séance partagée
   Coach ↔ Club et les convocations.
4. Exercer la composition dynamique dans l'ordre imposé et l'import PDF.

