import React, { useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

interface ProfileAvatarButtonProps {
  displayName: string;
  avatarUrl?: string;
  uploading?: boolean;
  onPress: () => void;
  size?: number;
}

export const ProfileAvatarButton: React.FC<ProfileAvatarButtonProps> = ({
  displayName,
  avatarUrl,
  uploading,
  onPress,
  size = 96,
}) => {
  const { colors: c } = useAppTheme();
  const profile = useSessionProfile();
  const isPlayer = profile?.role === 'player';
  const joueurTheme = useJoueurTheme();
  const accent = isPlayer ? joueurTheme.accent : c.brand;
  const accentInverse = isPlayer ? '#FFFFFF' : c.brandInverse;
  const styles = useMemo(() => createStyles(c, accent, accentInverse), [c, accent, accentInverse]);
  const letter = displayName.trim().charAt(0).toUpperCase() || '?';
  const compact = size < 56;
  const badgeSize = compact ? 22 : 30;
  const badgeIcon = compact ? 11 : 14;

  return (
    <TouchableOpacity
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2 },
        compact && styles.wrapCompact,
      ]}
      onPress={onPress}
      disabled={uploading}
      activeOpacity={0.85}
    >
      {avatarUrl ? (
        <Image
          source={{ uri: avatarUrl }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
        />
      ) : (
        <View style={[styles.placeholder, { width: size, height: size, borderRadius: size / 2 }]}>
          <Text style={[styles.letter, { fontSize: size * 0.38 }]}>{letter}</Text>
        </View>
      )}
      <View
        style={[
          styles.badge,
          {
            width: badgeSize,
            height: badgeSize,
            borderRadius: badgeSize / 2,
          },
        ]}
      >
        {uploading ? (
          <ActivityIndicator size="small" color={accentInverse} />
        ) : (
          <Icon name="image" size={badgeIcon} color={accentInverse} />
        )}
      </View>
    </TouchableOpacity>
  );
};

function createStyles(c: AppColors, accent: string, accentInverse: string) {
  return StyleSheet.create({
    wrap: {
      borderWidth: 3,
      borderColor: accent,
      overflow: 'hidden',
      backgroundColor: c.surfaceMuted,
    },
    wrapCompact: {
      borderWidth: 2,
    },
    image: { resizeMode: 'cover' },
    placeholder: {
      backgroundColor: accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    letter: { color: accentInverse, fontWeight: '900' },
    badge: {
      position: 'absolute',
      right: -1,
      bottom: -1,
      backgroundColor: accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: accentInverse,
    },
  });
}
