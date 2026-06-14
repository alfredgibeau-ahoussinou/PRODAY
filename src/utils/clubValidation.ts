export const MAX_CLUB_NAME = 120;
export const MAX_CLUB_CITY = 80;
export const MAX_CLUB_DEPARTMENT = 40;
export const MAX_CLUB_CATEGORIES = 12;
export const MAX_CATEGORY_LENGTH = 40;

function assertLength(label: string, value: string, max: number): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error(`${label} requis.`);
  if (trimmed.length > max) {
    throw new Error(`${label} trop long (max ${max} caractères).`);
  }
  return trimmed;
}

export function validateClubInput(input: {
  name: string;
  city: string;
  department?: string;
  categories: string[];
}): {
  name: string;
  city: string;
  department?: string;
  categories: string[];
} {
  const name = assertLength('Nom du club', input.name, MAX_CLUB_NAME);
  const city = assertLength('Ville', input.city, MAX_CLUB_CITY);
  const department = input.department?.trim();
  if (department && department.length > MAX_CLUB_DEPARTMENT) {
    throw new Error(`Département trop long (max ${MAX_CLUB_DEPARTMENT} caractères).`);
  }
  const categories = input.categories
    .map((c) => c.trim())
    .filter(Boolean)
    .slice(0, MAX_CLUB_CATEGORIES);
  if (categories.length === 0) {
    throw new Error('Au moins une catégorie est requise.');
  }
  for (const category of categories) {
    if (category.length > MAX_CATEGORY_LENGTH) {
      throw new Error(`Catégorie trop longue (max ${MAX_CATEGORY_LENGTH} caractères).`);
    }
  }
  return { name, city, department: department || undefined, categories };
}
