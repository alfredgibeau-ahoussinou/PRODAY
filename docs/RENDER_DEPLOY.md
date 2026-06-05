# Déploiement site vitrine sur Render

Le site Next.js (`website/`) est configuré via **`render.yaml`** à la racine du dépôt.

## 1. Créer le service (recommandé — Blueprint)

1. Ouvrir [dashboard.render.com/blueprints](https://dashboard.render.com/blueprints)
2. **New Blueprint Instance** → connecter le repo GitHub `alfredgibeau-ahoussinou/PRODAY`
3. Render détecte `render.yaml` et crée le service **`proday-website`**
4. Renseigner les variables marquées *sync: false* :
   - `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_PRIVATE_KEY`
   - `NEXT_PUBLIC_SITE_URL` = URL Render finale (ex. `https://proday-website.onrender.com`)
5. **Apply** — premier build ~2–3 min

Les pushes sur `main` redéploient automatiquement si l’auto-deploy est activé sur le service.

## 2. Alternative — CLI Render

```bash
brew install render   # ou déjà installé
render login
cd /chemin/vers/PRODAY
render blueprint launch
```

## 3. Variables d’environnement

| Variable | Obligatoire | Rôle |
|----------|-------------|------|
| `EMAILJS_*` | Oui (bêta) | Envoi email `/api/beta` |
| `NEXT_PUBLIC_SITE_URL` | Recommandé | Liens dans les emails bêta |
| `BETA_WAITLIST_FUNCTION_URL` | Non | Proxy Firebase au lieu d’EmailJS |
| `RENDER_EXTERNAL_URL` | Auto | Injectée par Render — utilisée si `NEXT_PUBLIC_SITE_URL` absente |

Voir aussi `docs/BETA_WAITLIST.md` pour le template EmailJS.

## 4. Domaine custom (optionnel)

Dans le service Render → **Settings → Custom Domains** → ajouter `proday.app` puis mettre à jour `NEXT_PUBLIC_SITE_URL`.

## 5. Build local (vérification)

```bash
npm run website:build
```
