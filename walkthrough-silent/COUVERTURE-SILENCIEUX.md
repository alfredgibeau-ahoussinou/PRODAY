# ProDay — enregistrements muets : couverture et horodatages

Application : **ProDay 1.0.10** — build web local (`http://localhost:8081`), Chrome piloté en CDP.
Périmètre : pôles **Club, Coach, Joueur, Parent**. L’espace **Admin plateforme est exclu**.

## Nature des fichiers livrés

- **Aucune piste audio** : la capture est un relevé d’images (screencast CDP) — le son n’est ni capté ni ajouté.
  Chaque fichier est contrôlé après export : `0` flux audio, `1` flux vidéo H.264.
- **Aucun sous-titre**, aucune incrustation, aucune voix off, aucune séquence d’intro ou de générique.
  Les images sont celles de l’application, sans habillage (les repères de chapitres sont des métadonnées,
  utiles pour naviguer, et la liste horodatée figure ci-dessous).
- Les lectures vidéo de l’application sont muettes par construction (aucune piste audio n’existe dans la source).

## Traitement du montage

La capture n’est pas une vidéo : c’est un relevé d’images envoyées quand l’écran change. Le montage
applique quatre traitements, sans jamais modifier ce qui est affiché :

- **Images stabilisées.** Chaque écran est représenté par une image prise après stabilisation, et non
  par la première image du changement. Une transition (menu qui s’ouvre, liste qui se remplit) n’est donc
  jamais tenue plusieurs secondes à l’image.
- **Temps morts plafonnés.** Un écran inchangé n’est jamais tenu plus de 13 s. Les gels de capture
  (interruptions du flux, allant jusqu’à 35 s) ne deviennent plus des minutes d’image fixe ; les pauses
  de lecture voulues (8 à 15 s par écran) sont conservées.
- **Prologue de connexion retiré.** Chaque scénario déclare deux étapes techniques avant le premier écran
  réel. Les 10 à 16 premières secondes des pôles dont la connexion se fait dans le format filmé montraient
  donc la sélection d’univers, la porte « Espace » et le **formulaire de connexion** : le montage démarre
  sur le premier écran réel, qui n’apparaît alors que chargé. Aucun identifiant, même de démonstration,
  n’est visible dans les vidéos.
- **Encodage renforcé.** `libx264` en crf 15, preset `slow`, paramètres orientés texte, réduction Lanczos.
  Mesuré sur ces captures : **+4 dB de PSNR** et une erreur structurelle divisée par environ 6 par rapport
  au réglage précédent (crf 20 / preset `veryfast`).

Les durées ci-dessous sont celles du **montage final**, pas celles de la capture. La différence est indiquée pour mémoire.
## Rendu et matériel

**Simulation de navigateur** — aucun appareil physique, aucun émulateur d’appareil :

- **Desktop** : fenêtre **1920 × 1080**, paysage, barre latérale visible.
- **Mobile** : viewport **390 × 844** en portrait, densité 3, tactile émulé : c’est la mise en page mobile
  réelle de l’application, rendue et pilotée séparément. **Aucune vidéo mobile n’est un recadrage du desktop.**
- Les segments où le support est tourné (analyse vidéo, tableau tactique, carte de trajet) apparaissent
  en **paysage centré** dans le canevas portrait : l’image entière est conservée, rien n’est rogné.

## Comptes et données

Comptes de démonstration isolés (`club`, `coach`, `player`, `parent` `.demo@proday.app`) sur le club
`FC ProDay Démo`. Le mot de passe est saisi **avant** l’enregistrement et n’apparaît dans aucune image ;
aucun outil de développement, aucune autre application, aucune notification système n’est visible.
Aucune action à conséquence n’est déclenchée sur des données réelles (aucun envoi, aucun paiement).

## Fichiers

| Fichier | Pôle | Interface | Viewport | Durée | Chapitres | Audio | Taille |
|---|---|---|---|---|---|---|---|
| `ProDay-Club-Desktop-Silent.mp4` | Club | Desktop | 1920x1080 | 03:35 | 23 | **aucun** (0 piste) | 6.9 Mo |
| `ProDay-Club-Mobile-Silent.mp4` | Club | Mobile | 1080x2340 | 07:21 | 25 | **aucun** (0 piste) | 44.0 Mo |
| `ProDay-Coach-Desktop-Silent.mp4` | Coach | Desktop | 1920x1080 | 05:51 | 21 | **aucun** (0 piste) | 11.6 Mo |
| `ProDay-Coach-Mobile-Silent.mp4` | Coach | Mobile | 1080x2340 | 04:35 | 16 | **aucun** (0 piste) | 21.6 Mo |
| `ProDay-Player-Desktop-Silent.mp4` | Joueur | Desktop | 1920x1080 | 03:15 | 14 | **aucun** (0 piste) | 4.2 Mo |
| `ProDay-Player-Mobile-Silent.mp4` | Joueur | Mobile | 1080x2340 | 03:43 | 15 | **aucun** (0 piste) | 14.3 Mo |
| `ProDay-Parent-Desktop-Silent.mp4` | Parent | Desktop | 1920x1080 | 01:58 | 13 | **aucun** (0 piste) | 2.4 Mo |
| `ProDay-Parent-Mobile-Silent.mp4` | Parent | Mobile | 1080x2340 | 02:09 | 11 | **aucun** (0 piste) | 7.6 Mo |

