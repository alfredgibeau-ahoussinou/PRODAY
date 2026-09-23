// src/components/discipline/PlayerSuspensionBadge.tsx
// Badge d'éligibilité et de suspension disciplinaire Footclubs FFF

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { PlayerEligibilityStatus } from '../../models/PlayerDisciplinary';
import { colors as c, spacing, radius } from '../../theme/designTokens';

interface PlayerSuspensionBadgeProps {
  status: PlayerEligibilityStatus;
  size?: 'sm' | 'md';
  showLabel?: boolean;
  onPress?: () => void;
  summary?: string;
}

export const PlayerSuspensionBadge: React.FC<PlayerSuspensionBadgeProps> = ({
  status,
  size = 'md',
  showLabel = true,
  onPress,
  summary,
}) => {
  const styles = stylesStatic;

  const config = useMemo(() => {
    switch (status) {
      case 'suspended':
        return {
          color: c.error,
          bg: 'rgba(239, 68, 68, 0.12)',
          border: 'rgba(239, 68, 68, 0.35)',
          icon: 'close-circle' as const,
          label: 'Suspendu',
        };
      case 'clean':
        return {
          color: c.success,
          bg: 'rgba(34, 197, 94, 0.12)',
          border: 'rgba(34, 197, 94, 0.35)',
          icon: 'checkmark-circle' as const,
          label: 'Éligible',
        };
      case 'verification_required':
        return {
          color: c.warning,
          bg: 'rgba(245, 158, 11, 0.12)',
          border: 'rgba(245, 158, 11, 0.35)',
          icon: 'alert-circle' as const,
          label: 'À vérifier',
        };
      case 'unavailable_or_outdated':
      default:
        return {
          color: c.textMuted,
          bg: 'rgba(148, 163, 184, 0.12)',
          border: 'rgba(148, 163, 184, 0.35)',
          icon: 'help-circle' as const,
          label: 'Non synchronisé',
        };
    }
  }, [status, c]);

  const content = (
    <View
      style={[
        styles.badge,
        size === 'sm' ? styles.badgeSm : styles.badgeMd,
        {
          backgroundColor: config.bg,
          borderColor: config.border,
        },
      ]}
    >
      <Ionicons
        name={config.icon}
        size={size === 'sm' ? 12 : 15}
        color={config.color}
      />
      {showLabel && (
        <Text
          numberOfLines={1}
          style={[
            styles.label,
            size === 'sm' ? styles.labelSm : styles.labelMd,
            { color: config.color },
          ]}
        >
          {summary || config.label}
        </Text>
      )}
    </View>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Statut disciplinaire : ${config.label}. Appuyer pour ouvrir les détails.`}
        style={({ pressed }) => [
          styles.touchable,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return content;
};

const stylesStatic = StyleSheet.create({
  touchable: {
    minHeight: 32,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.75,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    borderWidth: 1,
    gap: 5,
  },
  badgeSm: {
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  badgeMd: {
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  label: {
    fontWeight: '600',
  },
  labelSm: {
    fontSize: 11,
  },
  labelMd: {
    fontSize: 12,
  },
});
