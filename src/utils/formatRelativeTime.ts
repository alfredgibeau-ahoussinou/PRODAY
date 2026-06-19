type RelativeTimeTranslator = (
  key: string,
  vars?: Record<string, string | number>
) => string;

export function formatRelativeTime(
  date: Date,
  t: RelativeTimeTranslator,
  now = new Date(),
  locale = 'fr-FR'
): string {
  const diffMs = now.getTime() - date.getTime();
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return t('time.relative.justNow');
  if (minutes < 60) return t('time.relative.minutes', { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t('time.relative.hours', { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 7) return t('time.relative.days', { n: days });
  return date.toLocaleDateString(locale, { day: 'numeric', month: 'short' });
}
