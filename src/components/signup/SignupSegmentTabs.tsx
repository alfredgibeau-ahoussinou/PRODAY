import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Platform, ScrollView } from 'react-native';
import { PressableSpring } from '../motion';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import { spacing, radius } from '../../theme/designTokens';
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
 * Segments inscription — pilules scrollables (évite les libellés collés sur petit écran).
 */
export function SignupSegmentTabs<T extends string>({
  tabs,
  active,
  onSelect,
  compact,
}: SignupSegmentTabsProps<T>) {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const accent = c.accent;

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
                on && { backgroundColor: accent, borderColor: accent },
              ]}
              onPress={() => onSelect(tab.id)}
              scaleTo={0.97}
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
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.pill,
      borderWidth: 1.5,
      borderColor: c.borderStrong,
      backgroundColor: c.surfaceMuted,
      minHeight: 44,
      justifyContent: 'center',
    },
    pillCompact: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      minHeight: 40,
    },
    pillLabel: {
      fontSize: 14,
      fontWeight: '700',
      color: c.textSecondary,
      letterSpacing: 0.1,
      textAlign: 'center',
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    pillLabelCompact: {
      fontSize: 13,
    },
    pillLabelOn: {
      color: c.brandInverse,
      fontWeight: '800',
    },
  });
}
