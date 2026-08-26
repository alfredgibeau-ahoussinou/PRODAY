# Tests E2E (app Expo)

ProDay **1.0.8** combine des scénarios **E2E-adjacents** (Jest, sans device) et des flows **Maestro** (simulateur / appareil).

## Jest (sans device)

```bash
npm run test:e2e   # Suite E2E-adjacente
npm test           # Suite Jest complète
```

| Fichier | Parcours |
|---------|----------|
| `sponsorNavigation.e2e.test.ts` | Onglets shell sponsor, segments réseau |
| `adminNavigation.e2e.test.ts` | Onglets console admin |
| `sponsorProspectFlow.e2e.test.ts` | Scoring prospect + brouillon message |

## Maestro (device / simulateur)

Flows dans [`.maestro/`](../.maestro/) — **pas en CI**. Guide court : [../.maestro/README.md](../.maestro/README.md).

### Prérequis

1. Maestro CLI : https://maestro.mobile.dev/getting-started/installing-maestro
2. Build natif `com.proday.app` (`npm run ios` / `npm run android`) — Expo Go insuffisant
3. Comptes de test via scripts (`test-account:setup`, `partner-account:setup`, `admin:setup`) — **mots de passe hors repo**

### Variables d’environnement

| Variable | Description |
|----------|-------------|
| `MAESTRO_PLAYER_EMAIL` / `MAESTRO_PLAYER_PASSWORD` | Compte joueur (Reels) |
| `MAESTRO_SPONSOR_EMAIL` / `MAESTRO_SPONSOR_PASSWORD` | Compte partenaire |
| `MAESTRO_ADMIN_EMAIL` / `MAESTRO_ADMIN_PASSWORD` | Compte admin |

```bash
export MAESTRO_PLAYER_EMAIL=…
export MAESTRO_PLAYER_PASSWORD=…
npm run test:e2e:maestro
```

### Flows

| Fichier | Scénario |
|---------|----------|
| `reels-smoke.yaml` | Reels → empty state → sheet publication |
| `reels-publish.yaml` | Login joueur → vidéo démo → publish |
| `sponsor-tabs.yaml` | Shell sponsor |
| `admin-gate.yaml` | Gate / console admin |
| `sponsor-prospect-smoke.yaml` | Segment Prospects |
| `subflows/*-login.yaml` | Sous-flows login |

### testID utiles

`reels-empty-publish`, `reels-upload-*`, `main-tab-{id}`, `sponsor-top-bar`, `sponsor-drawer-{id}`, `admin-gate`, `admin-gate-refresh`.

## Liens

- [../src/README.md](../src/README.md) — lancer / EAS / build 17
- [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [proday75.fr](https://proday75.fr)
