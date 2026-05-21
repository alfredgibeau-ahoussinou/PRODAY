# 🏃 ProDay — Connecter · Progresser · Réussir

> **Plateforme mobile de mise en relation sportive** : recrutement, tournois, matchs amicaux et sponsoring pour clubs, joueurs, coachs et agents.

---

## 📱 Vision produit

ProDay est une super-app sport qui centralise tout l'écosystème des clubs amateurs et semi-pros :

| Onglet | Rôle | Utilisateurs cibles |
|--------|------|---------------------|
| **Mercato** | Recrutement joueurs / coachs | Clubs, agents, joueurs |
| **Arena** | Gestion de tournois | Organisateurs, clubs |
| **Matchs** | Matchs amicaux géolocalisés | Clubs |
| **Sponsors** | Marketplace partenaires | Entreprises locales, clubs |

---

## 🏗️ Architecture technique

```
Flutter (Mobile)
    │
    ├── Firebase Auth       → Authentification + rôles
    ├── Firestore           → Base de données temps réel
    ├── Firebase Storage    → Documents & vidéos
    ├── Cloud Functions     → Validation diplômes, notifications
    └── FCM                 → Push notifications (géofencing)
```

**Stack choisie :** Flutter + Firebase (No-code via FlutterFlow en MVP, migration Flutter code natif en v2)

---

## 📂 Structure du repository

```
proday/
├── README.md
├── docs/
│   ├── ARCHITECTURE.md         # Diagrammes techniques
│   ├── DATABASE_SCHEMA.md      # Modèle de données Firestore
│   ├── API_CONTRACTS.md        # Contrats des Cloud Functions
│   └── ProDay_NonDev_Brief.pdf # Brief pour collègues non-dev
├── src/
│   ├── models/                 # Modèles de données TypeScript
│   │   ├── User.ts
│   │   ├── Player.ts
│   │   ├── Club.ts
│   │   ├── Tournament.ts
│   │   └── SponsorOffer.ts
│   ├── services/               # Logique métier / Firebase
│   │   ├── auth.service.ts
│   │   ├── profile.service.ts
│   │   ├── tournament.service.ts
│   │   └── notification.service.ts
│   ├── screens/                # Écrans principaux
│   │   ├── MercatoScreen.tsx
│   │   ├── ArenaScreen.tsx
│   │   ├── MatchsScreen.tsx
│   │   └── SponsorsScreen.tsx
│   ├── components/             # Composants réutilisables
│   │   ├── ProfileCard.tsx
│   │   ├── VerificationBadge.tsx
│   │   ├── TournamentCard.tsx
│   │   └── MatchCard.tsx
│   └── utils/
│       ├── geofencing.ts
│       └── pdfGenerator.ts
└── assets/
    └── diagrams/
        └── architecture.mmd    # Diagramme Mermaid
```

---

## 🔒 Système de validation des profils

Le cœur de la confiance dans ProDay est le **workflow de vérification** :

```
Inscription → Upload document → Statut "PENDING" → Review admin → VERIFIED ✅
                                        │
                                        └── Profil visible mais accès limité
                                            (ne peut pas contacter des mineurs)
```

Champ Firestore : `users/{uid}.is_verified: boolean` (default: `false`)

---

## 🚀 Roadmap

### Mois 1 — MVP Core
- [ ] Auth multi-rôles (joueur / coach / agent / organisateur / sponsor)
- [ ] Upload et validation documents
- [ ] Écran Mercato (annonces + candidature)

### Mois 2-3 — Arena & Matchs
- [ ] Création et gestion de tournois
- [ ] Génération automatique des poules
- [ ] Live score + classement buteurs

### Mois 4 — Monétisation
- [ ] Marketplace sponsors
- [ ] Abonnement Pro pour agents
- [ ] Analytics clubs

---

## 👥 Équipe & contribution

| Rôle | Responsabilité |
|------|----------------|
| Product Owner | Vision produit, roadmap |
| Flutter Dev | Interface mobile |
| Backend Dev | Cloud Functions, Firestore rules |
| Designer | Figma, UX/UI |

---

## 📄 Licence

Propriétaire — ProDay © 2026. Tous droits réservés.
