# Sécurité — site vitrine (proday75.fr)

Configuration appliquée dans `website/netlify.toml`, `netlify.toml` (monorepo) et `website/next.config.ts`.

## Ce que la sécurité web peut (et ne peut pas) faire

**Impossible :** empêcher « Inspecter » / DevTools, masquer le HTML/CSS/JS envoyé au navigateur, ou rendre un piratage « littéralement impossible ». Tout code exécuté côté client est visible et modifiable par l’utilisateur.

**Efficace :** protéger les secrets et actions côté serveur, sessions admin cryptographiques, CSRF, rate limits, HTTPS/HSTS, CSP, cookies `HttpOnly`/`Secure`/`__Host-`, et ne jamais exposer de `NEXT_PUBLIC_*` sensibles.

## En-têtes HTTP

| En-tête | Valeur |
|---------|--------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` (sauf redirection jeton bêta → `no-referrer`) |
| `Permissions-Policy` | Capteurs restreints ; caméra/micro autorisés seulement pour Cal.com / Whereby (santé) |
| `Content-Security-Policy` | `default-src 'self'` + Fonts + EmailJS + Cloud Functions + `frame-ancestors 'none'` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `X-Robots-Tag` (admin) | `noindex, nofollow` |
| `Cache-Control` (admin + API) | `no-store` |

`poweredByHeader` désactivé ; `productionBrowserSourceMaps: false` (pas de source maps navigateur en prod).

## Routes API bêta

- `POST /api/beta` : rate limit (10/min/IP), validation email/rôle, contrôle `Origin`/`Referer`, réponse filtrée.
- `GET /api/beta/access` : rate limit (30/min/IP), cookie `httpOnly`, `Cache-Control: no-store`, longueur jeton plafonnée.

## Routes API admin fondateurs (`/admin`)

- Accès UI : **proxy Edge vérifie le HMAC** du cookie `proday_admin_session` quand le bundler Edge est OK ; les pages/API admin **vérifient toujours** le HMAC côté serveur Node.
- Cookie : `HttpOnly` + `Secure` + `SameSite=Strict` + Path `/` (12 h).
- Login : `POST /api/admin/login` — rate limit **3 / 15 min / IP**, délai anti-bruteforce ~450 ms sur échec, contrôle Origin/Referer.
- APIs admin : session HMAC Node + CSRF Origin/Referer + proxy secret vers Cloud Functions.
- Ne jamais préfixer `BETA_ADMIN_PIN`, `BETA_ADMIN_SESSION_SECRET`, `BETA_WEBSITE_ADMIN_SECRET` par `NEXT_PUBLIC_`.

## Secrets (serveur uniquement)

Ne jamais préfixer par `NEXT_PUBLIC_` :

- `EMAILJS_*`, `EMAILJS_PRIVATE_KEY`
- `BETA_ACCESS_SECRET`
- `BETA_WAITLIST_FUNCTION_URL`, `BETA_VALIDATE_FUNCTION_URL`
- `BETA_ADMIN_PIN` / `ADMIN_MINICODE`, `BETA_ADMIN_SESSION_SECRET`
- `BETA_WAITLIST_ADMIN_FUNCTION_URL`, `BETA_WEBSITE_ADMIN_SECRET`

Variables publiques autorisées : `NEXT_PUBLIC_SITE_URL`, liens APK/TestFlight optionnels.

## Surfaces publiques

- `robots.txt` : disallow `/admin`, `/api/`
- `/.well-known/security.txt` : contact sécurité

## Actions manuelles (dashboard)

1. **Netlify** — vérifier que les variables serveur sont définies (pas exposées au build client sauf `NEXT_PUBLIC_*`).
2. **Firebase** — règles Firestore / IAM Cloud Functions pour `submitBetaWaitlist` et `validateBetaAccess`.
3. **EmailJS** — activer « API non-navigateur » + clé privée ; reconnecter Gmail si erreur `invalid grant`.
4. **HSTS preload** — optionnel : soumettre le domaine sur [hstspreload.org](https://hstspreload.org) une fois la config stable.

## Risques résiduels

- Jeton bêta transité brièvement dans l’URL (`?token=`) avant pose du cookie — éviter de logger les query strings côté Netlify/analytics.
- Rate limiting en mémoire (non partagé entre instances serverless) — suffisant pour la bêta, à remplacer par Redis/Upstash si abus massifs.
- CSP autorise `'unsafe-inline'` / `'unsafe-eval'` (contrainte Next.js) — durcir avec nonces si besoin ultérieur.
- Le JS/CSS/HTML public reste lisible dans DevTools : c’est normal ; la protection porte sur les secrets et les APIs.
