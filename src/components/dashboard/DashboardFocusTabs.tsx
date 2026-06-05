import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../discover/PressableSpring';
import { colors, spacing, radius } from '../../theme/designTokens';

export type DashboardFocusId = 'priorities' | 'calendar';

interface DashboardFocusTabsProps {
  active: DashboardFocusId;
  onChange: (id: DashboardFocusId) => void;
  tabs?: { id: DashboardFocusId; label: string }[];
}

const DEFAULT_TABS: { id: DashboardFocusId; label: string }[] = [
  { id: 'priorities', label: 'Priorités' },
  { id: 'calendar', label: 'Planning' },
];

export const DashboardFocusTabs: React.FC<DashboardFocusTabsProps> = ({
  active,
  onChange,
  tabs = DEFAULT_TABS,
}) => (
  <View style={styles.row}>
    {tabs.map((tab) => {
      const on = tab.id === active;
      return (
        <PressableSpring
          key={tab.id}
          style={[styles.chip, on && styles.chipOn]}
          onPress={() => onChange(tab.id)}
          scaleTo={0.96}
        >
          <Text style={[styles.label, on && styles.labelOn]}>{tab.label}</Text>
        </PressableSpring>
      );
    })}
  </View>
);

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    backgroundColor: colors.surfaceMuted,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.pill,
  },
  chipOn: {
    backgroundColor: colors.surface,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted },
  labelOn: { fontWeight: '800', color: colors.text },
});
