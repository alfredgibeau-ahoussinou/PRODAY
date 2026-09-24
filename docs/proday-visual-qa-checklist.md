# ProDay — Checklist QA visuelle par pôle (dérivée de DESIGN.md)

Version 1.0 — 15 septembre 2026.

**Sources de vérité** : `DESIGN.md` (§1–§8, 206 lignes) · `docs/design/DESIGN_SYSTEM.md` (palette master, portes) · `assets/branding/README.md` (accents runtime par porte). Tokens runtime app : `src/theme/prodayBrand.ts`, `src/theme/designTokens.ts`, `src/content/coachPageIdentity.ts`, `src/features/club/theme/clubTokens.ts`.

**Rôle de ce document** : fournir la liste d'items à cocher, pôle par pôle, pour la prochaine recette **sur appareil**. Il ne remplace pas `docs/proday-verification.md` : chaque case cochée doit produire une ligne de preuve dans ce fichier de vérification (contrat §G).

## 0. Mode d'emploi

1. Remplir d'abord §1 (matrice d'environnements) : un support non testé reste « non testé », il ne devient jamais « vérifié » par déduction.
2. Dérouler §2 (socle transverse) une fois par pôle — les mêmes items se rejouent dans chaque pôle, car la conformité d'un composant partagé ne prouve pas son rendu dans tous les contextes.
3. Dérouler §3 pour le pôle concerné, en partant de l'entrée réelle indiquée (rôle → shell → écran).
4. Ne cocher une case qu'avec : identifiant d'item, support + version, observation, et preuve (capture, mesure, log). Aucune case cochée sur la seule base d'une lecture de code : l'inspection de code est un niveau de preuve inférieur (§G) et se consigne comme telle.
5. Les écarts §4 sont des **divergences décidées** (voir `docs/proday-decisions.md`, D-006) : ne pas les signaler comme défauts, ne pas les corriger sans décision explicite.

### Niveaux de preuve (rappel §G)

| Niveau | Démonstre | Ne démontre pas |
|---|---|---|
| Inspection de code | Présence d'une implémentation ou d'une règle | Son rendu réel |
| Test automatisé local | Résultat dans le contexte du test | Comportement appareil |
| Navigateur avec données réelles de test | Parcours dans cet environnement | Compatibilité universelle |
| Appareil réel | Comportement de cet appareil et de sa version | Tous les modèles et réseaux |

## 1. Matrice d'environnements (à remplir par la session de recette)

| Support cible (§F10) | Version réellement testée | État |
|---|---|---|
| PC Windows / Edge | … | À remplir |
| PC Windows / Chrome | … | À remplir |
| Mac / Safari | … | À remplir |
| Mac / Chrome | … | À remplir |
| iPad / Safari | … | À remplir |
| Tablette Android / Chrome | … | À remplir |
| iPhone / Safari | … | À remplir |

Largeurs CSS à parcourir : **320 · 390 · 600 · 768 · 1024 · 1440 · 1920** + les transitions entre paliers. Pour chaque largeur : zoom texte **200 %**, portrait **et** paysage, clavier ouvert, navigation au focus.

## 2. Socle transverse — DESIGN.md §1 à §7

À rejouer **dans chaque pôle**. Colonne « Où » = écran/point d'entrée observé.

