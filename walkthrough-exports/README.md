# ProDay — enregistrements vidéo (walkthroughs)

Application : **ProDay 1.0.10** — build web local (http://localhost:8081), Chrome piloté en CDP.
Périmètre : pôles **Club, Coach, Joueur, Parent**. L'espace **Admin plateforme est exclu** (hors demande).

Chaque pôle dispose de **deux enregistrements indépendants** : la mise en page desktop (1920 × 1080, paysage)
et la mise en page mobile (390 × 844 simulé, portrait), rendues et pilotées séparément —
aucune vidéo mobile n’est un recadrage du desktop.

## Fichiers livrés

| Fichier | Pôle | Interface | Viewport | Durée | Chapitres | Format / audio | Taille |
|---------|------|-----------|----------|-------|-----------|----------------|--------|
| `ProDay-Club-Desktop.mp4` | Club | Desktop (paysage) | 1920x1080 | 04:23 | 25 | H.264 + AAC | 8.3 Mo |
| `ProDay-Club-Mobile.mp4` | Club | Mobile (portrait) | 1080x2340 | 09:51 | 27 | H.264 + AAC | 35.3 Mo |
| `ProDay-Coach-Desktop.mp4` | Coach | Desktop (paysage) | 1920x1080 | 07:36 | 20 | H.264 + AAC | 12.7 Mo |
| `ProDay-Coach-Mobile.mp4` | Coach | Mobile (portrait) | 1080x2340 | 05:49 | 18 | H.264 + AAC | 19.6 Mo |
| `ProDay-Player-Desktop.mp4` | Joueur | Desktop (paysage) | 1920x1080 | 05:02 | 14 | H.264 + AAC | 5.9 Mo |
| `ProDay-Player-Mobile.mp4` | Joueur | Mobile (portrait) | 1080x2340 | 06:48 | 17 | H.264 + AAC | 15.6 Mo |
| `ProDay-Parent-Desktop.mp4` | Parent | Desktop (paysage) | 1920x1080 | 03:07 | 13 | H.264 + AAC | 3.7 Mo |
| `ProDay-Parent-Mobile.mp4` | Parent | Mobile (portrait) | 1080x2340 | 04:05 | 13 | H.264 + AAC | 9.5 Mo |

Chaque vidéo est accompagnée d’une fiche `ProDay-<Pôle>-<Interface>.md` : chapitres horodatés,
contenu expliqué, écran affiché, limites et transcript intégral de la narration —
et de sous-titres externes `ProDay-<Pôle>-<Interface>.srt` (les sous-titres sont aussi incrustés dans l’image).
Le détail complet (par chapitre et par étape) figure dans `COUVERTURE.md`.

## Ce que chaque vidéo contient

| Livrable | Contenu |
|----------|---------|
| `ProDay-Club-Desktop.mp4` | Sidebar complète du pôle Club : accueil (carte club, recherche globale, prochain rendez-vous), équipes, joueurs, coachs, demandes d’adhésion, calendrier, matchs, entraînements, événements, classements FFF, vidéo & analyse, communication, covoiturage, copilote IA, notifications, identité, pack club, licences, finances, sponsoring, permissions, puis bascule Pôle Président. |
| `ProDay-Club-Mobile.mp4` | Dock bas + hub « Tout ProDay » : accueil, bouton CRÉER, calendrier, équipes, matchs & live, événements, classements, vidéo & analyse (dont lecture **en paysage**), effectif & licences, staff & coachs, communication, finances, entraînements, covoiturage, documents & licences, sponsoring, rôles & permissions, identité, notifications, copilote, Pôle Président, retour accueil. |
| `ProDay-Coach-Desktop.mp4` | Cockpit entraîneur : briefing et priorités du banc, calendrier, équipe, composition et tactique, entraînements, assistant coach IA, chat copilote, vidéos, forme, gestion, messagerie, covoiturage, coaching personnalisé. |
| `ProDay-Coach-Mobile.mp4` | Même parcours en portrait, avec tableau tactique **en paysage** (rotation du support). |
| `ProDay-Player-Desktop.mp4` | Espace joueur desktop : rail latéral (accueil, calendrier, ma carte, menu), puis parcours par le hub « Tout ProDay » — saison et progression, équipe et mercato, vestiaire et messagerie, covoiturage, compte et paramètres, coach IA. Les modules **Clips** et **Boutique** y sont montrés tels quels : annoncés « Bientôt », sans contenu. |
| `ProDay-Player-Mobile.mp4` | Dock joueur : accueil, question de la semaine, calendrier, équipe, hub, saison, progression, vestiaire, clips (**paysage**), boutique, coach IA, trajet, compte — modules « Bientôt » inclus. |
| `ProDay-Parent-Desktop.mp4` | Espace parent en paysage : synthèse enfants, guide (suggestions, alertes, rôle), messages, agenda, trajets, profil. |
| `ProDay-Parent-Mobile.mp4` | Même parcours en portrait, avec écran trajet **en paysage**. |

## Méthode

1. **Inventaire** des routes et modules par pôle (`scripts/walkthrough/INVENTORY.md`).
2. **Connexion** avec des comptes de démonstration isolés (club `FC ProDay Démo`, aucun membre réel).
   Le mot de passe est saisi avant le début de la capture : il n’apparaît dans aucune vidéo.
3. **Scénario écrit** par pôle et par interface (`scripts/walkthrough/configs/*.json`) : chaque étape
   est jouée par de vrais événements souris/clavier, avec attente du rendu réel avant la narration.
4. **Capture** : Chrome en CDP, frames horodatées (screencast) + instantané d’accessibilité par étape.
5. **Assemblage** : vidéo muette à fps fixe, narration française (voix système), sous-titres incrustés
   et chapitres intégrés au conteneur MP4.
6. **Revue** : contrôle des légendes, de la couverture, des données sensibles, puis correction et ré-export.

## Reproduction

```bash
# 1. Application locale (web)
npm run web                    # http://localhost:8081

# 2. Comptes et données de démonstration
npm run seed:demo-player       # joueur
npm run seed:demo-club         # club / coach / parent

# 3. Capture pôle + interface (exemple)
node scripts/walkthrough/record.mjs scripts/walkthrough/configs/club-desktop.json
node scripts/walkthrough/record.mjs scripts/walkthrough/configs/club-mobile.json

# 4. Assemblage de la vidéo finale
bash scripts/walkthrough/assemble-all.sh

# 5. Index et couverture
node scripts/walkthrough/make-coverage.mjs && node scripts/walkthrough/make-index.mjs
```

## Limites connues

- **Simulation de navigateur** : les vidéos « Mobile » sont la mise en page responsive réelle
  (390 × 844, densité 3, tactile émulé), pas un appareil physique.
- **Aucune donnée réelle** : club de démonstration uniquement ; finances, adhésions et sorties IA
  sont des données de test, présentées comme telles (`démonstration`).
- Les écrans dépendant d’un club réellement affilié (licences FFF, classements officiels) peuvent
  afficher des états vides : ils sont conservés plutôt que masqués.
- Les points de blocage rencontrés pendant la production (étapes sans cible, rechargements
  automatiques de session) sont documentés dans chaque fiche et dans `COUVERTURE.md`.
- `App.tsx` a reçu une correction de mise en page (`screenDesktop.alignSelf`) sans laquelle la
  zone de contenu du pôle Joueur s’effondrait en hauteur nulle au-delà de ~900 px de large :
  la vidéo Joueur desktop n’était pas exploitable avant cette correction.
- **Modules annoncés « Bientôt »** : dans l'espace joueur, **Clips** et **Boutique** figurent dans le hub
  mais n’ouvrent aucun contenu (aucun clip, aucun article livré). Ils sont montrés et expliqués comme
  non disponibles, sans substitut simulé.
- Navigation mobile du pôle Club : les modules s’atteignent par le hub « Tout ProDay » ; les transitions
  d’écran prennent 3 à 6 secondes en mode développement, ce qui allonge les séquences (aucune coupe
  n’est faite entre deux modules).
