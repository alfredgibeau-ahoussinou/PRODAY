import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import {
  HEALTH_FAQ,
  HEALTH_FAQ_CATEGORIES,
} from '../../content/healthDirectory';
import { PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import type { HealthSnapshot } from '../../core/types/health';
import { HealthSummaryCard } from '../../features/home/components/HealthSummaryCard';

import type { WearableHealthMetrics } from '../../services/wearableHealth/types';

interface HealthFaqPanelProps {
  healthSnapshot?: HealthSnapshot;
  wearableConnected?: boolean;
  wearableMetrics?: WearableHealthMetrics | null;
  wearablePlatformLabel?: string;
  wearableSyncing?: boolean;
  wearableError?: string | null;
  onWearableConnect?: () => void;
  onWearableRefresh?: () => void;
}

export const HealthFaqPanel: React.FC<HealthFaqPanelProps> = ({
  healthSnapshot,
  wearableConnected,
  wearableMetrics,
  wearablePlatformLabel,
  wearableSyncing,
  wearableError,
  onWearableConnect,
  onWearableRefresh,
}) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [openId, setOpenId] = useState<string | null>(HEALTH_FAQ[0]?.id ?? null);

  const toggle = (id: string) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <View style={styles.root}>
      {healthSnapshot ? (
        <HealthSummaryCard
          health={healthSnapshot}
          wearableConnected={wearableConnected}
          wearableMetrics={wearableMetrics}
          wearablePlatformLabel={wearablePlatformLabel}
          wearableSyncing={wearableSyncing}
          wearableError={wearableError}
          onWearableConnect={onWearableConnect}
          onWearableRefresh={onWearableRefresh}
        />
      ) : null}

      <View style={[styles.intro, { borderColor: colors.border, backgroundColor: colors.surface }]}>
        <ProDayText variant="eyebrow" accent style={styles.introEyebrow}>
          FAQ santé sportive
        </ProDayText>
        <Text style={styles.introTitle}>Questions fréquentes</Text>
        <Text style={[styles.introBody, { color: colors.textSecondary }]}>
          Réponses courtes pour l’entraînement, la récupération, les blessures, la nutrition et le
          mental. Touchez une question pour afficher la réponse.
        </Text>
      </View>

      {HEALTH_FAQ_CATEGORIES.map((cat) => {
        const items = HEALTH_FAQ.filter((item) => item.category === cat.id);
        if (items.length === 0) return null;

        return (
          <View key={cat.id} style={styles.section}>
            <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{cat.label}</Text>
            <View style={[styles.list, { borderColor: colors.border, backgroundColor: colors.surface }]}>
              {items.map((item, index) => {
                const open = openId === item.id;
                const last = index === items.length - 1;
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.item,
                      !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                    ]}
                  >
                    <PressableSpring
                      style={styles.questionRow}
                      onPress={() => toggle(item.id)}
                      scaleTo={0.99}
                    >
                      <Text style={[styles.question, { color: colors.text }]}>{item.question}</Text>
                      <Icon
                        name={open ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={colors.textMuted}
                      />
                    </PressableSpring>
                    {open ? (
                      <Text style={[styles.answer, { color: colors.textSecondary }]}>
                        {item.answer}
                      </Text>
                    ) : null}
                  </View>
                );
              })}
            </View>
          </View>
        );
      })}
    </View>
  );
};

function createStyles(c: { text: string }) {
  return StyleSheet.create({
    root: { gap: spacing.md },
    intro: {
      padding: spacing.md,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      gap: spacing.xs,
    },
    introEyebrow: { marginBottom: 2 },
    introTitle: {
      fontFamily: fontFamily.extrabold,
      fontSize: 20,
      fontWeight: '800',
      color: c.text,
      letterSpacing: -0.3,
      lineHeight: 26,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    introBody: {
      fontFamily: fontFamily.regular,
      fontSize: 15,
      lineHeight: 22,
      marginTop: 2,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    section: { gap: spacing.xs },
    sectionLabel: {
      fontFamily: fontFamily.bold,
      fontSize: 11,
      fontWeight: '700',
      letterSpacing: 1.1,
      textTransform: 'uppercase',
      paddingHorizontal: spacing.xs,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    list: {
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      overflow: 'hidden',
    },
    item: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
    },
    questionRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    question: {
      flex: 1,
      fontFamily: fontFamily.semibold,
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 22,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
    answer: {
      fontFamily: fontFamily.regular,
      fontSize: 15,
      lineHeight: 23,
      marginTop: spacing.sm,
      paddingRight: spacing.lg,
      ...Platform.select({ android: { includeFontPadding: false } }),
    },
  });
}
