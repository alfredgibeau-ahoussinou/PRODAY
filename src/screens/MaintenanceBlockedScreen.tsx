import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Icon } from '../components/ui/Icon';
import { ProDayText } from '../components/ui/ProDayText';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

type MaintenanceBlockedScreenProps = {
  message: string;
};

/** Plein écran — mode maintenance plateforme (tous sauf admins). */
export const MaintenanceBlockedScreen: React.FC<MaintenanceBlockedScreenProps> = ({
  message,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <SafeAreaView style={[styles.root, rootStyle]} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar style="light" />
      <View style={styles.content}>
        <View style={[styles.iconRing, { backgroundColor: c.brandSoft }]}>
          <Icon name="settings" size={40} color={c.brand} />
        </View>
        <ProDayText variant="title" style={styles.title}>
          Maintenance en cours
        </ProDayText>
        <ProDayText variant="body" muted style={styles.body}>
          {message.trim() ||
            'ProDay est momentanément indisponible pour maintenance. Réessayez dans quelques minutes.'}
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
