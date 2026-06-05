import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { PressableSpring } from '../discover/PressableSpring';
import { spacing, radius } from '../../theme/designTokens';
import { useAppTheme } from '../../context/ProductLineContext';

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
}) => {
  const { colors: c } = useAppTheme();

  return (
    <View
      style={[
        styles.row,
        { backgroundColor: c.surfaceMuted, borderColor: c.border },
      ]}
    >
      {tabs.map((tab) => {
        const on = tab.id === active;
        return (
          <PressableSpring
            key={tab.id}
            style={[
              styles.chip,
              on && {
                backgroundColor: c.surface,
                shadowColor: c.brand,
              },
            ]}
            onPress={() => onChange(tab.id)}
            scaleTo={0.96}
          >
            <Text
              style={[
                styles.label,
                { color: c.textMuted },
                on && { fontWeight: '800', color: c.text },
              ]}
            >
              {tab.label}
            </Text>
          </PressableSpring>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
  },
  chip: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.pill,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 1,
  },
  label: { fontSize: 13, fontWeight: '600' },
});
