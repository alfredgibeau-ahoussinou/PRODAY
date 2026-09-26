import React from 'react';
import {
  Alert,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import { useParentShellNav } from '../../features/parent/shell/ParentShellNavContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTabNavigationOptional } from '../../context/TabNavigationContext';
import { radius } from '../../theme/designTokens';
import { prodayHaptics } from '../../utils/prodayHaptics';

export interface AppBackButtonProps {
  /** Libellé du bouton — défaut « Retour » */
  label?: string;
  /** Action personnalisée de retour */
  onPress?: () => void;
  /**
   * Callback avant retour — peut être synchrone ou asynchrone,
   * ou prendre un callback `proceed()`.
   * Si `onBeforeBack` retourne `false`, une alerte de confirmation s'affiche.
   */
  onBeforeBack?:
    | ((proceed: () => void) => void)
    | (() => boolean | Promise<boolean> | void);
  /** Indique s'il y a des modifications en attente d'enregistrement */
  hasUnsavedChanges?: boolean;
  /** Titre de l'alerte en cas de modifications non sauvegardées */
  unsavedTitle?: string;
  /** Message de l'alerte en cas de modifications non sauvegardées */
  unsavedMessage?: string;
  /** Destination de repli en l'absence d'historique */
  fallbackNavId?: string;
  /** Accessibilité */
  accessibilityLabel?: string;
  /** Style du conteneur pressable */
  style?: StyleProp<ViewStyle>;
  /** Style du texte du libellé */
  textStyle?: StyleProp<TextStyle>;
  /** Couleur personnalisée pour l'icône et le texte */
  color?: string;
  /** Afficher uniquement l'icône chevron (garde min touch target 44pt) */
  iconOnly?: boolean;
}

/**
 * Bouton Retour unifié ProDay :
 * - Libellé explicite « Retour » avec icône chevron arrière.
 * - Cible tactile >= 44pt (Apple Human Interface Guidelines & Material).
 * - Contraste élevé adapté au thème actif (sombre ou clair).
 * - Déclenchement de `shellNav.goBack()` avec repli propre.
 * - Prise en charge d'avertissement en cas de modifications non enregistrées.
 */
export const AppBackButton: React.FC<AppBackButtonProps> = ({
  label = 'Retour',
  onPress,
  onBeforeBack,
  hasUnsavedChanges = false,
  unsavedTitle = 'Modifications non enregistrées',
  unsavedMessage = 'Quitter sans enregistrer vos modifications ?',
  fallbackNavId,
  accessibilityLabel,
  style,
  textStyle,
  color,
  iconOnly = false,
}) => {
  const shellNav = useCoachShellNav();
  const clubNav = useClubShellNav();
  const parentNav = useParentShellNav();
  const coachTheme = useCoachTheme();
  const clubTheme = useClubTheme();
  const appTheme = useAppTheme();
  const tabNav = useTabNavigationOptional();

  // Contraste élevé : dérivé des tokens du coach, club ou du thème d'application
  const tokens = coachTheme?.tokens;
  const isLight = tokens?.isLight ?? (appTheme as any)?.isLight ?? false;

  const bg = isLight
    ? tokens?.elevated ?? appTheme?.colors?.surface ?? '#E5E5EA'
    : tokens?.surface ?? clubTheme?.tokens?.surface ?? '#1C1C24';
  const border = isLight
    ? tokens?.border ?? appTheme?.colors?.border ?? '#D1D1D6'
    : tokens?.border ?? clubTheme?.tokens?.border ?? 'rgba(255, 255, 255, 0.16)';
  const textColor = color ?? (isLight ? '#000000' : '#FFFFFF');

  const executeBack = () => {
    if (onPress) {
      onPress();
      return;
    }
    if (shellNav) {
      if (shellNav.canGoBack && shellNav.goBack) {
        shellNav.goBack();
        return;
      }
      if (fallbackNavId) {
        shellNav.requestNav(fallbackNavId as any);
        return;
      }
      if (shellNav.goBack) {
        shellNav.goBack();
        return;
      }
    }
    if (clubNav) {
      if (clubNav.canGoBack && clubNav.goBack) {
        clubNav.goBack();
        return;
      }
      if (fallbackNavId) {
        clubNav.requestNav(fallbackNavId as any);
        return;
      }
      if (clubNav.goBack) {
        clubNav.goBack();
        return;
      }
    }
    if (parentNav) {
      if (parentNav.canGoBack && parentNav.goBack) {
        parentNav.goBack();
        return;
      }
      if (fallbackNavId) {
        parentNav.requestNav(fallbackNavId as any);
        return;
      }
      if (parentNav.goBack) {
        parentNav.goBack();
        return;
      }
    }
    if (tabNav?.returnTab) {
      tabNav.goBackTab();
      return;
    }
    if (tabNav && fallbackNavId) {
      tabNav.setActiveTab(fallbackNavId as any);
      return;
    }
  };

  const confirmUnsavedAndProceed = (proceedFn: () => void) => {
    Alert.alert(unsavedTitle, unsavedMessage, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Quitter sans enregistrer',
        style: 'destructive',
        onPress: proceedFn,
      },
    ]);
  };

  const handlePress = async () => {
    prodayHaptics.press();

    if (hasUnsavedChanges) {
      confirmUnsavedAndProceed(executeBack);
      return;
    }

    if (onBeforeBack) {
      if (onBeforeBack.length > 0) {
        // onBeforeBack prend un callback proceed
        (onBeforeBack as (proceed: () => void) => void)(executeBack);
        return;
      }
      const canLeave = await (onBeforeBack as () => boolean | Promise<boolean> | void)();
      if (canLeave === false) {
        confirmUnsavedAndProceed(executeBack);
        return;
      }
    }

    executeBack();
  };

  return (
    <Pressable
      hitSlop={8}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: bg,
          borderColor: border,
        },
        iconOnly && styles.buttonIconOnly,
        pressed && styles.pressed,
        style,
      ]}
    >
      <Ionicons
        name="chevron-back"
        size={20}
        color={textColor}
        style={!iconOnly ? styles.chevronWithText : undefined}
      />
      {!iconOnly && (
        <Text style={[styles.label, { color: textColor }, textStyle]}>
          {label}
        </Text>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    minHeight: 44,
    minWidth: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  buttonIconOnly: {
    paddingHorizontal: 10,
    width: 44,
  },
  pressed: {
    opacity: 0.72,
    transform: [{ scale: 0.98 }],
  },
  chevronWithText: {
    marginRight: 4,
    marginLeft: -2,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
});
