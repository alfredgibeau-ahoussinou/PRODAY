import React from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { Icon } from '../ui/Icon';
import { colors, spacing } from '../../theme/designTokens';

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
          <ActivityIndicator size="small" color={colors.brandInverse} />
        ) : (
          <Icon name="image" size={14} color={colors.brandInverse} />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 3,
    borderColor: colors.accent,
    overflow: 'hidden',
    backgroundColor: colors.surfaceMuted,
  },
  image: { resizeMode: 'cover' },
  placeholder: {
    backgroundColor: colors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  letter: { color: colors.brandInverse, fontWeight: '900' },
  badge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.brandInverse,
  },
});
