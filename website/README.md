<div align="center">

<img src="public/branding/logo-proday-official.png" alt="ProDay" width="280" />

<br /><br />

**CONNECTER. PROGRESSER. RÉVÉLER.**

Site vitrine ProDay — [proday75.fr](https://proday75.fr)  
*Pas un outil de plus — l’infrastructure de votre football.*

</div>

---

## Quoi

Next.js **16** (App Router) · React **19** · Tailwind **4** · hébergé sur **Netlify**.

Le site présente l’identité officielle, les **six portes d’entrée** (Joueur, Club, Coach, Parent, Supporter, Sponsor), la bêta, les tarifs et les pages légales. Ce n’est **pas** l’app mobile (voir `../src/` et le README racine).

| | |
|--|--|
| **Production** | https://proday75.fr |
| **Logo public** | `/branding/logo-proday-official.png` |
| **Copy produit** | `src/lib/content.ts` · `src/lib/poles.ts` |
| **Code monorepo** | [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) (privé) |
| **Docs publiques** | [PRODAY-docs](https://github.com/alfredgibeau-ahoussinou/PRODAY-docs) |

Détail du code : [src/README.md](src/README.md) · Sécurité : [docs/WEBSITE_SECURITY.md](../docs/WEBSITE_SECURITY.md)

---

## Lancer en local

Depuis la **racine** du monorepo :

```bash
npm run website:dev    # → http://localhost:3000
```

Ou depuis `website/` :

```bash
npm install
cp .env.example .env.local   # EmailJS / URL site si besoin
npm run dev
```

Build :

```bash
npm run website:build        # racine
# ou : npm run build         # dans website/
```

---

## Routes publiques (aperçu)

### Produit & marketing

| Route | Contenu |
|-------|---------|
| `/` | Accueil — identité, portes, CTA bêta |
| `/joueur` · `/pro-club` · `/coach` · `/parent` · `/supporter` · `/sponsor` | Six portes |
| `/homme` · `/woman` · `/amateur` · `/pro` | Univers / segments (redirections ou pages dédiées) |
| `/fonctionnalites` | Modules par porte |
| `/ecosysteme` | Carte des acteurs |
| `/demo` | Démo interactive (portes carousel + Sponsor) |
| `/tarifs` · `/partenaires` · `/shop` | Offres & partenaires |
| `/roadmap` · `/vision` · `/a-propos` · `/faq` | Vision & confiance |
| `/confiance` · `/comparatif` · `/parcours` · `/quiz` | Parcours & preuves |
| `/pulse` · `/live-stats` · `/cv` · `/cartes` | Outils illustratifs |

### Bêta

| Route | Accès | Rôle |
|-------|-------|------|
| `/beta/inscription` | Public | Waitlist (+ `?role=sponsor`) |
| `/beta` | Cookie / token | Hub |
| `/beta/programme` | Cookie bêta | Programme — six portes |
| `/beta/installer` | Cookie bêta | APK / TestFlight |
| `/beta/aide` | Cookie bêta | FAQ support |

**Règle** — les CTA « Accès anticipé » pointent uniquement vers `/beta/inscription`.

### Légal & admin

| Route | Contenu |
|-------|---------|
| `/cgu` · `/confidentialite` | Légal |
| `/admin/*` | Console admin (session PIN / cookie HMAC) |

---

## Déploiement Netlify

- **Branche** : `main`
- **Base directory** : `website`
- Config : `website/netlify.toml` (+ `netlify.toml` racine avec `base = "website"`)

| Champ UI Netlify | Valeur |
|------------------|--------|
| Base directory | `website` |
| Build / Publish | Laisser vides — `@netlify/plugin-nextjs` |

Variables Production (ex.) : clés EmailJS, `NEXT_PUBLIC_SITE_URL=https://proday75.fr`, secrets admin — jamais commités.

Déploiement manuel :

```bash
cd website
npm run netlify:deploy
# ou scripts/netlify-deploy.sh
```

---

## Identité

- Tagline : **CONNECTER. PROGRESSER. RÉVÉLER.**
- Master : noir `#000` · blanc `#FFF` · or `#C5A059`
- Branding généré : `npm run branding:official` (dans `website/`)
- Sources monorepo : [`assets/branding/`](../assets/branding/README.md)

Pas de tagline legacy « RÉUSSIR ». Pas de métriques d’audience inventées.

---

## Liens

- Monorepo : [../README.md](../README.md)
- App mobile : [../src/README.md](../src/README.md)
- Domaine : [../docs/DOMAIN_PRODAY75_FR.md](../docs/DOMAIN_PRODAY75_FR.md)
- Bêta opérateur : [../docs/BETA_GUIDE.md](../docs/BETA_GUIDE.md)
