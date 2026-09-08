# Console Admin ProDay — Admin Control Center

## Modèle

L'interface admin app est le **ProDay Admin Control Center** (`src/features/admin/`).

Navigation par domaines : Accueil, Plateforme, Utilisateurs, Clubs, Commercial (devis),
Finances, Produit, Admin AI, Support, Sécurité, Système.

### Auth

- Droit Firebase `admin: true`
- Liste d'e-mails autorisés → aide au setup (`src/config/admin.ts`)
- Site `/admin` = code fondateur (bêta / trafic), **surface séparée** (website)

### Données

- `admin.service.ts`, `adminAudit.service.ts`, `clubQuote.service.ts` — Firestore réel
- Pas de fake payments / subscriptions dans le Control Center

### Setup

Placez les variables dans `.env` (gitignored) — le script les lit automatiquement :

```bash
ADMIN_SETUP_EMAIL=proday.admin@gmail.com
ADMIN_SETUP_PASSWORD=…   # même MDP que docs/internal/ProDay-Acces-Fondateurs.md (compte app)
npm run admin:setup
```

Cela crée/met à jour le compte Firebase Auth, applique `admin: true`, et aligne le mot de passe sur `.env`.  
Puis reconnecte-toi dans l'app pour recharger le jeton.

```bash
firebase deploy --only firestore:rules,storage,functions
```

## Sécurité

`request.auth.token.admin == true` sur Firestore / Storage / Functions.
