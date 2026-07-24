import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Icon } from '../components/ui/Icon';
import { ProDayText } from '../components/ui/ProDayText';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import {
  getPlatformFeatureMeta,
  type PlatformFeatureFlagKey,
} from '../content/platformFeatureFlags';
import type { AppColors } from '../theme/universeTheme';

type FeatureBlockedScreenProps = {
  flag: PlatformFeatureFlagKey;
  titleOverride?: string;
  messageOverride?: string;
};

/**
 * Plein écran — même UX que le mode maintenance, pour un feature flag OFF.
 * Écoute live via PlatformConfigProvider.
 */
export const FeatureBlockedScreen: React.FC<FeatureBlockedScreenProps> = ({
  flag,
  titleOverride,
  messageOverride,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const meta = getPlatformFeatureMeta(flag);
  const title = titleOverride ?? meta.disabledTitle;
  const message = messageOverride ?? meta.disabledMessage;

  return (
    <SafeAreaView style={[styles.root, rootStyle]} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={[styles.iconRing, { backgroundColor: c.brandSoft }]}>
          <Icon name="lock" size={40} color={c.brand} />
        </View>
        <ProDayText variant="title" style={styles.title}>
          {title}
        </ProDayText>
        <ProDayText variant="body" muted style={styles.body}>
          {message}
        </ProDayText>
      </View>
    </SafeAreaView>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, backgroundColor: c.background },
    content: {
      flex: 1,
      justifyContent: 'center',
      paddingHorizontal: spacing.xl,
      alignItems: 'center',
    },
    iconRing: {
      width: 88,
      height: 88,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.lg,
    },
    title: { textAlign: 'center', marginBottom: spacing.sm },
    body: { textAlign: 'center', lineHeight: 22, maxWidth: 360 },
  });
}
