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
 * Segments inscription épurés et minimalistes.
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
      marginBottom: spacing.md,
      width: '100%',
    },
    wrapCompact: {
      marginBottom: spacing.sm,
    },
    rail: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      flexGrow: 1,
      gap: 8,
      paddingVertical: 2,
    },
    pill: {
      paddingVertical: 9,
      paddingHorizontal: 18,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      backgroundColor: 'rgba(255, 255, 255, 0.04)',
      minHeight: 42,
      justifyContent: 'center',
    },
    pillCompact: {
      paddingVertical: 7,
      paddingHorizontal: 14,
      minHeight: 36,
    },
    pillOn: {
      backgroundColor: '#F5D04A',
      borderColor: '#F5D04A',
    },
    pillLabel: {
      fontSize: 14,
      fontWeight: '500',
      color: 'rgba(255, 255, 255, 0.75)',
    },
    pillLabelCompact: {
      fontSize: 13,
    },
    pillLabelOn: {
      color: '#000000',
      fontWeight: '700',
    },
  });
}
