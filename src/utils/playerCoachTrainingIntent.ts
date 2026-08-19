/** Normalise pour détection d’intention sans accents. */
function normalizeIntent(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase();
}

/** Intent utilisateur : créer un entraînement maison / programme IA. */
export function isHomeTrainingIntent(text: string): boolean {
  const n = normalizeIntent(text.trim());
  if (!n) return false;
  if (n.includes('creer mon entrainement')) return true;
  if (n.includes('programme ia')) return true;
  if (n.includes('entrainement ia')) return true;
  if (n.includes('entrainement a la maison')) return true;
  if (n.includes('entrainement') && (n.includes('maison') || n.includes('solo') || n.includes('chez moi'))) {
    return true;
  }
  return false;
}
