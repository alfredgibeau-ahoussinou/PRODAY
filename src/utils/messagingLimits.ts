export const MAX_MESSAGE_BODY = 2000;

export function validateMessageBody(body: string): string {
  const trimmed = body.trim();
  if (!trimmed) throw new Error('Message vide.');
  if (trimmed.length > MAX_MESSAGE_BODY) {
    throw new Error(`Message trop long (max ${MAX_MESSAGE_BODY} caractères).`);
  }
  return trimmed;
}
