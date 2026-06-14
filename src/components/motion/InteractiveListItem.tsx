import React from 'react';
import { type StyleProp, type ViewStyle } from 'react-native';
import { StaggerReveal } from './StaggerReveal';
import { PressableSpring } from './PressableSpring';

interface InteractiveListItemProps {
  children: React.ReactNode;
  index?: number;
  /** Plafonne le délai d’entrée sur les longues listes. */
  maxStaggerIndex?: number;
  delayStep?: number;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  disabled?: boolean;
  haptic?: boolean;
}

/**
 * Ligne / carte de liste — entrée échelonnée + ressort au toucher.
 */
export const InteractiveListItem: React.FC<InteractiveListItemProps> = ({
  children,
  index = 0,
  maxStaggerIndex = 12,
  delayStep = 42,
  style,
  onPress,
  disabled,
  haptic = true,
}) => {
  const staggerIndex = Math.min(index, maxStaggerIndex);

  return (
    <StaggerReveal index={staggerIndex} delayStep={delayStep} style={style}>
      {onPress ? (
        <PressableSpring
          onPress={onPress}
          disabled={disabled}
          haptic={haptic && !disabled}
          scaleTo={0.96}
        >
          {children}
        </PressableSpring>
      ) : (
        children
      )}
    </StaggerReveal>
  );
};
