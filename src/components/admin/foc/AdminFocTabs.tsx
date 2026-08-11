import React, { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { adminChrome, adminType } from '../../../theme/adminTheme';
import { spacing } from '../../../theme/designTokens';

type Tab = { id: string; label: string };

type Props = {
  tabs: Tab[];
  value: string;
  onChange: (id: string) => void;
};

export function AdminFocTabs({ tabs, value, onChange }: Props) {
  const styles = useMemo(() => createStyles(), []);
  if (tabs.length <= 1) return null;
  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {tabs.map((tab) => {
          const on = tab.id === value;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onChange(tab.id)}
              style={[styles.chip, on && styles.chipOn]}
              hitSlop={6}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{tab.label}</Text>
              {on ? <View style={styles.underline} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

function createStyles() {
  return StyleSheet.create({
    wrap: {
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: adminChrome.shellBorder,
      backgroundColor: adminChrome.shell,
    },
    row: {
      paddingHorizontal: spacing.md,
      paddingTop: 4,
      gap: 4,
      flexDirection: 'row',
      alignItems: 'stretch',
    },
    chip: {
      paddingHorizontal: 12,
      paddingTop: 10,
      paddingBottom: 12,
      minHeight: 40,
      justifyContent: 'center',
      position: 'relative',
    },
    chipOn: {},
    chipText: {
      color: adminChrome.textMuted,
      fontFamily: adminType.bodyBold,
      fontWeight: '700',
      fontSize: 13,
      letterSpacing: -0.1,
    },
    chipTextOn: {
      color: adminChrome.accent,
    },
    underline: {
      position: 'absolute',
      left: 10,
      right: 10,
      bottom: 0,
      height: 2,
      borderRadius: 1,
      backgroundColor: adminChrome.accent,
    },
  });
}

/** En-tête de page FOC standard. */
export function AdminFocPageHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  return (
    <View style={headerStyles.wrap}>
      <View style={headerStyles.row}>
        <View style={headerStyles.copy}>
          <Text style={headerStyles.kicker}>ProDay</Text>
          <Text style={headerStyles.title}>{title}</Text>
          {subtitle ? <Text style={headerStyles.sub}>{subtitle}</Text> : null}
        </View>
        {right ? <View style={headerStyles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const headerStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: adminChrome.shell,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: adminChrome.shellBorder,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  copy: { flex: 1, minWidth: 0, gap: 3 },
  right: { paddingTop: 6 },
  kicker: {
    color: adminChrome.accent,
    fontFamily: adminType.bodyExtra,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  title: {
    color: adminChrome.text,
    fontFamily: adminType.display,
    fontSize: 26,
    fontWeight: '800',
    letterSpacing: -0.6,
    lineHeight: 30,
  },
  sub: {
    color: adminChrome.textMuted,
    fontFamily: adminType.body,
    fontSize: 13,
    lineHeight: 18,
    marginTop: 2,
  },
});
