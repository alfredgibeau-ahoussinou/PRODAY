# Inventaire fonctionnel & de faisabilité — Vidéo ProDay × Veo

Version : 15 septembre 2026. Registre persistant demandé par la refonte de la section
Vidéo (Coach + Club/Admin). Il **remplace toute supposition antérieure** sur ce que
« VEO » désigne et sur ce qui est intégrable.

> **Statut global : cet inventaire n'est pas exhaustif.** Les pages produit publiques, la
> FAQ d'assistance et la documentation développeur ont été lues ; **aucun compte Veo
> authentifié n'a été consulté** (ni Clubhouse, ni Veo Go, ni Veo Editor, ni la Swagger
> API) et **aucun matériel** (Veo Cam, rig Veo Go) n'était disponible. Tout ce qui n'est
> pas marqué `Documenté` ou `Observé` est une déduction à vérifier.

## 0. Niveaux de preuve utilisés

| Niveau | Signification |
| --- | --- |
| **Observé** | Constaté directement dans le dépôt, ou dans une réponse HTTP/API réellement reçue par cette session. |
| **Documenté** | Écrit noir sur blanc par une source officielle Veo, URL citée. |
| **Déduit** | Conséquence logique de faits documentés, non confirmée par une source dédiée. |
| **Non vérifié** | Aucune preuve ; à ne pas présenter comme disponible. |

## 1. Produits confirmés — ne pas les confondre

La demande cite « Veo Go », « Veo Cam » et « l'application Veo ». Ce sont **trois choses
distinctes**, et une quatrième porte presque le même nom sans aucun rapport.

| Produit | Nature | Captation | Où l'on regarde | Source |
| --- | --- | --- | --- | --- |
| **Veo Go** | Application **iOS** + support de fixation. Transforme **deux iPhones** en système de captation. | Oui (football) | App Veo Go elle-même **et** la plateforme Veo (`app.veo.co`) | `veo.com/product/veo-go`, `support.veo.com` FAQ Veo Go, App Store `id6475045572` |
| **Veo Cam 3 / Cam 3 5G** | **Matériel** : caméra panoramique fixe à suivi automatique et IA embarquée. | Oui (tous sports) | Plateforme Veo (`app.veo.co`), Clubhouse | `veo.com` |
| **Plateforme / Clubhouse Veo** | **Web** (`app.veo.co`) : hébergement, montage (Veo Editor), partage, analytics, live. | Non | — | `app.veo.co`, FAQ Veo Go |
| ⚠️ **« Veo 3 / Veo 3.1 » de Google DeepMind** | **Modèle de génération vidéo IA** (`deepmind.google/models/veo`). | Non | — | Recherche web — **aucun rapport avec Veo Technologies** |

**Conséquence directe :** un nom de produit partagé ne donne pas des capacités partagées.
Une caméra, une application mobile et une plateforme web n'exposent pas les mêmes fonctions,
et Veo le documente lui-même explicitement (voir §3.4).

## 2. API officielle Veo — le fait qui change le diagnostic

Le registre `proday-requirements.md` classait `VEO-01` **« Bloqué : accès VEO partenaire »**,
comme si l'intégration était techniquement inconnue. Elle ne l'est pas : **une API publique
est documentée**.

- Portail : **`https://developer.veo.co.uk/`** — « Use the VEO API to access users, groups,
  tagsets, comments and videos ».
- Base API : `https://api.veo.co.uk/api/`
- Authentification documentée : `developer.veo.co.uk/authentication`
- Vidéos (upload, transcodage, lecture) : `developer.veo.co.uk/videos`
- Ressources documentées : `videos`, `users`, `groups`, `comments`, `tagsets`, + **Unity**
  (export vidéo depuis des builds 3D/XR).
- Une **documentation Swagger** existe pour les endpoints non détaillés dans les guides.

### 2.1 Authentification — mécanisme réel

