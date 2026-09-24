# Pôle Club/Admin — checklist des pages, sous-pages et états

Inventaire **route par route** du pôle Club, avec l'état de vérification réel.
Mis à jour le 15 septembre 2026.

---

## 1. Méthode (ce qui a été fait, et avec quels moyens)

1. **Accès réel au pôle Club** : le compte démo officiel du dépôt
   (`npm run seed:demo-club` → `club.demo@proday.app`, club `proday_demo_club`
   « FC ProDay Démo ») a été utilisé pour ouvrir le pôle dans l'aperçu live.
   C'est la **première fois** que le pôle Club est inspecté autrement que par lecture de code.
2. **Audit géométrique du DOM** exécuté dans la page (`preview_evaluate`), sur chaque route :
   texte rogné **sans ellipse** (`scrollWidth > clientWidth` et `text-overflow ≠ ellipsis`),
   cibles tactiles réelles inférieures à 44 px (en remontant au conteneur interactif),
   débordement horizontal hors fenêtre, chevauchement de contrôles interactifs,
   rayons et surfaces calculés.
3. **Ce qui n'était pas possible** : captures d'écran (la webview ne composite pas de frames)
   et changement de largeur (la fenêtre ne se redimensionne pas ; l'émulation de `innerWidth`
   ne déclenche pas les points de rupture RN Web). Une seule largeur a donc pu être auditée :
   **570 × 891**.

> Conséquence assumée : « vérifié » ci-dessous signifie « audit DOM conforme à cette largeur »,
> **pas** « validé à l'œil sur desktop, tablette et iPhone ». Les lignes `⛔` n'ont pas été inspectées.

---

## 2. Dock (4 destinations)

| Route (`ClubNavItemId`) | Écran | État | Constat |
|---|---|---|---|
| `today` | `ClubHomeScreen` | ✅ vérifié | Audit propre ; 4 actions de section en défaut tactile de 21 px → **corrigé** (hitSlop partagé) |
| `calendar` | `ClubCalendarScreen` | ⛔ non inspecté | — |
| `teams` | `ClubTeamsScreen` | ⛔ non inspecté | — |
| `plus` | `ClubMenuPane` | ✅ vérifié | Doublon de navigation « Rôles & Permissions » (ligne de menu **et** groupe Compte) → **corrigé** ; « Profil club » (même destination que « Identité du club ») retiré |

## 3. Destinations du Menu (18)

| Route | Écran / module | État | Constat |
|---|---|---|---|
| `players` | `ClubPlayersScreen` | 🟡 partiel | Page « Effectif & Licences » auditée propre (`n=171`, aucune cible < 44 px réelle) |
| `coaches` | `ClubCoachesScreen` | 🟡 partiel | Clic ambigu dans le menu ; aucune anomalie remontée |
| `matches` | `ClubMatchesScreen` → `ClubMatchesCenter` | ✅ vérifié | Audit propre ; les 3 « rognages » détectés étaient des ellipses volontaires (faux positifs) |
| `trainings` | `ClubTrainingsScreen` | ✅ vérifié | Audit propre |
| `standings` | `ClubStandingsScreen` | ✅ vérifié | Audit propre |
| `communication` | `ClubCommunicationScreen` → `ClubCommunicationHub` | 🟡 partiel | Clic ambigu ; aucune anomalie remontée |
| `assistant` | `ClubAiAssistant` (feuille « Copilote Club ») | ✅ vérifié | Exigence ChatGPT tenue : en-tête club (3 équipes · 25 licenciés), mention « réponses générées côté serveur », 4 suggestions d'amorce **538 × 46**, composer **484 × 68**, bouton d'envoi **56 × 56**, aucun chevauchement |
| `events` | `ClubEventsScreen` → `ClubEventOrganization` | ✅ vérifié | Audit propre |
| `licenses` | `ClubLicensesScreen` | 🟡 partiel | Audit propre, contenu non relu ligne à ligne |
| `finances` | `ClubFinancesScreen` → `ClubFinanceLedgerPanel` + `ClubFinancePlanPanel` | ✅ vérifié | Audit propre ; les 2 « petites cibles » mesurées étaient les actions de section → **corrigées** |
| `sponsoring` | `ClubSponsoringScreen` → `ClubAuxiliaryModules` | 🟡 partiel | Audit propre |
| `pack` | `ClubPackScreen` | ⛔ non inspecté | — |
| `club` | `ClubHubScreen` (« Identité du club ») | ⛔ non inspecté | — |
| `notifications` | `ClubNotificationsScreen` | ✅ vérifié | Audit propre |
| `permissions` | `ClubPermissionsScreen` | 🟡 partiel | Audit propre ; les `INPUT 40 × 20` mesurés sont les interrupteurs internes, cible réelle conforme |
| `video` | `ClubVideoScreen` → `VideoWorkspace` (module partagé Coach/Club) | ✅ vérifié | Audit propre ; onglets de section à **40 px** de haut (sous les 44 px recommandés) — module **partagé**, donc non corrigé ici sans arbitrage |
| `carpool` | `ClubCarpoolScreen` → `ClubCarpoolBoard` | ✅ vérifié | Audit propre ; état vide honnête (« Aucun trajet proposé »), champ de recherche **538 × 52 (r18)** conforme |
| `stats` | `ClubStatsScreen` | ⛔ non inspecté | — |
| `recruitment` | `ClubRecruitmentScreen` | ⛔ non inspecté | — |

