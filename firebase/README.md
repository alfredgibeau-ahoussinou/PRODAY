# Configuration & Règles Firebase (`firebase/`)

> Règles de sécurité Firestore & Storage, index composites et templates d'e-mails d'authentification ProDay.

---

## 📁 Contenu du Dossier

| Fichier / Dossier | Description |
| :--- | :--- |
| **`firestore.rules`** | Règles de sécurité Cloud Firestore avec validation stricte par rôle (`joueur`, `coach`, `club`, `sponsor`, `admin`) et protection des profils mineurs. |
| **`firestore.indexes.json`** | Index composites nécessaires pour les requêtes complexes de matchs, tournois, publications et statistiques. |
| **`storage.rules`** | Règles de contrôle d'accès pour les vidéos highlights, avatars, licences PDF et justificatifs d'adhésion. |
| **`auth-email-templates/`** | Gabarits HTML et textes brandés pour les e-mails de vérification et de réinitialisation. |

---

## 🚀 Commandes de Déploiement

### Déployer les règles et index Firestore
```bash
# Depuis la racine du projet
npm run firebase:deploy
```

### Déployer les règles Firebase Storage
```bash
npm run firebase:deploy:storage
```

---

## 🔒 Bonnes Pratiques de Sécurité
- Les clés de comptes de service (`service-account.json`) sont strictement ignorées par `.gitignore` et ne doivent jamais être commitées.
- Toute écriture sur les collections sensibles (`subscriptions`, `quotes`, `verifications`) est protégée par des vérifications d'identité côté serveur.
