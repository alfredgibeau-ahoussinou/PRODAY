# Maestro (`.maestro/`)

**CONNECTER. PROGRESSER. RÉVÉLER.** — scénarios UI ProDay **1.0.9** (`com.proday.app`).

Flows YAML pour simulateur ou appareil. **Hors CI** — validation manuelle / pré-release.

## Scénarios

| Fichier | Objectif |
|---------|----------|
| `reels-smoke.yaml` | Reels : empty state + sheet publication |
| `reels-publish.yaml` | Login joueur → vidéo démo → publish |
| `sponsor-tabs.yaml` | Connexion sponsor → navigation shell |
| `sponsor-prospect-smoke.yaml` | Smoke segment Prospects |
| `admin-gate.yaml` | Connexion admin → gate / console |
| `supporter-screenshot.yaml` | Capture supporter (marketing) |
| `subflows/` | Sous-flows login réutilisables |

## Lancer

```bash
export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=1

# Smoke reels
maestro test .maestro/reels-smoke.yaml

# Suite npm
npm run test:e2e:maestro
npm run test:e2e:maestro:reels
```

Publish (identifiants **uniquement en variables d’environnement**, jamais commités) :

```bash
export MAESTRO_PLAYER_EMAIL=…
export MAESTRO_PLAYER_PASSWORD=…
maestro test .maestro/reels-publish.yaml
# ou : npm run test:e2e:maestro:reels-publish
```

Prérequis : app native Dev Client (`npm run ios` / `npm run ios:sim`), Maestro CLI.  
`reels-publish` attend le bouton « Vidéo démo E2E » (`__DEV__`).

## Liens

- Guide E2E : [`../e2e/README.md`](../e2e/README.md)
- App : [`../src/README.md`](../src/README.md)
- [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [proday75.fr](https://proday75.fr) · [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)
