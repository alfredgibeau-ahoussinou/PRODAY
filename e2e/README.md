# Tests E2E

ProDay combine des scénarios **E2E-adjacents** (Jest, sans device) et des flows **Maestro** (simulateur ou appareil réel).

## Jest (sans device)

```bash
# Suite E2E-adjacente uniquement
npm run test:e2e

# Avec la suite Jest complète
npm test
```

### Couverture actuelle

| Fichier | Parcours |
|---------|----------|
| `sponsorNavigation.e2e.test.ts` | Onglets shell sponsor, segments réseau |
| `adminNavigation.e2e.test.ts` | Onglets console admin, segments modération / plateforme |
| `sponsorProspectFlow.e2e.test.ts` | Scoring prospect + brouillon message |

Tests unitaires liés : `sponsorGeoPush.test.ts`, `sponsorProspectScoring.test.ts`, `openSponsorProspectChat.test.ts`.

---

## Maestro (device / simulateur)

Les flows Maestro vivent dans `.maestro/`. Ils ne tournent **pas en CI** (pas d’émulateur dans le pipeline) : à lancer en local sur simulateur iOS, émulateur Android ou appareil branché.

### Prérequis

1. **Maestro CLI** — [Installation](https://maestro.mobile.dev/getting-started/installing-maestro) :
   ```bash
   curl -Ls "https://get.maestro.mobile.dev" | bash
   ```
2. **Build natif** de l’app (`com.proday.app`) :
   ```bash
   npm run ios        # simulateur iOS
   npm run android    # émulateur Android
   ```
   Expo Go ne suffit pas : Maestro cible le bundle id `com.proday.app`.
3. **Comptes de test** (mots de passe hors repo) :
   | Usage | Email par défaut | Script setup |
   |-------|------------------|--------------|
   | Joueur (Reels) | `alfredgibeauahoussinou@gmail.com` | `npm run test-account:setup` |
   | Shell sponsor | `part@gmail.com` | `npm run partner-account:setup` |
   | Console admin | `proday.admin@gmail.com` | `npm run admin:setup` |

### Variables d’environnement

| Variable | Description |
|----------|-------------|
| `MAESTRO_PLAYER_EMAIL` | Compte joueur (Reels publish) |
| `MAESTRO_PLAYER_PASSWORD` | Mot de passe joueur |
| `MAESTRO_SPONSOR_EMAIL` | Compte partenaire / sponsor |
| `MAESTRO_SPONSOR_PASSWORD` | Mot de passe sponsor |
| `MAESTRO_ADMIN_EMAIL` | Compte admin plateforme |
| `MAESTRO_ADMIN_PASSWORD` | Mot de passe admin |

Exemple :

```bash
export MAESTRO_PLAYER_EMAIL=alfredgibeauahoussinou@gmail.com
export MAESTRO_PLAYER_PASSWORD='votre-mot-de-passe'
export MAESTRO_SPONSOR_EMAIL=part@gmail.com
export MAESTRO_SPONSOR_PASSWORD='votre-mot-de-passe'
export MAESTRO_ADMIN_EMAIL=proday.admin@gmail.com
export MAESTRO_ADMIN_PASSWORD='votre-mot-de-passe-admin'

npm run test:e2e:maestro
```

Ou un flow isolé :

```bash
maestro test .maestro/reels-publish.yaml
maestro test .maestro/sponsor-tabs.yaml
```

### Flows disponibles

| Fichier | Scénario |
|---------|----------|
| `reels-smoke.yaml` | Onglet Reels → empty state → sheet publication |
| `reels-publish.yaml` | Login joueur → vidéo démo bundle → publish → « Reel publié » |
| `sponsor-tabs.yaml` | Connexion sponsor → menu latéral → pilotage / offres / réseau |
| `admin-gate.yaml` | Connexion admin → smoke gate **ou** accueil console si claim actif |
| `sponsor-prospect-smoke.yaml` | (Optionnel) Segment Prospects dans Réseau |
| `subflows/player-login.yaml` | Sous-flow connexion joueur |
| `subflows/sponsor-login.yaml` | Sous-flow connexion sponsor (réutilisé) |
| `subflows/admin-login.yaml` | Sous-flow connexion admin (réutilisé) |

### testID utilisés

| testID | Composant |
|--------|-----------|
| `reels-empty-publish` | CTA empty state Reels |
| `reels-upload-open` | FAB + ouvrir sheet publish |
| `reels-upload-pick-video` | Choisir une vidéo (Photos) |
| `reels-upload-demo-video` | Vidéo démo bundle (`__DEV__` only) |
| `reels-upload-caption` | Champ légende |
| `reels-upload-theme-{id}` | Chip thème (`skills`, …) |
| `reels-upload-submit` | Bouton publier |
| `main-tab-{id}` | Onglet barre basse (`reels`, `home`, …) |
| `sponsor-top-bar` | Barre supérieure shell sponsor |
| `sponsor-menu-button` | Bouton menu hamburger |
| `sponsor-drawer` | Panneau menu latéral |
| `sponsor-drawer-{id}` | Entrées menu (`pilotage`, `offres`, `messages`, `prospects`, …) |
| `sponsor-network-segment-messages` | Segment Messages (réseau) |
| `sponsor-network-segment-prospects` | Segment Prospects |
| `admin-gate` | Écran gate admin |
| `admin-gate-refresh` | Bouton « Rafraîchir le token » |

### Notes admin (gate)

- **Avec claim admin** (`npm run admin:setup`) : après connexion, l’app affiche la console (`Accueil` pilotage). Le flow `admin-gate.yaml` valide cet état.
- **Sans claim** : `AdminGateScreen` affiche « Accès refusé » et « Droits administrateur requis ». Ce cas n’est atteignable que si l’app route l’email plateforme vers `AdminAppShell` sans claim ; le flow documente l’assertion gate pour quand ce routage est actif.
- Déconnectez-vous entre un test sponsor et un test admin si la session persiste.

### Dépannage

- **« Se connecter » introuvable** : ouvrez l’onglet Profil (invité) ou déconnectez-vous depuis le profil joueur.
- **Timeout sur `sponsor-top-bar`** : vérifiez le rôle `sponsor` du compte (`partner-account:setup`) et l’univers Pro (ligne produit partenaire).
- **Maestro introuvable** : ajoutez `~/.maestro/bin` au `PATH` après installation.
