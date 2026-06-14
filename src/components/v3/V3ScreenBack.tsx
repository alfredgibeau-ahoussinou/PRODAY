import React from 'react';
import { TouchableOpacity } from 'react-native';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';

interface V3ScreenBackProps {
  onPress: () => void;
}

export const V3ScreenBack: React.FC<V3ScreenBackProps> = ({ onPress }) => {
  const { colors } = useAppTheme();
  return (
    <TouchableOpacity hitSlop={12} onPress={onPress} accessibilityRole="button" accessibilityLabel="Retour">
      <Icon name="arrow-back" size={22} color={colors.text} />
    </TouchableOpacity>
  );
};
