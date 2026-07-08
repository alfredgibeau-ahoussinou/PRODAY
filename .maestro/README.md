# Flows Maestro (`.maestro/`)

> Scénarios E2E UI sur simulateur ou appareil réel. **Non exécutés en CI** (pas d'émulateur dans le pipeline).

## Contenu

| Fichier | Scénario |
|---------|----------|
| `sponsor-tabs.yaml` | Connexion sponsor → navigation shell |
| `admin-gate.yaml` | Connexion admin → gate ou console |
| `sponsor-prospect-smoke.yaml` | Smoke segment Prospects |
| `subflows/` | Sous-flows login réutilisables |

## Lancer

```bash
npm run test:e2e:maestro
# ou
maestro test .maestro/sponsor-tabs.yaml
```

Prérequis : build natif (`npm run ios` / `android`), Maestro CLI, comptes test.

## Guide complet

→ [../e2e/README.md](../e2e/README.md) (variables d'env, testID, dépannage)
