import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { SUPPORTER_SPACE } from '../../features/supporterSpace/theme/supporterSpaceTheme';

/** Barre retour pour écrans secondaires supporter (hors dock). */
export const SupporterSpaceBackBar: React.FC<{ label?: string }> = ({ label = 'Retour' }) => {
  const { goBackTab, setActiveTab } = useTabNavigation();
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={() => {
          if (goBackTab) goBackTab();
          else setActiveTab('home');
        }}
        hitSlop={12}
        style={styles.btn}
      >
        <Icon name="arrow-back" size={20} color={SUPPORTER_SPACE.foreground} />
        <ProDayText variant="body" style={styles.label}>
          {label}
        </ProDayText>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bar: { paddingHorizontal: 12, paddingVertical: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { color: SUPPORTER_SPACE.foreground },
});
