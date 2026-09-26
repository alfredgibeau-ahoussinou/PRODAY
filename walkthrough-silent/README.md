# ProDay — enregistrements d’écran muets

Huit fichiers, **sans aucun son, sans sous-titre, sans habillage** : uniquement l’application
ProDay en fonctionnement, parcourue zone par zone.

| Fichier | Zone | Interface | Résolution | Durée | Audio | Taille |
|---|---|---|---|---|---|---|
| `ProDay-Club-Desktop-Silent.mp4` | Club | Desktop | 1920x1080 | 03:35 | aucun | 6.9 Mo |
| `ProDay-Club-Mobile-Silent.mp4` | Club | Mobile | 1080x2340 | 07:21 | aucun | 44.0 Mo |
| `ProDay-Coach-Desktop-Silent.mp4` | Coach | Desktop | 1920x1080 | 05:51 | aucun | 11.6 Mo |
| `ProDay-Coach-Mobile-Silent.mp4` | Coach | Mobile | 1080x2340 | 04:35 | aucun | 21.6 Mo |
| `ProDay-Player-Desktop-Silent.mp4` | Joueur | Desktop | 1920x1080 | 03:15 | aucun | 4.2 Mo |
| `ProDay-Player-Mobile-Silent.mp4` | Joueur | Mobile | 1080x2340 | 03:43 | aucun | 14.3 Mo |
| `ProDay-Parent-Desktop-Silent.mp4` | Parent | Desktop | 1920x1080 | 01:58 | aucun | 2.4 Mo |
| `ProDay-Parent-Mobile-Silent.mp4` | Parent | Mobile | 1080x2340 | 02:09 | aucun | 7.6 Mo |

- **Couverture et horodatages** : `COUVERTURE-SILENCIEUX.md` (checklist de pages par enregistrement,
  confrontation à l’inventaire de navigation, limites connues).
- **Contrôles techniques** : `VERIFICATION.md` (pistes audio/vidéo, décodage intégral, chapitres,
  plus long plan fixe).

## Méthode de montage

La capture n’est pas une vidéo : c’est un relevé d’images envoyées quand l’écran change. Le montage
transforme ce relevé en vidéo continue, sans jamais modifier ce qui est affiché :

1. chaque écran est représenté par une image **stabilisée** (jamais une image prise en pleine transition) ;
2. un écran inchangé n’est jamais tenu plus de **13 s** — les gels de capture ne deviennent pas des
   minutes d’image fixe, alors que les pauses de lecture voulues sont conservées ;
3. le **prologue de connexion** (sélection d’univers, porte « Espace », formulaire) est retiré : la visite
   commence sur le premier écran réel, chargé, et aucun identifiant n’apparaît ;
4. encodage `libx264` crf 15, preset `slow`, paramètres orientés texte, réduction Lanczos.

Rendu : **simulation de navigateur** (Chrome piloté en CDP), aucun appareil physique. Les enregistrements
« Mobile » sont la mise en page mobile réelle, rendue et pilotée séparément — jamais un recadrage du desktop.
Comptes de démonstration isolés (club `FC ProDay Démo`) ; aucun mot de passe visible, aucune donnée réelle.

Régénération : `bash scripts/walkthrough/run-silent.sh` (captures standard) ou
`bash scripts/walkthrough/run-coach-hq.sh` (pôle Coach, capture suréchantillonnée), puis
`node scripts/walkthrough/verify-silent.mjs && node scripts/walkthrough/make-silent-report.mjs`.

Les captures HQ du pôle Coach (`record.mjs` en densité 2/3 avec images nettes toutes les 2 s)
sont montées par le même `assemble-silent.mjs` ; le rapport lit automatiquement les dossiers
`coach-*-hq` quand leur manifeste existe.
