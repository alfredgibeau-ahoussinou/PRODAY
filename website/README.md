# Site vitrine ProDay (Next.js)

Site multi-pages interactif — infrastructure football, **21+ routes** publiques, portes d’entrée (Joueur, Club, Coach, Parent, Supporter, Sponsor) et formulaire bêta avec email de bienvenue.

Code source : [src/README.md](src/README.md) · Carte monorepo : [docs/STRUCTURE.md](../docs/STRUCTURE.md)

## Pages

| Route | Contenu |
|-------|---------|
| `/` | Accueil — témoignages, quiz, FAQ, exploration |
| `/homme` | Univers **Man** — modules, parcours, tarifs, Pulse |
| `/woman` | Univers **Woman** — foot féminin |
| `/pro` | Univers **Pro** — staff, recrutement vérifié |
| `/fonctionnalites` | Modules produit par pôle (Joueur, Club, Coach, Supporter, Sponsor) |
| `/demo` | Démo interactive **5 pôles** (`?p=joueur\|pro_club\|coach\|supporter\|sponsor`) |
| `/pulse` | Simulateur Pulse (thème par univers) |
| `/live-stats` | Saisie match en direct |
| `/cv` | Aperçu CV PDF (`?u=` pour le thème) |
| `/parcours` | Parcours par rôle |
| `/quiz` | Quiz profil (3 questions) |
| `/comparatif` | ProDay vs WhatsApp vs tableur |
| `/ecosysteme` | Carte interactive des acteurs |
| `/confiance` | Vérification diplômes |
| `/roadmap` | Livré / en cours / à venir |
| `/tarifs` | Plans par pôle + grille partenaires |
| `/partenaires` | Espace Partenaires — Découverte, Territorial, National |
| `/shop` | ProDay Shop |
| `/faq` | Questions fréquentes |
| `/beta/inscription` | Liste d'attente publique + email de bienvenue (`?role=sponsor` pour partenaires) |
| `/beta` | Hub bêta privé (lien email avec `?token=`) |
| `/beta/programme` | Programme bêta — six portes d’entrée (protégé) |
| `/beta/installer` | Guides APK / TestFlight (protégé) |
| `/beta/aide` | FAQ et support bêta (protégé) |
| `/a-propos` | Vision produit |

### Démo interactive (`/demo`)

Hero plein écran + téléphone interactif (Joueur, Club, Coach, Supporter, Sponsor…).

- URL `?p=amateur|supporter|sante|pro_joueur|pro_club|pro_staff` (legacy `?u=` redirigé)
- Onglets alignés sur les shells app ; contenu illustratif
- Lien **« Voir la démo »** depuis chaque page univers
- Contact partenaires : **proday.admin@gmail.com** — CTA `/beta/inscription?role=sponsor`

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

**Branche Git :** `main` — **Root directory :** `website` — **Hébergeur :** [Netlify](https://www.netlify.com/)

Un push sur `main` déclenche le déploiement automatique via le hook Git Netlify (pas de workflow GitHub Actions).

Configuration : `website/netlify.toml` (canonique) + `netlify.toml` à la racine (`base = "website"` pour le monorepo).

**Réglages obligatoires dans l’UI Netlify** (Site configuration → Build & deploy) :

| Champ | Valeur |
|-------|--------|
| Base directory | `website` |
| Build command | *(laisser vide — défini dans `netlify.toml`)* `npm run build` |
| Publish directory | *(laisser vide ou effacer `dist`)* — le plugin OpenNext gère la sortie |

Ne pas publier `dist` ni `.next` manuellement : Next.js a besoin de la **fonction serveur** générée par `@netlify/plugin-nextjs`.

**Variables d’environnement** (Site configuration → Environment variables, contexte **Production**) : clés EmailJS + `NEXT_PUBLIC_SITE_URL=https://proday75.fr` (voir section Bêta ci-dessous).

**Déploiement manuel (CLI)** depuis `website/` :

```bash
npm run build          # via netlify build
netlify deploy --prod --no-build \
  --dir .netlify/static \
  --functions .netlify/functions-internal
```

## Bêta — email de bienvenue (EmailJS)

Le formulaire `/beta/inscription` appelle `POST /api/beta` et envoie un **email de bienvenue** via [EmailJS](https://www.emailjs.com/). Le lien email ouvre `/beta/programme?token=…` (programme bêta directement).

Variables d’environnement (Netlify / `.env.local`) :

```env
EMAILJS_SERVICE_ID=service_xxx
EMAILJS_TEMPLATE_ID=template_xxx
EMAILJS_PUBLIC_KEY=xxx
EMAILJS_PRIVATE_KEY=xxx
NEXT_PUBLIC_SITE_URL=https://votre-domaine.com
```

Voir `docs/BETA_GUIDE.md` (guide opérateur complet) et `docs/BETA_WAITLIST.md` (dépannage EmailJS).

## Sécurité

En-têtes HTTP (HSTS, CSP, X-Frame-Options…), protection CSRF sur `POST /api/beta`, rate limiting et cookies bêta `httpOnly` : voir [`docs/WEBSITE_SECURITY.md`](../docs/WEBSITE_SECURITY.md).

## Thématisation par univers

Couleurs, CTA et contenus démo/tarifs/CV sont centralisés dans `src/components/universe/universeTheme.ts` et `src/lib/content.ts` (`BRANDS_BY_LINE`, `UNIVERSE_PAGE_CONFIG`).