## Checklist de pages et horodatages

Chaque tableau liste les écrans réellement enregistrés, dans l’ordre, avec leur horodatage.
La colonne « état » précise ce qui doit être visible à cet instant.

### Club — Desktop — `ProDay-Club-Desktop-Silent.mp4`

- Durée 03:35 · 1920x1080 · 23 chapitres · **silence vérifié** (0 piste audio)
- Scénario : 23 étapes · compte `club.demo@proday.app`
- Capture 04:23 → montage 03:35 : **47.4s retirés**, dont 10s de prologue de connexion, 170 écrans, 44 images entièrement noires écartées, aucun écran inchangé tenu plus de 13s

| Temps | Écran enregistré | Statut |
|---|---|---|
| 00:05 | Accueil club — carte club, recherche globale, prochain rendez-vous, raccourcis et statistiques | ✓ enregistré |
| 00:13 | Équipes — sélection d'une équipe et effectif | ✓ enregistré |
| 00:24 | Joueurs — annuaire des licenciés | ✓ enregistré |
| 00:37 | Coach — staff et affectations | ✓ enregistré |
| 00:47 | Demandes d'adhésion — affiliations en attente | ✓ enregistré |
| 00:57 | Calendrier — vues jour, semaine, mois | ✓ enregistré |
| 01:10 | Matchs — convocations et invitations | ✓ enregistré |
| 01:21 | Entraînements — séances et présences | ✓ enregistré |
| 01:32 | Événements — tournois et poules | ✓ enregistré |
| 01:42 | Classements — championnat officiel FFF | ✓ enregistré |
| 01:52 | Vidéo & Analyse — Veo, smartphone, clips IA (démonstration) | ✓ enregistré |
| 02:02 | Communication — canaux équipes, coachs, parents | ✓ enregistré |
| 02:13 | Covoiturage — déplacements et logistique | ✓ enregistré |
| 02:24 | Copilote Club — assistant IA à confirmation | ✓ enregistré |
| 02:27 | Notifications — centre d'alertes et préférences | ✓ enregistré |
| 02:27 | Club — identité et réglages | ✓ enregistré |
| 02:39 | Pack Club — offre sur devis | ✓ enregistré |
| 02:50 | Licences — documents et licences | ✓ enregistré |
| 02:60 | Finances — grand livre simplifié | ✓ enregistré |
| 03:10 | Sponsoring — partenaires, buvette, médical FFF, équipements | ✓ enregistré |
| 03:22 | Permissions — rôles admin, dirigeant, DS, coach | ✓ enregistré |
| 03:32 | Note — la bascule Pôle Président est disponible sur mobile (Menu) ; desktop = sidebar complète | ✓ enregistré |
| 03:35 | Fin de la visite | ✓ enregistré |

**Confrontation à l’inventaire de navigation**

| Page / état recensé | Dans l’enregistrement | Remarque |
|---|---|---|
| Accueil club (tableau de bord) | oui |  |
| Équipes rattachées | oui |  |
| Joueurs — annuaire des licenciés | oui |  |
| Coachs — staff et affectations | oui |  |
| Demandes d'adhésion | oui |  |
| Calendrier (jour / semaine / mois) | oui |  |
| Matchs & convocations | oui |  |
| Entraînements & présences | oui |  |
| Événements & tournois | oui |  |
| Classements FFF | oui |  |
| Vidéo & Analyse | oui |  |
| Communication & canaux | oui |  |
| Covoiturage & logistique | oui |  |
| Copilote Club IA | oui |  |
| Centre de notifications | oui |  |
| Identité & réglages du club | oui |  |
| Pack Club (offre) | oui |  |
| Licences & documents | oui |  |
| Finances & cotisations | oui |  |
| Sponsoring & partenaires | oui |  |
| Rôles & permissions | oui |  |
| Pôle Président (bascule) | oui | Disponible uniquement en version mobile : le chapitre le documente. |