| # | Réf. | Attendu (valeur exacte) | Où vérifier | Case |
|---|---|---|---|---|
| T-01 | §1.1 | Fond d'écran noir absolu `#000000` (OLED), sans gris parasite | Tous les écrans de premier niveau | ☐ |
| T-02 | §1.4 | Safe areas strictes : aucun chevauchement Dynamic Island / encoche / barre d'accueil ; `paddingTop: Math.max(insets.top, 12)` | En-têtes (`src/components/ui/ScreenHeader.tsx`, `src/components/ui/EliteHeader.tsx`, `src/components/coach/CoachScreenHeader.tsx`, `src/components/joueur/JoueurScreenChrome.tsx`) | ☐ |
| T-03 | §2.1 | Surfaces : `bg #000000`, `bgElevated #0A0A0F`, `surface #121218` (cartes, bulles IA, panneaux), `surfaceRaised #1A1A24` (saisies, barres flottantes, modales) ; `surfaceInverse #FAFAFA` réservé aux éléments inversés. **Exception documentée :** le pôle **Club** suit la palette mesurée sur sa charte de référence (`surface #191E23`, `raised #262E33`, D-011) au lieu de §2.1 — vérifier l'item `CL-19` pour ce pôle plutôt que cette ligne | Cartes, modales, champs, bulles de chat | ☐ |
| T-04 | §2.2 | Bordures : `border` `rgba(255,255,255,0.08)`, `borderStrong` `rgba(255,255,255,0.14)`, `borderActive` = accent du pôle à 45 % | Cartes, séparateurs, états focus/sélection | ☐ |
| T-05 | §2.3 | Texte : `#FFFFFF` (titres/valeurs) · `#D4D4D4` (corps) · `#8B8B9A` (métadonnées) · `rgba(139,139,154,0.72)` (placeholders) — aucun gris intermédiaire hors spec | Tous les blocs de texte | ☐ |
| T-06 | §3 | Échelle : hero 30–32/800–900/-0.6 · title 22–24/800/-0.4 · section 17–18/700/-0.2 · body 14–15/400–600 · caption 11–12/500–600/+0.2 · kicker 9–10/900/+1.4 à +2.0. **Police réellement rendue : la pile système Apple** (`System` iOS / `-apple-system, SF Pro` web / `Roboto` Android) — aucune police tierce n'est chargée dans le projet ; l'ancienne formulation « Inter/Syne chargées » est obsolète (amendment D-009) | Titres, cartes, sur-titres majuscules | ☐ |
| T-21 | §3 / `CA-23` | **La graisse est réellement rendue** : les titres sont **gras** et non uniformes — un hero/title doit être visiblement plus lourd qu'un body. Régression corrigée le 15/09 : `fontWeight` était retiré du style final et tous les alias de famille pointant vers la même pile système, **chaque titre de chaque pôle s'affichait en graisse normale**. Vérifier hero 800–900, title 700–800, section 700, body 400–600, caption 500–600, kicker 800–900 — sur les 5 supports et à texte agrandi 200 % | Toutes les pages, tous les pôles | ☐ |
| T-07 | §4.1 | Espacements sur la grille 8pt : xs 4 · sm 8 · md 12 · lg 16 · xl 24 · xxl 32 (mesures cohérentes sur les marges et les séparateurs) | Gouttières de pages, listes | ☐ |
| T-08 | §4.2 | Rayons : sm 10 (badges) · md 14 (boutons/icônes) · lg 18 (cartes) · xl 24 (composer, hero) · pill 999 (CTA pleine largeur, chips, pastilles) | Boutons, cartes, chips, composer | ☐ |
| T-09 | §4.3 | Ombre de carte : `#000000`, offset (0,4), opacity 0.25, radius 12 ; **halo Ambient Glow** (cercle diffus, opacity 0.12–0.20) visible en haut d'écran sans surcharge | Cartes ; halo en tête d'écran des pôles qui l'implémentent (`src/components/ui/AmbientGlow.tsx`) | ☐ |
| T-10 | §5.1 | En-tête : retour squircle 40×40, radius 12, fond `surface`, bordure `border` ; centre = kicker (puce `liveDot`) + titre blanc + sous-titre `textMuted` ; droite = action contextuelle (recharger/réinitialiser/fermer) | En-têtes de chaque pôle | ☐ |
| T-11 | §5.2 | Chat IA : carte hero (salutation, avatar étincelle `star-four-points`, badge de disponibilité, rappel sécurité) ; grille 2 colonnes avec tag majuscule ; bulle Conseiller à gauche (`surface` + `borderStrong` + avatar + badge « Conseiller IA ») ; bulle joueur à droite (`${accent}28` / bordure `${accent}66`) ; indicateur de réflexion avec message dynamique ; composer flottant `paddingBottom: Math.max(insets.bottom, 10)`, bouton circulaire `chevron-forward` illuminé à la saisie | `src/components/joueur/PlayerCoachAiChat.tsx` + tout chat IA de pôle | ☐ |
| T-12 | §5.3 | `PressableSpring` (scale 0.95–0.97) sur les cartes et boutons ; haptique `impactAsync(Light/Medium)` sur clic de carte et envoi de message | Toutes les actions clés | ☐ |
| T-13 | §6 | Icônes Ionicons + FootIcons ProDay ; symboles attendus : `star-four-points` (IA/premium/XP), `football`, `shield`, `trophy`, `refresh`, `arrow-back`/`chevron-forward` — aucune icône hors bibliothèque | Boutons, en-têtes, onglets | ☐ |
| T-14 | §7.1 | Aucun texte tronqué : `numberOfLines` maîtrisé (+`adjustsFontSizeToFit` sur badges contraints) et libellés complets visibles | Cartes, onglets, badges | ☐ |
| T-15 | §7.2 | Zones tactiles : `minHeight: 44` **ou** `hitSlop: 10` sur tout bouton interactif (vérifier les petites icônes d'en-tête et d'envoi) | Tous les contrôles | ☐ |
| T-16 | §7.3 | Contraste texte informatif ≥ 4.5:1 sur fond sombre (attention aux textes `textMuted` sur `surface`) | Métadonnées, hints | ☐ |
| T-17 | §7.4 | Fluidité 60/120 fps (Reanimated) : transitions, scroll long, ouverture de modale sans saccade | Listes longues, modales | ☐ |
| T-18 | §F10 | Responsive : 320 → 1920 sans défilement horizontal global ; grilles qui replient (1→2→3→4 colonnes) ; aucune carte coupée en transition de palier | Toutes pages, les 7 largeurs | ☐ |
| T-19 | §F10 | Zoom texte 200 %, portrait/paysage, clavier ouvert : saisie non masquée, focus visible, ordre de lecture stable | Formulaires, chats, composer | ☐ |
| T-20 | §F10 / UI-02 | Dock : pas de recouvrement du contenu, recherche visible dans chaque pôle, **pas de double menu** sur grand écran | `src/components/navigation/BottomTabBar.tsx`, `CompactTabBar.tsx`, `DesktopSideTabRail.tsx` | ☐ |

