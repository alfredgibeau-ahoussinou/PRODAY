import React from 'react';
import { ReelsFeed } from '../components/reels/ReelsFeed';
import { useThemedScreen } from '../hooks/useThemedScreen';

/** Reels foot verticaux — contenu filtré par univers (Man / Woman / Pro). */
export const ReelsScreen: React.FC = () => {
  const { productLine } = useThemedScreen();

  return <ReelsFeed productLine={productLine} />;
};
