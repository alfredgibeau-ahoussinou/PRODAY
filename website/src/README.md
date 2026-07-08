# Code source site (`website/src/`)

> Application Next.js (App Router). Routes dans `app/`, UI dans `components/`.

## Structure

| Dossier | Rôle |
|---------|------|
| `app/` | Routes Next.js — une dossier = une URL |
| `components/` | Blocs UI réutilisables (demo, pricing, nav…) |
| `content/` | Textes marketing, copy par univers |
| `lib/` | API bêta, thèmes univers, utilitaires |
| `middleware.ts` | Middleware (sécurité, cookies bêta) |

## Routes principales (`app/`)

| Route | Dossier |
|-------|---------|
| `/` | `app/page.tsx` |
| `/homme` · `/woman` · `/pro` | Univers produit |
| `/demo` | Démo interactive 9 onglets |
| `/beta/*` | Inscription et hub bêta |
| `/api/beta` | Endpoint liste d'attente |

Liste complète : [../README.md](../README.md).

## Composants (`components/`)

Regroupés par usage : `universe/`, `demo/`, `pricing/`, `beta/`, `layout/`, `ui/`…

Thématisation Homme / Woman / Pro : `components/universe/universeTheme.ts`.

## Liens

- [../README.md](../README.md) — déploiement Netlify
- [../../docs/WEBSITE_SECURITY.md](../../docs/WEBSITE_SECURITY.md)
- [../../docs/BETA_GUIDE.md](../../docs/BETA_GUIDE.md)
