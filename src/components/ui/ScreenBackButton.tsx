import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Icon } from './Icon';
import { useAppTheme } from '../../context/ProductLineContext';

interface ScreenBackButtonProps {
  onPress: () => void;
}

export const ScreenBackButton: React.FC<ScreenBackButtonProps> = ({ onPress }) => {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity
      hitSlop={12}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Retour"
    >
      <Icon name="arrow-back" size={22} color={colors.text} />
    </TouchableOpacity>
  );
};
