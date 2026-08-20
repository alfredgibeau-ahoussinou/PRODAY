import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { FOOTBALL_HUB } from '../theme/footballHubTheme';

type Props = {
  label: string;
  onPress: () => void;
  active?: boolean;
};

export const HubClubChip: React.FC<Props> = ({ label, onPress, active }) => (
  <Pressable
    onPress={onPress}
    style={({ pressed }) => [
      styles.chip,
      active && styles.active,
      pressed && styles.pressed,
    ]}
  >
    <View style={styles.dot}>
      <ProDayText variant="caption" style={styles.initial}>
        {(label.trim()[0] ?? '?').toUpperCase()}
      </ProDayText>
    </View>
    <ProDayText variant="caption" style={styles.label} numberOfLines={1}>
      {label}
    </ProDayText>
  </Pressable>
);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: FOOTBALL_HUB.surface,
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
    marginRight: 8,
    maxWidth: 180,
  },
  active: {
    borderColor: FOOTBALL_HUB.accent,
    backgroundColor: FOOTBALL_HUB.soft,
  },
  pressed: { opacity: 0.85 },
  dot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: FOOTBALL_HUB.logoPlaceholder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: { color: FOOTBALL_HUB.foreground, fontWeight: '700' },
  label: { color: FOOTBALL_HUB.foreground, flexShrink: 1 },
});
