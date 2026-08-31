import { Share, Platform } from 'react-native';

/** Export CSV contrôlé (partage natif — pas d’upload serveur). */
export function toCsv(
  headers: string[],
  rows: Array<Array<string | number | boolean | null | undefined>>,
): string {
  const esc = (v: string | number | boolean | null | undefined) => {
    const s = v == null ? '' : String(v);
    if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n');
}

export async function shareCsv(filename: string, csv: string): Promise<void> {
  const message = Platform.OS === 'ios' ? csv : `${filename}\n\n${csv}`;
  await Share.share({
    title: filename,
    message,
  });
}