### Club — Mobile — `ProDay-Club-Mobile-Silent.mp4`

- Durée 07:21 · 1080x2340 · 25 chapitres · **silence vérifié** (0 piste audio)
- Scénario : 25 étapes · compte `club.demo@proday.app`
- Capture 09:51 → montage 07:21 : **150s retirés**, dont 14.6s de prologue de connexion, 581 écrans, 1 images entièrement noires écartées, aucun écran inchangé tenu plus de 13s

| Temps | Écran enregistré | Statut |
|---|---|---|
| 00:05 | Accueil club (mobile) — carte du club, recherche universelle, prochain rendez-vous et modules du club | ✓ enregistré |
| 00:13 | Bouton « + CRÉER » — feuille de création : match, entraînement, joueur, coach, invitation | ✓ enregistré |
| 00:32 | Onglet Calendrier — vue jour/semaine/mois des événements du club | ✓ enregistré |
| 00:49 | Onglet Équipes — équipes rattachées au club et effectifs | ✓ enregistré |
| 01:06 | Onglet Menu — hub « Tout ProDay » : tous les modules du club et bannière Pôle Président | ✓ enregistré |
| 01:19 | Module Matchs & Live — convocations, scores en direct et feuilles de match | ✓ enregistré |
| 01:38 | Module Événements & Tournois — tournois, stages et rassemblements du club | ✓ enregistré |
| 01:59 | Module Classements FFF — championnat du club et divisions suivies | ✓ enregistré |
| 02:21 | Module Vidéo & Analyse IA — Veo, smartphone, smart clipping et tags (démonstration) | ✓ enregistré |
| 02:42 | Analyse vidéo en paysage — lecture plein écran d'un clip (rotation du support) | ✓ enregistré |
| 03:04 | Module Effectif & Licences — annuaire des licenciés, adhésions et statuts | ✓ enregistré |
| 03:26 | Module Staff & Coachs — affectations et encadrement des équipes | ✓ enregistré |
| 03:45 | Module Communication — canaux officiels, Flash Info et messagerie directe | ✓ enregistré |
| 04:07 | Module Finances & Cotisations — trésorerie, adhésions et suivi (données de démonstration) | ✓ enregistré |
| 04:26 | Module Entraînements — séances planifiées, exercices et présences | ✓ enregistré |
| 04:43 | Module Covoiturage & Logistique — déplacements extérieurs, places et itinéraires | ✓ enregistré |
| 05:04 | Module Documents & Licences — bordereaux FFF et certificats | ✓ enregistré |
| 05:26 | Module Sponsoring & Partenaires — dossiers, mécénat et visibilité | ✓ enregistré |
| 05:43 | Module Rôles & Permissions — droits d'accès du staff et des dirigeants | ✓ enregistré |
| 06:00 | Module Identité du club — couleurs, logo, saison et réglages | ✓ enregistré |
| 06:22 | Centre de notifications — alertes adhésions, convocations et staff | ✓ enregistré |
| 06:41 | Module Copilote Club IA — briefings et requêtes assistées (démonstration) | ✓ enregistré |
| 06:58 | Pôle Président & Direction — cockpit stratégique du club (bascule depuis le Menu) | ✓ enregistré |
| 07:21 | Fin du parcours mobile — le retour à l'accueil club n'a pas pu être déclenché depuis le cockpit Président : constat conservé tel quel | △ étape non déclenchée (documentée) |
| 07:21 | Fin de la visite | ✓ enregistré |

**Confrontation à l’inventaire de navigation**

| Page / état recensé | Dans l’enregistrement | Remarque |
|---|---|---|
| Accueil club (mobile) | oui |  |
| Bouton « + CRÉER » (feuille de création) | oui |  |
| Calendrier (jour / semaine / mois) | oui |  |
| Équipes rattachées | oui |  |
| Hub « Tout ProDay » | oui |  |
| Matchs & Live | oui |  |
| Événements & tournois | oui |  |
| Classements FFF | oui |  |
| Vidéo & Analyse IA | oui |  |
| Lecture vidéo en paysage (rotation) | oui |  |
| Effectif & licences | oui |  |
| Staff & coachs | oui |  |
| Communication | oui |  |
| Finances & cotisations | oui |  |
| Entraînements | oui |  |
| Covoiturage & logistique | oui |  |
| Documents & licences | oui |  |
| Sponsoring & partenaires | oui |  |
| Rôles & permissions | oui |  |
| Identité du club | oui |  |
| Centre de notifications | oui |  |
| Copilote Club IA | oui |  |
| Pôle Président & Direction | oui |  |
| Retour à l’accueil club | oui | Le retour depuis le cockpit Président n’a pas pu être déclenché : constat conservé. |

