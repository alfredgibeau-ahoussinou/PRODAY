# Visuels ProDay (showcase UI)

Images locales pour Discover, Arena, dashboard — sans Firebase Storage.  
App **1.0.8** · tagline **CONNECTER. PROGRESSER. RÉVÉLER.**

## Classique (`classic/`)

| Fichier | Usage |
|---------|--------|
| `classic-discover-hero.jpg` | Hero Discover |
| `classic-mercato.jpg` | Mercato, détections |
| `classic-profile.jpg` | Profils joueurs |
| `classic-match.jpg` | Matchs amicaux |
| `classic-arena.jpg` | Arena, tournois |
| `classic-staff.jpg` | Staff / fondateurs |
| `classic-exp-*.jpg` | Expériences interactives |

```bash
node scripts/download-classic-showcase-images.mjs
```

Référence code : `src/content/showcaseAssets.ts`.

## Woman (`woman/`)

Foot féminin (sujets vérifiés) :

```bash
node scripts/download-woman-showcase-images.mjs
```

Référence : `src/content/womanShowcaseAssets.ts`.  
Affichage : `ShowcaseImageBackground` dans Discover / inscription.

## Anciens PNG

Les `*.png` à la racine de `generated/` sont dépréciés.

## Liens

- Branding store : [../branding/README.md](../branding/README.md)
- [PRODAY](https://github.com/alfredgibeau-ahoussinou/PRODAY) · [proday75.fr](https://proday75.fr)
