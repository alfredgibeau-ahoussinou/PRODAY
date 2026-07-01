import { useAppTheme } from '../context/ProductLineContext';

/** Présentation UI joueuse (genre féminin ou legacy woman). */
export function useFemalePlayerPresentation(): boolean {
  const { isWoman } = useAppTheme();
  return isWoman;
}
