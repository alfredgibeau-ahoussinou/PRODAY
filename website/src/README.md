# Code source site (`website/src/`)

Next.js **16** App Router — [proday75.fr](https://proday75.fr).  
**CONNECTER. PROGRESSER. RÉVÉLER.** · six portes d’entrée · pas huit produits.

## Structure

| Dossier | Rôle |
|---------|------|
| `app/` | Routes — un dossier ≈ une URL |
| `components/` | UI (home, portes, demo, pricing, beta, admin…) |
| `content/` | Copy marketing / légal |
| `lib/` | `content.ts`, `poles.ts`, API bêta, thèmes |
| `middleware.ts` | Cookies bêta, garde-fous Edge |

## Routes utiles

| Zone | Exemples |
|------|----------|
| Portes | `/joueur`, `/pro-club`, `/coach`, `/parent`, `/supporter`, `/sponsor` |
| Produit | `/fonctionnalites`, `/ecosysteme`, `/demo`, `/tarifs`, `/roadmap` |
| Bêta | `/beta/inscription`, `/beta/programme`, `/beta/installer` |
| API | `app/api/beta/…` |

Liste & déploiement : [../README.md](../README.md).

## Liens

- [../README.md](../README.md) — site & Netlify  
- [../../README.md](../../README.md) — monorepo  
- [../../docs/WEBSITE_SECURITY.md](../../docs/WEBSITE_SECURITY.md)  
- [../../docs/BETA_GUIDE.md](../../docs/BETA_GUIDE.md)  
- [../../assets/branding/README.md](../../assets/branding/README.md)
