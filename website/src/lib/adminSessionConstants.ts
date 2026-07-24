/** Constantes admin utilisables en Edge middleware (sans Node crypto). */

export const ADMIN_SESSION_COOKIE = "proday_admin_session";
export const ADMIN_SESSION_MAX_AGE = 60 * 60 * 24 * 7; // 7 jours
export const ADMIN_LOGIN_PATH = "/admin/login";
export const ADMIN_HOME_PATH = "/admin/beta";

const TOKEN_PREFIX = "adm1.";

/** Cookie présent (contrôle léger middleware Edge — validation crypto côté serveur). */
export function hasAdminSessionCookieValue(value: string | undefined): boolean {
  return Boolean(value?.startsWith(TOKEN_PREFIX) && value.length > 20);
}

export { TOKEN_PREFIX as ADMIN_SESSION_TOKEN_PREFIX };
