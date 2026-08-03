# Domaine personnalisé `proday75.fr` (IONOS → Netlify)

**Site Netlify :** [proday75](https://app.netlify.com/projects/proday75)  
**Site ID :** `a55cf9f2-06a5-4632-bffb-8f68d81395ac`  
**URL canonique :** https://proday75.fr (et https://www.proday75.fr → redirection apex)  
**URL Netlify par défaut :** https://proday75.netlify.app (redirigée vers `proday75.fr`)

Dernière mise à jour : 2026-07-24 (incident `ERR_CERT_AUTHORITY_INVALID` — A record obsolète)

## Incident HTTPS Chrome (2026-07-24) — cause et correctif

### Symptôme

Chrome : « Votre connexion n'est pas privée » / `NET::ERR_CERT_AUTHORITY_INVALID` + HSTS (pas de contournement).

### Cause exacte

Le DNS public apex (`proday75.fr`) a **deux** enregistrements **A** :

| IP | Comportement TLS (SNI `proday75.fr`) |
|----|-------------------------------------|
| `75.2.60.5` | Certificat Let's Encrypt valide (`CN=proday75.fr`, émetteur `YE2`) — Netlify OK |
| `99.83.81.81` | Certificat **Amazon Internal** (`CN=bigmac-traymanager-…amazonaws.com`, CA interne) — **non fiable** |

Chrome choisit l’IP en round-robin. Quand il tombe sur `99.83.81.81`, la CA interne Amazon déclenche `ERR_CERT_AUTHORITY_INVALID`. HSTS empêche le bypass.

Ce n’est **pas** un certificat auto-signé Netlify, ni un cert expiré, ni un SAN mismatch. Le certificat LE Netlify est **émis et valide** (`ssl: true`, domaines `proday75.fr` + `www.proday75.fr`, expire ~2026-10-07).

`99.83.81.81` était une ancienne IP load balancer Netlify documentée dans d’anciens guides ; **Netlify ne la recommande plus**. Docs actuelles : **un seul** A → `75.2.60.5` (ou ALIAS/ANAME → `apex-loadbalancer.netlify.com`). Plusieurs A sur l’apex cassent HTTPS / provisioning.

### Correctif DNS (IONOS — action manuelle obligatoire)

1. [IONOS](https://www.ionos.fr/) → Domaines & SSL → **proday75.fr** → **DNS**
2. **Supprimer** l’enregistrement **A** `@` → `99.83.81.81`
3. **Conserver uniquement** :

| Type | Hôte | Valeur |
|------|------|--------|
| **A** | `@` | `75.2.60.5` |
| **CNAME** | `www` | `proday75.netlify.app` |

4. Optionnel (meilleure résilience) : si IONOS propose ALIAS/ANAME, remplacer le A par un ALIAS `@` → `apex-loadbalancer.netlify.com` (résout aujourd’hui vers `75.2.60.5` + `99.83.231.61`).
5. Attendre la propagation (TTL ~1 h typiquement), puis vider le cache Chrome HSTS si besoin : `chrome://net-internals/#hsts` → Delete domain `proday75.fr`.

### Vérification

```bash
dig +short A proday75.fr @8.8.8.8
# Attendu : UNIQUEMENT 75.2.60.5 (plus de 99.83.81.81)

# Doit réussir (verify ok, HTTP 200) :
curl -vI --resolve proday75.fr:443:75.2.60.5 https://proday75.fr
curl -vI https://proday75.fr

# Doit ÉCHOUER tant que le mauvais A existe encore :
curl -vI --resolve proday75.fr:443:99.83.81.81 https://proday75.fr
```

### État Netlify après correctif CLI (2026-07-24)

| Champ | Valeur |
|-------|--------|
| `custom_domain` | `proday75.fr` |
| `domain_aliases` | `www.proday75.fr` (réajouté via API) |
| `ssl` | `true` — certificat LE `issued` |
| DNS autoritaire | toujours **IONOS** (`ns*.ui-dns.*`) — la zone Netlify DNS existe mais n’est **pas** utilisée tant que les NS IONOS restent |

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


## Stratégie séquentielle domaines (2026-07-08 ~22:06 UTC — agent CLI)

**Objectif exécuté :** retirer les alias `proday75.fr` / `www.proday75.fr`, retirer `proday.app` comme primary, définir `proday75.fr` en primary, réajouter `www.proday75.fr`, provisionner TLS.

**Site ID :** `a55cf9f2-06a5-4632-bffb-8f68d81395ac`

### 1. État initial (`getSite`)

| Champ | Valeur |
|-------|--------|
| `custom_domain` | `proday.app` |
| `domain_aliases` | `proday75.fr`, `www.proday75.fr` |
| `ssl` / `ssl_status` | `false` / `null` |

### 2. Retrait des alias

| Appel | Réponse exacte |
|-------|----------------|
| `netlify api updateSite` `{"domain_aliases":[]}` | **200** — corps JSON renvoyé mais **`domain_aliases` inchangés** (`proday75.fr`, `www.proday75.fr`) — changement **ignoré** |
| `@netlify/api` `updateSite` `body: { domain_aliases: [] }` (Node, même token CLI) | **200** — `{"custom_domain":"proday.app","domain_aliases":[],"ssl":false}` — **alias vidés** |

### 3. Retrait `proday.app` + primary `proday75.fr`

| Appel | Réponse exacte |
|-------|----------------|
| `updateSite` `custom_domain: null` | **200** — `custom_domain: null`, `domain_aliases: []` |
| `updateSite` `custom_domain: "proday75.fr"` | **200** — `custom_domain: "proday75.fr"`, `domain_aliases: []` |
| `updateSite` `custom_domain: "proday75.fr"`, `domain_aliases: ["www.proday75.fr"]` | **200** — primary + alias **OK** |
| `updateSite` combiné **sans** étape alias vide (via CLI seul, état bloqué) | **200** ignoré ou **422** *We're provisioning a certificate…* (historique) |

**Constat :** la séquence **alias vides d’abord** (via client Node / `@netlify/api`) débloque le `PATCH` de `custom_domain` ; le CLI `netlify api updateSite` peut renvoyer **200 sans effet** sur les alias tant que le primary est encore `proday.app`.

### 4. TLS

| Appel | Réponse exacte |
|-------|----------------|
| `provisionSiteTLSCertificate` | **422** — `{"error":"bad dns for custom domain"}` |
| `showSiteTLSCertificate` | `null` |

### 5. État final (`getSite` ~22:09 UTC)

| Champ | Valeur |
|-------|--------|
| `custom_domain` | **`proday75.fr`** |
| `domain_aliases` | **`[]`** — `www.proday75.fr` **non réappliqué** : **422** `{"errors":{"domain_aliases":["can only be changed 3 times per hour on this plan"]}}` après une tentative de « toggle » alias pour relancer la vérif DNS |
| `url` / `ssl_url` | `http://proday75.fr` / `https://proday75.fr` |
| `ssl` / `ssl_status` | `false` / `null` |
| `proday.app` | **absent** du site (plus de primary ni d’alias) |

### 6. Vérifications HTTP(S)

| Test | Résultat |
|------|----------|
| `curl -sI http://proday75.fr` | **301** `Location: https://proday75.fr/` — `Server: Netlify` |
| `curl -svI https://proday75.fr` | **échec vérif certificat** — certificat servi `CN=*.netlify.app`, `subjectAltName does not match host name proday75.fr` |
| `dig +short proday75.fr A @8.8.8.8` | `75.2.60.5`, `99.83.81.81` |
| `dig +short www.proday75.fr CNAME @8.8.8.8` | `proday75.netlify.app.` |
| `getDNSForSite` | zone `proday75.fr`, enregistrement **NETLIFY** → `proday75.netlify.app` |

### 7. Résultat opérationnel

| Étape | Statut |
|-------|--------|
| Retirer `proday.app` / `www.proday.app` | **Succès** — primary `null` puis `proday75.fr` |
| Primary `proday75.fr` | **Succès** |
| Alias `www.proday75.fr` | **Partiel** — ajouté puis perdu (rate limit alias plan Free) ; **à refaire** |
| TLS Let’s Encrypt | **En attente / échec API** — `provisionSiteTLSCertificate` → *bad dns* ; HTTPS strict encore en mismatch |

**Actions manuelles utilisateur :**

1. Dans ~1 h (ou via UI Domain management), réajouter l’alias **`www.proday75.fr`** :
   ```bash
   netlify api updateSite --data '{"site_id":"a55cf9f2-06a5-4632-bffb-8f68d81395ac","domain_aliases":["www.proday75.fr"]}'
   ```
2. Attendre 5–15 min le provisionnement TLS automatique (`automatic_tls_provisioning: true`), puis relancer :
   ```bash
   netlify api provisionSiteTLSCertificate --data '{"site_id":"a55cf9f2-06a5-4632-bffb-8f68d81395ac"}'
   netlify api showSiteTLSCertificate --data '{"site_id":"a55cf9f2-06a5-4632-bffb-8f68d81395ac"}'
   curl -svI https://proday75.fr
   ```
3. Si *bad dns* persiste >24 h avec DNS public OK et primary `proday75.fr`, ouvrir un ticket support (modèle ci-dessous) pour forcer l’émission LE.

---

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
| Domaine principal (`custom_domain`) | **`proday75.fr`** (depuis 2026-07-08 ~22:08 UTC) — `proday.app` retiré |
| Alias | **`[]`** — réajouter **`www.proday75.fr`** (rate limit alias 3/h plan Free au moment de la migration) |
| Redirects `netlify.toml` | `proday.app`, `www.proday.app`, `proday75.netlify.app`, `www.proday75.fr` → `https://proday75.fr` |
| DNS public (`8.8.8.8`, 2026-07-08) | `A` → `75.2.60.5`, `99.83.81.81` ; `www` → `proday75.netlify.app` ; **OK pour Netlify** |
| Certificat Let's Encrypt pour `proday75.fr` | **Pas encore actif** (`ssl: false`) — HTTPS strict : certificat `*.netlify.app` (SAN mismatch) |
| Cause HTTPS « non sécurisé » | `provisionSiteTLSCertificate` → **422** `bad dns for custom domain` malgré primary `proday75.fr` et DNS public OK — délai propagation / job TLS Netlify |
| Cache DNS local | Un **AAAA** ou un ancien **A** IONOS peut encore apparaître localement (TTL) |

**Suivi :** [Domain management — proday75](https://app.netlify.com/projects/proday75/domain-management) → réajouter **`www.proday75.fr`**, surveiller **HTTPS** / **Verify DNS**. Séquence API documentée dans *Stratégie séquentielle domaines* ci-dessus.

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
2. **Supprimer** tout **A** racine autre que `75.2.60.5` (notamment l’ancien `99.83.81.81` et tout A IONOS type `217.160.0.39`).
3. **Ajouter / conserver** uniquement :

| Type | Hôte / Nom | Valeur / Cible | TTL |
|------|------------|----------------|-----|
| **A** | `@` (racine) | `75.2.60.5` | 3600 s ou défaut |
| **CNAME** | `www` | `proday75.netlify.app` | idem |

Notes IONOS :

- **Un seul** enregistrement **A** sur `@` → `75.2.60.5` ([docs Netlify](https://docs.netlify.com/manage/domains/configure-domains/configure-external-dns/)). Ne pas ajouter `99.83.81.81` (IP dépréciée → certificat Amazon interne → `ERR_CERT_AUTHORITY_INVALID`).
- Si ALIAS/ANAME disponible : préférer `@` → `apex-loadbalancer.netlify.com` à la place du A.
- CNAME `www` : si IONOS exige un point final → `proday75.netlify.app.`
- Ne pas créer de CNAME sur `@` (racine).
- Pas d’enregistrement **AAAA** sur l’apex (non supporté par le LB Netlify standard).
- Laisser les **NS** IONOS (`ui-dns.*`) sauf migration DNS complète vers Netlify.

## Après propagation DNS (souvent 15 min à 48 h)

1. Vérifier :
   ```bash
   dig +short proday75.fr A
   dig +short www.proday75.fr CNAME
   ```
   Attendu : **uniquement** `75.2.60.5` et `proday75.netlify.app` pour `www`.

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

Les adresses e-mail (`proday.admin@gmail.com`, etc.) et le bundle iOS/Android `com.proday.app` restent inchangés (identifiants app / messagerie distincts du domaine web).

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

