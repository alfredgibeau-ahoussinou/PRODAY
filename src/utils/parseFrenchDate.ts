/** Formate une date locale en jj/mm/aaaa. */
export function formatFrenchDate(date: Date): string {
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
}

/** Demain à 18h — défaut entraînement coach. */
export function defaultTrainingSchedule(): { date: string; time: string } {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return { date: formatFrenchDate(d), time: '18:00' };
}

/** Parse jj/mm/aaaa ou jj-mm-aaaa */
export function parseFrenchDate(input: string): Date | null {
  const trimmed = input.trim();
  const m = trimmed.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  const year = parseInt(m[3], 10);
  const d = new Date(year, month, day);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) {
    return null;
  }
  return d;
}
