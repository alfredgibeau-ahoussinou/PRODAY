import React, { useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import {
  pickMentalProgram,
  programProgress,
  type HealthProgramDay,
} from '../../v3/engines/healthProgram.engine';
import { healthProgramPreferencesService } from '../../../services/healthProgramPreferences.service';
import { GlassCard } from '../../../components/aurora/GlassCard';
import { ProDayText } from '../../../components/ui/ProDayText';
import { Icon } from '../../../components/ui/Icon';
import { PressableSpring } from '../../../components/motion';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTranslation } from '../../../context/LocaleContext';
import { spacing, radius } from '../../../theme/designTokens';

type MentalProgramCardProps = {
  uid: string;
};

/** Programme mental 7 jours — toujours proposé en complément du programme physique. */
export const MentalProgramCard: React.FC<MentalProgramCardProps> = ({ uid }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const program = useMemo(() => pickMentalProgram(), []);
  const [completed, setCompleted] = useState<number[]>([]);
  const [activeDay, setActiveDay] = useState(1);

  useEffect(() => {
    void healthProgramPreferencesService.getCompletedDays(uid, 'mental').then(setCompleted);
  }, [uid]);

  const progress = programProgress(completed);
  const today: HealthProgramDay | undefined = program.days.find((d) => d.day === activeDay);

  const toggleDay = async (day: number) => {
    const next = completed.includes(day)
      ? completed.filter((d) => d !== day)
      : [...completed, day].sort((a, b) => a - b);
    setCompleted(next);
    await healthProgramPreferencesService.setCompletedDays(uid, 'mental', next);
    if (!completed.includes(day) && day < 7) setActiveDay(day + 1);
  };

  return (
    <GlassCard variant="default" style={styles.card}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
          <Icon name="heart" size={18} color={colors.accent} />
        </View>
        <View style={styles.copy}>
          <ProDayText variant="section">{program.label}</ProDayText>
          <ProDayText variant="caption" muted>
            {program.description}
          </ProDayText>
        </View>
        <ProDayText variant="caption" accent style={styles.pct}>
          {progress}%
        </ProDayText>
      </View>

      <View style={[styles.track, { backgroundColor: colors.surfaceMuted }]}>
        <View style={[styles.fill, { width: `${progress}%`, backgroundColor: colors.accentLight }]} />
      </View>

      <View style={styles.days}>
        {program.days.map((d) => {
          const done = completed.includes(d.day);
          const active = d.day === activeDay;
          return (
            <Pressable
              key={d.day}
              onPress={() => setActiveDay(d.day)}
              style={[
                styles.dayChip,
                {
                  backgroundColor: done ? colors.accentSoft : colors.surfaceMuted,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <ProDayText variant="caption" accent={done || active}>
                J{d.day}
              </ProDayText>
            </Pressable>
          );
        })}
      </View>

      {today ? (
        <View style={[styles.today, { borderColor: colors.border }]}>
          <ProDayText variant="caption" accent style={styles.todayTitle}>
            {t('mental.program.day', { n: today.day })}. {today.title}
          </ProDayText>
          <ProDayText variant="body" muted>
            {today.task} · {today.durationMin} min
          </ProDayText>
          <PressableSpring
            style={[styles.doneBtn, { backgroundColor: colors.accentSoft }]}
            onPress={() => void toggleDay(today.day)}
            scaleTo={0.96}
            haptic
          >
            <ProDayText variant="caption" accent style={styles.doneText}>
              {completed.includes(today.day) ? t('mental.program.done') : t('mental.program.markDone')}
            </ProDayText>
          </PressableSpring>
        </View>
      ) : null}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md, padding: spacing.lg, gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: { flex: 1, gap: 2 },
  pct: { fontWeight: '800' },
  track: { height: 4, borderRadius: 2, overflow: 'hidden' },
  fill: { height: '100%' },
  days: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  dayChip: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  today: { borderTopWidth: 1, paddingTop: spacing.sm, gap: 4 },
  todayTitle: { fontWeight: '800' },
  doneBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.pill,
    marginTop: spacing.xs,
  },
  doneText: { fontWeight: '800' },
});
