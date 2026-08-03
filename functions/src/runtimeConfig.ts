/**
 * Configuration runtime Gen2 — remplace functions.config() (indisponible en Gen2).
 * Sources (priorité) : variables d'environnement (.env / .env.<projectId>), secret
 * FUNCTIONS_CONFIG_EXPORT (JSON), puis functions.config() Gen1 si encore disponible.
 */

export type RuntimeConfigSection = Record<string, string | undefined>;

export type RuntimeConfig = {
  admin?: RuntimeConfigSection;
  appointment?: RuntimeConfigSection;
  auth?: RuntimeConfigSection;
  beta?: RuntimeConfigSection;
  cal?: RuntimeConfigSection;
  email?: RuntimeConfigSection;
  mistral?: RuntimeConfigSection;
  stripe?: RuntimeConfigSection;
  revenuecat?: RuntimeConfigSection;
  visio?: RuntimeConfigSection;
};

function trim(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  const t = value.trim();
  return t || undefined;
}

function readEnv(...keys: string[]): string | undefined {
  for (const key of keys) {
    const v = trim(process.env[key]);
    if (v) return v;
  }
  return undefined;
}

function tryParseJsonConfig(raw: string | undefined): RuntimeConfig | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as RuntimeConfig;
    return parsed && typeof parsed === 'object' ? parsed : null;
  } catch {
    return null;
  }
}

function tryLegacyFunctionsConfig(): RuntimeConfig | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const functions = require('firebase-functions') as {
      config?: () => RuntimeConfig;
    };
    if (typeof functions.config === 'function') {
      return functions.config();
    }
  } catch {
    // Gen2 — functions.config() indisponible
  }
  return null;
}

function buildConfigFromEnv(): RuntimeConfig {
  return {
    admin: {
      alert_email: readEnv('ADMIN_ALERT_EMAIL'),
    },
    appointment: {
      site_url: readEnv('APPOINTMENT_SITE_URL'),
      emailjs_template_id: readEnv('APPOINTMENT_EMAILJS_TEMPLATE_ID'),
      emailjs_service_id: readEnv('APPOINTMENT_EMAILJS_SERVICE_ID'),
      emailjs_public_key: readEnv('APPOINTMENT_EMAILJS_PUBLIC_KEY'),
      emailjs_private_key: readEnv('APPOINTMENT_EMAILJS_PRIVATE_KEY'),
    },
    auth: {
      enabled: readEnv('AUTH_ENABLED'),
      continue_url: readEnv('AUTH_CONTINUE_URL'),
      from_email: readEnv('AUTH_FROM_EMAIL'),
      emailjs_template_id: readEnv('AUTH_EMAILJS_TEMPLATE_ID'),
      emailjs_verification_template_id: readEnv('AUTH_EMAILJS_VERIFICATION_TEMPLATE_ID'),
      emailjs_password_reset_template_id: readEnv('AUTH_EMAILJS_PASSWORD_RESET_TEMPLATE_ID'),
      emailjs_service_id: readEnv('AUTH_EMAILJS_SERVICE_ID'),
      emailjs_public_key: readEnv('AUTH_EMAILJS_PUBLIC_KEY'),
      emailjs_private_key: readEnv('AUTH_EMAILJS_PRIVATE_KEY'),
    },
    beta: {
      site_url: readEnv('BETA_SITE_URL'),
      from_email: readEnv('BETA_FROM_EMAIL'),
      emailjs_service_id: readEnv('BETA_EMAILJS_SERVICE_ID'),
      emailjs_template_id: readEnv('BETA_EMAILJS_TEMPLATE_ID'),
      emailjs_public_key: readEnv('BETA_EMAILJS_PUBLIC_KEY'),
      emailjs_private_key: readEnv('BETA_EMAILJS_PRIVATE_KEY'),
      website_admin_secret: readEnv(
        'BETA_WEBSITE_ADMIN_SECRET',
        'BETA_ADMIN_API_SECRET',
      ),
    },
    cal: {
      api_key: readEnv('CAL_API_KEY'),
      event_type_slug: readEnv('CAL_EVENT_TYPE_SLUG'),
      default_username: readEnv('CAL_DEFAULT_USERNAME', 'CAL_ORG_USERNAME'),
      org_username: readEnv('CAL_ORG_USERNAME'),
    },
    email: {
      provider: readEnv('EMAIL_PROVIDER'),
      brevo_api_key: readEnv('EMAIL_BREVO_API_KEY'),
      from_email: readEnv('EMAIL_FROM_EMAIL'),
      from_name: readEnv('EMAIL_FROM_NAME'),
    },
    mistral: {
      api_key: readEnv('MISTRAL_API_KEY'),
    },
    stripe: {
      secret_key: readEnv('STRIPE_SECRET_KEY'),
      webhook_secret: readEnv('STRIPE_WEBHOOK_SECRET'),
    },
    revenuecat: {
      webhook_auth: readEnv('REVENUECAT_WEBHOOK_AUTH', 'REVENUECAT_WEBHOOK_SECRET'),
    },
    visio: {
      daily_api_key: readEnv('DAILY_API_KEY', 'VISIO_DAILY_API_KEY'),
      daily_domain: readEnv('VISIO_DAILY_DOMAIN', 'DAILY_DOMAIN'),
    },
  };
}

