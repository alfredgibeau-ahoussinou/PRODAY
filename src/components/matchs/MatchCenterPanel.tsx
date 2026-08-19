import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import type { TeamEvent } from '../../models/TeamEvent';
import { EVENT_TYPE_LABELS, countRsvpYes, getPendingInviteeUids } from '../../models/TeamEvent';
import {
  isMatchHubEligible,
  isInMatchWindow,
  resolveLiveState,
  MATCH_LIVE_STATUS_LABELS,
} from '../../utils/matchLive';
import { formatCalendarDate } from '../../utils/seasonCalendar';
import { MatchLiveEventCard } from './MatchLiveEventCard';
import { LivePulseDot, StaggerReveal, PressableSpring } from '../motion';
import { ProDayText } from '../ui/ProDayText';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { MATCH_SITE } from '../../content/matchPageIdentity';
import { spacing } from '../../theme/designTokens';
import {
  MatchEmptyState,
  MatchKpiRow,
  MatchLightPanel,
  useMatchSkinTokens,
} from './matchCenterUi';

interface MatchCenterPanelProps {
  events: TeamEvent[];
  onOpenEvent: (eventId: string) => void;
  onCreateEvent?: () => void;
}

/** Centre match — cockpit live / à venir (score, compo, hub). */
export const MatchCenterPanel: React.FC<MatchCenterPanelProps> = ({
  events,
  onOpenEvent,
  onCreateEvent,
}) => {
  const { colors } = useAppTheme();
  const skin = useMatchSkinTokens();
  const accent = skin.joueurSkin ? skin.accent : colors.accent;
  const liveColor = skin.live;
  const { t } = useTranslation();

  const hubEvents = useMemo(() => {
    const now = Date.now();
    return events
      .filter((e) => isMatchHubEligible(e) && e.starts_at.getTime() > now - 8 * 60 * 60 * 1000)
      .sort((a, b) => a.starts_at.getTime() - b.starts_at.getTime());
  }, [events]);

  const liveNow = hubEvents.filter((e) => isInMatchWindow(e));
  const upcoming = hubEvents.filter(
    (e) => !isInMatchWindow(e) && resolveLiveState(e).status === 'scheduled',
  );
  const finishedToday = hubEvents.filter((e) => resolveLiveState(e).status === 'finished');

  const featured = liveNow[0] ?? upcoming[0] ?? null;
  const featuredLive = featured ? isInMatchWindow(featured) : false;

  if (hubEvents.length === 0) {
    return (
      <MatchEmptyState
        title={t('matchs.center.empty.title')}
        body={t('matchs.center.empty.subtitle')}
        cta={onCreateEvent ? 'Créer un événement' : undefined}
        onPress={onCreateEvent}
      />
    );
  }

  return (
    <View style={styles.wrap}>
      <MatchChapterHero
        title={t('matchs.center.intro.title')}
        subtitle={t('matchs.center.intro.subtitle')}
      />

      <MatchKpiRow
        items={[
          {
            label: t('matchs.center.live'),
            value: String(liveNow.length),
            tone: liveNow.length > 0 ? liveColor : skin.muted,
          },
          {
            label: t('matchs.center.upcoming'),
            value: String(upcoming.length),
            tone: accent,
          },
          {
            label: 'Terminés',
            value: String(finishedToday.length),
            tone: skin.muted,
          },
        ]}
      />

      {featured ? (
        <StaggerReveal index={0}>
          <FeaturedMatchCard
            event={featured}
            isLive={featuredLive}
            onPress={() => onOpenEvent(featured.id)}
          />
        </StaggerReveal>
      ) : null}

      {liveNow.length > 0 ? (
        <View style={styles.section}>
          <View style={styles.sectionHead}>
            <LivePulseDot active size={8} color={liveColor} inactiveColor={colors.errorBg} />
            <ProDayText variant="caption" style={[styles.sectionKicker, { color: liveColor }]}>
              {t('matchs.center.live')} · {liveNow.length}
            </ProDayText>
          </View>
          {liveNow.map((e, index) => (
            <StaggerReveal key={e.id} index={index + 1}>
              <MatchLiveEventCard event={e} onPress={() => onOpenEvent(e.id)} />
            </StaggerReveal>
          ))}
        </View>
      ) : null}

      {upcoming.length > 0 ? (
        <View style={styles.section}>
          <ProDayText variant="caption" style={[styles.sectionKicker, { color: colors.accent }]}>
            {t('matchs.center.upcoming')} · {upcoming.length}
          </ProDayText>
          {upcoming.map((e, index) => (
            <StaggerReveal key={e.id} index={liveNow.length + index + 1}>
              <MatchLiveEventCard event={e} onPress={() => onOpenEvent(e.id)} />
            </StaggerReveal>
          ))}
        </View>
      ) : null}

      {finishedToday.length > 0 && liveNow.length === 0 ? (
        <View style={styles.section}>
          <ProDayText variant="caption" style={[styles.sectionKicker, { color: MATCH_SITE.muted }]}>
            Terminés · {finishedToday.length}
          </ProDayText>
          {finishedToday.slice(0, 4).map((e, index) => (
            <StaggerReveal key={e.id} index={upcoming.length + index + 1}>
              <MatchLiveEventCard event={e} onPress={() => onOpenEvent(e.id)} />
            </StaggerReveal>
          ))}
        </View>
      ) : null}
    </View>
  );
};

