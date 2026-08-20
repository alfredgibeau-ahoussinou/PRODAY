import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { FOOTBALL_HUB } from '../../features/footballHub/theme/footballHubTheme';

/** Retour discret vers le dock Football Hub (écrans secondaires). */
export const FootballHubBackBar: React.FC<{ label?: string }> = ({
  label = '← Accueil',
}) => {
  const { goBackTab, setActiveTab, returnTab } = useTabNavigation();
  return (
    <Pressable
      onPress={() => {
        if (returnTab) goBackTab();
        else setActiveTab('home');
      }}
      style={styles.bar}
      hitSlop={8}
    >
      <ProDayText variant="caption" style={styles.label}>
        {label}
      </ProDayText>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  bar: { paddingVertical: 8, paddingHorizontal: 4 },
  label: { color: FOOTBALL_HUB.bright, fontWeight: '600' },
});
