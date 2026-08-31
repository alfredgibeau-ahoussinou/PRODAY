# Tests End-to-End & Intégration (`e2e/`)

> Suites de tests End-to-End (E2E) Jest et scénarios mobiles Maestro pour l'application ProDay (Version 1.0.9).

---

## 🧪 1. Tests E2E Automatisés (Jest)

Les tests E2E Jest simulent les parcours complets des utilisateurs sans nécessiter de simulateur lourd :

```bash
# Lancer les tests E2E spécifiques
npm run test:e2e

# Lancer la suite complète de 264 suites de tests
npm test
```

### Parcours testés :
- **`sponsorNavigation.e2e.test.ts`** : Navigation du Pôle Sponsor, simulateur de packs et segmentation.
- **`sponsorProspectFlow.e2e.test.ts`** : Scoring des entreprises locales et premier contact.
- **`adminWorkNavigation.test.ts`** : File d'attente prioritaire et outils d'administration VIP.

---

## 📱 2. Tests sur Appareil & Simulateur (Maestro)

Les scénarios Maestro sont situés dans le dossier [`.maestro/`](../.maestro/) et testent les interactions graphiques réelles sur iOS et Android :

```bash
# Lancer tous les flux Maestro
npm run test:e2e:maestro

# Tester le parcours des Reels vidéo
npm run test:e2e:maestro:reels
```