## 4. Vues de détail, formulaires, dialogues et panneaux

| Élément | Fichier | État |
|---|---|---|
| Fiche joueur | `ClubPlayerDetailScreen` | ✅ vérifié | Inspecté en aperçu (compte démo). **1 défaut corrigé** : en-tête « U17 · U17 » (catégorie répétée) ; **1 cible élargie** : retour « Joueurs » 28 px → `hitSlop` 10 px. Lignes à **62 px** (`clubForm.rowMinHeight`) conformes ; états vides honnêtes (« Aucun e-mail renseigné », « Pas de dossier médical sur cette fiche ») ; stats absentes affichées « — », jamais inventées |
| Espace équipe | `ClubTeamSpaceScreen` | 🟡 partiel | En-tête, cartes et sélecteur de sections rendus conformes ; le sélecteur de catégories (hébergé par `ClubTeamsHierarchy`) était la **puce à 34 px / r20 à aplat d'accent** — migré (voir §8). Étapes suivantes non ouvertes : Chat d'équipe, Calendrier, Communication, Statistiques |
| Feuille « Créer » (FAB) | `ClubCreateSheet` | ✅ vérifié | 7 actions rapides, rangées **56 px**, feuille r28, aucun rognage |
| Import effectif (CSV FootClubs) | `ClubImportSquadPanel` | ✅ vérifié (source) | Déjà sur le kit club (`clubUi`) ; carte « Import Squad » 66 px r20 r14 conforme |
| Invitation de match | `ClubMatchInvitePanel` | ⛔ non conforme | Feuille ouverte en aperçu : **champs 43 px / r12** au lieu de `clubForm.fieldHeight` (52) / `fieldRadius` (18). Panneau encore bâti sur le kit ProDay générique — voir §7.2 |
| Hub tournoi live | `ClubTournamentLiveHub` | ⛔ non inspecté |
| Assistant de création de tournoi | `ClubTournamentWizard` | ⛔ non inspecté |
| Bourse de recrutement | `ClubRosterBoardPanel` | ⛔ non inspecté |
| Feuilles d'essai | `ClubTrialSheetsPanel` | ⛔ non inspecté |
| Matchs amicaux | `ClubFriendlyMatchesPanel` | ⛔ non inspecté |
| Centre vidéo (caméras, captations, IA, offres) | `ClubVideoCenterPanel`, `ClubCamerasPanel`, `ClubVideoHardwarePanel`, `VeoConnectionPanel` | ⛔ non inspecté |
| Stade d'équipe (3D) | `ClubTeamStadiumPanel` | ⛔ non inspecté |
| Chat live club | `ClubLiveChat` | ⛔ non inspecté |
| Comparateur de formules | `ClubOffersComparePanel` | ⛔ non inspecté |
| Kanban recrutement | `ClubRecruitmentKanban` | ⛔ non inspecté |
| Palette / identité du club | `ClubBrandColorsPanel` | ⛔ non inspecté (exception documentée : couleurs de marque choisies par le club) |
| Demande de devis | `ClubQuoteRequestScreen` | ⛔ non inspecté |
| Formulaire de création (après la feuille) | `ClubCreateFormModal` | ⛔ non inspecté |
| Modales licences / permissions / finances | intégrées aux écrans ci-dessus | ⛔ non inspecté |

## 5. États transverses (chargement · vide · erreur · succès)

| État | État de vérification |
|---|---|
| Chargement (`ClubLoading`) | 🟡 vu sur Accueil/Matchs ; non systématique |
| Vide honnête (sans donnée de démo) | ✅ observé conforme sur Accueil, Matchs, Covoiturage, Vidéo, Classements |
| Erreur / hors-ligne | ⛔ non déclenché |
| Succès (persistance réelle) | 🟡 carpooling/tournois/entraînements couverts par tests automatisés, pas en aperçu |

---

## 6. Défauts trouvés et corrigés dans cette passe

