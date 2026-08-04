import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ProductLineContext';
import { FootIcon, FOOT_ICON_NAMES, type FootIconName } from './footIcons/FootIcon';

export type IconName =
  | 'home'
  | 'search'
  | 'chat'
  | 'notifications'
  | 'person'
  | 'handshake'
  | 'calendar'
  | 'location'
  | 'time'
  | 'shirt'
  | 'football'
  | 'football-outline'
  | 'walk'
  | 'car'
  | 'heart'
  | 'heart-outline'
  | 'mail'
  | 'briefcase'
  | 'bookmark'
  | 'bookmark-outline'
  | 'checkmark-circle'
  | 'warning'
  | 'shield'
  | 'school'
  | 'chevron-forward'
  | 'chevron-down'
  | 'chevron-up'
  | 'menu'
  | 'settings'
  | 'add'
  | 'close'
  | 'play'
  | 'tune'
  | 'share'
  | 'star'
  | 'star-outline'
  | 'image'
  | 'people'
  | 'business'
  | 'trophy'
  | 'star-four-points'
  | 'lock'
  | 'eye'
  | 'eye-off'
  | 'arrow-back'
  | 'alert-circle'
  | 'document'
  | 'camera'
  | 'videocam'
  | 'volume-high'
  | 'volume-mute'
  | 'bag'
  | 'globe'
  | 'call';

const FOOT_ALIAS: Partial<Record<IconName, FootIconName>> = {
  home: 'home',
  search: 'search',
  chat: 'chat',
  person: 'person',
  handshake: 'handshake',
  calendar: 'calendar',
  football: 'football',
  'football-outline': 'football',
  car: 'car',
  heart: 'heart',
  'heart-outline': 'heart',
  trophy: 'trophy',
  videocam: 'videocam',
  bag: 'bag',
  star: 'star',
  'star-four-points': 'star',
};

const MAP: Record<IconName, keyof typeof Ionicons.glyphMap> = {
  home: 'home-outline',
  search: 'search-outline',
  chat: 'chatbubble-outline',
  notifications: 'notifications-outline',
  person: 'person-outline',
  handshake: 'people-outline',
  calendar: 'calendar-outline',
  location: 'location-outline',
  time: 'time-outline',
  shirt: 'shirt-outline',
  football: 'football',
  'football-outline': 'football-outline',
  walk: 'walk-outline',
  car: 'car-outline',
  heart: 'heart',
  'heart-outline': 'heart-outline',
  mail: 'mail-outline',
  briefcase: 'briefcase-outline',
  bookmark: 'bookmark',
  'bookmark-outline': 'bookmark-outline',
  'checkmark-circle': 'checkmark-circle',
  warning: 'warning-outline',
  shield: 'shield-checkmark-outline',
  school: 'school-outline',
  'chevron-forward': 'chevron-forward',
  'chevron-down': 'chevron-down',
  'chevron-up': 'chevron-up',
  menu: 'ellipsis-vertical',
  settings: 'options-outline',
  add: 'add',
  close: 'close',
  play: 'play',
  tune: 'options-outline',
  share: 'share-outline',
  star: 'star',
  'star-outline': 'star-outline',
  image: 'image-outline',
  people: 'people-outline',
  business: 'business-outline',
  trophy: 'trophy-outline',
  'star-four-points': 'sparkles-outline',
  lock: 'lock-closed-outline',
  eye: 'eye-outline',
  'eye-off': 'eye-off-outline',
  'arrow-back': 'arrow-back',
  'alert-circle': 'alert-circle-outline',
  document: 'document-text-outline',
  camera: 'camera-outline',
  videocam: 'videocam-outline',
  'volume-high': 'volume-high',
  'volume-mute': 'volume-mute',
  bag: 'bag-outline',
  globe: 'globe-outline',
  call: 'call-outline',
};

const FILLED_MAP: Partial<Record<IconName, keyof typeof Ionicons.glyphMap>> = {
  home: 'home',
  search: 'search',
  chat: 'chatbubbles',
  person: 'person',
  handshake: 'people',
  car: 'car',
  calendar: 'calendar',
  shield: 'shield-checkmark',
  trophy: 'trophy',
  bag: 'bag',
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
  variant?: 'outline' | 'filled';
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  color,
  variant = 'outline',
}) => {
  const { colors: c } = useAppTheme();
  const resolvedColor = color ?? c.text;
  const footName = FOOT_ALIAS[name];

  if (footName && FOOT_ICON_NAMES.has(footName)) {
    return (
      <FootIcon
        name={footName}
        size={size}
        color={resolvedColor}
        filled={variant === 'filled'}
      />
    );
  }

  const glyph =
    variant === 'filled' && FILLED_MAP[name] ? FILLED_MAP[name] : MAP[name];
  return <Ionicons name={glyph} size={size} color={resolvedColor} />;
};
