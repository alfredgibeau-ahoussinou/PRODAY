import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import { isMatchHubEligible, isInMatchWindow, resolveLiveState } from '../../utils/matchLive';
import { MatchLiveEventCard } from './MatchLiveEventCard';
import { LivePulseDot, StaggerReveal } from '../motion';
import { ProDaySurface } from '../ui/ProDaySurface';
import { MatchChapterIntro } from './MatchChapterIntro';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';

interface MatchCenterPanelProps {
  events: TeamEvent[];
  onOpenEvent: (eventId: string) => void;
}

export const MatchCenterPanel: React.FC<MatchCenterPanelProps> = ({ events, onOpenEvent }) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  const hubEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => isMatchHubEligible(e) && e.starts_at.getTime() > now - 8 * 60 * 60 * 1000)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  }, [events]);

  const liveNow = hubEvents.filter((e) => isInMatchWindow(e));
  const upcoming = hubEvents.filter((e) => !isInMatchWindow(e) && resolveLiveState(e).status === 'scheduled');

  if (hubEvents.length === 0) {
    return (
      <ProDaySurface variant="module" style={styles.empty}>
        <Icon name="football-outline" size={36} color={colors.textMuted} />
        <ProDayText variant="section">{t('matchs.center.empty.title')}</ProDayText>
        <ProDayText variant="body" muted style={styles.emptySub}>
          {t('matchs.center.empty.subtitle')}
        </ProDayText>
      </ProDaySurface>
    );
  }

  return (
    <View style={styles.wrap}>
      <MatchChapterIntro
        title={t('matchs.center.intro.title')}
        subtitle={t('matchs.center.intro.subtitle')}
      />

      {liveNow.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <LivePulseDot active size={9} color={colors.error} inactiveColor={colors.errorBg} />
            <ProDayText variant="section">{t('matchs.center.live')} ({liveNow.length})</ProDayText>
          </View>
          {liveNow.map((e, index) => (
            <StaggerReveal key={e.id} index={index}>
              <MatchLiveEventCard event={e} onPress={() => onOpenEvent(e.id)} />
            </StaggerReveal>
          ))}
        </View>
      ) : null}

      {upcoming.length > 0 ? (
        <View style={styles.section}>
          <ProDayText variant="section">{t('matchs.center.upcoming')} ({upcoming.length})</ProDayText>
          {upcoming.map((e, index) => (
            <StaggerReveal key={e.id} index={liveNow.length + index}>
              <MatchLiveEventCard event={e} onPress={() => onOpenEvent(e.id)} />
            </StaggerReveal>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  lead: { marginBottom: spacing.sm },
  section: { gap: spacing.xs },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.xl,
  },
  emptySub: { textAlign: 'center' },
});
