# Composants UI (`src/components/`)

Composants React réutilisables par **domaine produit**. Pas d’accès Firebase direct — passer par `services/` ou `hooks/`.

## Domaines principaux

| Dossier | Domaine |
|---------|---------|
| `ui/` | Primitives (`ProDayText`, boutons, inputs) |
| `branding/` | `ProDayLogo`, `ProDayOfficialLockup`, `ProDaySymbol` |
| `motion/` | Animations (`PressableSpring`…) |
| `navigation/` | Barres, onglets, headers |
| `auth/` · `signup/` | Connexion, inscription |
| `profile/` | Profil joueur / staff / hubs |
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

- Générique → `components/ui/` ; métier → dossier domaine
- Icônes via `Icon` (pas d’emojis device — affichage `?`)
- Thème : `src/theme/` + `context/`
- Tests : colocaliser ou `src/__tests__/`

## Liens

- [../README.md](../README.md)
- [screens/README.md](../screens/README.md)
- [../../assets/branding/README.md](../../assets/branding/README.md)