## 3. Checklist par pôle

### 3.1 Pôle Joueur — accent `#FFFFFF` (P-JOU)

- **Entrée** : rôle `player` → `src/navigation/resolveMainTabScreen.tsx` → `src/features/joueur/JoueurAdaptiveHome.tsx` / `src/features/joueur/ElitePlayerCockpitScreen.tsx`.
- **Ambiance §8.1** : cockpit athlétique, gamification XP, carte d'attributs radar.
- **Dock §8.1 (5 onglets)** : Accueil · Matchs · Saison/XP · Profil/CV · Plus. Le dock runtime (`src/navigation/mainTabConfig.ts`) expose davantage d'ids (Accueil, Mercato, Matchs, Covoiturage, Santé, Actualités, Progression, Vidéos, Famille, Vestiaire, Mon Profil, Boutique, Services) avec repli en feuille de débordement → **consigner l'écart §8.1 ↔ runtime** comme écart de spécification, pas comme bug visuel.
- **Accent** : `#FFFFFF` (D-006) — ne pas s'attendre à `playerGreen #00E676`.

| # | Réf. | Item | Écran | Case |
|---|---|---|---|---|
| J-01 | §8.1 | Accueil : cockpit du jour, forme, météo d'entraînement, raccourcis ; carte OVR + radar lisibles | `src/features/joueur/ElitePlayerCockpitScreen.tsx` | ☐ |
| J-02 | §8.1 | Matchs : calendrier, convocations, statut titulaire/banc, météo | Onglet Matchs / `src/screens/joueur/PlayerSaisonScreen.tsx` | ☐ |
| J-03 | §8.1 | Saison/XP : niveaux, progression, défis, badges débloqués | `src/screens/joueur/PlayerProgressionScreen.tsx` | ☐ |
| J-04 | §8.1 | Profil/CV : CV sportif public, statistiques, vidéos réelles, préférences (aucune donnée inventée) | `src/screens/PlayerCvEditorScreen.tsx`, `src/screens/PlayerProfileScreen.tsx` | ☐ |
| J-05 | §8.1 | Plus : Conseiller IA, vestiaire, nutrition, matériel | `src/screens/joueur/JoueurPlusHubScreen.tsx` | ☐ |
| J-06 | §5.2 | Chat Conseiller IA conforme (zero-state, bulles, réflexion, composer, badge + rappel sécurité) | `src/screens/joueur/PlayerCoachAiScreen.tsx` | ☐ |
| J-07 | §4.3 | Halo Ambient Glow visible en haut d'écran, sans dégrader le contraste | `src/components/joueur/JoueurScreenChrome.tsx` | ☐ |
| J-08 | §6 / §8.1 | Symboles IA (`star-four-points`), trophée, ballon, bouclier corrects et teintés accent | Cockpit, onglets | ☐ |
| J-09 | §F10 | Radar d'attributs et cartes sans chevauchement aux largeurs 320/390/768/1440 | `src/features/joueur/JoueurAttributeRadar.tsx` | ☐ |
| J-10 | §B8 / D-004 | États vides honnêtes (« Aucune rencontre archivée », compteurs à 0/—) ; aucun faux résultat IA, faux direct, faux message | Cockpit, onglet stats | ☐ |

