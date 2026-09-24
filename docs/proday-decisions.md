# Décisions ProDay

## D-001 — VEO reste la priorité avant l’analyse IA

- **Décision :** ne pas développer ni valider de résultat IA vidéo avant d’avoir une connexion/lecture VEO réelle vérifiée.
- **Justification :** exigence B1/F1/F11 et priorité explicite du cahier des charges.
- **Alternatives écartées :** utiliser les clips ou fichiers d’exemple comme preuve ; les conserver éventuellement comme démo clairement étiquetée, jamais comme direct.
- **Conséquence :** `ai_ready` et `highlights_ready` restent faux lors d’une simple association VEO ; les analyses restent bloquées ou présentées comme non disponibles.

## D-002 — Une association par URL ne vaut pas une connexion VEO

- **Décision :** distinguer dans le modèle l’état de connexion et la nature déclarée de la vidéo (`live`, `replay`, `imported`, `unknown`).
- **Justification :** une fiche VEO, un embed et un fichier HLS/MP4 n’ont pas les mêmes capacités ni les mêmes preuves.
- **Alternatives écartées :** déduire `live` du fournisseur ou présenter toute URL VEO comme un flux lisible.
- **Conséquence :** le lecteur doit conserver des états explicites et l’interface doit demander une preuve/source réelle avant de déclarer un direct.

## D-003 — La protection vidéo doit être côté service et côté interface

- **Décision :** conserver les contrôles d’interface, mais considérer les règles Firestore comme autorité ; les règles actuelles sont à durcir pour vérifier l’audience autorisée au niveau du document.
- **Justification :** masquer une vidéo ou un bouton ne protège pas une captation.
- **Alternatives écartées :** faire confiance uniquement à `allowedRoles` du lecteur.
- **Conséquence :** ajouter une boucle dédiée de test de droits avec membres d’un autre club, joueurs non partagés et session révoquée.

## D-004 — Aucun faux succès local

- **Décision :** les replis locaux servent uniquement au développement de composants et sont marqués comme démo ; aucune valeur inventée ne doit être injectée par défaut dans un parcours réel.
- **Justification :** invariants B7, G, H et DATA-01.
- **Conséquence :** le hub Club devra charger les vidéos persistées ou afficher un état vide honnête lorsque aucune donnée réelle n’est disponible.

## D-006 — Accent de pôle : la source runtime fait foi sur DESIGN.md §2.4

- **Décision :** conserver les accents runtime de `assets/branding/README.md` / `src/theme/prodayBrand.ts` — Joueur `#FFFFFF`, Club `#10B981`, Sponsor `#92278F` — et traiter les valeurs de DESIGN.md §2.4 (`playerGreen #00E676`, `clubBlue #00ADEF`, `sponsorRed #EF4444`) comme des propositions non retenues.
- **Justification :** deux sources déclarées sur trois (branding README + `docs/design/DESIGN_SYSTEM.md`) donnent ces valeurs ; DESIGN.md §8.3 et §8.6 décrivent la même intention (« Émeraude Football », « Magenta / Violet ») ; basculer l'accent Joueur en vert casserait l'identité blanche déjà en place.
- **Alternatives écartées :** appliquer §2.4 au détriment du branding README ; afficher deux accents différents selon l’écran.
- **Conséquence :** la checklist de recette visuelle `docs/proday-visual-qa-checklist.md` (§4) liste ces écarts comme divergences décidées, à ne pas signaler comme défauts. Toute bascule d'accent doit repasser par une nouvelle décision et une mise à jour de `src/theme/prodayBrand.ts` + tests.

## D-007 — Périmètre de la recherche de personnes : filtrage service + callable, règles non exprimables

