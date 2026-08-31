import React from 'react';
import { View, StyleSheet } from 'react-native';
import { JoueurScreenChrome } from './JoueurScreenChrome';
import { Icon, type IconName } from '../ui/Icon';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useJoueurSecondaryTabBack } from '../../hooks/useJoueurSecondaryTabBack';
import { PLAYER_DARK, PLAYER_DARK_RADIUS } from '../../theme/playerDarkPremium';
import { spacing } from '../../theme/designTokens';

type Props = {
  title: string;
  message: string;
  icon?: IconName;
  kicker?: string;
};

/** Écran module désactivé — copy admin via feature flags. */
export function JoueurUnavailableScreen({
  title,
  message,
  icon = 'lock',
  kicker = 'ProDay',
}: Props) {
  const theme = useJoueurTheme();
  const tabBack = useJoueurSecondaryTabBack();
  const { goBackTab, setActiveTab } = useTabNavigation();

  const handleBack = () => {
    if (tabBack.showBack) {
      goBackTab();
      return;
    }
    setActiveTab('plus');
  };

  return (
    <JoueurScreenChrome variant="page" kicker={kicker} title={title} hideHero>
      <View style={styles.body}>
        <View
          style={[
            styles.iconPlate,
            {
              borderColor: `${theme.accent}44`,
              backgroundColor: theme.surface,
            },
          ]}
        >
          <Icon name={icon} size={40} color={theme.accent} variant="outline" />
        </View>
        <ProDayText variant="title" style={styles.title}>
          {title}
        </ProDayText>
        <ProDayText variant="caption" style={styles.message}>
          {message}
        </ProDayText>
        <PressableSpring onPress={handleBack} scaleTo={0.97} haptic style={styles.backBtn}>
          <ProDayText variant="caption" style={[styles.backText, { color: theme.accent }]}>
            Retour
          </ProDayText>
        </PressableSpring>
      </View>
    </JoueurScreenChrome>
  );
}

const styles = StyleSheet.create({
  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.md,
  },
  iconPlate: {
    width: 88,
    height: 88,
    borderRadius: PLAYER_DARK_RADIUS.card,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    color: PLAYER_DARK.text,
    fontWeight: '800',
    textAlign: 'center',
  },
  message: {
    color: PLAYER_DARK.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    maxWidth: 320,
  },
  backBtn: {
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: PLAYER_DARK_RADIUS.pill,
    borderWidth: 1,
    borderColor: PLAYER_DARK.border,
    backgroundColor: PLAYER_DARK.surface,
  },
  backText: {
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});
