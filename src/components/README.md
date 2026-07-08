# Composants UI (`src/components/`)

> Composants React réutilisables, regroupés par **domaine produit**. Pas de logique Firebase directe — passer par `services/` ou `hooks/`.

## Domaines principaux

| Dossier | Domaine |
|---------|---------|
| `ui/` | Primitives (boutons, cartes, inputs) |
| `motion/` | Animations (`PressableSpring`…) |
| `navigation/` | Barres, onglets, headers |
| `auth/` · `signup/` | Connexion, inscription |
| `profile/` | Profil joueur / staff |
| `mercato/` | Recrutement, annonces |
| `matchs/` | Matchs amicaux, stats live |
| `feed/` · `reels/` | Fil social, reels |
| `carpool/` | Covoiturage |
| `health/` · `medical/` | Santé, dossier médical |
| `messages/` | Messagerie |
| `shop/` · `subscription/` | Boutique, abonnements |
| `sponsor/` · `supporter/` | Shells partenaire / supporter |
| `team/` | Événements équipe, compo |
| `discover/` | Cartes découverte |
| `dashboard/` · `home/` | Accueil legacy |
| `v3/` | Shell et blocs V3 |
| `admin/` | UI console admin |
| `settings/` · `help/` | Réglages, aide |

## Conventions

- Préférer `components/ui/` pour le générique ; dossier métier pour le spécifique
- Thème univers : `src/theme/` + `context/`
- Tests : colocaliser ou `src/__tests__/`

## Liens

- [screens/README.md](../screens/README.md) — écrans qui composent ces blocs
- [../theme/](../theme/) — tokens Homme / Woman / Pro
