# Vérification des enregistrements muets

| Fichier | Résolution | Durée | Pistes vidéo | Pistes audio | Sous-titres | Chapitres | Plan fixe le plus long | Décodage | Taille |
|---|---|---|---|---|---|---|---|---|---|
| `ProDay-Club-Desktop-Silent.mp4` | 1920x1080 | 03:35 | 1 | **0** | 0 | 23 (repères) | 13 s | OK | 6.9 Mo |
| `ProDay-Club-Mobile-Silent.mp4` | 1080x2340 | 07:21 | 1 | **0** | 0 | 25 (repères) | 13 s | OK | 44.0 Mo |
| `ProDay-Coach-Desktop-Silent.mp4` | 1920x1080 | 05:51 | 1 | **0** | 0 | 21 (repères) | 45 s | OK | 11.6 Mo |
| `ProDay-Coach-Mobile-Silent.mp4` | 1080x2340 | 04:35 | 1 | **0** | 0 | 16 (repères) | 15 s | OK | 21.6 Mo |
| `ProDay-Parent-Desktop-Silent.mp4` | 1920x1080 | 01:58 | 1 | **0** | 0 | 13 (repères) | 13 s | OK | 2.4 Mo |
| `ProDay-Parent-Mobile-Silent.mp4` | 1080x2340 | 02:09 | 1 | **0** | 0 | 11 (repères) | 13 s | OK | 7.6 Mo |
| `ProDay-Player-Desktop-Silent.mp4` | 1920x1080 | 03:15 | 1 | **0** | 0 | 14 (repères) | 14 s | OK | 4.2 Mo |
| `ProDay-Player-Mobile-Silent.mp4` | 1080x2340 | 03:43 | 1 | **0** | 0 | 15 (repères) | 13 s | OK | 14.3 Mo |

## Contrôles

- Absence de piste audio : **conforme pour les 8 fichiers**.
- Une seule piste vidéo par fichier : conforme.
- Aucun flux de sous-titres : conforme.
- Les fichiers portent une **piste de chapitres** (métadonnées `text` issues du repérage horodaté) :
  elle n’affiche aucun texte à l’image, contrairement à des sous-titres. Aucun sous-titre n’est incrusté.
- Décodage complet sans erreur : conforme.
- Temps morts plafonnés : le plan fixe le plus long est de 45 s (plafond de montage : 13 s, marge d'arrondi comprise) — ⚠️ anomalie.
  Contrôle indépendant : échantillonnage à 1 i/s du fichier final, recherche de la plus longue suite d'images identiques.
- Images de contrôle : /tmp/proday-silent-review (4 par fichier).

Les captures proviennent d’un screencast CDP : le son n’est jamais capté, aucune piste audio n’est
produite ni ajoutée à l’encodage (`-an` explicite). Les lectures vidéo de l’application sont donc muettes
comme le reste de l’enregistrement.
