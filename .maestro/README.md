# Flows Maestro (`.maestro/`)

> Scénarios E2E UI sur simulateur ou appareil réel. **Non exécutés en CI** (pas d'émulateur dans le pipeline).

## Contenu

| Fichier | Scénario |
|---------|----------|
| `reels-smoke.yaml` | Onglet Reels + état vide + sheet publication |
| `reels-publish.yaml` | Login joueur → vidéo démo → publish → alerte succès |
| `sponsor-tabs.yaml` | Connexion sponsor → navigation shell |
| `admin-gate.yaml` | Connexion admin → gate ou console |
| `sponsor-prospect-smoke.yaml` | Smoke segment Prospects |
| `subflows/` | Sous-flows login réutilisables |

## Lancer

```bash
export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=1

# Smoke Reels (session déjà ouverte)
maestro test .maestro/reels-smoke.yaml

# Publish complet (compte joueur)
export MAESTRO_PLAYER_EMAIL=alfredgibeauahoussinou@gmail.com
export MAESTRO_PLAYER_PASSWORD='votre-mot-de-passe'
maestro test .maestro/reels-publish.yaml

# Suite
npm run test:e2e:maestro
```

Prérequis : build natif Dev Client (`npm run ios`), Maestro CLI, comptes test.
`reels-publish` exige `__DEV__` (bouton « Vidéo démo E2E »).

## Guide complet

→ [../e2e/README.md](../e2e/README.md) (variables d'env, testID, dépannage)
