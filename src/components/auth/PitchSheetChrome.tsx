import React from 'react';
import { View } from 'react-native';
import { pitchStyles } from './pitchStyles';

/** Poignée + barre noire en tête de feuille. */
export const PitchSheetChrome: React.FC = () => (
  <>
    <View style={pitchStyles.sheetAccent} />
    <View style={pitchStyles.sheetHandle} />
  </>
);
