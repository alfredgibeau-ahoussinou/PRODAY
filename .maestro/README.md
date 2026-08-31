# Flows Maestro (`.maestro/`)

Scénarios E2E UI sur simulateur ou appareil. **Non exécutés en CI.**

App cible : ProDay **1.0.8** (`com.proday.app`).

## Contenu

| Fichier | Scénario |
|---------|----------|
| `reels-smoke.yaml` | Reels + empty state + sheet publication |
| `reels-publish.yaml` | Login joueur → vidéo démo → publish |
| `sponsor-tabs.yaml` | Connexion sponsor → navigation shell |
| `admin-gate.yaml` | Connexion admin → gate ou console |
| `sponsor-prospect-smoke.yaml` | Smoke segment Prospects |
| `subflows/` | Sous-flows login réutilisables |

## Lancer

```bash
export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=1

maestro test .maestro/reels-smoke.yaml

# Publish (compte joueur — mots de passe hors repo)
export MAESTRO_PLAYER_EMAIL=…
export MAESTRO_PLAYER_PASSWORD=…
maestro test .maestro/reels-publish.yaml

npm run test:e2e:maestro
```

Prérequis : Dev Client natif (`npm run ios`), Maestro CLI, comptes test.  
`reels-publish` exige `__DEV__` (bouton « Vidéo démo E2E »).

## Guide complet

→ [../e2e/README.md](../e2e/README.md)

## Liens

- [../src/README.md](../src/README.md)
- [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [proday75.fr](https://proday75.fr)
