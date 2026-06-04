# Visuels ProDay (showcase UI)

Images locales pour Discover, Arena, dashboard, etc. — sans Firebase Storage.

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

Téléchargement (recadrage 16:9 / 4:3 / 21:9, `crop=faces` ou `entropy`) :  
`node scripts/download-classic-showcase-images.mjs`  
Référence : `src/content/showcaseAssets.ts`

## Woman (`woman/`)

Foot féminin uniquement (Unsplash + Pexels, sujets vérifiés) — `node scripts/download-woman-showcase-images.mjs`  
Référence : `src/content/womanShowcaseAssets.ts`

Affichage : `ShowcaseImageBackground` (`resizeMode="cover"`) dans Discover et l’inscription.

## Anciens PNG

Les fichiers `*.png` à la racine de `generated/` sont dépréciés ; vous pouvez les supprimer après validation des nouveaux visuels.
