import { useMemo } from 'react';
import { useAppTheme } from '../context/ProductLineContext';
import { SHOWCASE_IMAGES, type ShowcaseImageKey } from '../content/showcaseAssets';
import { WOMAN_SHOWCASE_IMAGES } from '../content/womanShowcaseAssets';

/** Visuels showcase — féminin en mode ProDay Woman, classique sinon. */
export function useShowcaseImages(): typeof SHOWCASE_IMAGES {
  const { isWoman } = useAppTheme();
  return useMemo(
    () => (isWoman ? WOMAN_SHOWCASE_IMAGES : SHOWCASE_IMAGES),
    [isWoman]
  ) as typeof SHOWCASE_IMAGES;
}

export type { ShowcaseImageKey };