### 3.2 Pôle Coach & Staff — accent Or Champagne `#C5A059` (P-COA)

- **Entrée** : rôle `coach` → `src/screens/coach/CoachPortalScreen.tsx` → `src/features/coach/shell/CoachAppShell.tsx`.
- **Ambiance §8.2** : tableau de bord tactique, rigueur professionnelle.
- **Thème** : variantes `solid` (sombre) et `clear` (claire) via `src/features/coach/shell/CoachThemeContext.tsx` ; accents équipe/club appliqués automatiquement. **Vérifier les deux variantes** : les correctifs de surfaces Coach (`COACH-T01`) portent sur la variante sombre.

| # | Réf. | Item | Écran | Case |
|---|---|---|---|---|
| C-01 | §8.2 | Convocations et présences : mise à jour visible et exacte, aucun état d'envoi fictif | `src/components/coach/match/CoachEventAttendanceList.tsx`, `CoachMatchEventHub` | ☐ |
| C-02 | §8.2 | Smart Tactics : XI de départ, banc, remplaçants ; terrain proportionné ; bac hors terrain | `src/screens/coach/CoachSquadScreen.tsx`, `src/components/coach/CoachPitchView.tsx`, `CoachBenchDrawer.tsx` | ☐ |
| C-03 | §8.2 | Suivi de forme et disponibilité de l'effectif ; alertes honnêtes (aucune alerte inventée) | `src/screens/coach/CoachWorkloadHealthScreen.tsx`, `src/screens/coach/CoachHomeScreen.tsx` | ☐ |
| C-04 | §8.2 | Briefings d'avant-match et causeries : lisibles, aucune homologation/statistique fabriquée | `src/screens/coach/CoachTacticalBoardScreen.tsx`, `CoachTwinMatchLabScreen.tsx` | ☐ |
| C-05 | §2.1 | Surfaces Coach alignées : cartes `#121218`, panneaux élevés `#1A1A24`, canvas noir — aucun gris du pôle Club (`#141418`, `#181820`, `#22222E`, `#1C1C22`) | Tous les écrans `src/screens/coach`, `src/components/coach` | ☐ |
| C-06 | §5.1 | En-tête Coach (kicker, titre, sous-titre `muted`, action de droite, retour squircle) | `src/components/coach/CoachScreenHeader.tsx`, `CoachPageFrame.tsx` | ☐ |
| C-07 | §8.2 / §F10 | Dock coach et rail latéral desktop : pas de double menu, pas de recouvrement au-delà de 900 px | `src/features/coach/shell/CoachSidebar.tsx`, `CoachTabBar.tsx`, `CoachCockpitChrome.tsx` | ☐ |
| C-08 | §2.2 | Bordures : `0.08` (cartes) / `0.14` (éléments interactifs) ; état actif teinté accent 45 % | Cartes, filtres, pilules | ☐ |
| C-09 | §5.2 / §B8 | Écrans vidéo/analyse : sources réelles uniquement, états d'échec explicites, aucune lecture de démonstration présentée comme réelle | `src/screens/coach/CoachVideoHubScreen.tsx`, `CoachMesVideosScreen.tsx` | ☐ |
| C-10 | D-004 | États vides honnêtes : classement (`Aucun classement disponible`), match center (`Aucun match en cours`), buteurs | `src/components/coach/CoachStandingsTable.tsx`, `src/screens/coach/CoachLiveMatchCenterScreen.tsx` | ☐ |

