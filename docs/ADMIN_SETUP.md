# Console Admin ProDay — Football Operations Center

## Modèle

L'interface admin est le **Football Operations Center (FOC)** — thème clair, sidebar rétractable,
navigation par sections et feuilles. Les 5 modes HQ (`pilotage`, `decisions`, `gestion`,
`abonnements`, `systeme`) sont conservés comme bridge interne.

### Sections FOC (sidebar)

| Section | Contenu |
|---------|---------|
| **Tableau de bord** | Vue d'ensemble de la plateforme |
| **Adhérents** | Joueurs, parents, coachs, éducateurs, dirigeants |
| **Clubs & équipes** | Clubs, équipes, effectifs, saisons |
| **Matchs** | Calendrier, résultats, invitations, feuilles de match |
| **Compétitions** | Événements, tournois, plateaux, organisation, live |
| **Recrutement** | Bassin, détections, mobilité, essais |
| **Performance** | Stats, vidéo, analyse, entraînements, progression |
| **Communication** | Notifications, messages, annonces |
| **Finances** | Abonnements, paiements, revenus, commissions, sponsors |
| **Caméras & vidéo** | Caméras, matchs filmés, vidéos |
| **Paramètres** | Personnaliser l'espace, système plateforme |

### Thème et layout

- **Thème clair** (`adminChrome.shell = #FFFFFF`) — `StatusBar style="dark"`
- **Desktop** (≥ 900 px) : sidebar rétractable + colonne TopBar + contenu
- **Mobile** : TopBar avec bouton menu → sidebar en overlay modal
- Sidebar largeur : 268 px développée, 72 px réduite (`ADMIN_FOC_SIDEBAR_WIDTH/COLLAPSED`)

### Personnalisation (`param_personnaliser`)

L'écran **Personnaliser mon espace** permet :
- Couleur principale (presets : ProDay `#006CFC`, Terrain, Nuit, Ambre, Rouge)
- Accent terrain (verts pelouse)
- Nom d'affichage dans la sidebar
- Densité : Confortable / Compact
- Masquer / afficher des sections de la sidebar
- Réordonner les blocs du tableau de bord (Monter / Descendre)

Préférences persistées en AsyncStorage (`proday_admin_foc_prefs_v1:{uid}`)
via `loadAdminFocPreferences` / `saveAdminFocPreferences` (`src/services/adminPreferences.service.ts`).

## Abonnements

Depuis **Finances → Abonnements** (ou directement depuis Gestion → compte → Gérer l'abonnement) :

- Voir l'état effectif **Gratuit** / **Payant**
- Catalogue des formules (inclus gratuit vs payant)
- Passer en payant / offrir un essai / prolonger / changer de formule
- Résilier en fin de période ou couper immédiatement
- Historique des achats (store + cadeaux admin)

Les écritures vont sur `users/{uid}` (`subscription_*`) + journal d'audit.

## Auth

- Droit Firebase `admin: true`
- Liste d'e-mails autorisés → écran d'accès seulement
- Site `/admin` = code fondateur (bêta / trafic), surface séparée

## Setup

```bash
ADMIN_SETUP_EMAIL=proday.admin@gmail.com
ADMIN_SETUP_PASSWORD=…
npm run admin:setup
```

Puis reconnecte-toi dans l'app pour recharger le jeton.

```bash
firebase deploy --only firestore:rules,storage,functions
```

## Sécurité

`request.auth.token.admin == true` sur Firestore / Storage / Functions.
