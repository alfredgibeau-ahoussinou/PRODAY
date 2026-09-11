import React from 'react';
import Svg, { Circle, Path, Rect, Polygon, G, Defs, LinearGradient, Stop } from 'react-native-svg';

export type ProDayGlyphName =
  | 'ball'
  | 'check-presence'
  | 'cross-absence'
  | 'carpool'
  | 'ai-spark'
  | 'trophy'
  | 'pitch'
  | 'location-pin'
  | 'calendar'
  | 'stats'
  | 'clock'
  | 'whistle'
  | 'share';

interface GlyphProps {
  name: ProDayGlyphName;
  size?: number;
  color?: string;
  secondaryColor?: string;
}

/**
 * Collection exclusive de pictogrammes vectoriels ProDay.
 * Zéro emoji générique : design taillé sur-mesure pour le football d'élite.
 */
export const ProDayGlyph: React.FC<GlyphProps> = ({
  name,
  size = 24,
  color = '#FAFAFA',
  secondaryColor = '#00E676',
}) => {
  const s = size;

  switch (name) {
    case 'ball':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={1.5} />
          <Polygon points="12,7 15.5,9.5 14,14 10,14 8.5,9.5" fill={color} opacity={0.9} />
          <Path d="M12 2.5V7M21 10L15.5 9.5M18.5 19L14 14M5.5 19L10 14M3 10L8.5 9.5" stroke={color} strokeWidth={1.2} strokeLinecap="round" />
        </Svg>
      );

    case 'check-presence':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Defs>
            <LinearGradient id="checkGlow" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={secondaryColor} />
              <Stop offset="100%" stopColor="#00B050" />
            </LinearGradient>
          </Defs>
          <Circle cx="12" cy="12" r="9.5" stroke="url(#checkGlow)" strokeWidth={1.75} />
          <Path d="M7.5 12L10.5 15L16.5 9" stroke={secondaryColor} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case 'cross-absence':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={1.5} opacity={0.4} />
          <Path d="M8.5 8.5L15.5 15.5M15.5 8.5L8.5 15.5" stroke={color} strokeWidth={1.8} strokeLinecap="round" opacity={0.7} />
        </Svg>
      );

    case 'carpool':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 14.5L5.8 8.2C6 7.5 6.6 7 7.3 7H16.7C17.4 7 18 7.5 18.2 8.2L20 14.5M4 14.5V17C4 17.6 4.4 18 5 18H6C6.6 18 7 17.6 7 17V15M20 14.5V17C20 17.6 19.6 18 19 18H18C17.4 18 17 17.6 17 17V15M4 14.5H20"
            stroke={color}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="8" cy="12.5" r="1.2" fill={color} />
          <Circle cx="16" cy="12.5" r="1.2" fill={color} />
        </Svg>
      );

    case 'ai-spark':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Defs>
            <LinearGradient id="goldAi" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0%" stopColor={secondaryColor} />
              <Stop offset="100%" stopColor={secondaryColor} />
            </LinearGradient>
          </Defs>
          <Path
            d="M12 2L13.8 8.2L20 10L13.8 11.8L12 18L10.2 11.8L4 10L10.2 8.2L12 2Z"
            fill="url(#goldAi)"
          />
          <Path
            d="M18 16L19 19L22 20L19 21L18 24L17 21L14 20L17 19L18 16Z"
            fill={secondaryColor}
            opacity={0.8}
          />
        </Svg>
      );

    case 'trophy':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 4H18V10C18 13.3 15.3 16 12 16C8.7 16 6 13.3 6 10V4Z"
            stroke={secondaryColor}
            strokeWidth={1.6}
            strokeLinejoin="round"
          />
          <Path d="M6 6H3C2.4 6 2 6.4 2 7V9C2 10.7 3.3 12 5 12H6" stroke={secondaryColor} strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M18 6H21C21.6 6 22 6.4 22 7V9C22 10.7 20.7 12 19 12H18" stroke={secondaryColor} strokeWidth={1.4} strokeLinecap="round" />
          <Path d="M12 16V19M8 20H16" stroke={secondaryColor} strokeWidth={1.6} strokeLinecap="round" />
        </Svg>
      );

    case 'pitch':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="4" width="18" height="16" rx="2" stroke={color} strokeWidth={1.5} />
          <Path d="M3 12H21" stroke={color} strokeWidth={1.3} />
          <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={1.3} />
          <Path d="M8 4V7H16V4M8 20V17H16V20" stroke={color} strokeWidth={1.2} />
        </Svg>
      );

    case 'location-pin':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 21C12 21 18 15.4 18 10C18 6.7 15.3 4 12 4C8.7 4 6 6.7 6 10C6 15.4 12 21 12 21Z"
            stroke={color}
            strokeWidth={1.6}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <Circle cx="12" cy="10" r="2.5" fill={color} />
        </Svg>
      );

    case 'calendar':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="5" width="18" height="16" rx="2.5" stroke={color} strokeWidth={1.6} />
          <Path d="M3 9.5H21" stroke={color} strokeWidth={1.4} />
          <Path d="M8 3V6M16 3V6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
          <Circle cx="8" cy="14" r="1" fill={color} />
          <Circle cx="12" cy="14" r="1" fill={color} />
          <Circle cx="16" cy="14" r="1" fill={color} />
        </Svg>
      );

    case 'stats':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M4 19.5H20" stroke={color} strokeWidth={1.5} strokeLinecap="round" />
          <Rect x="6" y="11" width="3" height="7" rx="1" fill={color} opacity={0.6} />
          <Rect x="11" y="7" width="3" height="11" rx="1" fill={secondaryColor} />
          <Rect x="16" y="9" width="3" height="9" rx="1" fill={color} opacity={0.8} />
        </Svg>
      );

    case 'clock':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={1.5} />
          <Path d="M12 7V12L15.5 14" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    case 'whistle':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M10 6C6.7 6 4 8.7 4 12C4 15.3 6.7 18 10 18C12.5 18 14.6 16.5 15.5 14.3L19 15.5V11.5L16 11V6H10Z"
            stroke={color}
            strokeWidth={1.5}
            strokeLinejoin="round"
          />
          <Circle cx="9.5" cy="12" r="1.5" fill={color} />
        </Svg>
      );

    case 'share':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path d="M4 12V20H20V12M12 4V16M12 4L7 9M12 4L17 9" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      );

    default:
      return null;
  }
};
