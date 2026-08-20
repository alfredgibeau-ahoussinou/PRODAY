import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { ProDayText } from '../../../components/ui/ProDayText';
import { FOOTBALL_HUB } from '../theme/footballHubTheme';

type Props = {
  label: string;
  country?: string;
  onPress: () => void;
};

export const HubCompetitionCard: React.FC<Props> = ({ label, country, onPress }) => (
  <Pressable onPress={onPress} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
    <ProDayText variant="body" style={styles.label} numberOfLines={2}>
      {label}
    </ProDayText>
    {country ? (
      <ProDayText variant="caption" style={styles.country}>
        {country}
      </ProDayText>
    ) : null}
  </Pressable>
);

const styles = StyleSheet.create({
  card: {
    width: 140,
    minHeight: 88,
    backgroundColor: FOOTBALL_HUB.elevated,
    borderRadius: 14,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: FOOTBALL_HUB.border,
    justifyContent: 'space-between',
  },
  pressed: { opacity: 0.88 },
  label: { color: FOOTBALL_HUB.foreground, fontWeight: '600' },
  country: { color: FOOTBALL_HUB.muted, marginTop: 8 },
});
