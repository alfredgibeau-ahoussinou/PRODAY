# Domaine personnalisé `proday75.fr` (IONOS → Netlify)

**Site Netlify :** [proday75](https://app.netlify.com/projects/proday75)  
**Site ID :** `a55cf9f2-06a5-4632-bffb-8f68d81395ac`  
**URL canonique :** https://proday75.fr (et https://www.proday75.fr → redirection apex)  
**URL Netlify par défaut :** https://proday75.netlify.app (redirigée vers `proday75.fr`)

Dernière mise à jour : 2026-07-08 (audit CLI/API domaines)

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


## Blocage retrait `proday.app` (2026-07-08 — CLI/API)

**Objectif :** `custom_domain` = `proday75.fr`, alias = `www.proday75.fr`, conserver `proday75.netlify.app`, retirer `proday.app` / `www.proday.app` (sans DNS).

### Auth CLI

```text
netlify status → utilisateur alfred Gibeau--Ahoussinou, projet proday75, Project URL https://proday.app
```

### État API `getSite` (après tentatives)

| Champ | Valeur |
|-------|--------|
| `custom_domain` | `proday.app` (inchangé) |
| `domain_aliases` | `proday75.fr`, `www.proday75.fr` (`www.proday.app` absent des alias) |
| `default_domain` | `proday75.netlify.app` |
| `quick_setup_in_progress` | `false` (forcé via `PATCH` — succès) |
| `ssl` / `ssl_status` | `false` / `null` |
| `managed_dns` | `true` (zone Netlify DNS pour `proday75.fr` via `getDNSForSite`) |

### Endpoints domaine (Open API / `netlify api --list`)

- **Aucun** `removeDomain`, `deleteSiteDomain`, ni équivalent CLI (`netlify sites:*` n’expose pas `sites:update` en CLI 22.2.1).
- Seul levier public : **`updateSite`** (`PATCH /api/v1/sites/{site_id}`) pour `custom_domain` et `domain_aliases`.

### Erreurs API exactes (support Netlify)

| Action | Réponse |
|--------|---------|
| `PATCH` `{"custom_domain":"proday75.fr","domain_aliases":["www.proday75.fr"]}` | **422** — `We're provisioning a certificate for your site, you cannot change custom domains until that process completes` |
| `PATCH` `{"custom_domain":"proday75.netlify.app"}` | **422** — `You cannot use the default domain as custom domain` |
| `POST /sites/{id}/ssl` (`provisionSiteTLSCertificate`) | **422** — `{"error":"bad dns for custom domain"}` (primary `proday.app` sans enregistrements A Netlify) |
| `GET /sites/{id}/ssl` (`showSiteTLSCertificate`) | `null` |
| `GET /sites/{id}/ssl/certificates?domain=…` | `{"error":"No certificates found for this domain"}` pour `proday.app`, `www.proday.app`, `proday75.fr`, `www.proday75.fr` |
| `POST /sites/{id}/ssl/renew` | `{"error":"There is no certificate to renew"}` |
| `DELETE /sites/{id}/ssl` | **404** (pas de certificat à supprimer) |
| `PATCH` alias trop fréquent (plan Free) | **422** — `{"errors":{"domain_aliases":["can only be changed 3 times per hour on this plan"]}}` |
| `netlify api updateSite` avec `custom_domain` pendant le blocage | parfois **200** avec site inchangé (`custom_domain` reste `proday.app`) — le changement est **ignoré**, pas appliqué |

### UI

L’utilisateur ne peut pas retirer `proday.app` / `www.proday.app` depuis **Domain management** (bouton Remove / Set primary indisponible ou sans effet) — cohérent avec le verrou TLS ci-dessus.

### Conclusion opérationnelle

**Échec** du retrait de `proday.app` via API/CLI tant que Netlify considère un **provisionnement certificat en cours** pour le site avec primary DNS-invalid (`proday.app`). Contournement côté app : redirects `netlify.toml` vers `https://proday75.fr`.

**Demande support Netlify :** débloquer ou annuler le job TLS bloqué sur le site `a55cf9f2-06a5-4632-bffb-8f68d81395ac` (`proday75`), retirer `proday.app` comme domaine principal, définir `proday75.fr` en primary et provisionner Let’s Encrypt pour `proday75.fr` / `www.proday75.fr`.

## Statut Netlify

| Élément | Statut |
|--------|--------|
| Domaine principal (`custom_domain`) | `proday.app` — **bloqué API** : 422 *provisioning certificate* ; `updateSite` peut renvoyer 200 sans changer le primary |
| Alias | `proday75.fr`, `www.proday75.fr` (`www.proday.app` retiré le 2026-07-08) |
| Redirects `netlify.toml` | `proday.app`, `www.proday.app`, `proday75.netlify.app`, `www.proday75.fr` → `https://proday75.fr` |
| DNS public (`8.8.8.8`, 2026-07-08) | `A` → `75.2.60.5`, `99.83.81.81` ; `www` → `proday75.netlify.app` ; **pas d’AAAA** — **OK pour Netlify** |
| Certificat Let's Encrypt pour `proday75.fr` | **Pas encore actif** (`ssl: false`, `ssl_status: null`) — `curl -svI https://proday75.fr` sert `*.netlify.app` (SAN mismatch) |
| Cause HTTPS « non sécurisé » | Primary = `proday.app` sans DNS Netlify → `provisionSiteTLSCertificate` renvoie **422** ; Let’s Encrypt non émis pour `proday75.fr` |
| Cache DNS local | Un **AAAA** ou un ancien **A** IONOS peut encore apparaître sur la machine locale 1–48 h après désactivation (TTL) ; les résolveurs publics sont déjà alignés |

**Suivi :** [Domain management — proday75](https://app.netlify.com/projects/proday75/domain-management) → retirer **proday.app** (⋮ → Remove domain), puis **Set as primary domain** sur **proday75.fr**. La CLI `updateSite` ne suffit pas tant que `proday.app` reste primary.

### Relancer la vérification DNS / TLS (CLI)

**Vérification DNS public (attendu Netlify) :**

```bash
dig +short proday75.fr A
dig +short www.proday75.fr CNAME
dig +short proday75.fr A @8.8.8.8
```

**Contrôle côté Netlify (CLI authentifiée) :**

```bash
netlify status
netlify api getSite --data '{"site_id": "a55cf9f2-06a5-4632-bffb-8f68d81395ac"}'
netlify api getDNSForSite --data '{"site_id": "a55cf9f2-06a5-4632-bffb-8f68d81395ac"}'
netlify api showSiteTLSCertificate --data '{"site_id": "a55cf9f2-06a5-4632-bffb-8f68d81395ac"}'
```

**Forcer une nouvelle vérification (API publique — pas de bouton « Verify DNS » exposé) :**

1. Retirer puis réajouter l’alias `proday75.fr` (déclenche souvent un nouveau contrôle DNS côté Netlify) :

```bash
SITE_ID=a55cf9f2-06a5-4632-bffb-8f68d81395ac
# Alias actuels (sans www.proday.app) :
netlify api updateSite --data '{"site_id":"'"$SITE_ID"'","domain_aliases":["proday75.fr","www.proday75.fr"]}'
```

2. Tenter le provisionnement Let’s Encrypt (échoue tant que le **domaine principal** `custom_domain` = `proday.app` n’a pas de DNS valide vers Netlify) :

```bash
netlify api provisionSiteTLSCertificate --data "{"site_id":"$SITE_ID"}"
# Réponse typique si proday.app sans A Netlify : {"error":"bad dns for custom domain"}
```

3. Quand le certificat pour `proday75.fr` est prêt, définir l’apex comme domaine principal :

```bash
netlify api updateSite --data "{"site_id":"$SITE_ID","custom_domain":"proday75.fr"}"
```

**Action manuelle dashboard (si le statut reste « Pending » / « DNS verification ») :**

[Domain management — proday75](https://app.netlify.com/projects/proday75/domain-management) → ligne `proday75.fr` → **Verify DNS** ou **Check DNS configuration** (libellé selon l’UI). Netlify ne documente pas d’équivalent CLI pour ce clic.

**Piège connu :** tant que `custom_domain` reste `proday.app` et que `proday.app` n’a **aucun** enregistrement `A` vers Netlify (vérifier avec `dig +short proday.app A @8.8.8.8`), `provisionSiteTLSCertificate` peut renvoyer `bad dns for custom domain` même si `proday75.fr` est déjà correct.

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

## Nouvelle tentative CLI/API (2026-07-08 ~19:00 heure Paris)

| Action | Résultat |
|--------|----------|
| `PATCH` `custom_domain=proday75.fr`, `domain_aliases=["www.proday75.fr"]` | **422** — provisioning certificate (immédiat + après **60 s**) |
| `PATCH` `automatic_tls_provisioning=false` seul | **200** mais `automatic_tls_provisioning` reste `true` |
| `PATCH` `ssl=false` | **200**, primary inchangé (`proday.app`) |
| `PATCH` `custom_domain=proday75.netlify.app` | **422** — cannot use default domain as custom domain |
| `PATCH` alias seul `["www.proday75.fr"]` | **422** rate limit alias (3/h plan Free) après plusieurs essais |
| `POST /ssl`, `provisionSiteTLSCertificate` | **422** — `bad dns for custom domain` |
| `GET /ssl/certificates?domain=…` | aucun certificat pour les 4 hôtes |
| `POST /ssl/renew` | `There is no certificate to renew` |
| `DELETE /ssl` | **404** |
| GraphQL `api.netlify.com/graphql` | **404** |
| `createSiteInTeam` + `custom_domain=proday75.fr` | **422** — domain must be unique (déjà sur site `a55cf9f2…`) |

**curl :** `http://proday75.fr` → **301** vers HTTPS ; `https://proday75.fr` → certificat `*.netlify.app` (SAN mismatch). Cause inchangée : primary `proday.app` sans DNS public (`dig proday.app` NXDOMAIN).

### Modèle message support Netlify (FR)

**Objet :** Déblocage provisionnement TLS — impossible de changer le domaine principal (site `proday75`)

Bonjour,

Mon site **proday75** (ID `a55cf9f2-06a5-4632-bffb-8f68d81395ac`, équipe HOLBERTON) est bloqué : je ne peux pas retirer **proday.app** ni définir **proday75.fr** comme domaine principal.

- **Domaine principal actuel :** `proday.app` (plus de zone DNS — je ne souhaite plus utiliser ce domaine).
- **Alias :** `proday75.fr`, `www.proday75.fr` (DNS OK : A Netlify + zone DNS Netlify pour `proday75.fr`).
- **Erreur API** sur tout `PATCH` de `custom_domain` : *We're provisioning a certificate for your site, you cannot change custom domains until that process completes*.
- **`POST /api/v1/sites/{id}/ssl`** : *bad dns for custom domain* (car le primary `proday.app` ne résout pas).
- **`GET /ssl/certificates`** : aucun certificat ; **`ssl`** = false ; HTTPS sur `proday75.fr` sert un certificat `*.netlify.app`.

**Demande :** annuler ou clôturer le job de provisionnement TLS bloqué, retirer `proday.app` / `www.proday.app` du site, définir **`proday75.fr`** comme domaine principal et provisionner Let's Encrypt pour `proday75.fr` et `www.proday75.fr`.

Merci,
Alfred Gibeau–Ahoussinou

