export type SavedCredentials = {
  email: string;
  password: string;
};

export function parseSavedCredentials(raw: string | null): SavedCredentials | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SavedCredentials;
    if (parsed?.email?.trim() && parsed?.password) {
      return { email: parsed.email.trim(), password: parsed.password };
    }
    return null;
  } catch {
    return null;
  }
}

export function maskEmail(email: string): string {
  const trimmed = email.trim();
  const at = trimmed.indexOf('@');
  if (at <= 0) return trimmed;
  const user = trimmed.slice(0, at);
  const domain = trimmed.slice(at + 1);
  const visible = user.length <= 2 ? user : `${user.slice(0, 2)}•••`;
  return `${visible}@${domain}`;
}
