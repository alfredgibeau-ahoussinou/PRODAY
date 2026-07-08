# Écrans (`src/screens/`)

> Un fichier ≈ un écran navigation. Les écrans orchestrent composants + services ; peu de logique métier lourde (→ `core/` ou `services/`).

## Organisation

| Sous-dossier | Rôle |
|--------------|------|
| *(racine)* | Écrans principaux : Mercato, Matchs, Santé, Feed, Messages, Profil, Auth… |
| `admin/` | Console admin plateforme (modération, stats, bêta) |
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
- Navigation déclarée dans `src/navigation/` (pas dans l'écran)
- Textes longs → `src/content/` ; appels Firebase → `src/services/`

## Liens

- [navigation/README.md](../navigation/README.md) — routing et onglets
- [components/README.md](../components/README.md) — UI réutilisée
- [../STRUCTURE.md](../STRUCTURE.md) — V3 vs legacy