| Élément | Valeur | Niveau |
| --- | --- | --- |
| Endpoint production | `https://tokenapi.veo.co.uk/oauth2/token` | Documenté |
| Endpoint UAT | `https://tokenapiuat.veo.co.uk/oauth2/token` | Documenté |
| Encodage | `application/x-www-form-urlencoded` | Documenté |
| Champs | `Username` (email VEO), `Password`, `Grant_type=password`, `Client_id` | Documenté |
| Durée du jeton | `expires_in: 1209599` s ≈ **14 jours** | Documenté |
| Usage | `Authorization: Bearer {token}` sur `api.veo.co.uk` | Documenté |
| Provisionnement | `client_id` **et secret** créés **uniquement par un représentant Veo** | Documenté |

**Le seul flux documenté est `grant_type=password`** — c'est-à-dire que le titulaire du
compte Veo saisit son **email et son mot de passe Veo**. La page mentionne qu'OAuth2 est « la
méthode recommandée » sans documenter de flux d'autorisation par redirection. **Aucun flux
OAuth à délégation (code + redirection) n'est documenté publiquement.**

### 2.2 Vidéos — cycle de vie réel

| Étape | Endpoint | Détail |
| --- | --- | --- |
| Créer l'actif | `POST /videos/` | corps `{ Title, RecordedStamp }` → renvoie l'id |
| Jeton d'upload | `GET /videos/{id}/uploadtoken?mimetype=` | URL Azure à usage **unique** |
| Upload | `PUT` vers l'URL Azure | en-têtes `x-ms-blob-type: BlockBlob`, `Content-Type` ; **pas** de jeton Veo |
| Lecture | `GET /videos/{id}/downloadtoken` | renvoie `Id`, `Duration` (s), et des `Tokens[]` (un par ratio) avec `Url` = **URL à usage unique** |
| Lister | `GET /videos/v3/get-all?createdByMe=&pageSize=&pageNumber=&orderByDirection=` | paginé |
| Formats acceptés | mp4, mov, wmv, avi, mpeg, asf (+ audio mp3/wav/m4a) | |

**États d'une vidéo :** `Awaiting video token request` → `Awaiting upload` →
`Awaiting transcode` → `Transcoding` → `Transcoded` → `Error`.

## 3. Inventaire par produit

Légende d'intégration : **D** = directe · **E** = expérience embarquée officielle ·
**H** = renvoi externe · **P** = dépend d'un accès/partenariat · **X** = non supporté/non vérifié.

### 3.1 Veo Go (captation iPhone)

| # | Fonction | Ce que l'utilisateur fait | Support / prérequis | Intégr. | Preuve |
| --- | --- | --- | --- | --- | --- |
| G-01 | Captation 2 iPhones | Deux iPhones filment une moitié de terrain chacun | **2 iPhones** à caméra ultra grand-angle, **iOS 18.0+** (XS, XS Max, XR, SE 2+ et plus récents) | X | Documenté |
| G-02 | Captation 3 appareils | 2 iPhones filment + 1 iPhone/iPad contrôle | 3e appareil, rig sur trépied | X | Documenté |
| G-03 | Bascule 2 ↔ 3 appareils | Réglages → Recording Setup | — | X | Documenté |
| G-04 | **Android** | — | **Non supporté**, pas au programme | X | Documenté |
| G-05 | Abonnement obligatoire pour enregistrer | Couvre stockage + traitement IA | Abonnement Veo Go actif | P | Documenté |
| G-06 | Heures d'enregistrement mensuelles | Remise à zéro chaque mois, ou abonnement supplémentaire | — | P | Documenté |
| G-07 | Stockage local temporaire | ≈ **6 Go par iPhone par heure**, libéré après upload | Espace disque | X | Documenté |
| G-08 | Upload vers la plateforme Veo | Les 2 fichiers sont envoyés, puis fusionnés en un match complet | Réseau | P | Documenté |
| G-09 | Montage/analyse sur Veo Editor | Depuis `app.veo.co` | Compte Veo | H | Documenté |
| G-10 | **Veo Live** | — | **Non supporté par Veo Go à ce stade** | X | Documenté |
| G-11 | **Veo Analytics** | — | **Non supporté par Veo Go à ce stade** | X | Documenté |
| G-12 | Invités qui aident à filmer | « join as a guest to help record » | — | X | Documenté |

