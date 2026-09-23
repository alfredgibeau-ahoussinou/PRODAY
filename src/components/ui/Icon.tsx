import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ProductLineContext';
import { FootIcon, FOOT_ICON_NAMES, type FootIconName } from './footIcons/FootIcon';
import type { IconName } from './iconNames';

export type { IconName } from './iconNames';

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
  gift: 'gift-outline',
  hamburger: 'menu-outline',
  'stats-chart': 'stats-chart-outline',
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
  'ellipsis-horizontal': 'ellipsis-horizontal',
  settings: 'options-outline',
  add: 'add',
  close: 'close',
  play: 'play',
  pause: 'pause',
  expand: 'expand-outline',
  contract: 'contract-outline',
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
  'log-out': 'log-out-outline',
  help: 'help-circle-outline',
  'swap-horizontal': 'swap-horizontal-outline',
  trash: 'trash-outline',
  flag: 'flag-outline',
  refresh: 'reload-outline',
  flash: 'flash-outline',
  grid: 'grid-outline',
  chatbubbles: 'chatbubbles-outline',
  sparkles: 'sparkles-outline',
  list: 'list-outline',
  'document-text': 'document-text-outline',
  mic: 'mic-outline',
  fitness: 'fitness-outline',
  'cloud-upload': 'cloud-upload-outline',
  download: 'download-outline',
  bus: 'bus-outline',
};

const FILLED_MAP: Partial<Record<IconName, keyof typeof Ionicons.glyphMap>> = {
  home: 'home',
  search: 'search',
  bus: 'bus',
  chat: 'chatbubbles',
  person: 'person',
  handshake: 'people',
  car: 'car',
  calendar: 'calendar',
  shield: 'shield-checkmark',
  trophy: 'trophy',
  bag: 'bag',
  people: 'people',
  gift: 'gift',
  hamburger: 'menu',
  'stats-chart': 'stats-chart',
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
