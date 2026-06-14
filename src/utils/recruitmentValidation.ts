export const MIN_COVER_LETTER = 20;
export const MAX_COVER_LETTER = 600;
export const MAX_RECRUITMENT_TEXT = 500;

function assertLength(label: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} requis.`);
  if (trimmed.length > max) {
    throw new Error(`${label} trop long (max ${max} caractères).`);
  }
  return trimmed;
}

export function validateCoverLetter(coverLetter: string): string {
  const trimmed = coverLetter.trim();
  if (trimmed.length < MIN_COVER_LETTER) {
    throw new Error(`Lettre de motivation trop courte (min ${MIN_COVER_LETTER} caractères).`);
  }
  if (trimmed.length > MAX_COVER_LETTER) {
    throw new Error(`Lettre de motivation trop longue (max ${MAX_COVER_LETTER} caractères).`);
  }
  return trimmed;
}

export function validateRecruitmentPostInput(input: {
  title: string;
  position: string;
  category: string;
  level: string;
  city: string;
  description?: string;
}): {
  title: string;
  position: string;
  category: string;
  level: string;
  city: string;
  description?: string;
} {
  const title = assertLength('Titre', input.title, MAX_RECRUITMENT_TEXT);
  const position = assertLength('Poste', input.position, MAX_RECRUITMENT_TEXT);
  const category = assertLength('Catégorie', input.category, MAX_RECRUITMENT_TEXT);
  const level = assertLength('Niveau', input.level, MAX_RECRUITMENT_TEXT);
  const city = assertLength('Ville', input.city, MAX_RECRUITMENT_TEXT);
  const description = input.description?.trim();
  if (description && description.length > MAX_RECRUITMENT_TEXT * 3) {
    throw new Error(`Description trop longue (max ${MAX_RECRUITMENT_TEXT * 3} caractères).`);
  }
  return {
    title,
    position,
    category,
    level,
    city,
    description: description || undefined,
  };
}
