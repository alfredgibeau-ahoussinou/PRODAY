# Application Mobile ProDay (`src/`)

> Code source React Native / Expo (SDK 54) de l'application ProDay — Version **1.0.9** (Build iOS 19 / VersionCode Android 11).

---

## 📌 Informations Techniques

| Propriété | Valeur |
| :--- | :--- |
| **Version** | `1.0.9` (`app.json` & `package.json`) |
| **iOS** | Build **19** (TestFlight / App Store Connect `6801583755`) |
| **Android** | `versionCode` **11** (APK distribué sur `proday75.fr/downloads/proday-beta.apk`) |
| **Bundle ID** | `com.proday.app` |
| **Technologies** | Expo SDK 54 · React Native 0.81.5 · React 19 · TypeScript 5.9 · Reanimated 3 |

---

## 🏗️ Architecture du Dossier `src/`

```
src/
├── features/             Fonctionnalités avancées & centre de commande
│   └── admin/            Espace Admin personnalisé (Outils rapides VIP, Health, WorkQueue)
├── screens/              Écrans des 6 pôles métier (Joueur, Coach, Club, Sponsor, Famille, Supporter)
├── components/           Composants d'interface (Cartes, Badges, Modales, Vidéos)
├── navigation/           Gestionnaires de navigation par pôle et shells de rôle
├── services/             Services Firestore, Cloud Functions, Moteur IA Gemini et Stripe
├── context/              Contextes React globaux (Auth, Mode, AdminDataContext)
├── theme/                Tokens de design (`#07100c`, `#F5D04A`, `#C5A059`)
├── models/               Types TypeScript et modèles de données métier
├── utils/                Utilitaires d'insights, calculs de score et filtres
└── __tests__/            264 suites de tests unitaires (1 386 tests passés)
```

---

## ⚡ Commandes de Développement

```bash
# Démarrer le bundler Metro
npm start

# Lancer sur simulateur iOS
npm run start:ios

# Lancer sur émulateur Android
npm run android

# Lancer les tests unitaires et le typecheck
npm run typecheck
npm test
```