**Incidents enregistrés pendant la capture**

- flux de capture interrompu 21s à l'étape retour-club : relance du screencast

### Coach — Desktop — `ProDay-Coach-Desktop-Silent.mp4`

- Durée 05:51 · 1920x1080 · 21 chapitres · **silence vérifié** (0 piste audio)
- Scénario : 21 étapes · compte `coach.demo@proday.app`
- Capture 10:08 → montage 05:51 : **256.9s retirés**, dont 0s de prologue de connexion, 267 écrans, 0 images entièrement noires écartées, aucun écran inchangé tenu plus de 13s

| Temps | Écran enregistré | Statut |
|---|---|---|
| 00:00 | Début de la capture | ✓ enregistré |
| 00:00 | Connexion au pôle Coach (session de démonstration déjà ouverte, mot de passe masqué) | ✓ enregistré |
| 00:03 | Accueil coach — cockpit du banc : vigilance de charge, prochain événement, raccourcis (tableau tactique, entraînements, scouting vocal) | ✓ enregistré |
| 00:13 | Messagerie — messagerie interne du staff, ouverte depuis l'en-tête (conversations, groupes, non lus) | ✓ enregistré |
| 00:26 | Calendrier (barre latérale) — vue du mois avec séances et matchs de l'équipe active | ✓ enregistré |
| 00:39 | Équipe — effectif de l'équipe active, actions d'équipe et accès à la composition | ✓ enregistré |
| 00:39 | Menu — hub « Tout ProDay » du pôle Coach : tous les modules du staff en une page | ✓ enregistré |
| 01:06 | Module Matchs & Live — direct, convocations et scores | ✓ enregistré |
| 01:25 | Module Entraînements — séances, exercices d'atelier et présences | ✓ enregistré |
| 01:49 | Module Effectif & Joueurs — fiches joueurs, forme et statistiques individuelles | ✓ enregistré |
| 02:14 | Assistant Coach IA — conseils et causeries proposées (résultats de démonstration) | ✓ enregistré |
| 02:41 | Chat Copilote IA — assistant conversationnel du staff | ✓ enregistré |
| 02:59 | Mes Vidéos — captations, clips et analyse vidéo (démonstration) | ✓ enregistré |
| 03:24 | Forme & Charge — suivi physique de l'effectif : charge, alertes et objectifs | ✓ enregistré |
| 03:48 | Gestion Équipe — licences, catégories et organisation administrative | ✓ enregistré |
| 04:07 | Historique des relances — qui a été relancé, quand et combien de destinataires | ✓ enregistré |
| 04:25 | Covoiturage — trajets et véhicules des matchs | ✓ enregistré |
| 04:44 | Coaching Perso — créneaux ouverts et tarification à l'heure | ✓ enregistré |
| 05:04 | Composition & tableau tactique — accueil → raccourci « Tableau tactique » → « Composer le onze » : schéma de jeu de l'équipe active | ✓ enregistré |
| 05:34 | Retour à l'accueil coach — synthèse du parcours | ✓ enregistré |
| 05:49 | Fin de la visite | ✓ enregistré |

**Confrontation à l’inventaire de navigation**

| Page / état recensé | Dans l’enregistrement | Remarque |
|---|---|---|
| Accueil coach (cockpit du banc) | oui |  |
| Messagerie interne | oui |  |
| Calendrier (séances / matchs) | oui |  |
| Équipe (effectif de l’équipe active) | oui |  |
| Hub « Tout ProDay » | oui |  |
| Matchs & Live | oui |  |
| Entraînements & ateliers | oui |  |
| Effectif & joueurs | oui |  |
| Assistant Coach IA | oui |  |
| Chat Copilote IA | oui |  |
| Mes Vidéos | oui |  |
| Forme & Charge | oui |  |
| Gestion Équipe | oui |  |
| Historique des relances | oui |  |
| Covoiturage | oui |  |
| Coaching Perso | oui |  |
| Composition & tableau tactique | oui | L’accès « Composer l’équipe & la tactique » est visible dans l’accueil ; la composition détaillée est enregistrée dans la version mobile. |
| Aide | **non** | Page d’aide, accessible depuis la barre latérale mais non enregistrée. |

**Incidents enregistrés pendant la capture**

- étape assistant-ia : pression sur « Assistant Coach IA » sans effet — tentative 1
- étape composition-tactique : pression sur « Composer le onze » sans effet — tentative 1
- étape composition-tactique : pression sur « Composer le onze » sans effet — tentative 2
- étape composition-tactique : pression sur « Composer le onze » sans effet — tentative 3

### Coach — Mobile — `ProDay-Coach-Mobile-Silent.mp4`