- **Décision :** la recherche de personnes est **bornée au club du lecteur** dans le service (`resolvePlayerSearchScope` → requête `profile.club_id == clubId`), avec échec fermé quand aucun club n'est résolvable. Deux exceptions documentées gardent la découverte inter-clubs : l'administration plateforme et les rôles `agent` / `recruiter` (les coordonnées restent gouvernées par `contactPrivacyVisibility`). Une fonction callable `searchClubMembers` porte la même règle côté serveur, en résolvant le club depuis `users/{uid}` — jamais depuis un paramètre client.
- **Justification :** le protocole exige que le service fasse autorité (B9, ADMIN-01) et qu'aucun résultat ne sorte du périmètre autorisé (CA-12, F4). `usersService.listPlayers` interrogeait auparavant toute la collection `users` (tous clubs) ; les règles Firestore ne peuvent **pas** exprimer ce filtrage : une règle `allow list` ne voit pas la clause `where` d'une requête, seulement `limit`/`offset`.
- **Alternatives écartées :**
  - filtrer uniquement dans l'interface (masquer les résultats) — ne protège pas contre un client modifié ;
  - rendre `allow list` sur `/users` conditionnel au club — impossible à écrire, et un refus global casserait les annuaires existants (mercato, listes de staff, suivis supporter) qui reposent aujourd'hui sur cette lecture.
- **Conséquence :** la fuite applicative est fermée (requêtes bornées + échec fermé + tests), mais **le durcissement des règles reste ouvert** : il exige de migrer d'abord les autres consommateurs de l'annuaire vers des lectures bornées, puis de refuser `allow list` sur `/users` au-delà de l'administration, la découverte passant par `searchClubMembers`. Nouvelle exigence `SEARCH-03`, bloquée sur déploiement (`firebase deploy --only functions`).

## D-005 — Blocage externe documenté

- **Décision :** ne pas contourner l’absence d’identifiants VEO Partner OAuth, de compte/match de test ou de matériel par une simulation présentée comme validation.
- **Justification :** protocole A, E2, F1 et J.
- **Conséquence :** VEO-01, VEO-04, VEO-05 et VEO-06 restent Bloqués/À vérifier jusqu’à réception des accès nécessaires.

## D-008 — Référence visuelle : la forme est reprise, pas l’identité de couleur

- **Décision :** pour le pôle Club/Admin, la référence fournie (captures des écrans « Moi », « Training », « Club ») est reprise **en forme** : titre posé sur le canvas, encarts de liste groupée au rayon généreux **sans bordure ni ombre** avec filets en retrait, ligne de réglage à icône contour et chevron fin, puces pilule dont la sélection est un **contour d’accent** (jamais un remplissage plein), bouton secondaire en pilule à contour fin, FAB central de dock. L’**accent reste l’émeraude ProDay `#10B981`** et le socle de surfaces reste DESIGN.md §2.1.
- **Justification :** la demande porte sur « card shapes, proportions, rounded corners, spacing, backgrounds, buttons, and screen layouts » ; la couleur d’accent est déjà fixée par D-006 (source runtime) et l’identité de marque du pôle ne se déduit pas d’une capture d’application tierce.
- **Alternatives écartées :** reprendre aussi la couleur d’accent de la référence — contredirait D-006 et ferait diverger le pôle Club du pôle Coach ; appliquer la forme à tous les pôles — hors périmètre et sans recette visuelle associée.
- **Conséquence :** `clubForm` devient le contrat de forme du pôle (valeurs verrouillées par test) ; `clubUi`, `ClubTabBar`, `ClubMenuPane`, `ClubBrandHeader` et `ClubHomeScreen` sont réalignés ; les 17 écrans consommant `ClubBrandHeader` changent de traitement de titre sans revue visuelle écran par écran (items CL-10→CL-15 de la checklist).

## D-009 — Typographie : Inter reste la police du pôle Club (écart avec l’exigence « Apple » enregistré)

- **Constat :** l’exigence demande la typographie système Apple sur les supports compatibles. Or `ProDayText` **supprime toute `fontFamily` reçue** et force la famille Inter chargée (`resolveLoadedFont`) : les styles `APPLE_TYPOGRAPHY` du chrome Club ne rendent donc que tailles/graisses, et la pile SF/system n’est appliquée dans aucun pôle aujourd’hui.
- **Décision :** ne pas basculer en silence. Le pôle Club garde Inter (corps/UI) comme DESIGN.md §3 le prescrit et comme le pôle Coach le fait ; l’écart avec l’exigence est enregistré (`CA-23`) au lieu d’être maquillé.
- **Justification :** D-006 établit que la source runtime fait foi sur DESIGN.md ; une bascule SF/system pour le seul pôle Club créerait une divergence Coach↔Club alors que l’exigence demande une continuité, et changerait les métriques de tous les écrans sans recette appareil.
- **Alternatives écartées :** ajouter un opt-in dans `ProDayText` puis l’activer sur le pôle Club — faisable, mais c’est une décision produit (quelle police pour quel pôle) doublée d’une recette Apple réelle qu’aucune session ne peut exécuter ici.
- **Conséquence :** `CA-23` passe « Bloqué » sur décision produit ; si la bascule est retenue, elle doit se faire dans `ProDayText` avec repli documenté et recette iPhone/iPad avant tout marquage « Vérifié ».

