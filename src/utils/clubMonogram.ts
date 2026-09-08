/** Monogramme à partir du nom association (pas de PII). */
export function clubMonogram(name: string): string {
  const cleaned = name
    .replace(/\b(football|club|fc|as|us|sc|ac|om|rc|cs|entente|sportive|association)\b/gi, ' ')
    .replace(/[^a-zA-ZÀ-ÿ0-9\s]/g, ' ')
    .trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  const single = (parts[0] || name || '?').replace(/\s+/g, '');
  return single.slice(0, 2).toUpperCase() || '?';
}
