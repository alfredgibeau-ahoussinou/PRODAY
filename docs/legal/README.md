# Juridique (`docs/legal/`)

Documents légaux ProDay — site [proday75.fr](https://proday75.fr) · versions en ligne `/cgu` et `/confidentialite`.

## Contenu

| Fichier / dossier | Description |
|-------------------|-------------|
| `TERMS_OF_USE.md` | Conditions générales d’utilisation |
| `PRIVACY_POLICY.md` | Politique de confidentialité |
| `pactes/` | Sources Markdown des pactes d’associés |
| `pdf/` | PDF générés (CGU, confidentialité, pactes) |

## Génération PDF

```bash
npm run docs:legal    # CGU + confidentialité
npm run docs:pactes   # 4 exemplaires pactes associés
```

## Liens

- [../README.md](../README.md) — index documentation  
- Site public : `website/public/legal/` · https://proday75.fr/cgu
