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
  const styles = useMemo(() => createStyles(c), [c]);
  const letter = displayName.trim().charAt(0).toUpperCase() || '?';

  return (
    <TouchableOpacity
      style={[styles.wrap, { width: size, height: size, borderRadius: size / 2 }]}
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
      <View style={styles.badge}>
        {uploading ? (
          <ActivityIndicator size="small" color={c.brandInverse} />
        ) : (
          <Icon name="image" size={14} color={c.brandInverse} />
        )}
      </View>
    </TouchableOpacity>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      borderWidth: 3,
      borderColor: c.brand,
      overflow: 'hidden',
      backgroundColor: c.surfaceMuted,
    },
    image: { resizeMode: 'cover' },
    placeholder: {
      backgroundColor: c.ink,
      alignItems: 'center',
      justifyContent: 'center',
    },
    letter: { color: c.brandInverse, fontWeight: '900' },
    badge: {
      position: 'absolute',
      right: 0,
      bottom: 0,
      width: 30,
      height: 30,
      borderRadius: 15,
      backgroundColor: c.brand,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: c.brandInverse,
    },
  });
}
