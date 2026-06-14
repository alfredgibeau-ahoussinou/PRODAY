import React from 'react';
import Svg, { Circle, Path, Rect, G } from 'react-native-svg';

export type FootIconName =
  | 'football'
  | 'home'
  | 'search'
  | 'handshake'
  | 'chat'
  | 'trophy'
  | 'calendar'
  | 'videocam'
  | 'heart'
  | 'car'
  | 'person'
  | 'bag'
  | 'star';

type FootIconProps = {
  name: FootIconName;
  size?: number;
  color?: string;
  filled?: boolean;
};

/** Icônes foot ProDay — traits géométriques, distinctes d’Ionicons. */
export const FootIcon: React.FC<FootIconProps> = ({
  name,
  size = 24,
  color = '#0A0A0A',
  filled = false,
}) => {
  const s = size;
  const sw = filled ? 0 : 1.8;

  switch (name) {
    case 'football':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="12" r="9.5" stroke={color} strokeWidth={sw} fill={filled ? color : 'none'} />
          {!filled ? (
            <>
              <Path d="M12 4.5 L14.2 8.5 L12 11.5 L9.8 8.5 Z" stroke={color} strokeWidth={1.4} />
              <Path d="M12 12.5 L15.5 14 L17 17.5 L12 15.5 L7 17.5 L8.5 14 Z" stroke={color} strokeWidth={1.4} />
              <Path d="M4.5 12 L8.5 9.8 L11.5 12 L8.5 14.2 Z" stroke={color} strokeWidth={1.2} />
              <Path d="M19.5 12 L15.5 14.2 L12.5 12 L15.5 9.8 Z" stroke={color} strokeWidth={1.2} />
            </>
          ) : null}
        </Svg>
      );
    case 'home':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 10.5 L12 4 L20 10.5 V19.5 H4 Z"
            stroke={color}
            strokeWidth={sw}
            fill={filled ? color : 'none'}
            strokeLinejoin="round"
          />
          <Rect x="9" y="13" width="6" height="6.5" stroke={color} strokeWidth={sw} fill={filled ? '#fff' : 'none'} />
          <Path d="M2 20 H22" stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.5} />
        </Svg>
      );
    case 'search':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx="10.5" cy="10.5" r="6" stroke={color} strokeWidth={sw} fill={filled ? color : 'none'} />
          <Path d="M15 15 L20 20" stroke={color} strokeWidth={2.2} strokeLinecap="round" />
          {filled ? null : (
            <Circle cx="10.5" cy="10.5" r="2" fill={color} opacity={0.35} />
          )}
        </Svg>
      );
    case 'handshake':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M5 16 L8 13 L11 15 L14 11 L17 14 L20 11"
            stroke={color}
            strokeWidth={sw}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
          <Circle cx="6" cy="17" r="2.5" fill={filled ? color : 'none'} stroke={color} strokeWidth={sw} />
          <Circle cx="18" cy="17" r="2.5" fill={filled ? color : 'none'} stroke={color} strokeWidth={sw} />
          <Path d="M3 20 H21" stroke={color} strokeWidth={1.4} strokeLinecap="round" opacity={0.4} />
        </Svg>
      );
    case 'chat':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 5 H20 V15 H9 L5 19 V15 H4 Z"
            stroke={color}
            strokeWidth={sw}
            fill={filled ? color : 'none'}
            strokeLinejoin="round"
          />
          {!filled ? (
            <Circle cx="9" cy="10" r="1" fill={color} />
          ) : null}
          {!filled ? (
            <Circle cx="12" cy="10" r="1" fill={color} />
          ) : null}
          {!filled ? (
            <Circle cx="15" cy="10" r="1" fill={color} />
          ) : null}
        </Svg>
      );
    case 'trophy':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M7 5 H17 V10 C17 13 14.5 15 12 15 C9.5 15 7 13 7 10 Z"
            stroke={color}
            strokeWidth={sw}
            fill={filled ? color : 'none'}
          />
          <Path d="M5 7 H7 M17 7 H19 M5 7 V9 C5 11 6 12 7 12 M19 7 V9 C19 11 18 12 17 12" stroke={color} strokeWidth={sw} />
          <Path d="M10 15 V17 H14 V15 M8 19 H16" stroke={color} strokeWidth={sw} strokeLinecap="round" />
        </Svg>
      );
    case 'calendar':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x="4" y="6" width="16" height="14" rx="2" stroke={color} strokeWidth={sw} fill={filled ? color : 'none'} />
          <Path d="M4 10 H20" stroke={color} strokeWidth={sw} />
          <Path d="M8 4 V7 M16 4 V7" stroke={color} strokeWidth={sw} strokeLinecap="round" />
          {!filled ? (
            <Path d="M8 14 H16 M8 17 H13" stroke={color} strokeWidth={1.2} strokeLinecap="round" opacity={0.6} />
          ) : null}
        </Svg>
      );
    case 'videocam':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Rect x="3" y="7" width="12" height="10" rx="2" stroke={color} strokeWidth={sw} fill={filled ? color : 'none'} />
          <Path d="M15 10 L21 7 V17 L15 14 Z" stroke={color} strokeWidth={sw} fill={filled ? color : 'none'} strokeLinejoin="round" />
        </Svg>
      );
    case 'heart':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 20 C12 20 4 14.5 4 9.5 C4 6.5 6.5 4.5 9 4.5 C10.5 4.5 12 5.5 12 5.5 C12 5.5 13.5 4.5 15 4.5 C17.5 4.5 20 6.5 20 9.5 C20 14.5 12 20 12 20 Z"
            stroke={color}
            strokeWidth={sw}
            fill={filled ? color : 'none'}
            strokeLinejoin="round"
          />
        </Svg>
      );
    case 'car':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M4 14 L6 9 H18 L20 14 V18 H4 Z"
            stroke={color}
            strokeWidth={sw}
            fill={filled ? color : 'none'}
            strokeLinejoin="round"
          />
          <Circle cx="7.5" cy="18" r="1.8" stroke={color} strokeWidth={sw} fill={filled ? '#fff' : 'none'} />
          <Circle cx="16.5" cy="18" r="1.8" stroke={color} strokeWidth={sw} fill={filled ? '#fff' : 'none'} />
        </Svg>
      );
    case 'person':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={sw} fill={filled ? color : 'none'} />
          <Path
            d="M5 20 C5 16 8 14 12 14 C16 14 19 16 19 20"
            stroke={color}
            strokeWidth={sw}
            fill={filled ? color : 'none'}
            strokeLinecap="round"
          />
        </Svg>
      );
    case 'bag':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M6 8 H18 L17 20 H7 Z"
            stroke={color}
            strokeWidth={sw}
            fill={filled ? color : 'none'}
            strokeLinejoin="round"
          />
          <Path d="M9 8 V6 C9 4.5 10.5 3 12 3 C13.5 3 15 4.5 15 6 V8" stroke={color} strokeWidth={sw} />
        </Svg>
      );
    case 'star':
      return (
        <Svg width={s} height={s} viewBox="0 0 24 24" fill="none">
          <Path
            d="M12 3 L14.5 9 H21 L16 13 L18 20 L12 16 L6 20 L8 13 L3 9 H9.5 Z"
            stroke={color}
            strokeWidth={sw}
            fill={filled ? color : 'none'}
            strokeLinejoin="round"
          />
        </Svg>
      );
    default:
      return null;
  }
};

export const FOOT_ICON_NAMES = new Set<FootIconName>([
  'football',
  'home',
  'search',
  'handshake',
  'chat',
  'trophy',
  'calendar',
  'videocam',
  'heart',
  'car',
  'person',
  'bag',
  'star',
]);