### 3.2 Veo Cam 3 / Cam 3 5G (matériel)

| # | Fonction | Détail | Intégr. | Preuve |
| --- | --- | --- | --- | --- |
| C-01 | Captation panoramique + suivi IA | Caméra fixe, suivi automatique, qualité broadcast | X (matériel) | Documenté |
| C-02 | **Live** | « livestream your matches » — add-on **Veo Live** | H / P | Documenté |
| C-03 | **Veo Analytics** | Add-on distinct (Veo Go ne l'a pas ⇒ il existe côté Cam) | P | Déduit |
| C-04 | Upload automatique vers la plateforme | Batterie annoncée jusqu'à 8 h | P | Documenté |
| C-05 | Application Veo de configuration | Santé caméra, réglages (**absente de Veo Go**) | X | Documenté |
| C-06 | Entitlements séparés | Heures Veo Cam **non** transférables vers Veo Go et inversement | P | Documenté |

### 3.3 Plateforme Veo / Clubhouse (`app.veo.co`)

| # | Fonction | Détail | Intégr. | Preuve |
| --- | --- | --- | --- | --- |
| P-01 | Hébergement et lecture des matchs | Toutes captations (Go **et** Cam) | D (via API) | Documenté |
| P-02 | Montage (Veo Editor) | Outils d'édition | H | Documenté |
| P-03 | Bibliothèque / organisation | `get-all` paginé, tri par date d'upload | D (via API) | Documenté |
| P-04 | Partage et accès équipe | Ressources `users` / `groups` de l'API | D (via API) | Documenté |
| P-05 | Commentaires et tags | Ressources `comments` / `tagsets` de l'API | D (via API) | Documenté |
| P-06 | Clip / highlights | Insight IA — passe par les ressources d'analyse | P | Déduit |
| P-07 | Live | Add-on, distinct de l'API documentée | H | Documenté |

### 3.4 Séparation documentée par Veo lui-même

Trois points que Veo écrit explicitement, et qui interdisent de construire une section
« Live » indifférenciée :

1. **Veo Go ne supporte ni Veo Live ni Veo Analytics.** (FAQ Veo Go)
2. **L'application Veo Go ne montre que les captations Veo Go** ; les captations Veo Cam se
   consultent sur `app.veo.co`. (FAQ Veo Go)
3. **Les droits (heures) Veo Cam et Veo Go sont séparés** et non mélangeables. (FAQ Veo Go)

## 4. Ce qui est réellement intégrable dans ProDay

| Capacité | Classification | Justification |
| --- | --- | --- |
| **Lister les vidéos autorisées** (`videos/v3/get-all`) | **Directe, sous condition P** | Endpoint documenté, paginé. Dépend d'un `client_id` délivré par Veo. |
| **Lire une vidéo dans le lecteur ProDay** | **Directe, sous condition P** | `downloadtoken` renvoie des URLs de lecture par ratio. Le lecteur intégré existant peut les consommer. |
| **Associer une vidéo à un club / équipe / match ProDay** | **Directe** | Déjà fait dans ProDay (`veoService.associateMatch`), indépendant de l'API. |
| **Uploader un fichier vers Veo** | **Directe, sous condition P** | Flux en 3 étapes documenté (`POST /videos` → token → `PUT` Azure). |
| **Afficher l'état de traitement** | **Directe, sous condition P** | Les 6 états sont documentés ⇒ un état honnête par vidéo est possible. |
| **Récupérer commentaires / tags / insights IA** | **Directe, sous condition P** | Ressources `comments` / `tagsets` documentées. |
| **Se connecter au compte Veo** | **P, et sensible** | Flux documenté = `grant_type=password` ⇒ **mot de passe Veo de l'utilisateur**. `client_id` + secret provisionnés par un représentant Veo. |
| **Diffuser un direct Veo dans ProDay** | **Non supporté aujourd'hui** | Aucun endpoint de live dans la documentation API ; Veo Live est un add-on, et Veo Go ne le supporte pas. ⇒ **renvoi externe**, jamais un faux lecteur. |
| **Veo Analytics / Insights IA à la demande** | **P / non vérifié** | Add-on côté Cam ; accessible via API seulement si le compte y a droit. |
| **Captation (Cam ou Go)** | **Hors périmètre** | C'est du matériel / une app tierce. ProDay ne filme pas. |

## 5. Conséquences de conception retenues

1. **La connexion n'est pas un formulaire ProDay.** Le flux documenté exige le mot de passe
   Veo. La règle produit interdit de collecter un mot de passe sauf si une intégration
   explicitement supportée l'exige — ici c'est le cas *techniquement*, mais cela impose :
   échange **côté serveur** (Cloud Function) pour que le `client_secret` ne soit jamais dans
   le bundle mobile, mot de passe **jamais persisté ni journalisé**, et accord produit explicite.
   ⇒ **Tant que cette décision n'est pas prise, ProDay n'affiche pas « Connecté ».**
2. **Le direct n'est pas une promesse d'API.** Il est présenté comme un **renvoi externe
   assumé** vers la plateforme Veo, distinct de la lecture intégrée.
3. **La section Live doit être atténuée, pas supprimée** : elle porte une information réelle
   (Veo Go ne le supporte pas ; Veo Cam oui via add-on) et un lien sortant.
4. **Coach et Club lisent la même source.** Déjà vrai : `clubCamerasService.listMatchVideos`
   par club + filtre d'audience. Aucune copie divergente ne doit apparaître.
5. **Aucun faux état.** Pas de « Connecté » sans vérification, pas de « EN DIRECT » sans flux,
   pas de barre de progression d'upload sans upload réel.

## 6. Non vérifié / bloqué — à ne pas présenter comme disponible

| Élément | Pourquoi |
| --- | --- |
| Contenu du Swagger (endpoints non documentés dans les guides) | Page non consultée ; accès requis à la Swagger. |
| Existence d'un flux OAuth à délégation | Non documenté publiquement ; supposer une redirection serait inventer. |
| Capacités exactes de Veo Live dans l'app | Nécessite un compte + un abonnement Live. |
| Veo Analytics / Insights IA | Add-on payant, non vérifié. |
| Délai réel upload → `Transcoded` | Dépend du transcodage Veo, non mesuré. |
| Lecture réelle d'une URL `downloadtoken` dans le lecteur ProDay | Aucun jeton obtenu : nécessite `client_id` + compte. |
| Comportement de l'app Veo Go (écrans, UX) | App Store lue, application non installée. |
| Prix / formule d'abonnement | Sources publiques **contradictoires** (≈ 29–40 £/mois selon les pages, une source annonce des frais matériels uniques) ⇒ non retenu. |

## 6 bis. QR code et association d’appareils — le point qui change la conception

La demande cite explicitement « Connect using a QR code ». Un QR **existe** bien chez Veo,
mais pas là où on pourrait le croire. Deux mécanismes distincts, tous deux documentés :

| Association | Mécanisme réel | Qui exécute | ProDay peut-il le faire ? | Source |
| --- | --- | --- | --- | --- |
| **Deux iPhones Veo Go** | **QR code affiché par le premier iPhone**, scanné par le second (appareil photo, ou « Scan QR » dans Veo Go) → « Join Recording » | L’**application Veo Go**, sur deux iPhones | **Non.** ProDay est ni l’afficheur ni le scanner, et aucune interface de session locale n’est documentée ⇒ un scanner ProDay serait un décor | `support.veo.com` — *A step-by-step guide to recording your matches with Veo Go*, § Step 2 |
| **Caméra Veo Cam 2/3** | **Bluetooth** : la caméra s’annonce dans l’application Veo Cam, on la sélectionne par son **numéro d’identification** | L’**application Veo Cam**, après connexion au compte Veo | **Non.** Aucun QR, aucune interface d’appairage appelable | `support.veo.com` — *How to connect your Veo Cam 2 or Veo Cam 3 using the Veo Cam App* |

**Conséquence assumée, et c’est le cœur de la décision :** la demande « implémenter le QR »
se traduit par **décrire le parcours vérifié et ne rien simuler**, parce que le mécanisme
vérifié n’appartient pas à ProDay. Ajouter un lecteur de QR dans l’application aurait
exactement produit ce que la consigne interdit ailleurs (« do not create a decorative QR
code or simulate successful pairing »). Le parcours est donc affiché **pas à pas, tel que
la documentation le décrit**, avec le lien officiel, et marqué « Hors ProDay ».

Ce qui serait également interdit et ne sera pas fait : interpréter une URL scannée comme
une instruction de connexion de confiance. Le seul flux d’authentification documenté reste
le `grant_type=password` sur `tokenapi.veo.co.uk`, à échanger **côté serveur** avec un client
délivré par un représentant Veo.

## 7. État d’implémentation et de vérification (15 septembre 2026)

### 7.1 Ce qui a été construit

| Élément | Emplacement | Preuve |
| --- | --- | --- |
| **Un seul module Vidéo** partagé par les deux pôles | `src/features/video/VideoWorkspace.tsx` | Rendu par `ClubVideoHub` (Club) et `CoachVideoHubScreen` (Coach) ; garde-fou qui interdit au wrapper de parler aux services vidéo |
| Sections filtrées par rôle | `resolveVideoSections` | Vue d’ensemble · Bibliothèque · Clips & analyse · Direct · Appareils & connexions |
| **Point d’entrée « Connecter Veo »** avec trois méthodes | `VeoConnectPanel` + `VEO_CONNECTION_METHODS` | Compte (ProDay, bloqué), QR Veo Go (externe), caméra Bluetooth (externe) ; chaque méthode annonce **ce qu’elle associe** |
| **États séparés compte / caméra / flux** | `VeoStateAxes`, `resolveCameraState`, `resolveStreamState` | Aucun des trois n’est déduit d’un autre ; le flux vient du document club persisté |
| Recherche et filtre équipe de la bibliothèque | `filteredVideos`, `libraryTeams` | Filtres dérivés des seules captations chargées |
| Lecture intégrée | `ProDayIntegratedVideoPlayer` monté par le module | Lecteur **modal** avec état d’erreur et reprise — pas un lien externe |
| Garde-fous anti-simulation | `videoWorkspaceShared.test.ts`, `veoWorkspace.test.ts` | Interdit tout `BarCodeScanner`/`expo-camera` et toute chaîne de succès d’appairage |

### 7.2 Ce qui a été **observé rendu** (au-delà de l’inspection de code)

Recette exécutée dans l’aperçu, **connecté avec les comptes de démonstration documentés**
(`docs/APP_REVIEW.md`) : `coach.demo@proday.app` et `club.demo@proday.app`, mot de passe de
démonstration du dépôt. C’est la première session où le shell authentifié a pu être vu.

| Observation | Pôle | Résultat |
| --- | --- | --- |
| Les 5 sections se rendent, une seule fois chacune | Coach **et** Club | Vérifié dans le DOM (IDs de test comptés) |
| État de connexion honnête | Coach **et** Club | « Connexion Veo non configurée · Non configuré », raison affichée |
| Capacités : « Prêt · accès Veo requis » | Coach **et** Club | 5 capacités concernées + 1 seule « Intégré » (association ProDay, sans accès Veo) |
| État vide de la bibliothèque | Coach | « Aucune captation pour ce club » — club coaché sans captation |
| **Captations réelles lues** | Club | « Captations associées 1 · Clips dérivés 2 » sur `FC ProDay Démo` |
| Carte de captation réelle | Club | « Veo · Caméra connectée | 21 août 2026 | Match · Veo | Équipe non renseignée » — aucune durée ni score inventés |
| **Clips dérivés réels** | Club | 2 clips calculés depuis la captation persistée, dont « Séquence but (indicatif) » |
| **Recherche de bibliothèque** | Club | « zzz-introuvable » ⇒ 0 résultat + état explicite ; « match » ⇒ 1 résultat |
| **Lecteur intégré ouvert** | Club | Modal « DIFFUSION VEO / VIDÉO CLUB » avec titre, fermeture et **« Flux vidéo temporairement indisponible » + « Reconnexion / Réessayer »** |
| Étapes QR réellement documentées affichées | Club | « Start Recording », « Join Recording », numéro d’identification de la caméra |
| Bouton d’association réservé au rôle habilité | Club vs Coach | Présent côté Club, absent côté Coach (rôle coach) |

### 7.3 Ce qui **reste non vérifié** — à ne pas présenter comme validé

| Élément | Blocage exact |
| --- | --- |
| **Lecture d’un flux Veo réel** (direct ou replay) | Le lecteur intégré s’ouvre et atteint sa branche d’erreur sur l’URL persistée de démonstration, qui n’est pas un flux Veo lisible. Une URL `downloadtoken` réelle exige un client Veo + une captation `Transcoded` : aucun des deux n’existe. **Le lecteur est donc prouvé intégré, pas prouvé lisant un flux Veo.** |
| Compte Veo connecté | Client Veo non délivré (identifiants Partenaire). Aucun état « Connecté » ne peut être produit honnêtement. |
| Appairage QR et appairage caméra | Hors du périmètre technique de ProDay (voir §6 bis) — vérifiés dans la documentation officielle, non exécutables ici. |
| Permissions caméra / refus d’accès | Sans objet : aucun scanner n’est implémenté, puisque le mécanisme vérifié n’appartient pas à ProDay. |
| Matrice appareils (Windows, Mac, iPad, Android, iPhone) | Aucun appareil disponible. La recette est faite au niveau navigateur (aperçu web), pas appareil. |
| Droits Veo côté service (qui voit quoi) | Dépend du compte Veo réel ; les règles ProDay sont vérifiées, pas les règles Veo. |

### 7.4 Bug réel trouvé en regardant l’écran (et non en lisant le code)

Le premier rendu authentifié a montré une **section en chargement permanent** : ni état vide,
ni compteurs, rien. Cause : le défaut `videos = []` dans la déstructuration des propriétés
créait **un nouveau tableau à chaque rendu**, et ce tableau étant une dépendance de l’effet de
chargement, l’effet se relançait indéfiniment. Corrigé par des identités stables
(`NO_VIDEOS`/`NO_CLIPS`), et un état de chargement **visible** a été ajouté à la place du vide
silencieux. Ce défaut n’était pas détectable par typecheck ni par test : il fallait regarder
l’écran.

Deuxième défaut, vu dans le même écran : la section « Appareils & connexions » rendait
**deux fois** la carte d’état, les produits et les capacités, parce que le panneau Club
(`VeoConnectionPanel`) réembarquait les mêmes composants partagés. Le doublon a été retiré
(le panneau Club reste utilisé par les Paramètres du club, où il est le seul contenu) et la
seule information qu’il apportait en propre — « disponible sans accès Veo » — a été reprise
dans le module partagé, donc pour les deux pôles.

## 8. Prochaine action pour débloquer

Contacter le représentant Veo pour obtenir **deux paires `client_id` / secret** (UAT
`tokenapiuat` + production `tokenapi`) et l'autorisation d'utiliser le flux
`grant_type=password` depuis un service serveur ProDay. C'est la seule étape qui sépare
l'inventaire ci-dessus d'une intégration vérifiée — elle est **administrative**, pas technique.

## 9. Implémentation de l’intégration in-app (16 septembre 2026)

Cette section remplace la conclusion « tout est bloqué » de la §8 pour ce qui a été construit :
le chemin complet **compte → bibliothèque → lecture dans ProDay** existe désormais dans le
code, avec le lecteur intégré ProDay (aucun renvoi vers un site pour regarder une vidéo).

### 9.1 Ce qui est branché

| Élément | Où | Nature |
| --- | --- | --- |
| `veoAccountStatus`, `veoConnect`, `veoDisconnect`, `veoVideosList`, `veoPlaybackUrl` | `functions/src/veoApi.ts` (région `europe-west1`) | Callables réelles ; le `client_secret` n’existe qu’ici |
| Règles pures (session, statuts HTTP, forme des réponses, URL de lecture) | `functions/src/veoApiCore.ts` | Testé par `functions/test/veoApiCore.test.mjs` |
| Service applicatif (aucun secret côté client) | `src/services/veo/veoAccount.service.ts` | Appels en `europe-west1` |
| Modèle de vérité (normalisation, tons, libellés) | `src/services/veo/veoAccountModel.ts` | Pur, testé |
| Panneau compte + QR + bibliothèque | `src/features/video/VeoAccountPanel.tsx` | Rendu par le **module Vidéo partagé** (Coach **et** Club) |
| Lecture | `VideoWorkspace` → `resolveVeoPlaybackUrl` → `ProDayIntegratedVideoPlayer` | Plein écran (`allowsFullscreenVideo`) |

Le jeton Veo est stocké côté serveur dans `veo_sessions/{uid}` : Coach et Club lisent donc le
même enregistrement autorisé, et « Connecté » n’apparaît qu’après vérification serveur.

### 9.2 Vérifié par exécution

- `functions/test/veoApiCore.test.mjs` — 8 tests : corps d’échange documenté, absence de client,
  bascule UAT, marge d’expiration (60 s), statuts HTTP, enveloppes `get-all`, `downloadtoken`.
- `src/__tests__/veoAccountLifecycle.test.ts` — 11 tests : cycle complet piloté avec les
  callables simulées (non configuré → connexion → liste → lecture → refus → déconnexion),
  **région `europe-west1` assertée sur chaque appel**.
- `src/__tests__/veoInAppPlayback.test.ts` — 15 tests : lecture in-app, états de chargement /
  échec / reprise, et l’interdiction de confondre « injoignable » avec « non configuré ».
- Écran (preview web, rôle entraîneur, `Mes Vidéos` › `Appareils & connexions`) : le panneau
  rend « Service Veo injoignable » avec reprise, **sans** proposer à tort de demander un accès
  Veo ; la carte QR affiche les 6 étapes officielles ; « Revérifier la connexion » réémet
  réellement l’appel `veoAccountStatus`.

### 9.3 Bloqueur exact, constaté (et non supposé)

`POST https://europe-west1-proday-155b0.cloudfunctions.net/veoAccountStatus` → **HTTP 404**
(également en `us-central1`). Les callables Veo ne sont **pas déployées** sur le projet
`proday-155b0`, et `VEO_CLIENT_ID` / `VEO_CLIENT_SECRET` ne sont pas provisionnés (ils ne
peuvent l’être que par un représentant Veo). Conséquence honnête : **aucune vidéo Veo ne peut
être lue aujourd’hui**, et la preview web ne peut pas non plus atteindre les callables (CORS
des Cloud Functions depuis une origine navigateur — limite du mode web de développement, sans
effet sur iOS/Android).

Deux actions restent donc à faire, dans cet ordre :

1. `firebase deploy --only functions:veoAccountStatus,functions:veoConnect,functions:veoDisconnect,functions:veoVideosList,functions:veoPlaybackUrl` (nécessite l’approbation du propriétaire du projet).
2. Provisionner `VEO_CLIENT_ID` / `VEO_CLIENT_SECRET` en secrets de fonctions, puis connecter un
   compte Veo depuis l’app et relire une captation : c’est le seul test qui validera la lecture.

Aucun faux lecteur, aucune URL Veo reconstruite, aucun bouton de site tiers ne tient lieu de
cette étape : le direct reste explicitement hors périmètre (aucun endpoint documenté).

### 9.4 Déploiement effectué (16 septembre 2026, 16 h 11 UTC)

Les cinq callables Veo sont **déployées en 2ᵉ génération, région `europe-west1`**, sur le
projet `proday-155b0` (le premier déploiement les avait créées en 1ʳᵉ génération, contre la
convention du dépôt : elles ont été supprimées puis redéployées en v2).

```
veoAccountStatus   v2   callable   europe-west1   256 Mi   nodejs20
veoConnect         v2   callable   europe-west1   256 Mi   nodejs20
veoDisconnect      v2   callable   europe-west1   256 Mi   nodejs20
veoVideosList      v2   callable   europe-west1   256 Mi   nodejs20
veoPlaybackUrl     v2   callable   europe-west1   256 Mi   nodejs20
```

**Vérifications faites après déploiement**

- `POST https://europe-west1-proday-155b0.cloudfunctions.net/veoAccountStatus` (non
  authentifié) → **401** `{"status":"UNAUTHENTICATED","message":"Session expirée. Reconnectez-vous."}` :
  la fonction est joignable, et l'authentification est appliquée côté backend.
- En-tête `access-control-allow-origin` renvoyé : les callables v2 gèrent le CORS, donc la
  preview web de développement atteint désormais la fonction (ce qui a permis la vérification
  ci-dessous, impossible en 1ʳᵉ génération).
- **Chaîne complète vérifiée à l'écran** (preview web, rôle entraîneur, `Mes Vidéos` ›
  `Appareils & connexions`) : le panneau affiche « Connexion Veo non configurée » avec le
  message exact du serveur. Preuve que ce texte vient bien de la fonction déployée : la phrase
  « la demande d’accès est administrative, pas technique » n'existe **que** dans
  `functions/src/veoApiCore.ts` — `grep` sur `src/` ne la trouve nulle part.
