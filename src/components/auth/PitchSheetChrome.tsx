import React from 'react';
import { View } from 'react-native';
import { usePitchStyles } from './pitchStyles';
import { ProDayGradient } from '../ui/ProDayGradient';

/** Poignée + barre dégradé univers en tête de feuille. */
export const PitchSheetChrome: React.FC = () => {
  const pitchStyles = usePitchStyles();
  return (
    <>
      <ProDayGradient
        kind="cta"
        style={pitchStyles.sheetAccent}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
      />
      <View style={pitchStyles.sheetHandle} />
    </>
  );
};