### 3.3 Pôle Club & Direction — accent Émeraude `#10B981` (P-CLU)

- **Entrée** : rôle `club` → `src/screens/club/ClubHomeScreen.tsx` / `ClubHubScreen.tsx`.
- **Ambiance §8.3** : centre de commandement institutionnel.

| # | Réf. | Item | Écran | Case |
|---|---|---|---|---|
| CL-01 | §8.3 | Équipes, licences et effectifs cohérents entre vues Club et Coach (même source) | `src/screens/club/ClubTeamsScreen.tsx`, `ClubPlayersScreen.tsx`, `ClubTeamSpaceScreen.tsx` | ☐ |
| CL-02 | §8.3 | Bourse aux amicaux et tournois inter-clubs : création possible sans source FFF, fuseau du lieu visible | `src/components/club/ClubFriendlyMatchesPanel.tsx`, `src/screens/ProposeMatchScreen.tsx` | ☐ |
| CL-03 | §8.3 | Pipeline de détection (Observé → Contacté → Essai → Intégré) lisible et cohérent | `src/components/club/ClubRecruitmentKanban.tsx`, `src/screens/club/ClubRecruitmentScreen.tsx` | ☐ |
| CL-04 | §8.3 | Financements / sponsoring / équipements : montants réels ou état vide, aucun faux succès | `src/components/club/ClubFinanceLedgerPanel.tsx`, `ClubEquipmentMarketPanel.tsx` | ☐ |
| CL-05 | §2.1 | **Écart corrigé (`CLUB-T03`)** : `src/features/club/theme/clubTokens.ts` est aligné sur §2.1 — `bgElevated #0A0A0F`, `surface #121218`, `elevated`/`raised #1A1A24` — et le chrome Club consomme ces tokens. Reste à confirmer visuellement : aucune nuance bleutée résiduelle (`#181C26`, `#12151C`, `#141822`, `#0E0E14`) dans les modales, champs, bulles et cartes métriques | Écrans Club (équipes, matchs, canaux, stats, classement, communication, menu) | ☐ |
| CL-06 | §5.1 / §F10 | En-tête et cadre de page Club, grille 8pt, pas de scroll horizontal à 320 px | `src/components/club/ClubPageFrame.tsx` | ☐ |
| CL-07 | §2.3 | Tableaux (classement, finances) : en-têtes `textMuted`, valeurs blanches, contraste ≥ 4.5:1 | `src/screens/club/ClubStandingsScreen.tsx`, `ClubStatsScreen.tsx` | ☐ |
| CL-08 | VEO-T08 / D-004 | Panneau « Connexions · VEO » : état de connexion véridique, club associé, méthode réellement supportée, aucun faux OAuth | `src/components/club/VeoConnectionPanel.tsx` | ☐ |
| CL-09 | §B8 / CLUB-T02 | Hubs (entraînements, buteurs, canaux, covoiturage, terrains) : données persistées ou état vide explicite | `src/screens/club/ClubTrainingsScreen.tsx`, `ClubCommunicationScreen.tsx`, `ClubCarpoolScreen.tsx` | ☐ |
| CL-10 | forme de référence | **Titre posé sur le canvas** : aucun encart, aucun fond, aucune pastille autour du titre ; titre net à gauche, sous-titre `textMuted` dessous | En-tête de chaque écran Club (`src/features/club/ui/ClubBrandHeader.tsx`, Accueil club) | ☐ |
| CL-11 | forme de référence | **Listes groupées en encart** : un seul conteneur arrondi (rayon 22) par groupe, fond `surface`, **ni bordure ni ombre**, filets internes en retrait alignés sur le libellé ; écart 28 entre groupes | Menu club, Accueil club (modules, équipes, adhésions) | ☐ |
| CL-12 | forme de référence | **Ligne de réglage** : icône en contour 22, libellé 17, chevron fin 15 en `textDim`, hauteur ≥ 62 ; aucun fond d'icône, aucune couleur d'accent sur la ligne ; **le filet interne passe sous le libellé** (marge 18 + icône 22 + écart 12) et ne le coupe pas | Lignes de tous les groupes du pôle Club | ☐ |
| CL-13 | forme de référence | **Puces d'action** : pilules rayon 999, hauteur 44, fond `elevated`, rangée défilante horizontalement sans défilement global ; bouton secondaire = pilule **à contour fin sans remplissage** ; sélection de filtre = **contour d'accent + libellé accent**, jamais un remplissage plein | Accueil (rangée de puces), écrans à filtres, états vides | ☐ |
| CL-14 | forme de référence | **Dock** : capsule à extrémités pleinement arrondies, accent sur l'onglet actif (icône **et** libellé), **aucun encart ni soulignement** sous l'onglet actif, **FAB central** de 56 chevauchant l'arête supérieure de la moitié de sa hauteur, sans recouvrir le contenu ; hauteur de barre et libellés lisibles en texte agrandi | Barre basse du pôle Club (mobile/tablette) | ☐ |
| CL-15 | forme de référence / §B8 | **Aucun chiffre de démonstration** sur l'Accueil : effectifs, adhésions, convocations et identité FFF proviennent du workspace réel ou affichent un état vide explicite | `src/screens/club/ClubHomeScreen.tsx` | ☐ |
| CL-16 | forme de référence (`CA-50`) | **Libellés du dock en bas de casse** (« Accueil », « Calendrier », « Équipes », « Menu »), jamais en capitales ; taille et graisse lisibles à texte agrandi 200 % | Barre basse du pôle Club | ☐ |
| CL-17 | forme de référence (`CA-51`) | **Cartes structurelles plates et neutres** : Calendrier, Matchs, Entraînements, Équipes, Effectifs, Finances, Coachs et Hub — une seule surface neutre par carte, **aucun lavage de couleur**, aucun rail latéral, aucune bordure teintée, aucune ombre portée ; la couleur ne circule que par les pastilles d'état et les icônes | `ClubCalendarChrome.tsx`, `ClubMatchesDay.tsx`, `ClubTrainingsDay.tsx`, `ClubTeamCard.tsx`, `ClubPlayersChrome.tsx`, `ClubFinanceChrome.tsx`, `ClubCoachesChrome.tsx`, `ClubHubChrome.tsx` | ☐ |
| CL-19 | palette mesurée (D-011) | **Palette du pôle Club identique à la charte fournie** : canvas noir, cartes `#191E23` (gris **bleuté froid**, pas neutre), surfaces élevées `#262E33`, accent **or `#F8D548`**, et surtout **contenu noir sur l'or** (FAB, badges, CTA pleins) — jamais de libellé blanc sur l'or (~1,4:1). Vérifier aussi que les statuts restent **verts/rouges** (« conforme », « en retard », « payé ») et ne sont pas passés à l'or | Tous les écrans du pôle Club | ☐ |
| CL-20 | palette mesurée (D-011) | **Convergence d'identité à arbitrer** : Club, Coach et Président sont désormais tous dans les ors (`#F8D548` vs `#C5A059`) — vérifier si la distinction visuelle entre ces trois pôles reste suffisante sur la barre d'onglets, la carte d'univers et les écrans d'inscription | Sélecteur d'univers, inscription, docks Club / Coach / Président | ☐ |
| CL-18 | forme de référence (`CA-52`, non traité) | **Communication et hero** : vérifier si les lavages diagonaux de `ClubCommunicationHub`, le lavage vertical de `ClubPlayerHero` et le halo blanc de `ClubHubScreen` sont visibles et s'ils jurent avec les autres cartes plates | `ClubCommunicationHub.tsx`, `ClubPlayerHero.tsx`, `screens/club/ClubHubScreen.tsx` | ☐ |

