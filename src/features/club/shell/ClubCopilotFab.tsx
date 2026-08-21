import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableSpring } from '../../../components/motion';
import { Icon } from '../../../components/ui/Icon';
import { ClubText } from '../ui/clubUi';
import { useClubTheme } from './ClubThemeContext';
import type { ClubThemeTokens } from '../theme/clubTokens';
import { clubRadius, clubShadow, clubSpace } from '../theme/clubDesignSystem';

type Props = {
  onPress: () => void;
};

/**
 * FAB Copilote Club — remplace l’ancien chip ballon FAQ (36px football-outline).
 * Entrée premium sombre : pill gradient + libellé, au-dessus de CRÉER.
 */
export function ClubCopilotFab({ onPress }: Props) {
  const { tokens } = useClubTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  return (
    <PressableSpring
      onPress={onPress}
      scaleTo={0.94}
      haptic
      style={styles.wrap}
      accessibilityRole="button"
      accessibilityLabel="Ouvrir le copilote Club"
      accessibilityHint="Dialogue IA — confirmation avant chaque action"
      testID="club-copilot-fab"
    >
      <LinearGradient
        colors={[tokens.accent, tokens.accentDeep]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.face}
      >
        <View style={styles.sheen} pointerEvents="none" />
        <View style={styles.iconDisk}>
          <Icon name="chat" size={20} color={tokens.accent} />
        </View>
        <View style={styles.copy}>
          <ClubText variant="caption" style={styles.title}>
            Copilote
          </ClubText>
          <ClubText variant="caption" style={styles.sub} numberOfLines={1}>
            Demander
          </ClubText>
        </View>
      </LinearGradient>
    </PressableSpring>
  );
}

function createStyles(tokens: ClubThemeTokens) {
  return StyleSheet.create({
    wrap: {
      position: 'absolute',
      right: clubSpace.lg,
      bottom: 132,
      zIndex: 31,
      borderRadius: clubRadius.pill,
      ...clubShadow.accent(tokens),
    },
    face: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      minHeight: 54,
      paddingLeft: 8,
      paddingRight: 18,
      paddingVertical: 8,
      borderRadius: clubRadius.pill,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.22)',
      overflow: 'hidden',
    },
    sheen: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255,255,255,0.06)',
    },
    iconDisk: {
      width: 38,
      height: 38,
      borderRadius: 19,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.onAccent,
      borderWidth: 1,
      borderColor: 'rgba(255,255,255,0.35)',
    },
    copy: {
      gap: 1,
      paddingRight: 2,
    },
    title: {
      color: tokens.onAccent,
      fontWeight: '800',
      fontSize: 13,
      letterSpacing: 0.4,
      lineHeight: 16,
    },
    sub: {
      color: 'rgba(255,255,255,0.72)',
      fontWeight: '600',
      fontSize: 10,
      letterSpacing: 0.2,
      lineHeight: 13,
    },
  });
}
