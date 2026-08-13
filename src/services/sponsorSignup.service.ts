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
        ...(process.env.EXPO_PUBLIC_PRODAY_MOBILE_API_SECRET?.trim()
          ? {
              'x-proday-mobile-key':
                process.env.EXPO_PUBLIC_PRODAY_MOBILE_API_SECRET.trim(),
            }
          : {}),
      },
      body: JSON.stringify(payload),
    });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) {
      return { ok: false, error: data.error ?? 'Inscription sponsor impossible' };
    }
    return { ok: true };
  } catch {
    return { ok: false, error: 'Connexion impossible. Réessayez plus tard' };
  }
}