function mergeSections(
  base: RuntimeConfigSection | undefined,
  overlay: RuntimeConfigSection | undefined
): RuntimeConfigSection {
  const out: RuntimeConfigSection = { ...(base ?? {}) };
  if (!overlay) return out;
  for (const [key, value] of Object.entries(overlay)) {
    const t = trim(value);
    if (t) out[key] = t;
  }
  return out;
}

function mergeConfigs(...configs: (RuntimeConfig | null | undefined)[]): RuntimeConfig {
  const merged: RuntimeConfig = {};
  for (const cfg of configs) {
    if (!cfg) continue;
    for (const section of Object.keys(cfg) as (keyof RuntimeConfig)[]) {
      merged[section] = mergeSections(merged[section], cfg[section]);
    }
  }
  return merged;
}

let cachedConfig: RuntimeConfig | null = null;

/** Config fusionnée — évaluée paresseusement à l'exécution (safe Gen2). */
export function getRuntimeConfig(): RuntimeConfig {
  if (cachedConfig) return cachedConfig;

  cachedConfig = mergeConfigs(
    tryParseJsonConfig(readEnv('FUNCTIONS_CONFIG_EXPORT')),
    buildConfigFromEnv(),
    tryLegacyFunctionsConfig()
  );

  return cachedConfig;
}

export function getConfigSection(section: keyof RuntimeConfig): RuntimeConfigSection {
  return getRuntimeConfig()[section] ?? {};
}

export function configStr(
  section: keyof RuntimeConfig,
  key: string,
  envAliases: string[] = []
): string | undefined {
  const fromSection = trim(getConfigSection(section)[key]);
  if (fromSection) return fromSection;

  const envKeys = [
    `${String(section).toUpperCase()}_${key.toUpperCase()}`,
    ...envAliases,
  ];
  return readEnv(...envKeys);
}

let cachedCalDefaultUsername: string | null | undefined;

/** Username Cal.com org — config, env, ou GET /me (mis en cache). */
export async function resolveCalDefaultUsername(): Promise<string | null> {
  const fromConfig = configStr('cal', 'default_username', ['CAL_DEFAULT_USERNAME', 'CAL_ORG_USERNAME']);
  if (fromConfig) return fromConfig;

  if (cachedCalDefaultUsername !== undefined) {
    return cachedCalDefaultUsername;
  }

  const apiKey = configStr('cal', 'api_key', ['CAL_API_KEY']);
  if (!apiKey) {
    cachedCalDefaultUsername = null;
    return null;
  }

  try {
    const response = await fetch('https://api.cal.com/v2/me', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'cal-api-version': '2026-02-25',
      },
    });
    if (response.ok) {
      const body = (await response.json()) as { data?: { username?: string } };
      cachedCalDefaultUsername = trim(body.data?.username) ?? null;
      if (cachedCalDefaultUsername) {
        console.info('[runtimeConfig] Cal default_username résolu via /me:', cachedCalDefaultUsername);
      }
      return cachedCalDefaultUsername;
    }
    console.warn('[runtimeConfig] Cal /me →', response.status);
  } catch (e) {
    console.warn('[runtimeConfig] Cal /me failed:', e);
  }

  cachedCalDefaultUsername = null;
  return null;
}

/** Réinitialise le cache (tests). */
export function resetRuntimeConfigCache(): void {
  cachedConfig = null;
  cachedCalDefaultUsername = undefined;
}
