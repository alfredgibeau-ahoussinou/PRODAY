# Navigation (`src/navigation/`)

> Définition des onglets, stacks et shells (joueur, sponsor, admin).

## Contenu

| Élément | Rôle |
|---------|------|
| Fichiers racine | `MainTabs`, résolveurs d'écrans, deep links |
| `shells/` | Shells dédiés : `V3TabShell`, sponsor, admin, supporter |

## Shells

- **Joueur** : onglets Accueil, Covoiturage, Mercato, Matchs, Santé, Feed, Messages, Profil
- **Sponsor** : menu latéral (pilotage, offres, réseau…)
- **Admin** : console plateforme (`screens/admin/`)
- **V3** : `EXPO_PUBLIC_V3_SHELL=1` → `V3TabShell`

## Conventions

- Les écrans sont importés depuis `src/screens/`
- Pas de logique métier ici — uniquement routing et layout

## Liens

- [screens/README.md](../screens/README.md)
- [../STRUCTURE.md](../STRUCTURE.md)
