import React, { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Alert } from 'react-native';
import {
  SKILL_ENDORSEMENT_KEYS,
  type SkillEndorsementCounts,
  type SkillEndorsementKey,
} from '../../models/SkillEndorsement';
import { skillEndorsementsService } from '../../services/skillEndorsements.service';
import { GlassCard } from '../aurora/GlassCard';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';

interface SkillEndorsementsCardProps {
  playerUid: string;
  viewerUid?: string;
  viewerName?: string;
  clubId?: string;
  canEndorse: boolean;
}

export const SkillEndorsementsCard: React.FC<SkillEndorsementsCardProps> = ({
  playerUid,
  viewerUid,
  viewerName,
  clubId,
  canEndorse,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [counts, setCounts] = useState<SkillEndorsementCounts | null>(null);
  const [mine, setMine] = useState<Partial<Record<SkillEndorsementKey, boolean>>>({});
  const [busy, setBusy] = useState<SkillEndorsementKey | null>(null);

  const refresh = useCallback(async () => {
    const next = await skillEndorsementsService.countsForPlayer(playerUid);
    setCounts(next);
    if (viewerUid && canEndorse) {
      const flags: Partial<Record<SkillEndorsementKey, boolean>> = {};
      await Promise.all(
        SKILL_ENDORSEMENT_KEYS.map(async (skill) => {
          flags[skill] = await skillEndorsementsService.hasEndorsed(viewerUid, playerUid, skill);
        })
      );
      setMine(flags);
    }
  }, [canEndorse, playerUid, viewerUid]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const toggle = async (skill: SkillEndorsementKey) => {
    if (!canEndorse || !viewerUid || !viewerName || busy) return;
    setBusy(skill);
    try {
      if (mine[skill]) {
        await skillEndorsementsService.revoke(viewerUid, playerUid, skill);
      } else {
        await skillEndorsementsService.endorse({
          endorser_uid: viewerUid,
          endorser_name: viewerName,
          endorsed_uid: playerUid,
          skill,
          club_id: clubId,
        });
      }
      await refresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    } finally {
      setBusy(null);
    }
  };

  if (!counts) return null;

  return (
    <GlassCard variant="default" style={styles.card}>
      <ProDayText variant="section">{t('pulse.endorsements.title')}</ProDayText>
      <ProDayText variant="caption" muted style={styles.sub}>
        {t('pulse.endorsements.subtitle')}
      </ProDayText>
      <View style={styles.wrap}>
        {SKILL_ENDORSEMENT_KEYS.map((skill) => {
          const active = !!mine[skill];
          return (
            <PressableSpring
              key={skill}
              onPress={() => void toggle(skill)}
              disabled={!canEndorse || busy === skill}
              scaleTo={0.96}
              haptic={canEndorse}
              style={[
                styles.chip,
                {
                  borderColor: active ? colors.accent : colors.border,
                  backgroundColor: active ? colors.accentSoft : colors.surfaceMuted,
                  opacity: canEndorse ? 1 : 0.9,
                },
              ]}
            >
              <ProDayText variant="caption" accent={active} style={{ fontWeight: '700' }}>
                {t(`pulse.skill.${skill}`)}
              </ProDayText>
              <ProDayText variant="caption" muted>
                {counts[skill]}
              </ProDayText>
            </PressableSpring>
          );
        })}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  sub: { marginBottom: spacing.sm },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});
