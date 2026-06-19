const MAX_RESPONSE_LEN = 500;

export function validateWeeklyResponseBody(body: string): string | null {
  const trimmed = body.trim();
  if (!trimmed) return 'Réponse requise.';
  if (trimmed.length > MAX_RESPONSE_LEN) {
    return `Réponse trop longue (max ${MAX_RESPONSE_LEN} caractères).`;
  }
  return null;
}
