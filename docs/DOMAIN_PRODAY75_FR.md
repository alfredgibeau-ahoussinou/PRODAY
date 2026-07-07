# Domaine personnalisé `proday75.fr` (IONOS → Netlify)

**Site Netlify :** [proday75](https://app.netlify.com/projects/proday75)  
**Site ID :** `a55cf9f2-06a5-4632-bffb-8f68d81395ac`  
**URL canonique :** https://proday75.fr (et https://www.proday75.fr → redirection apex)  
**URL Netlify par défaut :** https://proday75.netlify.app (redirigée vers `proday75.fr`)

Dernière mise à jour : 2026-07-07

## Clé privée IONOS (`*.proday75.fr_private_key.key`)

Fichier typique dans `~/Downloads/` après achat SSL chez IONOS :

- `*.proday75.fr_private_key.key` — **clé privée** du certificat IONOS

**Rôle :** cette clé sert au **SSL/TLS côté IONOS** (hébergement IONOS, proxy IONOS, ou import manuel d’un certificat sur un serveur IONOS).  
**Netlify n’en a pas besoin** : une fois le DNS pointé vers Netlify, le certificat **Let’s Encrypt** est provisionné automatiquement par Netlify.

**Sécurité :**

- Ne **jamais** committer la clé (voir `.gitignore` : `*.key`, `*.pem`, etc.).
- Conserver le fichier en local ou dans un gestionnaire de secrets.
- Si la clé a été exposée, la révoquer et en générer une nouvelle chez IONOS.

Seule la clé privée a été trouvée localement ; pas de bundle `.crt`/`.pem` IONOS dans `Downloads/` au moment de la migration.

## Statut Netlify

| Élément | Statut |
|--------|--------|
| Domaine principal (`custom_domain`) | `proday.app` — **en attente** bascule vers `proday75.fr` (certificat TLS en cours côté Netlify) |
| Alias ajoutés | `proday75.fr`, `www.proday75.fr`, `www.proday.app` |
| Redirects `netlify.toml` | `proday.app`, `www.proday.app`, `proday75.netlify.app`, `www.proday75.fr` → `https://proday75.fr` |
| DNS public actuel (`proday75.fr`) | `A` → `217.160.0.39` (parking IONOS) — **à corriger** |
| Certificat Let's Encrypt pour `proday75.fr` | **Non actif** tant que le DNS ne pointe pas vers Netlify |

### Commandes utiles

```bash
netlify status
netlify api getSite --data '{"site_id": "a55cf9f2-06a5-4632-bffb-8f68d81395ac"}'
# Pas de `netlify domains:*` dans CLI 22.x — utiliser l’API updateSite ou le tableau de bord
```

## Enregistrements DNS à configurer chez IONOS

Connexion : [IONOS](https://www.ionos.fr/) → **Domaines & SSL** → **proday75.fr** → **DNS**.

1. **Désactiver** toute redirection / page parking / « redirection du domaine » vers une page IONOS.
2. **Supprimer ou remplacer** l’enregistrement **A** existant pour la racine (`@`) qui pointe vers `217.160.0.39`.
3. **Ajouter / conserver** les enregistrements suivants :

| Type | Hôte / Nom | Valeur / Cible | TTL |
|------|------------|----------------|-----|
| **A** | `@` (racine) | `75.2.60.5` | 3600 s ou défaut |
| **A** | `@` | `99.83.81.81` | idem |
| **CNAME** | `www` | `proday75.netlify.app` | idem |

Notes IONOS :

- Deux enregistrements **A** sur `@` : configuration recommandée par Netlify pour l’apex avec DNS externe.
- CNAME `www` : si IONOS exige un point final → `proday75.netlify.app.`
- Ne pas créer de CNAME sur `@` (racine).
- Laisser les **NS** IONOS (`ui-dns.*`) sauf migration DNS complète vers Netlify.

## Après propagation DNS (souvent 15 min à 48 h)

1. Vérifier :
   ```bash
   dig +short proday75.fr A
   dig +short www.proday75.fr CNAME
   ```
   Attendu : `75.2.60.5` / `99.83.81.81` et `proday75.netlify.app` pour `www`.

2. Netlify → **Domain management** → `proday75.fr` **Verified**, certificat HTTPS **Active**.

3. Définir **`proday75.fr`** comme domaine principal (quand l’API ne renvoie plus l’erreur 422) :
   ```bash
   netlify api updateSite --data '{
     "site_id": "a55cf9f2-06a5-4632-bffb-8f68d81395ac",
     "custom_domain": "proday75.fr"
   }'
   ```
   Ou : Domain management → **Set as primary domain**.

4. Variable Netlify (recommandé) : `NEXT_PUBLIC_SITE_URL` = `https://proday75.fr`

## Firebase Auth — domaines autorisés

Dans **Authentication → Settings → Authorized domains**, ajouter :

- `proday75.fr`
- `www.proday75.fr`

Puis mettre à jour la config Functions (si pas déjà fait) :

```bash
firebase functions:config:set auth.continue_url="https://proday75.fr"
firebase deploy --only functions
```

## Codebase

URLs publiques du site migrées vers `https://proday75.fr` :

- `LEGAL_META.siteUrl` (`src/content/legal/fr.ts`, `website/src/content/legal/fr.ts`)
- `NEXT_PUBLIC_SITE_URL` (`.env.example`, `website/.env.example`)
- Templates e-mail Auth (logo)
- Fallbacks bêta / auth Cloud Functions
- Redirects `netlify.toml`

Les adresses e-mail (`contact@proday.app`, etc.) et le bundle iOS/Android `com.proday.app` restent inchangés (identifiants app / messagerie distincts du domaine web).

## Références

- [Netlify — DNS externe / apex](https://docs.netlify.com/domains-https/custom-domains/configure-external-dns/)
- [IONOS — enregistrements DNS](https://www.ionos.fr/assistance/domaines/configurer-vos-enregistrements-dns-cname-mx-etc/)