- Durée 04:35 · 1080x2340 · 16 chapitres · **silence vérifié** (0 piste audio)
- Scénario : 16 étapes · compte `coach.demo@proday.app`
- Capture 10:33 → montage 04:35 : **358.1s retirés**, dont 12.5s de prologue de connexion, 256 écrans, 5 images entièrement noires écartées, aucun écran inchangé tenu plus de 13s

| Temps | Écran enregistré | Statut |
|---|---|---|
| 00:07 | Accueil coach (mobile) — briefing du banc, vigilance charge, prochaines échéances et RSVP | ✓ enregistré |
| 00:27 | Onglet Menu — hub « Tout ProDay » du pôle Coach (tous les modules) | ✓ enregistré |
| 00:44 | Module Matchs & Live — direct, convocations et scores | ✓ enregistré |
| 01:10 | Module Entraînements — séances, exercices et présences de l'équipe | ✓ enregistré |
| 01:27 | Module Effectif & Joueurs — fiches, forme et statistiques individuelles | ✓ enregistré |
| 01:49 | Assistant Coach IA — conseils et causeries (résultats de démonstration) | ✓ enregistré |
| 01:49 | Chat Copilote IA — assistant conversationnel du staff | ✓ enregistré |
| 02:02 | Mes Vidéos — captations et clips d'analyse (démonstration) | ✓ enregistré |
| 02:20 | Forme & Charge — suivi physique : charge, alertes et objectifs | ✓ enregistré |
| 02:37 | Gestion Équipe — licences, catégories et organisation | ✓ enregistré |
| 02:55 | Messagerie — messages directs et groupes staff / parents | ✓ enregistré |
| 02:55 | Covoiturage — trajets et véhicules des matchs | ✓ enregistré |
| 03:12 | Coaching Perso — créneaux et tarifs à l'heure | ✓ enregistré |
| 03:29 | Composition & tableau tactique — accueil → Tableau tactique → « Composer le onze », puis schéma de jeu affiché en paysage plein écran | ✓ enregistré |
| 04:22 | Retour à l'accueil coach — synthèse du parcours mobile | ✓ enregistré |
| 04:35 | Fin de la visite | ✓ enregistré |

**Confrontation à l’inventaire de navigation**

| Page / état recensé | Dans l’enregistrement | Remarque |
|---|---|---|
| Accueil coach (mobile) | oui |  |
| Hub « Tout ProDay » | oui |  |
| Matchs & Live | oui |  |
| Entraînements | oui |  |
| Effectif & joueurs | oui |  |
| Assistant Coach IA | oui |  |
| Chat Copilote IA | oui |  |
| Mes Vidéos | oui |  |
| Forme & Charge | oui |  |
| Gestion Équipe | oui |  |
| Messagerie | oui |  |
| Covoiturage | oui |  |
| Coaching Perso | oui |  |
| Tableau tactique en paysage | oui |  |
| Calendrier | **non** | Visible depuis le dock ; le détail du calendrier est enregistré dans la version desktop. |

**Incidents enregistrés pendant la capture**

- étape menu : pression sur « Menu » sans effet — tentative 1
- étape menu : pression sur « Menu » sans effet — tentative 2
- étape menu : pression sur « Menu » sans effet — tentative 3
- étape matchs-live : pression sur « Matchs & Live » sans effet — tentative 1
- étape assistant-ia : pression sur « Assistant Coach IA » sans effet — tentative 1
- étape assistant-ia : pression sur « Assistant Coach IA » sans effet — tentative 2
- étape assistant-ia : pression sur « Assistant Coach IA » sans effet — tentative 3
- étape copilote : pression sur « Chat Copilote IA » sans effet — tentative 1
- étape copilote : pression sur « Chat Copilote IA » sans effet — tentative 2
- étape copilote : pression sur « Chat Copilote IA » sans effet — tentative 3
- blocage détecté à l'étape copilote : deux interactions sans effet → rechargement de la session
- étape messagerie : pression sur « Messagerie » sans effet — tentative 1
- étape messagerie : pression sur « Messagerie » sans effet — tentative 2
- étape messagerie : pression sur « Messagerie » sans effet — tentative 3
- étape tactique : pression sur « Composer le onze » sans effet — tentative 1
- étape tactique : pression sur « Composer le onze » sans effet — tentative 2
- étape tactique : pression sur « Composer le onze » sans effet — tentative 3
- étape retour-accueil : pression sur « Accueil » sans effet — tentative 1
- étape retour-accueil : pression sur « Accueil » sans effet — tentative 2
- étape retour-accueil : pression sur « Accueil » sans effet — tentative 3

### Joueur — Desktop — `ProDay-Player-Desktop-Silent.mp4`

