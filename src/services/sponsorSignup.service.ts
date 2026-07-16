import type { SponsorSignupPayload } from '../content/sponsorSignupContent';

const SPONSOR_SIGNUP_URL = 'https://proday75.fr/api/sponsor/signup';

export async function submitSponsorSignup(
  payload: SponsorSignupPayload,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(SPONSOR_SIGNUP_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-proday-client': 'proday-mobile',
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? 'Inscription sponsor impossible' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Connexion impossible — réessayez plus tard' };
  }
}
