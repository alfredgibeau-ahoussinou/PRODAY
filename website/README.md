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

## Bêta — email de bienvenue (EmailJS)

Le formulaire `/beta` appelle `POST /api/beta` et envoie un **email de bienvenue** via [EmailJS](https://www.emailjs.com/).

### Vercel

```env
EMAILJS_SERVICE_ID=service_xxx
EMAILJS_TEMPLATE_ID=template_xxx
EMAILJS_PUBLIC_KEY=xxx
EMAILJS_PRIVATE_KEY=xxx
NEXT_PUBLIC_SITE_URL=https://proday-xak9.vercel.app
```

Voir `docs/BETA_WAITLIST.md` (template EmailJS + activation API non-navigateur).
