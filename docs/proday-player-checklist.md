# Checklist du pôle Joueur — refonte Player (route par route)

Inventaire et état réel après la boucle **L17** (socle design Player + dock 4
destinations + conversion des écrans principaux). Conventions identiques à
`proday-coach-checklist.md` : une case n'est cochée que si forme **et**
fonctionnement ont été constatés.

## Méthode et limites

| Élément | Valeur réellement utilisée |
| --- | --- |
| Aperçu | Metro dédié `http://localhost:8083` (session `screen` `metro-player`, process 50402) — le port 8081 appartient à l'aperçu Coach de l'autre thread |
| Compte | `player.demo@proday.app` (Lucas Démo — FC ProDay Démo, Seniors, milieu #8) |
| Mesure | Audit géométrique du DOM dans la page (rectangles, rayons, couleurs calculées, débordement, rognage) |
| Largeur auditée | **730 × 905 uniquement** — une seule largeur, comme la boucle Coach |
| Captures | 1 capture rendue (Menu) ; la webview reste par ailleurs sans frames |

Conséquence assumée : **PC desktop large, tablette, iPhone et orientations ne
sont pas vérifiés** ; toute mention ✅ signifie « vérifié à 730 × 905 sur le
compte joueur de démonstration ».

## Socle livré (partagé, une seule source)

| Élément | État |
| --- | --- |
| `src/theme/playerDesignSystem.ts` (nouveau) | ✅ forme Fitness Park (cartes r22/24, puces 44/999, actions 52/999, lignes 62, champs 52/18) + `playerType` = références `APPLE_TYPOGRAPHY` (identité, pas copie) + surfaces `PLAYER_DARK` + tons de réponse dérivés de `CLUB_TOKENS` (vert/orange/rouge communs Coach/Club) — **0 couleur littérale** |
| Garde-fou `playerDesignSystem.test.ts` (nouveau, 7 tests) | ✅ zéro littéral, identité Apple, parité de forme avec `clubForm`, sélection au contour, entrée Menu « Ma Saison » |
| Garde-fou `playerVisualAlignment.test.ts` (nouveau, 4 tests) | ✅ plafond **0 littéral** sur les fichiers convertis, dock Apple + 4 destinations dans l'ordre, cibles de forme |
| `components/navigation/PlayerDockTabBar.tsx` (nouveau) | ✅ dock capsule : Accueil · Calendrier · Ma Carte · Menu ; état actif sur la couleur ; libellés Apple 12 px bas de casse |

## Dock — 4 destinations (refonte Player §4)

| Destination | Écran rendu | État |
| --- | --- | --- |
| Accueil (`home`) | Portail Joueur → Cockpit (`PlayerHomeScreen`) | ✅ ouvert et vérifié |
| Calendrier (`matchs`) | `MatchsScreen` (Centre Match, convocation, Radar, Stats, Classement) | ✅ ouvert et vérifié |
| Ma Carte (`profil`) | Profil joueur (Compte/Parcours/Activité/Paramètres + carte + passeport) | ✅ ouvert et vérifié |
| Menu (`plus`) | `JoueurPlusHubScreen` (« Tout ProDay ») | ✅ ouvert et vérifié |
| Ma Saison (`feed` → `progression`) | Depuis Menu : tuile « Ma Saison » → Progression (XP, quêtes, objectifs) | ✅ tuile présente et navigue ; écran rendu |

Mesures relevées en aperçu (730 × 905) : onglets de dock **173 × 48** chacun,
libellés **12 px**, `text-transform: none`, aucune capitale imposée ; boutons de
réponse **44 px de haut**, rayon 18 ; cartes `rgb(18,18,24)` rayon **22**, hero
rayon **24**, bordures `rgba(255,255,255,0.08/0.14)` — **0 débordement
horizontal, 0 cible < 30 px** sur l'audit complet de l'accueil.

## Écrans convertis au socle partagé (0 couleur littérale)

| Fichier | Avant | Après |
| --- | --- | --- |
| `screens/player/PlayerPortalScreen.tsx` | 7 littéraux, aplat vert actif, touches < 44 | **0** ; segment actif au **contour d'accent**, cibles 44, `accessibilityRole="tab"` |
| `screens/player/PlayerHomeScreen.tsx` | 88 littéraux, dégradés bleu nuit hors spec | **0** ; cartes plates Fitness Park sur fond noir, dégradés retirés, barre de réponse sur `playerResponseTone` (vert/orange/rouge communs), honnêteté conservée |
| `screens/player/PlayerStatsScreen.tsx` | 51 littéraux, « 1 540' / 18 titularisations » inventés | **0** ; KPI réels ou « — » (DATA-01), période « Saison 2026/2027 », notations du staff à état vide honnête |
| `screens/player/PlayerWellnessScreen.tsx` | 69 littéraux, dégradés, **ACWR « 1.08 » fabriqué** | **0** ; check-in réel conservé (score/vigilance calculés), ACWR en état honnête, échelles 1–5 aux puces du socle (44 pt), sauvegarde avec confirmation + erreur actionnable |
| `screens/player/PlayerTacticalView.tsx` | 36 littéraux, **onze fictif** (Lloris, Griezmann…), pastille « EN DIRECT » inventée, causerie simulée | **0** ; composition lue sur `TeamEvent.lineup` (publiée par le staff) via `pickLineupTargetEvent`, causerie réelle via `matchTalkService`, états honnêtes quand rien n'est publié |

## Recette visuelle — largeurs, texte agrandi, clavier (L20)

Méthode : conteneur racine contraint à la largeur visée + `innerWidth`/`innerHeight`
redefinis, puis audit DOM réel (débordements, textes tronqués, cibles < 44 pt).
Aucune maquette : c'est le vrai layout flex qui reflue.

| État testé | Accueil | Santé | Tactique | Défauts trouvés |
| --- | --- | --- | --- | --- |
| 320 × 844 | ✅ 0 débordement, 0 troncature | ✅ (après corrections) | ✅ (après corrections) | 7 corrigés (voir ci-dessous) |
| 390 × 844 | ✅ | ✅ | ✅ | contenu à 59-60 px au-dessus du dock (jamais recouvert) |
| Texte ×1,5 (proxy Dynamic Type) | ✅ | ✅ | ✅ | 0 |
| Texte ×2 (taille d'accessibilité extrême) | ✅ | — | titre tronqué → corrigé | libellés du dock tronqués → plafonnés à 1,4× |
| Écran court 390 × 420 (proxy clavier) | — | — | — | ⚠️ feuille modale non bornée → corrigée en `82%` |

**Corrections apportées :** rail du portail en défilement horizontal avec onglets
`minWidth: 96` et cible à 44 pt (avant : « Passeport & CV » tronqué à 48 px,
cible à 36 pt) ; en-têtes Santé/Tactique en `flexWrap` avec `minWidth: 168`
(avant : titre tronqué à 57 px) ; steppers du check-in à 44 pt (avant 34 pt) ;
libellés de cartes/CTA/statut sur 2 lignes et `flexWrap` (avant : tronqués) ;
titres d'écran sur 2 lignes ; `maxFontSizeMultiplier: 1.4` sur les libellés du
dock ; feuille du guide bornée à `82%` de la fenêtre réelle au lieu d'une
constante calculée au chargement du module.

**Limite du banc** : sur web, la `Modal` de React Native Web rend son contenu
dans le flux du document (feuille mesurée à `top: 1120`), donc l'aperçu ne peut
pas valider le comportement des modales en écran court — à recetter sur appareil.

## Contrôles exécutés

| Contrôle | Résultat |
| --- | --- |
| `npx tsc --noEmit` | **0 erreur** |
| `npx jest` | **361 suites / 2 367 tests verts** (après intégration des tests du workstream parallèle) |
| Garde-fous anti-régression | `playerDesignSystem` (7), `playerVisualAlignment` (4), Coach/Club intacts (`coachProDesignAlignment`, `clubReferenceForm` verts) |
| Bundle Metro iOS (8083) | HTTP 200 (**29 835 825 octets**) contenant `playerDesignSystem` / `PlayerDockTabBar` |
| Données affichées | Réelles : Lucas Démo, 12 matchs / 3 buts / 5 passes, convocation « 1 en attente », classement « DONNÉES NON DISPONIBLES » (véridique), feuilles « Pas encore de feuilles de match » |

## Workflows §6 — état réel

| Parcours | État | Preuve |
| --- | --- | --- |
| Répondre à un événement → reflété côté Coach | ⛔ **Non reproduit à l'écran** — deux activations (clic CDP + clavier) n'ont déclenché **aucun RPC d'écriture** (réseau : uniquement des Listen 200) ; le flux réseau reste silencieux, donc ni refus de règle ni succès. Le code d'écriture (`teamEventsService.updateRsvp`) est inchangé et testé ; la recette doit être reprise sur appareil ou dès que le flake RN-Web `Pressable` (constaté depuis L14) le permet | `preview_logs` : 0 write |
| Ouvrir le bon événement / lieu / compo publiée | 🟡 l'événement réel s'affiche (jeu. 17 sept. 18:30, Lyon, Marc Coach Démo, « Compo à poser ») — la compo n'est pas publiée côté seed, rien d'inventé côté joueur | snapshot Calendrier |
| Rechercher une personne autorisée → profil → DM | ⛔ non exercé cette boucle | — |
| Créer / rejoindre un groupe autorisé | ⛔ non exercé — reste bloqué par les règles Firestore non déployées (D-014, hors périmètre Player) | — |
| Demander un siège covoiturage → réservation confirmée | ⛔ non exercé | — |
| Vidéo de match autorisée | ⛔ non exercé (Veo bloqué en externe, VEO-01) | — |
| Modifier un profil autorisé | ⛔ non exercé | — |
| Réouverture → données intactes | 🟡 rechargement complet de la page effectué, session et données revenues (persistance navigateur) ; continuité multi-appareils reste DEVICE-02 (bloqué) | reload vérifié |

## Blocages et limites à reporter

1. **RSVP non rejoué à l'écran** (voir tableau §6) — aucune écriture déclenchée,
   cause probable = flake RN-Web `Pressable` documenté depuis L14 ; à recetter
   avant de déclarer le parcours vérifié.
2. **Concurrence Coach** : `CoachAiTacticsSheet.tsx` (fichier du workstream
   Coach, édité par l'autre thread) a été vu en **erreur de syntaxe**
   (`'withAlpha(tokens.bg, 0.75)'` écrit comme chaîne, ligne ~422), cassant le
   bundle Metro 8081. Ne pas intégrer tant que la boucle Coach n'est pas revenue
   au vert ; `npx tsc` côté Player est resté 0 erreur.
3. **Une seule largeur auditée (730)** — desktop, tablette, iPhone, portrait/
   paysage, texte 200 %, clavier ouvert : non vérifiés (DEVICE-01).
4. **Écrans Player non encore convertis** au socle partagé (mesuré en littéraux) :
   `PlayerSaisonScreen` (120), `PlayerSaisonIcons` (24), `JoueurPlusHubScreen` (11),
   `JoueurTacticsCoachScreen` (10), `JoueurWhoAreYouGateScreen` (5),
   `PlayerFootballHubScreen` / `PlayerProgressionScreen` (0 littéral mais jamais
   relus visuellement). **Non touchés à dessein** : `MatchsScreen`,
   `MessagesScreen`/`ChatScreen` — écrans **partagés avec le pôle Coach**
   (`CoachPortalScreen`, `CoachAppShell` les importent), propriété du workstream
   partagé pour éviter tout conflit de styles.
6. **Défauts observés au playtest, non corrigés** : avatar de démo pointant un
   `file:///…/ImagePicker/*.jpg` (chemin du simulateur) → image cassée sur web
   (donnée seedée, propriété profil/seed) ; l'arbre a11y RN-Web n'expose pas
   `aria-checked` des radios (limitation de la lib — `checked`+`selected` posés
   pour le natif). Corrigé au passage : `brainState.mapper` écrivait
   `last_action: undefined` → `setDoc` échouait (progression non persistée).
5. **Git indisponible** (licence Xcode non acceptée sur la machine) : modifications
   suivies hors git — rien n'a été commité.

## Prochaine boucle (L20)

1. Recetter le RSVP (écriture réelle + reflet côté Coach `coach.demo@proday.app`) —
   reste le parcours §6 le plus important non prouvé.
2. Convertir `PlayerSaisonScreen` (120 littéraux) puis `JoueurPlusHubScreen`.
3. Étendre la recette visuelle aux largeurs 320 / 390 et au texte agrandi
   (l'aperçu n'exposait qu'une seule largeur cette boucle).
4. Rejouer les parcours §6 restants (recherche → DM, covoiturage, vidéo).

## L21 — Conversion au socle zéro-littéral (plafond par fichier)

Audit des 8 écrans demandés (Wellness, TacticalView, Matchs, Messages/Chat,
Carpool, Notifications, Coach IA, EditProfile) : **tous à 0 littéral** après la
passe précédente (Jetons neutres inter-pôles pour Carpool/Chat/Notifications).
Le dernier fichier porteur de couleurs était le **corps réel de l'écran Coach
IA** : `components/joueur/PlayerCoachAiChat.tsx` (32 littéraux dans les styles,
6 en ligne). Converti vers les jetons existants, sans changement de rendu :

- 3 accents d'exercices → `CLUB_TOKENS.success`, `PLAYER_DARK.statBlue`,
  `PRODAY_POLE_ACCENTS.club` (or de charte `#F8D548` remplace un or inventé
  `#FFD700`) ; `#FF9F0A` → `CLUB_TOKENS.warning`.
- Gris/fonds/bordures → `PLAYER_DARK` (bg/surface/surfaceRaised/text/textMuted,
  border 0.06→0.08 — deltas ≤ 2 % d'alpha sur un fond noir, imperceptibles) ;
  incertitude héritée `'transparent'` (HTML) retirée.
- Bandeau d'erreur → `CLUB_TOKENS.danger` / `dangerSoft` (registre sémantique
  commun Coach/Club ; alpha 0.12→0.16).
- Fallback `teamColor` → `PLAYER_DARK.accent` (identité pôle, alignée socle).

Garde-fou étendu : `PlayerCoachAiChat.tsx` ajouté à `ZERO_LITERAL_FILES`
(`playerVisualAlignment.test.ts`). Suite complète : **361 suites / 2 372 tests**,
tsc 0 erreur, bundle 8083 HTTP 200. Restent hors socle (décision inter-pôles) :
`PlayerSaisonScreen` (120), `PlayerSaisonIcons` (24), `JoueurPlusHubScreen` (11).

### L22 — RSVP §6 prouvé (écriture réelle + reflet Coach) + 2 défauts corrigés

**Le parcours §6 le plus important est désormais vérifié de bout en bout** avec
les comptes de review, écriture Firestore réelle :

| Étape | Preuve observée sur la surface réelle |
| --- | --- |
| Baseline Coach (convocation 17 sept.) | « 25 réponses en attente », Lucas non répondu |
| Clic « Présent » (Calendrier joueur) | échec `Missing or insufficient permissions` → **corrigé** |
| Cause 1 | règles Firestore : `resource.data.match_report_finalized_at` sur une clé absente = **erreur** (le champ n'est jamais écrit à la création) → `.get(..., null)`, déployées |
| Cause 2 | effets secondaires post-écriture (`ensureTeamThread`) rejetaient après le commit → « échec » affiché à tort → isolés |
| Après correction | « ✅ Tu es confirmé », hub « 1 oui · 24 en attente », persistant après reload |
| Reflet Coach | **« 24 réponses en attente »** (même enregistrement partagé) |

Bonus : **`Alert.alert` est un no-op sur web** (react-native-web) → déconnexion
et suppression de compte étaient des boutons morts sur web. Correctif minimal :
`src/utils/prodayAlert.ts` (web → `window.confirm`), branché sur la
déconnexion + suppression. Cela explique une partie des « flakes Pressable »
documentés depuis L14. Même classe de défaut présente sur ~9 autres appels
dans `ProfileScreen.tsx` — à corriger au fil des re-tests.

Reste non prouvé cette boucle : chips « Incertain »/« Absent », réponse via le
widget Home (nécessite un **match**, pas un entraînement — les compte démo n'en
ont pas à venir), parcours RSVP **parent**, et le flux RSVP écrit par le staff.

Suite complète : **361 suites / 2 375 tests**, tsc 0 erreur.
