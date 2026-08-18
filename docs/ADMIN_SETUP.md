# Console Admin ProDay — Centre de contrôle

## Modèle

L'interface admin est le **centre de contrôle ProDay** — thème clair premium, sidebar rétractable
avec groupes **Principal** + **Administration**, navigation par sections fonctionnelles uniquement
(pas de boutons fictifs ni de stubs).

Registre : `src/navigation/adminNavConfig.ts` · RBAC : `src/utils/adminPermissions.ts`

### Sections menu (21 entrées fonctionnelles)

| Groupe | Sections |
|--------|----------|
| **Principal** | Accueil, Utilisateurs, Clubs, Coachs, Joueurs, Parents, Équipes, Matchs & Événements, Recrutement, Vidéo, Abonnements, Marketplace, Sponsors, Contenus, Messagerie, Signalements, Statistiques, Paramètres |
| **Administration** | Journal d'activité, Sécurité, Configuration plateforme |

**Reportées** (pas d'écran/service dédié) : IA ProDay, Notifications push admin, Gestion admins, Rôles & permissions UI.

### Thème et layout

- Thème clair dynamique (`buildAdminChrome`) — couleur, accent terrain, radius
- **Desktop** (≥ 768 px) : sidebar + TopBar + contenu
- **Mobile** : TopBar + menu overlay plein écran
- Sidebar : 260 px / 72 px réduite

### Personnalisation

Écran **Paramètres → Personnaliser** : couleurs, radius, densité, sections visibles, ordre des blocs dashboard.
Persistance AsyncStorage `proday_admin_prefs_v3:{uid}`.

### RBAC

Rôles : `super_admin`, `admin`, `moderateur`, `admin_finance`, `admin_clubs`.
Emails `PLATFORM_ADMIN_EMAILS` → super_admin. Gate sidebar via `canAccessSection`.

## Auth

- Claim Firebase `admin: true`
- Setup : `npm run admin:setup` puis reconnexion app

## Sécurité

- Messagerie admin : modération/signalements uniquement (`AdminMessagesPanel`)
- Protection mineurs : fiche joueur (`AdminFocAccountEditor`)
