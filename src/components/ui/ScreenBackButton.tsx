import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '../../context/ProductLineContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { useTranslation } from '../../context/LocaleContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';
import { radius } from '../../theme/designTokens';
import { prodayHaptics } from '../../utils/prodayHaptics';

interface ScreenBackButtonProps {
  onPress: () => void;
  accessibilityLabel?: string;
}

/** Bouton retour unifié — pill brandSoft + chevron (aligné ScreenHeader). */
export const ScreenBackButton: React.FC<ScreenBackButtonProps> = ({
  onPress,
  accessibilityLabel,
}) => {
  const { colors } = useAppTheme();
  const profile = useSessionProfile();
  const isPlayer = profile?.role === 'player';
  const joueurTheme = useJoueurTheme();
  const playerColors = usePlayerThemeColors();
  const backBg = isPlayer ? playerColors.accentSoft : colors.brandSoft;
  const backIcon = isPlayer ? joueurTheme.accent : colors.brand;
  const { t } = useTranslation();
  return (
    <Pressable
      hitSlop={12}
      onPress={() => {
        prodayHaptics.press();
        onPress();
      }}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? t('common.back')}
      style={[styles.btn, { backgroundColor: backBg }]}
    >
      <Ionicons name="chevron-back" size={22} color={backIcon} />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
