# Site vitrine ProDay (Next.js)

Site multi-pages interactif — **16 pages** + composants démo.

## Pages

| Route | Contenu |
|-------|---------|
| `/` | Accueil enrichi — témoignages, quiz, FAQ, téléchargement |
| `/fonctionnalites` | 8 piliers + modules |
| `/demo` | Démo 5 onglets |
| `/pulse` | Simulateur Pulse |
| `/live-stats` | Saisie match en direct |
| `/cv` | Aperçu CV PDF |
| `/parcours` | Parcours par rôle |
| `/quiz` | Quiz profil (3 questions) |
| `/comparatif` | ProDay vs WhatsApp vs tableur |
| `/ecosysteme` | Carte interactive des acteurs |
| `/confiance` | Vérification diplômes |
| `/roadmap` | Livré / en cours / à venir |
| `/tarifs` | Plans Gratuit & Pro |
| `/faq` | 8 questions |
| `/woman` | Univers foot féminin |
| `/beta` | Waitlist |
| `/a-propos` | Vision produit |

## Lancer

```bash
npm run website:dev
```

## Build

```bash
npm run website:build
```

## Déploiement Vercel

**Branche Git :** `main` — **Root Directory :** `website`

### CI (recommandé)

Un push sur `main` qui modifie `website/**` déclenche `.github/workflows/deploy-website.yml` (secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).

### Dashboard

1. [vercel.com/new](https://vercel.com/new) → importer `alfredgibeau-ahoussinou/PRODAY`
2. **Production Branch** : `main`
3. **Root Directory** : `website`
4. Deploy

### CLI

```bash
cd website
npx vercel login
npx vercel --prod
```

## Bêta — email de bienvenue

Le formulaire `/beta` appelle `POST /api/beta`, enregistre l’inscription dans Firestore (`beta_waitlist`) et envoie un **email de bienvenue** (Mercato, Pulse, prochaines étapes).

### Configuration (production)

1. Compte [Resend](https://resend.com) + domaine vérifié (ou `onboarding@resend.dev` pour tests).
2. Déployer la Cloud Function :
   ```bash
   firebase functions:config:set \
     beta.resend_api_key="re_..." \
     beta.from_email="ProDay <noreply@votredomaine.com>" \
     beta.site_url="https://proday.app"
   firebase deploy --only functions:submitBetaWaitlist
   firebase deploy --only firestore:rules
   ```
3. Sur **Vercel** (variables d’environnement du projet `website`) :
   ```env
   BETA_WAITLIST_FUNCTION_URL=https://europe-west1-proday-155b0.cloudfunctions.net/submitBetaWaitlist
   ```

### Dev local (sans Functions)

Copier `website/.env.example` → `website/.env.local` et définir `RESEND_API_KEY`.

Voir aussi `docs/BETA_WAITLIST.md`.
