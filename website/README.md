# Site vitrine ProDay (Next.js)

Site multi-pages interactif — **21 routes** publiques, démos par univers (**Man**, **Woman**, **Pro**) et formulaire bêta avec email de bienvenue.

## Pages

| Route | Contenu |
|-------|---------|
| `/` | Accueil — témoignages, quiz, FAQ, exploration |
| `/homme` | Univers **Man** — modules, parcours, tarifs, Pulse |
| `/woman` | Univers **Woman** — foot féminin |
| `/pro` | Univers **Pro** — staff, recrutement vérifié |
| `/fonctionnalites` | 11 piliers produit + modules (Fil, Reels, Sponsors…) |
| `/demo` | Démo interactive **9 onglets** (`?u=homme\|woman\|pro`) |
| `/pulse` | Simulateur Pulse (thème par univers) |
| `/live-stats` | Saisie match en direct |
| `/cv` | Aperçu CV PDF (`?u=` pour le thème) |
| `/parcours` | Parcours par rôle |
| `/quiz` | Quiz profil (3 questions) |
| `/comparatif` | ProDay vs WhatsApp vs tableur |
| `/ecosysteme` | Carte interactive des acteurs |
| `/confiance` | Vérification diplômes |
| `/roadmap` | Livré / en cours / à venir |
| `/tarifs` | Plans Gratuit & Pro (`?u=` pour filtrer par univers) + grille partenaires |
| `/partenaires` | Espace Partenaires — Découverte 0 €, Territorial 49 €, National Pro 99 €/mois |
| `/shop` | ProDay Shop |
| `/faq` | Questions fréquentes |
| `/beta/inscription` | Liste d'attente publique + email de bienvenue (`?role=sponsor` pour partenaires) |
| `/beta` | Hub bêta privé (lien email avec `?token=`) |
| `/beta/programme` | Programme bêta — six pôles (protégé) |
| `/beta/installer` | Guides APK / TestFlight (protégé) |
| `/beta/aide` | FAQ et support bêta (protégé) |
| `/a-propos` | Vision produit |

### Démo interactive (`/demo`)

Mock téléphone avec les **9 onglets** de l’app : Accueil, Mercato, Matchs, Reels, Fil, Covoiturage, Santé, Messages, Profil.

- Contact partenaires : **partenaires@proday.app** — CTA `/beta/inscription?role=sponsor`
- Sélecteur **Man / Woman / Pro** en haut de page
- Contenu et visuels adaptés par univers (`?u=homme`, `?u=woman`, `?u=pro`)
- Lien **« Voir la démo »** depuis chaque page univers

## Lancer en local

```bash
# Depuis la racine du monorepo
npm run website:dev

# Ou depuis ce dossier
npm install
npm run dev
```

→ [http://localhost:3000](http://localhost:3000)

Copier `website/.env.example` vers `website/.env.local` pour la bêta (EmailJS).

## Build

```bash
npm run website:build   # racine
# ou
npm run build           # dans website/
```

## Déploiement

**Branche Git :** `main` — **Root directory :** `website`

### Vercel (CI recommandé)

Un push sur `main` qui modifie `website/**` déclenche `.github/workflows/deploy-website.yml` (secrets `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID`).

**Dashboard :**

1. [vercel.com/new](https://vercel.com/new) → importer le dépôt
2. **Production Branch** : `main`
3. **Root Directory** : `website`
4. Deploy

**CLI :**

```bash
cd website
npx vercel login
npx vercel --prod
```

### Netlify

Configuration : `website/netlify.toml` (canonique) + `netlify.toml` à la racine (`base = "website"` pour le monorepo).

**Réglages obligatoires dans l’UI Netlify** (Site configuration → Build & deploy) :

| Champ | Valeur |
|-------|--------|
| Base directory | `website` |
| Build command | *(laisser vide — défini dans `netlify.toml`)* `npm run build` |
| Publish directory | *(laisser vide ou effacer `dist`)* — le plugin OpenNext gère la sortie |

Ne pas publier `dist` ni `.next` manuellement : Next.js a besoin de la **fonction serveur** générée par `@netlify/plugin-nextjs`.

**Variables d’environnement** : mêmes clés EmailJS que Vercel (voir ci-dessus) + `NEXT_PUBLIC_SITE_URL=https://proday-site.netlify.app`.

**Déploiement manuel (CLI)** depuis `website/` :

```bash
npm run build          # via netlify build
netlify deploy --prod --no-build \
  --dir .netlify/static \
  --functions .netlify/functions-internal
```

## Bêta — email de bienvenue (EmailJS)

Le formulaire `/beta/inscription` appelle `POST /api/beta` et envoie un **email de bienvenue** via [EmailJS](https://www.emailjs.com/). Le lien email ouvre `/beta?token=…` (hub protégé).

Variables d’environnement (Vercel / Netlify / `.env.local`) :

```env
EMAILJS_SERVICE_ID=service_xxx
EMAILJS_TEMPLATE_ID=template_xxx
EMAILJS_PUBLIC_KEY=xxx
EMAILJS_PRIVATE_KEY=xxx
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
```

Voir `docs/BETA_GUIDE.md` (guide opérateur complet) et `docs/BETA_WAITLIST.md` (dépannage EmailJS).

## Thématisation par univers

Couleurs, CTA et contenus démo/tarifs/CV sont centralisés dans `src/components/universe/universeTheme.ts` et `src/lib/content.ts` (`BRANDS_BY_LINE`, `UNIVERSE_PAGE_CONFIG`).
