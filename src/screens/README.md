# Écrans (`src/screens/`)

Un fichier ≈ un écran navigation. Orchestration composants + services ; logique lourde → `core/` ou `services/`.

App : ProDay **1.0.8** · **CONNECTER. PROGRESSER. RÉVÉLER.**

## Organisation

| Sous-dossier | Rôle |
|--------------|------|
| *(racine)* | Mercato, Matchs, Santé, Feed, Messages, Profil, Auth… |
| `admin/` | Console admin (modération, stats, bêta) |
| `club/` | Hub club, annonces, structure |
| `discover/` | Découverte joueurs / clubs |
| `medical/` | Dossier médical |
| `men/` | Parcours univers Homme |
| `proPlayer/` | Parcours joueur Pro |
| `signup/` | Inscription multi-étapes |
| `sponsor/` | Shell partenaire / sponsor |
| `supporter/` | Parcours supporter |

## Conventions

- Nommage : `*Screen.tsx`
- Navigation déclarée dans `src/navigation/`
- Textes longs → `src/content/` ; Firebase → `src/services/`
- Typo titres UI : Inter via `ProDayText` (Syne réservé à `brand`)

## Liens

- [../README.md](../README.md)
- [navigation/README.md](../navigation/README.md)
- [components/README.md](../components/README.md)
- [../STRUCTURE.md](../STRUCTURE.md)