function MatchChapterHero({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useAppTheme();
  return (
    <View style={styles.hero}>
      <ProDayText variant="caption" style={[styles.kicker, { color: colors.accent }]}>
        Centre Match
      </ProDayText>
      <ProDayText variant="section" style={styles.heroTitle}>
        {title}
      </ProDayText>
      <ProDayText variant="caption" style={styles.heroSupport}>
        {subtitle}
      </ProDayText>
    </View>
  );
}

function FeaturedMatchCard({
  event,
  isLive,
  onPress,
}: {
  event: TeamEvent;
  isLive: boolean;
  onPress: () => void;
}) {
  const { colors } = useAppTheme();
  const skin = useMatchSkinTokens();
  const accent = skin.joueurSkin ? skin.accent : colors.accent;
  const liveColor = skin.live;
  const live = resolveLiveState(event);
  const confirmed = countRsvpYes(event);
  const pending = getPendingInviteeUids(event).length;
  const barColor = isLive ? liveColor : accent;

  return (
    <PressableSpring onPress={onPress} scaleTo={0.98} haptic>
      <MatchLightPanel style={styles.featured}>
        <View style={[styles.featuredBar, { backgroundColor: barColor }]} />
        <View style={styles.featuredBody}>
          <View style={styles.featuredTop}>
            <View style={styles.featuredStatus}>
              {isLive ? <LivePulseDot active size={7} color={liveColor} /> : null}
              <ProDayText
                variant="caption"
                style={[
                  styles.featuredStatusText,
                  { color: isLive ? liveColor : accent },
                ]}
              >
                {isLive
                  ? `${MATCH_LIVE_STATUS_LABELS[live.status]}${live.minute != null ? ` · ${live.minute}'` : ''}`
                  : EVENT_TYPE_LABELS[event.event_type]}
              </ProDayText>
            </View>
            <ProDayText variant="caption" style={{ color: MATCH_SITE.muted }}>
              {formatCalendarDate(event.starts_at)}
            </ProDayText>
          </View>

          <ProDayText variant="section" style={styles.featuredTitle} numberOfLines={2}>
            {event.title}
          </ProDayText>

          <View style={styles.scoreBlock}>
            <View style={styles.scoreTeam}>
              <ProDayText variant="caption" style={{ color: MATCH_SITE.muted }} numberOfLines={1}>
                {live.home_label ?? 'Domicile'}
              </ProDayText>
              <ProDayText variant="hero" style={styles.scoreNum}>
                {live.home_score}
              </ProDayText>
            </View>
            <ProDayText variant="section" style={{ color: MATCH_SITE.muted }}>
              —
            </ProDayText>
            <View style={[styles.scoreTeam, styles.scoreTeamAway]}>
              <ProDayText variant="caption" style={{ color: MATCH_SITE.muted }} numberOfLines={1}>
                {live.opponent_name ?? 'Adversaire'}
              </ProDayText>
              <ProDayText variant="hero" style={styles.scoreNum}>
                {live.away_score}
              </ProDayText>
            </View>
          </View>

          <View style={styles.featuredMeta}>
            {event.lineup ? (
              <ProDayText variant="caption" style={{ color: colors.accent, fontWeight: '700' }}>
                {event.lineup.formation}
              </ProDayText>
            ) : (
              <ProDayText variant="caption" style={{ color: MATCH_SITE.muted }}>
                Compo à poser
              </ProDayText>
            )}
            <ProDayText variant="caption" style={{ color: MATCH_SITE.muted }}>
              {confirmed} oui · {pending} en attente
            </ProDayText>
          </View>

          <ProDayText variant="caption" style={[styles.featuredCta, { color: colors.accent }]}>
            Ouvrir le hub match →
          </ProDayText>
        </View>
      </MatchLightPanel>
    </PressableSpring>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  hero: { gap: 4 },
  kicker: {
    textTransform: 'uppercase',
    letterSpacing: 2.4,
    fontSize: 10,
    fontWeight: '800',
  },
  heroTitle: {
    fontWeight: '800',
    letterSpacing: -0.5,
    fontSize: 22,
    color: MATCH_SITE.foreground,
  },
  heroSupport: { lineHeight: 18, color: MATCH_SITE.muted },
  section: { gap: spacing.xs },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionKicker: {
    textTransform: 'uppercase',
    letterSpacing: 1.8,
    fontSize: 10,
    fontWeight: '800',
  },
  featured: {
    flexDirection: 'row',
    padding: 0,
    overflow: 'hidden',
  },
  featuredBar: { width: 3 },
  featuredBody: {
    flex: 1,
    padding: spacing.md,
    gap: spacing.sm,
  },
  featuredTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  featuredStatus: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  featuredStatusText: {
    fontWeight: '800',
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  featuredTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
    color: MATCH_SITE.foreground,
  },
  scoreBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  scoreTeam: { flex: 1, gap: 4 },
  scoreTeamAway: { alignItems: 'flex-end' },
  scoreNum: {
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
    fontSize: 36,
    color: MATCH_SITE.foreground,
  },
  featuredMeta: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    alignItems: 'center',
  },
  featuredCta: { fontWeight: '800', marginTop: 2 },
});
