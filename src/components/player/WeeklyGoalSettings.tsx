import React, { useState } from 'react';
import { View, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { AnimatedEntrance } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { usePlayerThemeColors } from '../../context/PlayerThemeContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';

const TARGETS = [1, 2, 3, 4, 5, 6, 7] as const;

interface WeeklyGoalSettingsProps {
  target: number;
  sessionCount: number;
  onChangeTarget: (target: number) => Promise<void>;
}

/** Réglage objectif séances hebdomadaires (1–7) — alimente la progression carrière. */
export const WeeklyGoalSettings: React.FC<WeeklyGoalSettingsProps> = ({
  target,
  sessionCount,
  onChangeTarget,
}) => {
  const { colors } = useAppTheme();
  const playerColors = usePlayerThemeColors();
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);

  const handleSelect = async (value: number) => {
    if (value === target || saving) return;
    setSaving(true);
    try {
      await onChangeTarget(value);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatedEntrance kind="fadeUp">
      <GlassCard variant="default" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.copy}>
            <ProDayText variant="caption" muted style={styles.eyebrow}>
              {t('career.weekly.title')}
            </ProDayText>
            <ProDayText variant="body">{t('career.weekly.subtitle', { count: target })}</ProDayText>
          </View>
          {saving ? <ActivityIndicator size="small" color={playerColors.accent} /> : null}
        </View>

        <ProDayText variant="caption" muted>
          {t('career.weekly.progress', { done: sessionCount, target })}
        </ProDayText>

        <View style={styles.chips}>
          {TARGETS.map((value) => {
            const selected = value === target;
            return (
              <Pressable
                key={value}
                disabled={saving}
                onPress={() => void handleSelect(value)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: selected ? playerColors.accentSoft : colors.surfaceMuted,
                    borderColor: selected ? playerColors.accent : colors.border,
                  },
                ]}
              >
                <ProDayText variant="caption" accent={selected} style={styles.chipText}>
                  {value}
                </ProDayText>
              </Pressable>
            );
          })}
        </View>
      </GlassCard>
    </AnimatedEntrance>
  );
};

const styles = StyleSheet.create({
  card: { padding: spacing.lg, gap: spacing.sm, marginBottom: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  copy: { flex: 1, gap: 2 },
  eyebrow: { textTransform: 'uppercase', letterSpacing: 1, fontSize: 9 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.xs },
  chip: {
    minWidth: 36,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    borderRadius: radius.pill,
    borderWidth: 1,
    alignItems: 'center',
  },
  chipText: { fontWeight: '800' },
});