1. **Actions de section sans zone tactile** — `ClubSectionHeader` rendait une action texte de
   **21 px de haut** sans `hitSlop` (`Réglages`, `Tout voir`, `Gérer`, `Définir`, `Ajouter`… sur
   Accueil, Finances, Matchs, Licences, Notifications). Correction partagée dans la primitive
   (`SECTION_ACTION_HIT_SLOP`, cible réelle ≥ 45 px) — `clubReferenceForm.test.ts` (31 tests) verrouille
   la mesure et interdit qu'une action de section soit rendue sans élargissement.
2. **Navigation dupliquée dans le Menu** — « Rôles & Permissions » existait deux fois (ligne de menu
   et lien du groupe Compte) et « Profil club » doublait « Identité du club » vers la même page.
   Entrées dupliquées retirées ; `clubNavConfig.test.ts` interdit leur retour.

## 7. Passe du 15/09/2026 — panneaux et dialogues

### 7.1 Défaut transversal confirmé : la puce de filtre locale

Cinq écrans club (dont l'espace équipe et l'annuaire) avaient **recopié leur propre puce** :
`paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20` → **34 px de haut**, rayon 20, et un état
actif en **remplissage plein accent avec libellé noir**. La référence de forme dit l'inverse
(`clubForm.chipHeight` 44, `chipRadius` pilule, sélection au **contour d'accent**, jamais à l'aplat).

Mesure avant / après (audit DOM en aperçu) :

| | hauteur | rayon | puce active |
|---|---|---|---|
| Avant | 34 px | 20 px | `rgb(100,210,255)` plein, libellé noir |
| Après | **44 px** | **999 px** | fond **transparent**, contour et libellé `rgb(100,210,255)` |

Correction apportée : `ClubPill` reçoit un état `active` (contour + libellé accent) et **sept puces
recopiées ont été ramenées à la primitive partagée** — catégories d'équipes, onglets des modules
complémentaires, filtres de canaux, rôles de l'annuaire, et **quatre** filtres du centralisateur de
matchs (catégories, amical, territoire, statut initial). `clubChipConsistency.test.ts` interdit le
retour d'une puce locale.

### 7.2 Dérive de socle : 20 panneaux encore sur l'ancien kit

Le pôle Club a **deux kits**. Le kit approuvé (`features/club/ui/clubUi.tsx` + `clubDesignSystem`) est
utilisé par quasi tous les écrans et 28 fichiers d'UI club. Mais la quasi-totalité de
`src/components/club/*` — soit la vingtaine de panneaux listés en §4 — est encore bâtie sur le **kit
ProDay générique** (`ProDaySurface` / `ProDayText` / `useAppTheme()`), plus **10 fichiers** encore sur
l'échelle `APPLE_TYPOGRAPHY` (« Design System Apple Obsidian Glass » en en-tête) :
`ClubAuxiliaryModules`, `ClubChannelsHub`, `ClubMatchesCenter`, `ClubPitchSchedule`, `ClubPlayersDirectory`,
`ClubTeamsHierarchy`, `ClubTrainingsOversight`, `ClubHubScreen`, `ClubStatsScreen`, `VeoConnectionPanel`.

Conséquence **mesurée** (et non théorique) : là où le kit club impose un champ de **52 px / r18**
(`clubForm.fieldHeight` / `fieldRadius`), le panneau d'invitation de match rend des champs de
**43 px / r12**. Les panneaux du kit générique n'ont donc pas les rayons, l'échelle typographique ni
les hauteurs de champ de la référence — corrigé jusqu'ici : les puces (§7.1) et la fiche joueur.

### 7.3 Nettoyage

`src/components/club/clubPortalUi.tsx` (389 lignes, ancien kit de primitives) n'était importé par
**aucun** fichier : supprimé. Aucune autre référence dans `src`.

## 8. Blocages explicites

- **Aucune capture d'écran possible** : la webview de l'aperçu ne composite pas de frames. La revue
  « à l'œil » repose donc sur l'audit DOM et sur votre propre lecture de l'onglet Preview, où le pôle
  Club est désormais **ouvert sur le compte démo** (`club.demo@proday.app`).
- **Une seule largeur auditée (570 × 891)** : ni desktop (≥ 1024), ni tablette (768–1024), ni iPhone
  (320–430). Les points de rupture du shell Club (dock vs sidebar) ne sont donc **pas** vérifiés.
- **Routes non inspectées** : 8 écrans principaux et une quinzaine de panneaux listés en §4 restent en
  ⛔. Les déclarer « terminés » serait faux.
- **Panneaux hors kit club** : la dérive de socle décrite en §7.2 touche ~20 fichiers de
  `src/components/club/*`. La migration est un chantier à part entière ; elle n'est faite ici que pour
  les puces et la fiche joueur.
- **Rafraîchissement perdu au rechargement** : les helpers d'audit injectés dans la page (`window.__go`,`__visit`) disparaissent à chaque rechargement Metro ; l'audit a été ré-injecté à chaque modification.
