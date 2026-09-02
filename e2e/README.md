# Tests E2E (`e2e/` + Jest / Maestro)

**CONNECTER. PROGRESSER. RÉVÉLER.** — ProDay **1.0.9**

Ce dossier documente la stratégie E2E de l’app Expo. Les suites Jest vivent sous `src/__tests__/e2e/` ; les scénarios appareil sont dans [`.maestro/`](../.maestro/).

## Jest E2E (sans simulateur)

```bash
npm run test:e2e          # src/__tests__/e2e/
npm test                  # suite Jest complète
npm run typecheck
```

Couvrent notamment la navigation sponsor, les flux prospects et des parcours admin — en mémoire, sans UI native.

## Maestro (simulateur / appareil)

Prérequis : Dev Client (`npm run ios` / `ios:sim`), [Maestro CLI](https://maestro.mobile.dev/), comptes de test **hors repo**.

```bash
export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS=1

npm run test:e2e:maestro
npm run test:e2e:maestro:reels
npm run test:e2e:maestro:reels-publish   # emails / mots de passe via env
```

Détail des YAML : [`.maestro/README.md`](../.maestro/README.md).  
**Non exécuté en CI** par défaut — usage local / release.

## Charge

```bash
npm run test:scale
```

## Liens

- App : [`../src/README.md`](../src/README.md)
- Scripts : [`../scripts/README.md`](../scripts/README.md)
- [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [proday75.fr](https://proday75.fr) · [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)

Pas de secrets dans les fichiers de test versionnés.
