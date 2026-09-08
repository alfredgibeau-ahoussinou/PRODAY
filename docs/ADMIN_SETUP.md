# Console Admin ProDay — Admin Control Center

## Modèle

L'interface admin app est le **ProDay Admin Control Center** (`src/features/admin/`).

Navigation par domaines : Accueil, Plateforme, Utilisateurs, Clubs, Commercial (devis),
Finances, Produit, Admin AI, Support, Sécurité, Système.

### Auth

- Droit Firebase `admin: true` (app)
- Liste d'e-mails autorisés → aide au setup (`src/config/admin.ts`)
- Site `/admin` = **minicode PIN** (HMAC Edge) pour ops fondateurs (bêta / trafic / commercial / finances) — **surface séparée** du Control Center app ; pas le contrôle produit total

### Données

- `admin.service.ts`, `adminAudit.service.ts`, `clubQuote.service.ts` — Firestore réel (app)
- Pas de fake payments / subscriptions dans le Control Center
- Site : proxies Cloud Functions (`websiteAdminStats`, waitlist, billing) — voir `docs/WEBSITE_SECURITY.md`

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