- Deux garde-fous ajoutés pendant la préparation du déploiement : `adminInitOrder.test.mjs`
  (le module Veo initialise Admin lui-même ; il ne dépend pas de l'ordre des imports de
  `index.ts`, contrairement à 22 modules préexistants qui, eux, en dépendent) et la
  vérification que les callables sont bien déclarées en v2.

### 9.5 Ce qu'il reste pour lire une vraie vidéo Veo

Une seule chose, et elle n'est pas technique : **`VEO_CLIENT_ID` / `VEO_CLIENT_SECRET`**.
Sans ces deux secrets, la fonction répond honnêtement `not_configured` et aucun formulaire de
connexion n'est affiché (il ne pourrait aboutir à rien). Marche à suivre :

1. Obtenir les deux paires d'identifiants auprès d'un représentant Veo (UAT `tokenapiuat` +
   production `tokenapi`).
2. `firebase functions:secrets:set VEO_CLIENT_ID` puis `VEO_CLIENT_SECRET --project proday-155b0`
   (ou variables d'environnement des fonctions), et redéployer les cinq callables pour qu'elles
   les reçoivent.
3. Depuis l'app : `Mes Vidéos` › `Appareils & connexions` › connecter le compte Veo, puis lire
   une captation dans `Bibliothèque` — c'est l'unique test qui validera la lecture réelle.

Tant que l'étape 1 n'est pas faite, **aucune vidéo Veo ne peut être lue**, et l'interface le
dit plutôt que de faire semblant. Le direct reste hors périmètre : aucun endpoint de diffusion
n'est documenté par Veo.