- Durée 03:15 · 1920x1080 · 14 chapitres · **silence vérifié** (0 piste audio)
- Scénario : 14 étapes · compte `player.demo@proday.app`
- Capture 05:02 → montage 03:15 : **107.3s retirés**, dont 0s de prologue de connexion, 107 écrans, 3 images entièrement noires écartées, aucun écran inchangé tenu plus de 13s

| Temps | Écran enregistré | Statut |
|---|---|---|
| 00:00 | Début de la capture | ✓ enregistré |
| 00:00 | Connexion au pôle Joueur (session de démonstration déjà ouverte, mot de passe masqué) | ✓ enregistré |
| 00:03 | Accueil joueur — carte de joueur, prochains rendez-vous, quêtes du jour et objectifs de saison | ✓ enregistré |
| 00:13 | Calendrier joueur — rendez-vous, filtres, convocations, carte et terrains | ✓ enregistré |
| 00:31 | Ma Carte — fiche joueur, note globale, statistiques et vitrine | ✓ enregistré |
| 00:44 | Ma Saison — matchs, feuilles de match, classement et progression du joueur | ✓ enregistré |
| 01:09 | Équipe — club, groupe et mercato : effectif et équipes du joueur | ✓ enregistré |
| 01:34 | Vestiaire — messagerie d'équipe, convocations et fils de discussion | ✓ enregistré |
| 01:52 | Trajet — covoiturage et déplacements vers les rencontres | ✓ enregistré |
| 02:12 | Mon compte — profil joueur, vitrine CV et paramètres | ✓ enregistré |
| 02:30 | Mon Coach IA — carte présente dans le hub, mais aucun module ne s'ouvre dans cette version : constat conservé tel quel | ✓ enregistré |
| 02:48 | Modules annoncés « Bientôt » — Clips et Boutique présents dans le hub mais sans contenu livré | ✓ enregistré |
| 03:01 | Retour à l'accueil joueur — synthèse du parcours | ✓ enregistré |
| 03:14 | Fin de la visite | ✓ enregistré |

**Confrontation à l’inventaire de navigation**

| Page / état recensé | Dans l’enregistrement | Remarque |
|---|---|---|
| Accueil joueur (Carrière) | oui |  |
| Calendrier joueur | oui |  |
| Ma Carte (fiche & vitrine) | oui |  |
| Ma Saison (matchs & progression) | oui |  |
| Équipe — club, groupe & mercato | oui |  |
| Vestiaire & messagerie | oui |  |
| Trajet / covoiturage | oui |  |
| Mon compte & paramètres | oui |  |
| Mon Coach IA | oui | Carte présente dans le hub mais sans ouverture de module sur cette version desktop : constat conservé. |
| Clips (annoncé « Bientôt ») | oui | Module annoncé « Bientôt » : aucun contenu livré. |
| Boutique (annoncé « Bientôt ») | oui | Module annoncé « Bientôt » : aucun contenu livré. |

### Joueur — Mobile — `ProDay-Player-Mobile-Silent.mp4`

- Durée 03:43 · 1080x2340 · 15 chapitres · **silence vérifié** (0 piste audio)
- Scénario : 15 étapes · compte `player.demo@proday.app`
- Capture 06:48 → montage 03:43 : **185.4s retirés**, dont 16s de prologue de connexion, 169 écrans, 7 images entièrement noires écartées, aucun écran inchangé tenu plus de 13s

| Temps | Écran enregistré | Statut |
|---|---|---|
| 00:01 | Fermeture de la « Question de la semaine » — popup d'accueil du joueur | ✓ enregistré |
| 00:12 | Accueil joueur (mobile) — carte de joueur, quêtes du jour, objectifs de saison et radar de progression | ✓ enregistré |
| 00:13 | Onglet Calendrier — rendez-vous, filtres par type, convocations et carte des terrains | ✓ enregistré |
| 00:30 | Onglet Équipe — annuaire du club et fiches des membres | △ étape non déclenchée (documentée) |
| 00:30 | Onglet Menu — hub « Tout ProDay » du joueur : tous les modules et services | ✓ enregistré |
| 00:47 | Ma Saison — matchs & calendrier, classement de championnat et mes statistiques | ✓ enregistré |
| 01:04 | Progression — XP, niveau et défis débloqués | ✓ enregistré |
| 01:18 | Vestiaire — messagerie d'équipe et fils de discussion | ✓ enregistré |
| 01:31 | Hub en paysage — la rotation du support redimensionne réellement l'interface (module Clips annoncé « Bientôt » : aucune vidéo à lire) | ✓ enregistré |
| 02:00 | Boutique — module annoncé « Bientôt » : vitrine d'équipement ProDay non disponible pour le joueur | ✓ enregistré |
| 02:27 | Mon Coach IA — programme personnalisé (démonstration) | ✓ enregistré |
| 02:57 | Trajet — covoiturage et déplacements vers les rencontres | ✓ enregistré |
| 03:13 | Mon compte — profil joueur, vitrine CV et réglages | ✓ enregistré |
| 03:30 | Retour à l'accueil joueur — synthèse du parcours mobile | ✓ enregistré |
| 03:43 | Fin de la visite | ✓ enregistré |