> **AMENDEMENT (même session) — le constat de D-009 était faux, et un vrai défaut se cachait derrière.**
>
> Vérification refaite : `grep` sur `src/` ne trouve **aucun chargement de police** (pas de `useFonts`, pas de `Font.loadAsync`, aucun paquet Expo Fonts pour Inter/Syne) et `src/theme/typography.ts` résout `fontFamily` vers `APPLE_FONT_STACK` — `System` sur iOS, pile `-apple-system / SF Pro` sur le web, `Roboto` sur Android. La **pile Apple est donc bien celle qui est rendue** ; l'affirmation « `ProDayText` force Inter » était un raisonnement supposé présenté comme une vérification, exactement ce que la boucle E3 interdit.
>
> Le défaut réel est plus grave : `ProDayText` retirait `fontWeight` du style final (`const { fontFamily: _fontFamily, fontWeight, ...rest } = flat`) parce que l'ancien code encodait la graisse dans le **nom** de la famille (`Inter_700Bold`, `Syne_800ExtraBold`…). Avec la pile système, **tous les alias de famille retournent la même valeur** — `regular`, `semibold`, `bold`, `extrabold`, `black`, `display`, `displayBold` ≡ `System`. Retirer `fontWeight` supprimait donc toute l'information de graisse : **les titres de toute l'application étaient rendus en graisse normale**, la hiérarchie visuelle disparaissait. C'est un défaut de rendu à l'échelle de l'application, pas un écart de conformité documentable.
>
> **Correctif :** la résolution sort dans un module **pur et testable**, `src/theme/proDayTextStyle.ts` (`resolveProDayTextStyle`, `resolveTextWeight`, `resolveTextFamily`) ; `ProDayText` la consomme. La famille système reste imposée (aucune police tierce chargée) et le `fontWeight` demandé est désormais **conservé**, avec repli sur la graisse de la variante. `transform` reste retiré.
>
> **Preuve :** `src/__tests__/proDayTextWeight.test.ts` (8 tests) — dont un test de **prémisse** qui verrouille le fait que les 7 alias de famille sont identiques (si une police à graisses multiples revient un jour, ce test échoue et signale que l'invariant a changé de sens).
>
> **Ce qui reste ouvert :** `CA-23` n'est plus « bloqué sur décision » mais « satisfait par construction » au niveau inspection + test ; une **recette appareil** reste nécessaire pour confirmer le rendu SF réel (graisses, taille dynamique, texte agrandi 200 %).

## D-010 — Forme de référence : dock en capsule à icône nue, et cartes structurelles plates et neutres

- **Constats (retour « pas encore parfait » avec les mêmes captures) :** D-008 avait aligné les primitives mais laissait deux écarts mesurables. **Dock** : libellés en capitales 9 px poids 800, encart d'accent 44×44 derrière l'icône active, barre de soulignement 18×2 sous l'onglet actif, rayon 24 au lieu d'une capsule, et surtout un **FAB rendu dans le flux de la rangée** (`marginBottom: 20`) donc enfermé dans le dock avec 20 px de vide au-dessus, alors que la référence le fait **chevaucher l'arête**. **Cartes** : les heroes Calendrier/Matchs/Entraînements/Effectifs/Finances/Coachs peignaient un **lavage diagonal** `[tone.soft, tokens.surface]` sur toute la surface, plus une bordure teintée `tone.color + '55'`, un **rail** de 3–4 px et une ombre portée ; le hub peignait un dégradé bleu nuit et un halo blanc. Ce sont des surfaces neutres transformées en surfaces colorées — l'inverse de « neutral surfaces and a restrained ProDay accent color ».
- **Décision :** (1) le dock suit la forme de la référence — capsule (`dockRadius: 999`, flou clippé au même contour), libellés en **bas de casse** 11 px, icône active **nue** (aucun encart, aucun soulignement : la couleur seule marque l'état), et FAB **sorti du flux** (`fabAnchor` absolu, `top: -fabSize × fabOverlap`, avec `marginTop` de même valeur sur le root), le chevauchement devenant **exact par construction** au lieu d'être estimé à l'œil ; (2) toute carte structurelle est **plate** — une seule surface `tokens.surface`, rayon unique `clubForm.groupRadius` (22), **sans** dégradé, rail, bordure teintée ni ombre ; la couleur ne circule plus que par les pastilles d'état et les icônes.
- **Justification :** la demande porte explicitement sur card shapes, proportions, backgrounds et screen layouts, et la référence montre des cartes d'une seule couleur. Le rayon unique 22 est la valeur déjà mesurée ailleurs dans la référence (encart groupé), donc l'aplatir supprime une incohérence interne au pôle en plus de l'écart avec la capture.
- **Alternatives écartées :** garder le rail en le décrivant comme « sémantique » — le type d'événement est déjà porté par la pastille, le rail est une décoration ; corriger le FAB en ajustant `marginBottom` — la géométrie resterait dépendante de la hauteur de la rangée, alors que l'ancrage absolu la rend déterministe ; supprimer le halo de fond du shell (`bgWash`) — DESIGN.md §4.3 le prescrit explicitement, il est conservé.
- **Conséquence :** `CA-50`/`CA-51` en cours, `CA-26` mis à jour (`separatorInset` **dérivé** de la marge + icône + écart pour tomber sous le libellé, hauteur de ligne 62) ; garde-fou `clubReferenceForm.test.ts` porté à 30 tests ; `CA-52` ouvre la même question pour `ClubCommunicationHub`, `ClubPlayerHero` et `ClubHubScreen` ; items `CL-16`→`CL-18` ajoutés à la checklist visuelle. **Réserve explicite :** aucun pixel n'a été observé, faute de compte Club de test et d'accès invité au shell Club.
## D-011 — Le pôle Club adopte la **palette mesurée** de la charte de référence (couleurs, pas seulement la forme)

- **Demande :** « je veux les mêmes couleurs et le même fond que sur l'image ». Elle **remplace** la portée de D-008 (« la forme est reprise, pas l'identité de couleur ») — D-008 reste valable comme méthode (on ne devine pas une charte), D-011 en étend le périmètre sur instruction explicite du propriétaire du produit.
- **Méthode :** la quatrième capture (`IMG_4950.PNG`, 1284×2778, 16 bits) n'était pas lisible par le modèle. Plutôt que d'en deviner le contenu, la palette a été **extraite des pixels** (`Pillow` : fréquence des couleurs quantifiées, plans de saturation, bandes horizontales, centroïde du FAB). Les **quatre** captures ont été analysées pour savoir si elles partagent la même charte — oui, et les valeurs sont cohérentes à un octet près.
- **Valeurs mesurées :** `bg #000000` · `surface #191E23` rgb(25,30,35) — 28 % / 36 % / 27 % des pixels selon la capture · `raised #262E33` rgb(38,46,51) — jusqu'à 49 % · tons de bord `#373D42` / `#414A51` · **accent `#F8D548` rgb(248,213,72), identique à l'octet dans les quatre captures** · texte `#FFFFFF`. Les surfaces sont des **gris bleutés froids** (`B > G > R`), pas des gris neutres : `#121218`/`#1A1A24` (DESIGN.md §2.1) sont remplacés pour le pôle Club.
- **Découverte non triviale — l'encre sur l'or :** la palette dominante ne dit pas quoi poser *sur* l'accent. Mesure ciblée du FAB central (centroïde de l'or, puis palette à l'intérieur du disque) : **`#000000` représente 20 %, 26 % et 29 % des pixels de la pastille** dans les trois captures. La référence pose donc du **noir** sur l'or. `poleOnAccent('club')` retournait `#FFFFFF` (branche `default`) : du blanc sur `#F8D548` donne ~1,4:1 de contraste, illisible. Corrigé en `#000000` (~15:1). **C'est le genre de défaut qu'une simple copie de palette aurait créé.**
- **Ce qui reste volontairement inchangé :** `bgElevated #0A0A0F` (la référence ne montre pas de niveau intermédiaire entre le canvas noir et les cartes — on garde la valeur du socle plutôt que d'en inventer une) ; les bordures alpha §2.2 (un blanc à 0,08 posé sur `#191E23` redonne `#2B3035`, soit exactement le ton de bord mesuré, entre `#262E33` et `#373D42`) ; les jetons **sémantiques** `success`/`warning`/`danger`/`pitch` restent vert/rouge — « conforme », « en retard », « payé » ne se déduisent pas d'une couleur d'identité, et 71 occurrences d'émeraude dans le chrome Club sont des états de succès, pas des accents.
- **Application depuis une source unique :** `PRODAY_POLE_ACCENTS.club` passe à `#F8D548`, et tout le pôle suit — `CLUB_TOKENS`, `CLUB_SITE`, `buildClubThemeTokens`, le wash du shell, le dock, les primitives `clubUi`, la carte d'univers de l'inscription, le thème de barre d'onglets, les dégradés CTA (`proClubGradients.card` → `#262E33`, `.cta` → `['#9F8629', '#F8D548']`, l'or assombri étant relevé sur l'antialiasing du FAB).
- **Alternatives écartées :** ne changer que les surfaces et garder l'émeraude — la demande porte sur « les couleurs », pas seulement le fond, et l'or est la couleur la plus visible de la référence ; modifier `CLUB_TOKENS` sans toucher `PRODAY_POLE_ACCENTS` — le pôle se serait scindé entre deux identités (carte d'univers, barre d'onglets, inscription restées vertes).
- **Conséquence et points de vigilance :** le pôle Club devient or, comme le Coach (`#C5A059`) et le Président — la distinction par couleur entre ces trois pôles se réduit ; c'est signalé plutôt que masqué. 12 fichiers de tests épinglaient l'ancienne palette et ont été mis à jour vers les valeurs mesurées, avec des assertions qui **verrouillent la mesure** (ex. `poleOnAccent('club') === noir`, `surface === '#191E23'`) et un test qui échoue si quelqu'un « réaligne » le Club sur §2.1 par réflexe. **Aucun pixel observé :** l'application n'a pas été vue rendue avec cette palette (ni compte Club, ni appareil) — la conformité est établie au niveau inspection + test + bundle compilé.

## D-012 — Le QR Veo n’est **pas** intégré à ProDay : on décrit le parcours vérifié au lieu de simuler un appairage

- **Constat (recherche officielle, 15/09/2026) :** la demande citait « Connect using a QR code ». Il existe bien un QR chez Veo, mais c’est un **échange entre les deux iPhones du rig Veo Go** : le premier iPhone, connecté au Clubhouse, affiche le QR après « Start Recording » ; le second le scanne (« Scan QR » ou appareil photo) puis « Join Recording » lie les deux appareils *(`support.veo.com` — guide pas à pas Veo Go)*. L’association d’une **caméra Veo Cam 2/3** se fait elle en **Bluetooth** depuis l’application Veo Cam, en sélectionnant la caméra par son **numéro d’identification** *(`support.veo.com` — connexion via l’appli Veo Cam)*. **Aucun QR n’intervient côté caméra.**
- **Décision :** ProDay **n’implémente aucun scanner**. Il affiche le parcours réel, étape par étape, marqué « Hors ProDay », avec le lien vers la documentation officielle, et nomme explicitement qui affiche le QR et qui le scanne. Les trois méthodes réellement supportées y figurent côte à côte, dont la seule qui appartient à ProDay : la **connexion du compte Veo** (`Vidéo › Appareils & connexions › Connecter Veo`), aujourd’hui **Bloquée** faute de client délivré.
- **Justification :** la consigne autorise « implement only the verified mechanism » et interdit simultanément « a decorative QR code » et « simulate successful pairing ». Le mécanisme vérifié **n’appartient pas à ProDay** ; l’implémenter aurait produit exactement le décor interdit. Un scanner qui ne peut rien associer n’est pas une fonctionnalité, c’est une promesse.
- **Alternatives écartées :** (1) un lecteur de QR dans ProDay qui « associe » un appareil — il ne pourrait rien prouver, aucun flux de session n’étant documenté ; (2) accepter une URL scannée comme instruction de connexion — explicitement interdit, et une source d’usurpation ; (3) collecter l’e-mail et le mot de passe Veo dans un formulaire ProDay — le flux documenté est un `grant_type=password`, mais sans accord produit il serait collecté côté client : écarté.
- **Corollaire — trois états vraiment séparés :** compte, caméra et flux ne sont plus illustrés par une seule pastille. `resolveCameraState` et `resolveStreamState` dérivent du **document club persisté**, et `VeoStateAxes` affiche les trois côte à côte : *un compte connecté ne prouve ni une caméra associée, ni un flux qui émet*. Un enregistrement marqué `live` mais `uploading` s’affiche « Démarrage », jamais « Direct ».
- **Conséquence et risque assumé :** l’exigence « QR » est satisfaite par une documentation dans l’application, pas par du code de scan. C’est un **écart de forme volontaire** vis-à-vis de la demande littérale, arbitré au nom de la règle « ne jamais simuler une intégration ». Items `VEO-09` à `VEO-11` au registre ; inventaire §6 bis et §7.

## D-013 — Deux défauts trouvés **en regardant l’écran**, invisibles pour le typecheck et les tests

- **Constat :** la première session authentifiée (comptes de démonstration documentés dans `docs/APP_REVIEW.md`) a montré ce que les sessions précédentes n’avaient pas pu voir. Deux défauts réels :
  1. **Section en chargement permanent.** `videos = []` dans la déstructuration des propriétés créait **un nouveau tableau à chaque rendu** ; comme `videos` est une dépendance de l’effet de chargement, l’effet se relançait sans fin et la section n’affichait **ni état vide ni compteurs** — un vide silencieux, pire qu’un indicateur de chargement.
  2. **Contenu dupliqué.** La section « Appareils & connexions » rendait deux fois la carte d’état, les produits et les capacités, parce que le panneau Club `VeoConnectionPanel` réembarquait les composants partagés.
- **Décision :** identités de tableaux **stables** (`NO_VIDEOS`/`NO_CLIPS`) au lieu de littéraux par défaut, plus un état de chargement **visible** ; suppression du doublon, et reprise dans le module partagé de la seule information propre au panneau Club (« disponible sans accès Veo »), donc pour les deux pôles.
- **Justification :** le protocole distingue inspection de code, test et rendu. Ces deux défauts prouvent la distinction : le typecheck et 1 858 tests étaient verts pendant qu’un écran n’affichait rien.
- **Conséquence :** garde-fous ajoutés (absence de tout scanner QR simulé, unicité des panneaux rendus, sources de connexion bornées au module partagé). **Comptes utilisés :** `coach.demo@proday.app` et `club.demo@proday.app`, comptes de démonstration du dépôt — navigation et lecture uniquement, aucun enregistrement créé, aucune donnée de production modifiée.

## D-014 — Les groupes échouent **parce que les règles Firestore font autorité** : on corrige la règle et on refuse d’annoncer un succès

- **Contexte :** la création de groupe a été menée jusqu’au bout dans l’aperçu (nom, deux membres réels, relecture, confirmation). Firestore a répondu `Missing or insufficient permissions.`
- **Diagnostic :** la règle n’est pas un défaut d’affichage. `isValidThreadCreate()` exige `participant_ids.size() == 2` — un groupe est refusé à la création. Et `allow update` interdit de toucher `participant_ids`, donc l’ajout/retrait de membre est refusé aussi. Les règles ont été écrites pour le 1↔1.
- **Décision :** (1) l’interface **ne simule rien** : elle affiche le refus réel et **conserve le brouillon** ; (2) le message brut est traduit (`humanizeGroupError`) parce que « Missing or insufficient permissions. » n’aide personne ; (3) la règle est corrigée **dans le dépôt**, strictement scopée aux groupes.
- **Correction des règles :** `isValidGroupThreadCreate()` exige `is_group == true`, 3 à 50 participants, le créateur **dedans** et `admin_uids` le contenant, et `created_by == request.auth.uid` — le rôle annoncé n’est jamais cru sur parole. `isGroupAdmin()` lit `resource` (l’état enregistré), jamais `request.resource`, sinon un membre s’auto-promouvrait dans la même écriture. `allow update` n’ouvre `participant_ids` qu’à un administrateur de groupe, **qui doit rester membre**.
- **Alternatives écartées :** laisser les règles en l’état et retirer le bouton (masquer un refus n’est pas une autorisation) ; autoriser tout participant à modifier `participant_ids` (élévation de droits) ; écrire le groupe côté client sans attendre la réponse du service (faux succès).
- **Conséquence :** **le blocage reste entier jusqu’au déploiement.** La commande n’est pas exécutée ici (action externe et irréversible, autorisation non donnée) : `firebase deploy --only firestore:rules`. Tant qu’elle n’est pas passée, `CHAT-04`/`CHAT-05` restent **Bloqué** et l’application dit la vérité plutôt que de faire semblant.

## D-015 — Une catégorie de recherche sans destination ouvrable ne s’affiche pas et ne se compte pas

- **Contexte :** `GlobalSearchModal` rendait les sections « Équipes » et « Événements » dès qu’elles avaient des résultats, même quand le pôle appelant ne fournissait aucun gestionnaire : la ligne existait, grisée, et ne menait nulle part.
- **Décision :** filtrer **à la source** du rendu et du comptage (`resultAvailability`), pas seulement au clic. Le total annoncé n’additionne que les catégories réellement ouvrables.
- **Justification :** une ligne de résultat est une promesse de navigation. L’afficher sans issue est le « bouton qui ne mène nulle part » interdit ; et un total qui compte des résultats inatteignables est un chiffre faux.
- **Conséquence :** le pôle Coach (sans gestionnaire équipe/événement) ne montre jamais ces catégories ; le pôle Club les montre et les ouvre réellement. Deux défauts liés corrigés au passage : le `useEffect` de recherche n’avait ni `clubId` ni `playerScope` dans ses dépendances (périmètre périmé après changement de club ou de rôle), et `onOpenEvent` ignorait l’événement trouvé pour n’ouvrir que l’onglet Calendrier.

## D-016 — « Dû » et « encaissé » sont deux objets distincts ; la saison est dérivée d'une date, pas recopiée

- **Contexte :** le registre `club_finance_entries` enregistre des **mouvements** (`type`, `amount_eur`, `entry_date`). Il ne contient ni montant dû, ni échéance, ni budget. Aucun « reste à recouvrer », « impayé », « en retard » ou « écart budgétaire » ne pouvait donc être calculé autrement qu'en inventant un montant par défaut et une date limite.
- **Décision :** ajouter **deux objets** au modèle plutôt que d'étendre le registre.
  1. `club_fees` — **ce qui est dû** : `amount_due_eur`, `discount_eur`, `due_date`, `season`, adhérent, catégorie.
  2. `club_budgets` — **ce qui est prévu** : `planned_income_eur`, `planned_expense_eur` par (saison, catégorie).
  Et lier les encaissements aux échéances par un champ `fee_id` sur l'écriture.
- **Justification :** un mouvement et une obligation ne se confondent pas. Les fusionner (par exemple un type `obligation` dans le même registre) aurait rendu tout total ambigu : le `solde` du registre aurait additionné des flux et des créances.
- **Identifiants déterministes :** `club_fees/{club__saison__portée__catégorie}` et `club_budgets/{club__saison__catégorie}`. Une affectation de cotisation pour tout un effectif devient **réexécutable sans doublon**, et corriger un budget met à jour la ligne au lieu d'en ajouter une seconde (ce qui doublerait le prévu).
- **Risque symétrique traité :** un identifiant déterministe peut **écraser** une échéance ajustée à la main (remise accordée, date décalée). `clubFeesService.createOrSkip` refuse alors l'écriture et renvoie `skipped_conflict` avec le détail du conflit ; l'écrasement n'a lieu que sur `overwrite: true`, après confirmation explicite de l'utilisateur. `unchanged` est distingué de `created` : rejouer la même affectation dit « rien n'a été dupliqué ».
- **Saison en un seul endroit :** `src/utils/clubSeason.ts` (1er août → 31 juillet). La saison **n'est pas stockée** sur les écritures : elle est dérivée de `entry_date`. La recopier aurait créé deux vérités pour la même ligne — corriger une date aurait laissé l'écriture dans l'ancienne saison du budget. Elle **est** stockée sur les échéances et les budgets, qui ne sont rattachés à aucune date métier.
- **Conséquence :** `FIN-01`, `FIN-03`, `FIN-05` calculables ; `FIN-02` devient vérifiable ; le « reste à recouvrer » existant (`clubFinanceOutstandingPrerequisites`) n'est plus une limite de modèle mais un état réel du club : *aucune échéance saisie*.

## D-017 — Aucun encaissement n'est réparti d'office, et l'argent non rattaché est compté à part

- **Contexte :** les écritures déjà enregistrées portent un `member_uid` mais aucun `fee_id`. Faut-il considérer qu'un encaissement de cotisation au nom d'un adhérent éteint son échéance ?
- **Décision :** **non.** Un paiement ne réduit une échéance que s'il la désigne. Les encaissements de cotisation sans `fee_id` sont exposés séparément (`unallocatedCount`, `unallocatedEur`) avec un énoncé à l'écran invitant à les rattacher.
- **Justification :** répartir automatiquement un encaissement non rattaché est un choix arbitraire qui produit deux erreurs symétriques et graves — éteindre une relance légitime, ou en déclencher une injuste. Le rattachement est une décision du club, pas une inférence du calcul. La séparation est aussi ce qui empêche l'application d'afficher un « reste à recouvrer » plus faible que la réalité sans le dire.
- **Limite assumée :** le formulaire d'encaissement ne propose que les échéances de l'adhérent **rattaché par UID** ; à défaut d'UID, l'égalité de nom est exigée, jamais une ressemblance partielle — rattacher l'encaissement d'un homonyme serait une écriture fausse.

## D-018 — Le rôle coach n'a plus accès aux données financières nominatives (correction d'autorisation, non déployée)

- **Contexte :** `club_finance_entries` était protégée par `isClubStaffForClub()`, qui inclut `canManageClubEntity()` → `coach | organizer | agent`. Un coach rattaché à un club pouvait donc lire le registre financier, et le référentiel exige l'inverse (« rôle coach ne donnant pas accès automatique aux détails financiers »).
- **Décision :** introduire `canManageClubFinance(clubId)` — compte propriétaire du club, ou rôle `club` rattaché à ce club — et l'appliquer aux **trois** collections financières ainsi qu'aux justificatifs Storage (`isClubFinanceManager`). Même logique que `match /clubs/{clubId}` en écriture, et non un nouveau modèle.
- **Alternatives écartées :** laisser `isClubStaffForClub` sur le registre et ne resserrer que les nouvelles collections (incohérence : le coach verrait le ledger mais pas les échéances) ; retirer le module financier de l'interface sans changer la règle (masquer un bouton ne remplace pas une autorisation).
- **Conséquence : resserrement d'accès réel, à confirmer avant publication.** Au déploiement, un coach ou un organisateur perd la lecture du registre. Si un compte de ce type doit conserver l'accès, il faut l'ajouter explicitement à `canManageClubFinance`. Aucun déploiement n'a été exécuté.

## D-019 — La provenance d'un paiement est un littéral, pas un champ libre

- **Contexte :** le référentiel demande de distinguer les paiements saisis manuellement des paiements confirmés par un prestataire.
- **Décision :** `payment_provenance` n'a **qu'une valeur possible** côté client : `manual`. Le type TypeScript l'impose, `clubFinance.service` l'écrit littéralement, et la règle Firestore le vérifie à la création **comme** à la mise à jour.
- **Justification :** ProDay n'a aucun rapprochement bancaire. Autoriser la valeur `provider_confirmed` dans le schéma aurait créé un champ qu'aucun code ne peut remplir honnêtement — et un jour rempli à la main pour « faire propre ». L'invariant est donc vérifiable côté serveur, pas seulement promis par une note d'interface.
- **Conséquence :** `FIN-03` vérifié au niveau règles ; l'interface n'affiche jamais « payé / vérifié par la banque ».
