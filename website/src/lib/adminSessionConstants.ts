/** Constantes admin utilisables en Edge middleware (sans Node crypto). */

/** Cookie admin (Secure + HttpOnly + SameSite=Strict). */
export const ADMIN_SESSION_COOKIE = "proday_admin_session";
/** Session courte : réduit la fenêtre si vol de cookie. */
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12; // 12 heures
export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_HOME_PATH = "/admin/home";

const TOKEN_PREFIX = "adm1.";

/** Cookie présent (contrôle léger). préférer la vérif HMAC Edge/Node. */
export function hasAdminSessionCookieValue(value: string | undefined): boolean {
  return Boolean(value?.startsWith(TOKEN_PREFIX) && value.length > 20);
}

export { TOKEN_PREFIX as ADMIN_SESSION_TOKEN_PREFIX };
