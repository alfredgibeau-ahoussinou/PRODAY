import React from 'react';
import { View } from 'react-native';
import { usePitchStyles } from './pitchStyles';

/** Poignée + barre noire en tête de feuille. */
export const PitchSheetChrome: React.FC = () => {
  const pitchStyles = usePitchStyles();
  return (
    <>
      <View style={pitchStyles.sheetAccent} />
      <View style={pitchStyles.sheetHandle} />
    </>
  );
};
