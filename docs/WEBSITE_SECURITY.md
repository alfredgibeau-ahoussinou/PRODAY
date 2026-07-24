# Sécurité — site vitrine (proday75.fr)

Configuration appliquée dans `website/netlify.toml`, `netlify.toml` (monorepo) et `website/next.config.ts`.

## En-têtes HTTP

| En-tête | Valeur |
|---------|--------|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` |
| `X-Frame-Options` | `DENY` |
| `X-Content-Type-Options` | `nosniff` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` (sauf redirection jeton bêta → `no-referrer`) |
| `Permissions-Policy` | Capteurs, caméra, micro, géoloc, paiement, USB, etc. désactivés (liste exhaustive dans `netlify.toml`) |
| `X-Permitted-Cross-Domain-Policies` | `none` |
| `Cross-Origin-Opener-Policy` | `same-origin` |
| `Cross-Origin-Resource-Policy` | `same-origin` |
| `Content-Security-Policy` | `default-src 'self'` + Google Fonts + EmailJS + Cloud Functions + `upgrade-insecure-requests` |

## Routes API bêta

- `POST /api/beta` : rate limit (10/min/IP), validation email/rôle, contrôle `Origin`/`Referer`, réponse filtrée.
- `GET /api/beta/access` : rate limit (30/min/IP), cookie `httpOnly`, `Cache-Control: no-store`, longueur jeton plafonnée.

## Routes API admin fondateurs (`/admin`)

- Accès UI : middleware + cookie `proday_admin_session` (HMAC, 7 jours) après `POST /api/admin/login` avec minicode.
- Rate limit PIN : 5 tentatives / 15 min / IP.
- `GET /api/admin/beta/waitlist`, `POST …/approve|reject|resend` : session requise, `Origin`/`Referer` (CSRF), proxy vers CF `websiteBetaWaitlistAdmin` avec secret serveur.
- Ne jamais préfixer `BETA_ADMIN_PIN`, `BETA_ADMIN_SESSION_SECRET`, `BETA_WEBSITE_ADMIN_SECRET` par `NEXT_PUBLIC_`.

## Secrets (serveur uniquement)

Ne jamais préfixer par `NEXT_PUBLIC_` :

- `EMAILJS_*`, `EMAILJS_PRIVATE_KEY`
- `BETA_ACCESS_SECRET`
- `BETA_WAITLIST_FUNCTION_URL`, `BETA_VALIDATE_FUNCTION_URL`
- `BETA_ADMIN_PIN` / `ADMIN_MINICODE`, `BETA_ADMIN_SESSION_SECRET`
- `BETA_WAITLIST_ADMIN_FUNCTION_URL`, `BETA_WEBSITE_ADMIN_SECRET`

Variables publiques autorisées : `NEXT_PUBLIC_SITE_URL`, liens APK/TestFlight optionnels.

## Actions manuelles (dashboard)

1. **Netlify** — vérifier que les variables serveur sont définies (pas exposées au build client sauf `NEXT_PUBLIC_*`).
2. **Firebase** — règles Firestore / IAM Cloud Functions pour `submitBetaWaitlist` et `validateBetaAccess`.
3. **EmailJS** — activer « API non-navigateur » + clé privée ; reconnecter Gmail si erreur `invalid grant`.
4. **HSTS preload** — optionnel : soumettre le domaine sur [hstspreload.org](https://hstspreload.org) une fois la config stable.

## Risques résiduels

- Jeton bêta transité brièvement dans l’URL (`?token=`) avant pose du cookie — éviter de logger les query strings côté Netlify/analytics.
- Rate limiting en mémoire (non partagé entre instances serverless) — suffisant pour la bêta, à remplacer par Redis/Upstash si abus massifs.
- CSP autorise `'unsafe-inline'` / `'unsafe-eval'` (contrainte Next.js) — durcir avec nonces si besoin ultérieur.
