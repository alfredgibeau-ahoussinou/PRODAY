import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Icon } from '../ui/Icon';
import type { IconName } from '../ui/iconNames';
import type { BusTripStatus, TransportMode } from '../../models/TransportLogistics';
import {
  BUS_TRIP_STATUS_LABELS,
  TRANSPORT_MODE_LABELS,
} from '../../models/TransportLogistics';
import { radius, spacing } from '../../theme/designTokens';

interface TransportBadgeProps {
  mode?: TransportMode;
  status?: BusTripStatus;
  size?: 'sm' | 'md';
}

export const TransportBadge: React.FC<TransportBadgeProps> = ({
  mode,
  status,
  size = 'md',
}) => {
  if (status) {
    let bg = 'rgba(255, 255, 255, 0.08)';
    let text = '#E2E8F0';
    let icon: IconName = 'time';

    switch (status) {
      case 'boarding_open':
        bg = 'rgba(59, 130, 246, 0.2)';
        text = '#60A5FA';
        icon = 'people';
        break;
      case 'departed':
        bg = 'rgba(16, 185, 129, 0.2)';
        text = '#34D399';
        icon = 'bus';
        break;
      case 'delayed':
        bg = 'rgba(239, 68, 68, 0.2)';
        text = '#F87171';
        icon = 'warning';
        break;
      case 'return_started':
        bg = 'rgba(168, 85, 247, 0.2)';
        text = '#C084FC';
        icon = 'swap-horizontal';
        break;
      case 'arrived':
        bg = 'rgba(34, 197, 94, 0.2)';
        text = '#4ADE80';
        icon = 'checkmark-circle';
        break;
      case 'cancelled':
        bg = 'rgba(156, 163, 175, 0.2)';
        text = '#9CA3AF';
        icon = 'close';
        break;
      case 'scheduled':
      default:
        bg = 'rgba(255, 255, 255, 0.1)';
        text = '#CBD5E1';
        icon = 'time';
        break;
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }, size === 'sm' && styles.badgeSm]}>
        <Icon name={icon} size={size === 'sm' ? 12 : 14} color={text} />
        <Text style={[styles.label, { color: text }, size === 'sm' && styles.labelSm]}>
          {BUS_TRIP_STATUS_LABELS[status] || status}
        </Text>
      </View>
    );
  }

  if (mode) {
    let bg = 'rgba(255, 255, 255, 0.08)';
    let text = '#E2E8F0';
    let icon: IconName = 'car';

    switch (mode) {
      case 'bus_only':
        bg = 'rgba(59, 130, 246, 0.2)';
        text = '#60A5FA';
        icon = 'bus';
        break;
      case 'carpool_only':
        bg = 'rgba(16, 185, 129, 0.2)';
        text = '#34D399';
        icon = 'car';
        break;
      case 'mixed':
        bg = 'rgba(245, 158, 11, 0.2)';
        text = '#FBBF24';
        icon = 'swap-horizontal';
        break;
      case 'individual':
        bg = 'rgba(148, 163, 184, 0.2)';
        text = '#94A3B8';
        icon = 'person';
        break;
    }

    return (
      <View style={[styles.badge, { backgroundColor: bg }, size === 'sm' && styles.badgeSm]}>
        <Icon name={icon} size={size === 'sm' ? 12 : 14} color={text} />
        <Text style={[styles.label, { color: text }, size === 'sm' && styles.labelSm]}>
          {TRANSPORT_MODE_LABELS[mode] || mode}
        </Text>
      </View>
    );
  }

  return null;
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: radius.pill ?? 999,
    alignSelf: 'flex-start',
  },
  badgeSm: {
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  labelSm: {
    fontSize: 11,
  },
});
