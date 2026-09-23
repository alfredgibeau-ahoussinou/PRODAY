import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PressableSpring } from '../motion';
import { ProDayText } from './ProDayText';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { colors } from '../../theme/designTokens';

interface OfflineCacheBannerProps {
  visible: boolean;
  onRefresh?: () => void;
  message?: string;
}

/** Bandeau SportEasy — Mode hors ligne discret & synchronisation. */
export const OfflineCacheBanner: React.FC<OfflineCacheBannerProps> = ({
  visible,
  onRefresh,
  message = 'Dernières données enregistrées',
}) => {
  const playerTheme = usePlayerThemeColors();
  const teamColor = playerTheme.accent;

  if (!visible) return null;

  return (
    <View style={styles.card}>
      <View style={styles.leftCol}>
        <Ionicons name="cloud-offline-outline" size={22} color={teamColor} />
        <View style={styles.textCol}>
          <ProDayText style={styles.title}>Mode hors ligne</ProDayText>
          <ProDayText style={styles.subtitle} numberOfLines={1}>
            {message}
          </ProDayText>
        </View>
      </View>

      <View style={styles.separator} />

      {onRefresh ? (
        <PressableSpring
          onPress={() => {
            prodayHaptics.press();
            onRefresh();
          }}
          scaleTo={0.95}
          haptic
          style={styles.syncBtn}
        >
          <Ionicons name="sync-outline" size={16} color={teamColor} />
          <ProDayText style={[styles.syncText, { color: teamColor }]}>
            Synchroniser
          </ProDayText>
        </PressableSpring>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.borderStrong,
    borderWidth: 1,
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 10,
  },
  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textCol: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 13,
    letterSpacing: -0.2,
  },
  subtitle: {
    color: '#8B8B9A',
    fontWeight: '500',
    fontSize: 11,
    marginTop: 1,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  syncBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  syncText: {
    fontWeight: '800',
    fontSize: 12.5,
  },
});


