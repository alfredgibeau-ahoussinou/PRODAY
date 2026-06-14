export const MIN_STAGE_MESSAGE = 10;
export const MAX_STAGE_MESSAGE = 600;
export const MAX_STAGE_TEXT = 500;

function assertLength(label: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} requis.`);
  if (trimmed.length > max) {
    throw new Error(`${label} trop long (max ${max} caractères).`);
  }
  return trimmed;
}

export function validateStageApplicationMessage(message: string): string {
  const trimmed = message.trim();
  if (trimmed.length < MIN_STAGE_MESSAGE) {
    throw new Error(`Message trop court (min ${MIN_STAGE_MESSAGE} caractères).`);
  }
  if (trimmed.length > MAX_STAGE_MESSAGE) {
    throw new Error(`Message trop long (max ${MAX_STAGE_MESSAGE} caractères).`);
  }
  return trimmed;
}

export function validateStageOfferInput(input: {
  title: string;
  description?: string;
  city: string;
  category: string;
}): {
  title: string;
  description: string;
  city: string;
  category: string;
} {
  const title = assertLength('Titre', input.title, MAX_STAGE_TEXT);
  const city = assertLength('Ville', input.city, MAX_STAGE_TEXT);
  const category = assertLength('Catégorie', input.category, MAX_STAGE_TEXT);
  const description = input.description?.trim() ?? '';
  if (description.length > MAX_STAGE_TEXT * 3) {
    throw new Error(`Description trop longue (max ${MAX_STAGE_TEXT * 3} caractères).`);
  }
  return { title, description, city, category };
}
