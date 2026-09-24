# ProDay — Rapport consolidé des manques par page du cahier des charges

Généré le 15 septembre 2026 depuis `docs/proday-requirements.md` (registre) et `docs/proday-verification.md` (preuves). Référence produit : `ProDay-Freebuff-boucles-completes.md` v. 14/09/2026.

**Usage :** chaque ligne nomme la (les) exigence(s) du registre couvrant la page, son état exact au registre, le manque principal et la prochaine action concrète. Reprendre une session en choisissant un ID de la file « Reprise par ID » (fin de ce document) puis en lisant sa ligne ici. Un état de code (« À vérifier ») ne vaut jamais validation service/appareil (règle G).

## Synthèse par page

| Page | Titre | Exigences | État | Manque principal | Prochaine action |
|---|---|---|---|---|---|
| 0 (transverse) | Direction globale : VEO d'abord, zéro donnée fictive, barre basse, recherche | VEO-*, DATA-01, UI-02, SEARCH-01 | Mélange (voir pages) | Balayage DATA-01 clos (reste l'asset de démo Maestro, `__DEV__` uniquement) ; surfaces grises alignées dans tous les pôles (Coach `COACH-T01`, Club `CLUB-T03`, reste du socle `UI-T04`) | DATA-01 : rien d'actionnable hors `pickReelVideo` ; UI-01 : recette visuelle par pôle sur appareil (checklist) |
| 1 | Accueil | UI-01, DATA-01 | En cours | Non audité page par page cette session | Inspection UI-01 (cartes, hiérarchie, une action principale) |
| 2 | Ma Carte — profil joueur + vraies stats | SPORT-01, DATA-01 | À examiner | Stats liées aux résultats réels non vérifiées bout en bout | SPORT-01 : tracer stats joueur ↔ `player_match_stats` ↔ profil |
| 3 | Calendrier & Convocations | SPORT-01, NOTIF-01 | À examiner | Présences/RSVP déjà persistés (tests VEO-02) mais recette convocation non tracée | Scénario NOTIF/SPORT : convocation → réception → RSVP → pointage |
| 4 | Partage (Flex & Share) | UI-01 | À examiner | Existence confirmée (`GuestUniverseHome`, partage reels) ; conformité spec non auditée | Inspection de code + scénario manuel |
| 5 | Messagerie transverse | CHAT-01, CHAT-02, SEARCH-02 | À examiner | Service réel (`messages.service`) jamais recetté de bout en bout | CHAT-01 : boucle émission → persistance → réception → historique (comptes test requis) |
| 6 | Tableau de bord équipe | SPORT-01 | À examiner | Cohérence Coach/Club sur les mêmes objets non vérifiée | Comparaison des vues Coach vs Club sur un même club de test |
| 7 | Séances d'entraînement | SPORT-01, DATA-01 | En cours | Hub club reconnecté (CLUB-T02) ; côté coach non audité | Étendre l'audit DATA-01/SPORT-01 au pôle coach |
| 8 | Scouting Vocal / Notes de match | SPORT-01 | À examiner | Services présents (`scoutReports`, `scoutingShortlist`) ; conformité non vérifiée | Inspection : droits, persistance, aucun faux résultat IA |
| 9 | Tactique — composition progressive | LINEUP-01, LINEUP-02 | En cours / À réaliser | Ordre imposé attaquants→… testé ? brouillon/publié distincts non prouvés | LINEUP-01 : tests d'ordre ; LINEUP-02 : persistance brouillon + reprise |
| 10 | Convocations & Communication | SPORT-01, CHAT-01 | À examiner | Même manque que pages 3 et 5 | Idem CHAT-01/SPORT-01 |
| 11 | Évaluation joueurs IA | VEO-07, DATA-01 | À réaliser | IA vidéo fermée tant que VEO non validée (règle B1) — évaluations hors vidéo non auditées | Garder fermée côté vidéo ; auditer évaluations manuelles existantes |
| 12 | Tableau de bord admin club | ADMIN-01 | À examiner | Droits par module non vérifiés côté service | ADMIN-01 : vérifier règles Firestore vs interface (finance d'abord) |
| 13 | Cockpit financier | ADMIN-01, DATA-01 | À examiner | Panneau réel (`ClubFinanceLedgerPanel`) ; accès coach aux détails financiers à confirmer bloqué | ADMIN-01 : test « coach ≠ accès finance » |
| 14 | Suivi des entraînements par équipe | SPORT-01 | En cours | Séances réelles branchées (CLUB-T02, `buildSessionCheckIns`) ; taux de présence global non recetté | Recette avec données réelles multi-équipes |
| 15 | Score en direct & Résultats | SPORT-03, DATA-01 | À examiner | Faux « DIRECT » supprimé (CLUB-T01) ; saisie réelle via hub match existante mais non recettée | SPORT-03 : score saisi → consultable → traçable, sans démo |
| 16 | Matchs amicaux autonomes | SPORT-02 | À examiner | Parcours Firestore réel (accept/refus/contre-proposition) jamais recetté | SPORT-02 : deux clubs ProDay + adversaire externe + ultramarin |
| 17 | Gestion des effectifs multi-équipes | SPORT-01 | En cours | Hiérarchie équipes réelle (`ClubTeamsHierarchy` démo retirée) ; import PDF rattaché à PDF-02 | PDF-02 : rapprochement sans doublon |
| 18 | Suivi technique global | SPORT-01 | À examiner | Indicateurs agrégés alimentés par données vides (honnête) mais formules non vérifiées | Vérifier calculs sur données de test persistées |
| 19 | Classements officiels | SPORT-03, DATA-01 | À examiner | Écran réel (`ClubStandingsScreen`) ; source FFF conditionnelle non confirmée (hypothèse découverte déjà consignée) | Confirmer l'accès source ou maintenir saisie manuelle seule |
| 20 | Paramètres club | ADMIN-01, VEO-02 | À vérifier | Connexions VEO panel monté (VEO-T08) ; gestion membres/invitations non audité | ADMIN-01 : fiche de droits + trace des modifications |
| 21 | Vidéo VEO (priorité absolue) | VEO-01…07 | Mélange | Chaîne in-app complète ; **blocage externe** : pas d'OAuth Partenaire, pas de flux réel, pas d'appareils | Fournir accès VEO + appareils (VEO-01/06 bloqués) ; sinon rien d'actionnable côté code |
| 22 | Coaching IA joueur | DATA-01 | À examiner | `playerCoachAi.service` présent ; recommandations « à vérifier » non auditées | Inspection DATA-01 sur les sorties IA affichées |
| 23 | Covoiturage | DATA-01, SPORT-01 | En cours | Hub reconnecté au service réel (CLUB-T02) ; bouton « Demander une place » spec vs panneau joueur à réconcilier | Vérifier les deux actions spec (proposer / demander) dans les deux pôles |
| 24 | Inscription, connexion, recherche club, univers | AUTH-01, AUTH-02, CLUB-01 | À vérifier / En cours | Recette code faite (AUTH-T01) ; SMS réel, e-mails réels et comptes de test manquants | Comptes de test par rôle + appareils (AUTH-T01 limites) |
| 25 | Notifications | NOTIF-01 | À examiner | Services présents (`notification`, `prodayLocalNotifications`, `staffNotifications`) ; centralisation non vérifiée | NOTIF-01 : lu/non-lu, ouverture dans le bon espace |
| 26 | Paramètres du compte | AUTH-02, UI-01 | À examiner | Écran(s) présents ; suppression de compte réelle (`deleteMyAccount`) non recettée | Scénario changement de méthode + suppression + session expirée |
| 27 (annexe) | Écrans admin & système | ADMIN-01, DEVICE-01 | À examiner | Hors priorité tant que les parcours joueurs/coach/club ne sont pas validés | Après AUTH/CHAT |
| 28 (annexe) | Import PDF | PDF-01, PDF-02 | En cours / À réaliser | Extraction/prévisualisation en cours ; rapprochement et réouverture à réaliser | PDF-02 puis tests F8 (multipage, protégé, accents, homonymes) |

## Invariants transverses (à respecter dans toutes les boucles)

| Invariant | ID | État | Note |
|---|---|---|---|
| Zéro donnée de démonstration | DATA-01 | En cours | Pôle club : 0 fixture restante (CLUB-T01/T02). Reste : `globalSearch.service`, `TrainHubScreen`, `ProPlayerGroupScreen`, asset reel `pickReelVideo` |
| VEO avant IA vidéo | VEO-07 | À réaliser | IA vidéo reste fermée ; ne pas activer tant que VEO-04/06 ne sont pas validées sur flux réel |
| Barre basse 4 destinations + Menu, sans tiroir | UI-02 | En cours | Vérifié club (BottomTabBar unifiée) ; autres pôles à confirmer explicitement |
| Preuves graduées (G) | VERIFY-01 | En cours | Chaque scénario a preuve + limite ; ne pas confondre inspection/test local/service réel/appareil |
| Droits côté service autoritaires (B9) | ADMIN-01 | À examiner | Masquer un bouton ne suffit jamais ; règles Firestore à recetter |

## Reprise par ID (file conseillée)

1. ~~**DATA-01** (Critique)~~ **sweep terminé** — `globalSearch.service.ts`, `TrainHubScreen.tsx`, `ProPlayerGroupScreen.tsx` ne contiennent plus aucune injection ; les écrans Admin (`AdminHomeScreen`/`AdminStaffScreen`), les classements FFF (`frenchFootballStandings.service`), la résolution de compétition (`clubLeagueResolution`), les écrans joueur/coach routés (`PlayerSaisonScreen`, `PlayerHomeScreen`, `PlayerStatsScreen`, `ClubStandingsScreen`, `CoachHomeScreen`, `CoachStandingsTable`, `CoachLiveMatchCenterScreen`) et le passeport (`playerPassport.service`) sont passés en données réelles/états vides honnêtes. **Seul reste `src/utils/pickReelVideo.ts`** (`DEMO_REEL_VIDEO`) : clip Maestro/smoke, bouton « Demo » monté uniquement sous `allowDemoVideo={__DEV__}` — outil de développement identifié, pas une donnée de production. Vérif : `grep -rn "DEMO_" src --include=*.ts --include=*.tsx | grep -v __tests__` ne renvoie plus que ce fichier.
1bis. ~~**UI-01 pôle Club**~~ **fait (`CLUB-T03`)** — `src/features/club/theme/clubTokens.ts` aligné sur DESIGN.md §2.1/§2.2/§2.3 (`bgElevated #0A0A0F`, `surface #121218`, `elevated`/`raised #1A1A24`, `borderStrong 0.14`, `foreground #FFFFFF`, `faint` = `textDim`) ; 41 surfaces navy/charcoal locales remplacées par les tokens dans 10 fichiers du chrome Club ; garde-fou `src/__tests__/clubChromeTokens.test.ts` (7 tests). Reste : confirmation visuelle (item CL-05 de la checklist). Prochaine cible UI-01 : ~~pôles covoiturage, player, admin, messages~~ **fait (`UI-T04`, étape 2)** — thèmes de pôle (`prodayBrand`, `prodayAmateurTheme`, `prodayParentTheme`, `prodaySanteTheme`, `prodaySupporterTheme`, `prodayWomanTheme`, `playerSegmentTheme`, `playerDarkPremium`, `universeTheme`, `universeGradients`) alignés §2.1, puis 43 surfaces locales dans les écrans/composants restants (`AmateurClubScreen`, `TeamManagementScreen`, `MatchNextUpCard`, `MatchWeekStrip`, `PlayerSaisonScreen`, `screens/player/PlayerHomeScreen`) et les dégradés (proClub.card, ambient, flashAmbient, gradientEnd, shieldGradient). Garde-fou `src/__tests__/poleSurfaceConsistency.test.ts` (17 tests). Scan app-wide : zéro gris hors spec hors exceptions documentées (encre sur puce claire inscription, encre sur feuille blanche auth, arrêts SVG du stade, palette de marque club). Reste : recette visuelle par pôle sur appareil.
2. **SPORT-02** (Majeur, service prêt) — recette amicaux avec deux clubs test + adversaire externe ; le parcours Firestore existe (`friendlyMatches.service`).
3. **CHAT-01 → CHAT-02 → SEARCH-02** (Bloquant) — recette messagerie de bout en bout ; `messages.service` complet mais jamais recetté ; comptes de test requis.
4. **SPORT-01 → SPORT-03** (Bloquant/Majeur) — source de vérité stats/scores ; s'appuyer sur `player_match_stats` déjà persistés (VEO-T06).
5. **NOTIF-01** (Majeur) — centralisation et ouverture dans le bon espace.
6. **LINEUP-01 → LINEUP-02** (Majeur) — tests d'ordre de composition, brouillon/publié.
7. **ADMIN-01** (Critique) — règles Firestore vs interface, finance d'abord.
8. **PDF-02 → PDF-01 fin** (Majeur) — rapprochement sans doublon, tests F8.
9. **UI-01 / UI-02 / DEVICE-01** — matrice d'interfaces ; nécessite appareils (partiellement bloqué). Socle Dark Premium désormais propagé hors Coach/Club (`UI-T04`, étape 2) : thèmes de pôle + 43 dernières surfaces locales + dégradés alignés §2.1 ; scan app-wide sans gris hors spec. Reste une recette visuelle par pôle (checklist `docs/proday-visual-qa-checklist.md`) et la matrice d'appareils DEVICE-01.
10. **VEO-01 / VEO-06** (Bloqués externes) — rien d'actionnable côté code ; fournir identifiants OAuth Partenaire, club/flux VEO réel, appareils. Toute la préparation côté application est faite (VEO-T01…T10).

## Blocages externes inchangés

- Identifiants VEO Partner OAuth non délivrés (VEO-01).
- Aucun club/match VEO réel ni diffusion de test (VEO-02/03/04 service réel, VEO-05).
- Aucun appareil iPhone/tablette/PC fourni pour la matrice (VEO-06, DEVICE-01/02).
- Aucun compte de test par rôle pour la recette AUTH/CHAT/SPORT de bout en bout.
