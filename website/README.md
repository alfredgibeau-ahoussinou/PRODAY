<div align="center">

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="public/branding/logo-proday-lockup-white.png">
  <source media="(prefers-color-scheme: light)" srcset="public/branding/logo-proday-lockup-black.png">
  <img src="public/branding/logo-proday-official.png" alt="ProDay" width="320" />
</picture>

<br /><br />

# Site ProDay · proday75.fr

**CONNECTER · PROGRESSER · RÉVÉLER**  
*L’infrastructure de votre football · six portes d’entrée, une plateforme*

[![Production](https://img.shields.io/badge/Production-proday75.fr-F5D04A?style=flat-square&logo=googlechrome&logoColor=black)](https://proday75.fr)
[![Bêta](https://img.shields.io/badge/Bêta-Inscription-0891b2?style=flat-square)](https://proday75.fr/beta/inscription)
[![APK](https://img.shields.io/badge/APK-bêta-34d399?style=flat-square&logo=android)](https://proday75.fr/downloads/proday-beta.apk)

</div>

---

## Rôle

Marketing, inscription bêta, pages des portes métier, devis clubs/sponsors, légal (CGU / confidentialité), admin PIN, téléchargement APK.

Stack : **Next.js 16** (App Router) · **React 19** · **Tailwind CSS 4** · **Framer Motion** · hébergement **Netlify**.

Version app documentée côté site : **1.0.9** (alignée sur `app.json` du monorepo).

---

## Arborescence

```
website/
├── src/
│   ├── app/            Routes App Router (+ api/)
│   ├── components/     UI (home, portes, bêta, admin, immersive…)
│   ├── content/        Copy marketing / légal
│   ├── lib/            Contenu, pôles, helpers
│   └── hooks/
├── public/
│   ├── branding/       Logos / favicons publiés
│   ├── downloads/      proday-beta.apk
│   ├── videos/         Intro Motion
│   └── images/         Captures marketing
├── scripts/            Deploy Netlify, branding
└── netlify.toml        Headers, redirects, plugin Next
```

---

## Routes principales

| Zone | Exemples |
|------|----------|
| Accueil | `/` |
| Portes | `/joueur` · `/coach` · `/pro-club` · `/parent` · `/supporter` · `/sponsor` |
| Produit | `/fonctionnalites` · `/ecosysteme` · `/demo` · `/tarifs` · `/roadmap` · `/comparatif` |
| Bêta | `/beta/inscription` · `/beta/programme` · `/beta/installer` · `/beta/aide` |
| Légal | `/cgu` · `/confidentialite` |
| Admin | `/admin` (session PIN Edge) |

Détail du code : [`src/README.md`](src/README.md).

---

## Démarrage local

```bash
cd website
npm install
```

Variables typiques dans `.env.local` (ne jamais committer de secrets) :

```env
NEXT_PUBLIC_SITE_URL=https://proday75.fr
NEXT_PUBLIC_BETA_APP_VERSION=1.0.9
NEXT_PUBLIC_BETA_APK_URL=/downloads/proday-beta.apk
# BETA_ADMIN_PIN, EmailJS, etc. selon docs/
```

```bash
npm run dev      # http://localhost:3000
npm run build
npm run lint
```

Depuis la racine monorepo : `npm run website:dev` / `npm run website:build`.

---

## Déploiement Netlify

Production : [https://proday75.fr](https://proday75.fr)

```bash
npm run netlify:deploy
# script : scripts/netlify-deploy.sh (isole .env.local)
```

Sécurité (CSP, session admin HMAC, robots) : [`../docs/WEBSITE_SECURITY.md`](../docs/WEBSITE_SECURITY.md).

---

## Liens

- Monorepo : [`../README.md`](../README.md)
- Branding source : [`../assets/branding/`](../assets/branding/)
- Docs publiques : [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs)
