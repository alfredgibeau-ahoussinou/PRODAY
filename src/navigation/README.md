# Navigation (`src/navigation/`)

Onglets, stacks et shells de rôle — ProDay **1.0.8**.

## Contenu

| Élément | Rôle |
|---------|------|
| Fichiers racine | `MainTabs`, résolveurs d’écrans, deep links |
| `shells/` | Shells : joueur, coach, club, parent, sponsor, admin, président, supporter |

## Shells

- **Joueur** : Accueil, Covoiturage, Mercato, Matchs, Santé, Feed / Reels, Messages, Profil (univers âge × genre)
- **Coach / Club / Parent / Président** : hubs + chapter pagers (chrome dédié, pas le HUD joueur)
- **Sponsor** : menu latéral (pilotage, offres, réseau…)
- **Admin** : console plateforme (`screens/admin/`)
- **V3** : `EXPO_PUBLIC_V3_SHELL=1` → `V3TabShell`

## Conventions

- Écrans importés depuis `src/screens/`
- Pas de logique métier ici — routing et layout uniquement
- Hauteur des pagers horizontaux : mesurer et passer à `PagerPage` (`flex: 1` ne donne pas de hauteur dans un `ScrollView` horizontal)

## Liens

- [../README.md](../README.md) — lancer l’app / EAS
- [screens/README.md](../screens/README.md)
- [../STRUCTURE.md](../STRUCTURE.md)
