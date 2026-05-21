import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/designTokens';

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
  | 'menu'
  | 'settings'
  | 'add'
  | 'close'
  | 'share'
  | 'star'
  | 'star-outline'
  | 'image'
  | 'people'
  | 'business'
  | 'trophy'
  | 'star-four-points'
  | 'lock';

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
  menu: 'ellipsis-vertical',
  settings: 'options-outline',
  add: 'add',
  close: 'close',
  share: 'share-outline',
  star: 'star',
  'star-outline': 'star-outline',
  image: 'image-outline',
  people: 'people-outline',
  business: 'business-outline',
  trophy: 'trophy-outline',
  'star-four-points': 'sparkles-outline',
  lock: 'lock-closed-outline',
};

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

export const Icon: React.FC<IconProps> = ({
  name,
  size = 22,
  color = colors.brand,
}) => (
  <Ionicons name={MAP[name]} size={size} color={color} />
);
