# Cloud Functions Firebase (`functions/`)

> Logique serveur sécurisée TypeScript pour ProDay — Triggers Firestore, Callables, Webhooks Stripe, E-mails transactionnels et Moteur IA Gemini Flash.

---

## 🏗️ Architecture & Organisation

Région de déploiement : **`europe-west1`** (aligné avec Firestore `eur3` à Francfort/Belgique).

```
functions/
├── src/
│   ├── index.ts                      Point d'entrée central des exports Cloud Functions
│   ├── aiTrainingSession.ts          Générateur de séances d'entraînement IA (Gemini Flash & Blood Bath)
│   ├── aiAssistantChat.ts            Assistant conversationnel pour coachs et clubs
│   ├── stripeWebhooks.ts             Gestion des abonnements clubs et paiements sponsors
│   ├── sponsorGeoPush.ts             Push géolocalisé pour les offres sponsors locales
│   ├── authEmailService.ts           Envoi d'e-mails de vérification et réinitialisation de mot de passe
│   ├── appointmentNotifications.ts   Notifications de rendez-vous et visio (Cal.com / Daily.co)
│   ├── betaWaitlistEmails.ts         Gestion automatique des confirmations/validations bêta
│   └── types/                        Définitions TypeScript et interfaces de données
├── test/                             Suites de tests unitaires (Node.js test runner natif)
└── package.json                      Dépendances (Firebase Functions v2, Firebase Admin v13)
```

---

## 🤖 Moteur IA Google Gemini 1.5 Flash

L'application ProDay utilise Google Gemini 1.5 Flash pour générer des séances complètes d'entraînement et des analyses tactiques :
- **Quota & Coût** : 100% dans le tier gratuit (15 requêtes/minute, 1 500 requêtes/jour sans aucun frais).
- **Mode Blood Bath** : Génération de séances d'intensité maximale avec 5 phases structurées (Activation, Cœur technique, Duel sous pression, Finition, Récupération).
- **Sécurité** : Clé API `GEMINI_API_KEY` stockée de manière sécurisée côté serveur sans exposition aux clients mobiles.

---

## 🧪 Tests Unitaires

Exécuter la suite de tests unitaires (25 tests de validation) :

```bash
cd functions
npm test
```

---

## 🚀 Compilation & Déploiement

### 1. Compiler le code TypeScript
```bash
cd functions
npm run build
```

### 2. Déployer toutes les fonctions
```bash
# Depuis la racine du projet
npm run firebase:deploy:functions

# Ou depuis le dossier functions/
firebase deploy --only functions
```

### 3. Déployer une fonction spécifique
```bash
firebase deploy --only functions:generateTrainingSession,functions:onSponsorOfferCreated
```

---

## 🔐 Variables d'Environnement & Secrets
Les secrets sont gérés via Google Cloud Secret Manager et Firebase Functions Config :
- `GEMINI_API_KEY` : Clé API Google Gemini AI.
- `STRIPE_SECRET_KEY` & `STRIPE_WEBHOOK_SECRET` : Clés de paiement Stripe.
- `EMAILJS_PRIVATE_KEY` : Clé d'envoi transactionnel d'e-mails.
