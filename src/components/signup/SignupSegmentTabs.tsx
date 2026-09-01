import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { PressableSpring } from '../motion';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import { spacing } from '../../theme/designTokens';
import type { AppColors } from '../../theme/universeTheme';

export interface SignupSegmentTab<T extends string = string> {
  id: T;
  label: string;
}

interface SignupSegmentTabsProps<T extends string> {
  tabs: SignupSegmentTab<T>[];
  active: T;
  onSelect: (id: T) => void;
  compact?: boolean;
}

/**
 * Segments inscription — pilules scrollables modernes or et verre dépoli.
 */
export function SignupSegmentTabs<T extends string>({
  tabs,
  active,
  onSelect,
  compact,
}: SignupSegmentTabsProps<T>) {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);

  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      >
        {tabs.map((tab) => {
          const on = tab.id === active;
          return (
            <PressableSpring
              key={tab.id}
              style={[
                styles.pill,
                compact && styles.pillCompact,
                on && styles.pillOn,
              ]}
              onPress={() => onSelect(tab.id)}
              scaleTo={0.96}
            >
              <Text
                style={[
                  styles.pillLabel,
                  compact && styles.pillLabelCompact,
                  on && styles.pillLabelOn,
                ]}
                numberOfLines={1}
                maxFontSizeMultiplier={1.05}
              >
                {tab.label}
              </Text>
            </PressableSpring>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.lg,
      width: '100%',
    },
    wrapCompact: {
      marginBottom: spacing.md,
    },
    rail: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexGrow: 1,
      gap: spacing.sm,
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.xs,
    },
    pill: {
      paddingVertical: 10,
      paddingHorizontal: 20,
      borderRadius: 14,
      borderWidth: 1.5,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      minHeight: 46,
      justifyContent: 'center',
    },
    pillCompact: {
      paddingVertical: 8,
      paddingHorizontal: 16,
      minHeight: 40,
    },
    pillOn: {
      backgroundColor: '#F5D04A',
      borderColor: '#F5D04A',
      shadowColor: '#F5D04A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 4,
    },
    pillLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: 'rgba(255, 255, 255, 0.8)',
    },
    pillLabelCompact: {
      fontSize: 13,
    },
    pillLabelOn: {
      color: '#07100C',
      fontWeight: '900',
    },
  });
}