### 3.4 Pôle Parent & Famille — accent Vert Lime `#8CC63F` (P-PAR)

- **Entrée** : `src/navigation/ParentAppShell.tsx`.
- **Ambiance §8.4** : rassurante, claire, simplifiée, bienveillante (contraste élevé, pas de surcharge).

| # | Réf. | Item | Écran | Case |
|---|---|---|---|---|
| PA-01 | §8.4 | Agenda des matchs/entraînements des enfants, ordre chronologique, fuseaux corrects | `src/screens/parent/ParentAgendaScreen.tsx` | ☐ |
| PA-02 | §8.4 | Covoiturage entre parents : places, conducteur, statut réels | `src/screens/parent/ParentCarpoolScreen.tsx`, `src/screens/CarpoolScreen.tsx` | ☐ |
| PA-03 | §8.4 | Validation des présences et autorisations parentales : action explicite, accusé véridique | `src/screens/ParentalControlScreen.tsx`, `ParentalActivityReportScreen.tsx` | ☐ |
| PA-04 | §8.4 | Guide éducatif & IA d'accompagnement : ton bienveillant, résultat présenté comme à vérifier | `src/screens/parent/ParentGuideScreen.tsx` | ☐ |
| PA-05 | §2.3 / §7.3 | Lisibilité famille : textes informatifs ≥ 4.5:1, hiérarchie claire, pas de jargon | Tous écrans Parent | ☐ |
| PA-06 | §8.4 | Profil enfant : identité vérifiable, aucune donnée d'un autre enfant | `src/screens/parent/ParentChildProfileScreen.tsx` | ☐ |