**Confrontation à l’inventaire de navigation**

| Page / état recensé | Dans l’enregistrement | Remarque |
|---|---|---|
| Connexion / ouverture de session | **non** | Exclue volontairement du montage : le prologue de connexion (sélection d’univers, porte « Espace Joueur », formulaire) n’est pas filmé — voir « Traitement du montage ». |
| Question de la semaine (popup d’accueil) | oui |  |
| Accueil joueur (mobile) | oui |  |
| Calendrier (présence & filtres) | oui |  |
| Équipe — annuaire du club | oui |  |
| Hub « Tout ProDay » | oui |  |
| Ma Saison | oui |  |
| Progression (XP & défis) | oui |  |
| Vestiaire | oui |  |
| Rotation paysage du support | oui |  |
| Boutique (annoncé « Bientôt ») | oui | Module annoncé « Bientôt » : aucun contenu livré. |
| Clips (annoncé « Bientôt ») | oui | Module annoncé « Bientôt » : aucun contenu livré ; la rotation paysage est montrée à la place. |
| Mon Coach IA | oui |  |
| Trajet / covoiturage | oui |  |
| Mon compte & réglages | oui |  |

**Incidents enregistrés pendant la capture**

- flux de capture interrompu 19s à l'étape accueil : relance du screencast
- flux de capture interrompu 35s à l'étape equipe : relance du screencast
- flux de capture interrompu 20s à l'étape progression : relance du screencast
- blocage détecté à l'étape vestiaire : deux interactions sans effet → rechargement de la session
- blocage détecté à l'étape boutique : deux interactions sans effet → rechargement de la session

### Parent — Desktop — `ProDay-Parent-Desktop-Silent.mp4`

- Durée 01:58 · 1920x1080 · 13 chapitres · **silence vérifié** (0 piste audio)
- Scénario : 13 étapes · compte `parent.demo@proday.app`
- Capture 03:07 → montage 01:58 : **68.9s retirés**, dont 0s de prologue de connexion, 33 écrans, 0 images entièrement noires écartées, aucun écran inchangé tenu plus de 13s

| Temps | Écran enregistré | Statut |
|---|---|---|
| 00:00 | Début de la capture | ✓ enregistré |
| 00:00 | Connexion au pôle Parent (session de démonstration déjà ouverte, mot de passe masqué) | ✓ enregistré |
| 00:03 | Accueil parent — enfants liés, alertes, invitations et demandes de temps d'écran | ✓ enregistré |
| 00:13 | Enfant — fiche de l'enfant : statistiques, agenda et suivi | ✓ enregistré |
| 00:26 | Second enfant — bascule entre les deux profils rattachés au compte | ✓ enregistré |
| 00:26 | Guide IA — suggestions et conseils pour accompagner l'enfant | ✓ enregistré |
| 00:39 | Menu — hub « Outils famille » : messages, agenda, trajet | ✓ enregistré |
| 00:52 | Messages — contacts approuvés et conversations de l'enfant | ✓ enregistré |
| 01:06 | Agenda — réponse de présence « Je viens / Absent » et signalement de retard | ✓ enregistré |
| 01:19 | Trajet — suivi live du covoiturage et partage de position | ✓ enregistré |
| 01:32 | Profil parent — langue de l'application, mot de passe et documents légaux | ✓ enregistré |
| 01:45 | Retour à l'accueil — synthèse du parcours parent | ✓ enregistré |
| 01:57 | Fin de la visite | ✓ enregistré |

**Confrontation à l’inventaire de navigation**

| Page / état recensé | Dans l’enregistrement | Remarque |
|---|---|---|
| Accueil parent (enfants liés) | oui |  |
| Fiche enfant (données & suivi) | oui |  |
| Bascule entre deux profils enfants | oui |  |
| Guide IA (suggestions & alertes) | oui |  |
| Menu — outils famille | oui |  |
| Messages — contacts approuvés | oui |  |
| Agenda (présence & retards) | oui |  |
| Trajet — suivi live si partage | oui |  |
| Profil parent & compte | oui |  |

### Parent — Mobile — `ProDay-Parent-Mobile-Silent.mp4`

