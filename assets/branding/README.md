# Logos ProDay

| Fichier | Usage |
|---------|--------|
| `logo-light.png` | Legacy — fond blanc |
| `logo-dark.png` | Legacy — fond sombre |
| `logo-transparent-hero.png` | **Transparent** — hero photo, headers sombres |
| `logo-transparent-dark.png` | **Transparent** — cartes blanches, headers clairs |
| `logo-auth-dark.png` | Legacy — variante traitée (préférer `logo-transparent-hero` sur bandeau noir) |
| `logo-mark-transparent.png` | Picto P seul — filigrane sur photos |

Génération : **ISNet** pour `logo-dark` · clé blanc pour `logo-light` (le coureur blanc n’est pas confondu avec le fond).
`logo-auth-dark` : trous intérieurs (coureur) remplis en blanc + détourage.
Commande : `node scripts/generate-transparent-logos.mjs`

## Pro Day for Women (rose)

| Fichier | Usage |
|---------|--------|
| `logo-woman-picto.png` | Picto P rose (haute résolution) |
| `logo-woman-mark-transparent.png` | Filigrane (= picto) |

Le libellé **Pro Day for Women** + tagline sont rendus en natif par `src/components/WomanLogo.tsx` (texte net).

Génération picto : `npm run branding:logos:woman` (nécessite `logo-mark-transparent.png`).
