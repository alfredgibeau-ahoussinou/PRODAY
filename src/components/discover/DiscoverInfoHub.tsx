import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, LayoutAnimation, Platform, UIManager } from 'react-native';
import { PRODAY_INFO_SECTIONS } from '../../content/showcaseExperience';
import { DiscoverSectionHeader } from './DiscoverSectionHeader';
import { PressableSpring } from './PressableSpring';
import { Icon } from '../ui/Icon';
import { spacing, radius } from '../../theme/designTokens';
import { useDiscoverStyles } from './discoverStyles';
import type { AppColors } from '../../theme/universeTheme';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export const DiscoverInfoHub: React.FC = () => {
  const { colors: c } = useDiscoverStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const [openId, setOpenId] = useState<string | null>(PRODAY_INFO_SECTIONS[0]?.id ?? null);

  const toggle = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={styles.wrap}>
      <DiscoverSectionHeader
        label="COMPRENDRE PRODAY"
        title="Tout savoir en un coup d'œil"
        subtitle="Tapez une section pour voir le détail et les actions clés."
      />
      {PRODAY_INFO_SECTIONS.map((section) => {
        const open = openId === section.id;
        return (
          <PressableSpring
            key={section.id}
            style={[styles.card, open && styles.cardOpen]}
            onPress={() => toggle(section.id)}
          >
            <View style={styles.head}>
              <View style={styles.headCopy}>
                <Text style={styles.title}>{section.title}</Text>
                <Text style={styles.summary}>{section.summary}</Text>
              </View>
              <Icon
                name={open ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={c.textMuted}
              />
            </View>
            {open ? (
              <View style={styles.body}>
                <Text style={styles.bodyText}>{section.body}</Text>
                <View style={styles.tips}>
                  {section.tips.map((tip) => (
                    <View key={tip} style={styles.tipRow}>
                      <View style={styles.tipDot} />
                      <Text style={styles.tipText}>{tip}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </PressableSpring>
        );
      })}
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    wrap: {
      paddingHorizontal: spacing.lg,
      marginTop: spacing.xl,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
    },
    cardOpen: {
      borderColor: c.brand,
      backgroundColor: c.surfaceMuted,
    },
    head: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    headCopy: { flex: 1 },
    title: { fontSize: 15, fontWeight: '900', color: c.text },
    summary: { fontSize: 12, color: c.brand, fontWeight: '700', marginTop: 2 },
    body: { marginTop: spacing.md, paddingTop: spacing.md, borderTopWidth: 1, borderTopColor: c.border },
    bodyText: { fontSize: 13, lineHeight: 20, color: c.textSecondary },
    tips: { marginTop: spacing.md, gap: spacing.xs },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    tipDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: c.brand,
      marginTop: 6,
    },
    tipText: { flex: 1, fontSize: 12, fontWeight: '700', color: c.text },
  });
}