- Durée 02:09 · 1080x2340 · 11 chapitres · **silence vérifié** (0 piste audio)
- Scénario : 11 étapes · compte `parent.demo@proday.app`
- Capture 04:05 → montage 02:09 : **115.9s retirés**, dont 13.1s de prologue de connexion, 72 écrans, 2 images entièrement noires écartées, aucun écran inchangé tenu plus de 13s

| Temps | Écran enregistré | Statut |
|---|---|---|
| 00:06 | Accueil parent (mobile) — enfants liés, bascule de supervision, alertes et invitations | ✓ enregistré |
| 00:13 | Enfant — fiche de Léo : agenda, convocations et suivi de saison | ✓ enregistré |
| 00:26 | Second enfant — bascule vers Lucas, le second profil supervisé | ✓ enregistré |
| 00:39 | Guide IA — suggestions pour accompagner l'enfant (conseils personnalisés) | ✓ enregistré |
| 00:52 | Onglet Menu — hub « Outils famille » : messages, agenda et trajet | ✓ enregistré |
| 01:05 | Messages — contacts approuvés et conversations de l'enfant | ✓ enregistré |
| 01:19 | Agenda — réponse de présence « Je viens / Absent » et signalement de retard | △ étape non déclenchée (documentée) |
| 01:19 | Trajet — suivi live du covoiturage et partage de position (paysage pour la carte) | △ étape non déclenchée (documentée) |
| 01:38 | Profil parent — langue de l'application, mot de passe et documents légaux | ✓ enregistré |
| 01:55 | Retour à l'accueil parent — synthèse du parcours mobile | ✓ enregistré |
| 02:08 | Fin de la visite | ✓ enregistré |

**Confrontation à l’inventaire de navigation**

| Page / état recensé | Dans l’enregistrement | Remarque |
|---|---|---|
| Accueil parent (mobile) | oui |  |
| Fiche enfant | oui |  |
| Bascule entre deux profils enfants | oui |  |
| Guide IA | oui |  |
| Menu — outils famille | oui |  |
| Messages | oui |  |
| Agenda | oui |  |
| Trajet (rotation paysage) | oui |  |
| Profil & compte | oui |  |

**Incidents enregistrés pendant la capture**

- flux de capture interrompu 26s à l'étape agenda : relance du screencast

## Vérifications finales

| Contrôle | Résultat |
|---|---|
| Pistes audio dans les 8 fichiers | **aucune** |
| Pistes vidéo | une seule par fichier |
| Sous-titres incrustés ou piste de sous-titres | ⚠️ à vérifier |
| Lecture complète (décodage intégral) | voir `VERIFICATION.md` |
| Ordre de visite | accueil → menus → chaque module → retour à l’accueil |

## Limites connues

- **Joueur desktop** : la carte *Mon Coach IA* n’ouvre aucun module sur cette version (le module s’ouvre
  normalement en mobile) ; *Clips* et *Boutique* sont annoncés « Bientôt » et montrés comme tels.
- **Club desktop** : la bascule vers le Pôle Président n’existe qu’en mobile.
- **Club mobile** : le retour à l’accueil club depuis le cockpit Président n’a pas pu être déclenché
  (étape conservée et signalée, pas supprimée).
- **Pôles Club et Coach** : les pages de réglages de compte (Profil, Paramètres) et l’**Aide** ne sont pas
  enregistrées — elles restent accessibles mais n’ont pas été parcourues.
- Plusieurs écrans affichent des **états vides** (aucune convocation, aucun trajet, aucune conversation) :
  ce sont les états réels du club de démonstration, conservés tels quels, sans données inventées.
- Le **prologue de connexion** n’est pas filmé : ce n’est pas une omission de couverture, c’est un choix
  de confidentialité. Les écrans de connexion restent accessibles dans l’application.
- Les captures utilisées ont été prises en JPEG qualité 80 et, pour le desktop, en densité 1 (un pixel
  d’image par pixel CSS). La chaîne de capture est désormais réglée sur la qualité 95 et la densité 2
  (suréchantillonnage réduit ensuite en Lanczos) : un prochain tournage gagnera encore en netteté.

## Reproduction

```bash
# Application locale puis comptes de démonstration
npm run web
npm run seed:demo-club && npm run seed:demo-player && npm run seed:demo-parent

# Capture d’un pôle et d’une interface
node scripts/walkthrough/record.mjs scripts/walkthrough/configs/club-desktop.json

# Encodage muet (aucune piste audio, aucun sous-titre)
bash scripts/walkthrough/run-silent.sh

# Rapport de couverture et horodatages
node scripts/walkthrough/make-silent-report.mjs
```
