import * as functions from 'firebase-functions';

export type AuthEmailPayload = {
  to: string;
  subject: string;
  html: string;
  text: string;
};

export type AuthEmailTransportConfig = {
  resendApiKey: string;
  fromEmail: string;
};

export function getAuthEmailTransportConfig(): AuthEmailTransportConfig | null {
  const authCfg = functions.config().auth ?? {};
  const betaCfg = functions.config().beta ?? {};

  const resendApiKey =
    (authCfg.resend_api_key as string | undefined)?.trim() ||
    (betaCfg.resend_api_key as string | undefined)?.trim() ||
    '';
  const fromEmail =
    (authCfg.from_email as string | undefined)?.trim() ||
    (betaCfg.from_email as string | undefined)?.trim() ||
    'ProDay <contact@proday.app>';

  if (!resendApiKey) return null;
  return { resendApiKey, fromEmail };
}

export function isAuthCustomEmailEnabled(): boolean {
  const authCfg = functions.config().auth ?? {};
  const explicit = String(authCfg.enabled ?? '').trim().toLowerCase();
  if (explicit === 'false') return false;
  if (explicit === 'true') return getAuthEmailTransportConfig() !== null;
  return getAuthEmailTransportConfig() !== null;
}

export async function sendAuthEmailViaResend(
  config: AuthEmailTransportConfig,
  payload: AuthEmailPayload
): Promise<void> {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: config.fromEmail,
      to: [payload.to],
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
      reply_to: 'contact@proday.app',
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`Resend ${res.status}: ${detail}`);
  }
}