### 3.5 Pôle Supporter & Tribune — accent Cyan `#06B6D4` (P-SUP)

- **Entrée** : `src/navigation/SupporterAppShell.tsx` (rôle `supporter`, ou parent en visite invitée).
- **Dock** : Accueil · Matchs · Compétitions · Mes clubs · Vidéos · Profil (`src/navigation/resolveMainTabScreen.tsx`).
- **Ambiance §8.5** : festive, communautaire, 100 % libre et gratuite (aucun paywall).

| # | Réf. | Item | Écran | Case |
|---|---|---|---|---|
| S-01 | §8.5 | Scores en direct des clubs de quartier/région : état « pas de direct » explicite, jamais de faux live | `src/screens/supporter/SupporterMatchsScreen.tsx` | ☐ |
| S-02 | §8.5 | Fil d'actualité vidéo, moments forts et classements : médias réels uniquement | `src/screens/supporter/SupporterVideosScreen.tsx`, `SupporterCompetitionsScreen.tsx` | ☐ |
| S-03 | §8.5 | Billetterie solidaire / boutique : statut de commande véridique | `src/screens/supporter/SupporterHomeScreen.tsx`, `src/screens/ShopScreen.tsx` | ☐ |
| S-04 | §5.1 / §8.5 | Dock supporter conforme à l'ordre annoncé, accent cyan appliqué aux éléments actifs | `src/features/supporter/**` | ☐ |
| S-05 | §B8 | Aucun club « vérifié » inventé ni classement fictif dans l'annuaire supporter | `src/screens/supporter/SupporterClubsScreen.tsx`, `src/screens/ClubsListScreen.tsx` | ☐ |

### 3.6 Pôle Sponsor & Marque — accent Magenta `#92278F` (P-SPO)

- **Entrée** : `src/navigation/SponsorAppShell.tsx`.
- **Ambiance §8.6** : business, ROI, visibilité.

| # | Réf. | Item | Écran | Case |
|---|---|---|---|---|
| SP-01 | §8.6 | Catalogue d'opportunités de sponsoring local : offres réelles ou état vide | `src/screens/sponsor/SponsorHubScreen.tsx`, `SponsorOfferDetailScreen.tsx` | ☐ |
| SP-02 | §8.6 | Métriques d'impact / visibilité : source et période visibles, aucune métrique inventée | `src/screens/sponsor/SponsorCampaignsScreen.tsx` | ☐ |
| SP-03 | §8.6 | Dotations et contrats : statut contractuel véridique, pas de faux « signé » | `src/screens/sponsor/SponsorContractScreen.tsx` | ☐ |
| SP-04 | §2.4 / D-006 | Accent runtime `#92278F` (branding README) — `sponsorRed #EF4444` de DESIGN.md §2.4 n'est pas appliqué : divergence décidée | Tous écrans Sponsor | ☐ |

