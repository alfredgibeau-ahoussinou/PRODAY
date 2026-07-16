import * as functions from 'firebase-functions';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

export type BrevoConfig = {
  apiKey: string;
  fromEmail: string;
  fromName: string;
};

export type BrevoSendPayload = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export function getBrevoConfig(): BrevoConfig | null {
  const cfg = functions.config().email ?? {};
  const apiKey = (cfg.brevo_api_key as string | undefined)?.trim();
  const fromEmail = (cfg.from_email as string | undefined)?.trim();
  const fromName = (cfg.from_name as string | undefined)?.trim() || 'ProDay';

  if (!apiKey || !fromEmail) return null;
  return { apiKey, fromEmail, fromName };
}

export type BrevoSendResult = {
  messageId: string;
};

/** Envoi transactionnel via Brevo API v3. */
export async function sendViaBrevo(
  config: BrevoConfig,
  payload: BrevoSendPayload
): Promise<BrevoSendResult> {
  const body: Record<string, unknown> = {
    sender: { name: config.fromName, email: config.fromEmail },
    to: [{ email: payload.to }],
    subject: payload.subject,
    htmlContent: payload.html,
  };
  if (payload.text?.trim()) {
    body.textContent = payload.text.trim();
  }

  const res = await fetch(BREVO_API_URL, {
    method: 'POST',
    headers: {
      'api-key': config.apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const detail = await res.text();

  if (!res.ok) {
    console.error('[brevoEmailClient] Envoi refusé:', {
      status: res.status,
      to: payload.to,
      from: config.fromEmail,
      subject: payload.subject,
      detail,
    });
    throw new Error(`Brevo ${res.status}: ${detail}`);
  }

  let messageId = '';
  try {
    const parsed = JSON.parse(detail) as { messageId?: string };
    messageId = String(parsed.messageId ?? '').trim();
  } catch {
    // réponse non-JSON inattendue
  }

  console.info('[brevoEmailClient] Accepté par Brevo:', {
    messageId: messageId || '(inconnu)',
    to: payload.to,
    from: config.fromEmail,
    subject: payload.subject,
  });

  return { messageId };
}
