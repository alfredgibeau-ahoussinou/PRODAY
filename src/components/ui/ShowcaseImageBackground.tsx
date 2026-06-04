import React from 'react';
import {
  ImageBackground,
  type ImageBackgroundProps,
  type ImageStyle,
  type StyleProp,
} from 'react-native';
import { useAppTheme } from '../../context/ProductLineContext';
import {
  getShowcaseImageStyle,
  type ShowcaseImageVariant,
} from '../../content/showcaseImageStyle';

export interface ShowcaseImageBackgroundProps extends ImageBackgroundProps {
  variant?: ShowcaseImageVariant;
  imageStyle?: StyleProp<ImageStyle>;
}

/** ImageBackground — resizeMode cover, cadrage Woman ajusté automatiquement. */
export const ShowcaseImageBackground: React.FC<ShowcaseImageBackgroundProps> = ({
  variant = 'card',
  resizeMode = 'cover',
  imageStyle,
  children,
  ...rest
}) => {
  const { isWoman } = useAppTheme();
  return (
    <ImageBackground
      {...rest}
      resizeMode={resizeMode}
      imageStyle={getShowcaseImageStyle(
        variant,
        imageStyle as ImageStyle | undefined,
        isWoman
      )}
    >
      {children}
    </ImageBackground>
  );
};