### 3.7 Rôles intégrés (P-PRE, P-ADM, P-EVT) — pas des apps séparées

| # | Pôle | Réf. | Item | Écran | Case |
|---|---|---|---|---|---|
| PR-01 | Président — accent `#C5A059` | §8.3 | Tableau de bord institutionnel : sections réelles, aucun chiffre de démonstration | `src/screens/president/PresidentDashboardScreen.tsx`, `PresidentSections.tsx` | ☐ |
| AD-01 | Admin — accent `#A3A3A3` | §B9 / UI-01 | Console : surfaces sombres spec, droits côté service autoritaires, aucune invitation/message prétendument envoyé | `src/screens/admin/AdminPortalScreen.tsx`, `AdminHomeScreen.tsx`, `AdminStaffScreen.tsx`, `AdminSystemScreen.tsx` | ☐ |
| EV-01 | Événements — accent `#F7941D` | §8.5 | Compétitions/tournois : affiches, classements et directs cohérents, pas de faux résultats | `src/screens/competition/CompetitionDashboardScreen.tsx`, `TournamentLiveScreen.tsx` | ☐ |

## 4. Divergences spec ↔ runtime (ne pas cocher comme défaut)

| # | DESIGN.md | Valeur runtime (source) | Décision |
|---|---|---|---|
| 1 | §2.4 / §8.1 `playerGreen #00E676` / `#2DD4BF` | `#FFFFFF` (`assets/branding/README.md`, `src/theme/prodayBrand.ts`) | D-006 — accent Joueur blanc conservé (deux sources de vérité sur trois) |
| 2 | §2.4 `clubBlue #00ADEF` / §8.3 « ou Bleu » | `#10B981` (branding README, `PRODAY_POLE_ACCENTS.club`) | D-006 — émeraude conservée (aligne §8.3 « Émeraude Football ») |
| 3 | §2.4 `sponsorRed #EF4444` | `#92278F` (§8.6 Magenta, branding README) | D-006 — magenta conservé (§8.6 fait autorité sur §2.4) |
| 4 | §8.1 dock Joueur « 5 onglets » | 13 destinations + feuille de débordement (`src/navigation/mainTabConfig.ts`) | Écart de spécification à trancher (produit), pas un défaut visuel |
| 5 | §2.1 `surface #121218` | Pôle Club : `#141418` / `#181820` / `#22222E` (avant correction) → aligné `#121218` / `#1A1A24` (`src/features/club/theme/clubTokens.ts`) | **Écart réel — corrigé** (`CLUB-T03`) ; seule la confirmation visuelle reste (item CL-05) |

## 5. Gabarit de consignation (contrat §G)

Chaque item coché produit une ligne dans `docs/proday-verification.md` :

| ID | Exigence | Préconditions | Rôle | Données utilisées | Étapes | Résultat attendu | Résultat observé | Environnement | Version testée | Preuve | Limites |
|---|---|---|---|---|---|---|---|---|---|---|---|
| ex. J-06 | UI-01 / §5.2 | Compte joueur de test | Joueur | Profil de test | Ouvrir Conseiller IA | Bulles conformes §5.2 | … | iPhone 15 / iOS 18.4 | build 1.0.9 | capture écran | — |

## 6. Critères de sortie de la recette

1. §1 entièrement renseignée : aucun support marqué « vérifié » sans observation réelle.
2. T-01 → T-20 parcourus dans chacun des six pôles + rôles intégrés, avec preuve par item coché.
3. Les écarts §4 sont corroborés par une ligne de vérification : divergence décidée (1–3), écart de spécification produit (4), écart réel à corriger (5).
4. Les items §3 spécifiques au pôle sont tous traités, ou marqués « bloqué » avec la dépendance nommée.
5. Aucun item coché ne s'appuie uniquement sur une inspection de code.
