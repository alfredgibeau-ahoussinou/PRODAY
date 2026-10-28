/**
 * WAVE 5 P-001 — Accueil Coach (`pages.home` + desktop `dashboard`).
 *
 * Mobile : Épinglés · Votre saison · Points clés · Préparer le terrain · À venir · Raccourcis.
 * Desktop : `desktop-dashboard` (KPIs + semaine + lower | prochain RDV + À régler + poule).
 * Données : Firebase events / RSVP réels — aucun chiffre inventé, aucun CTA factice pour un trou produit.
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CoachStandingsTable } from '../../components/coach/CoachStandingsTable';
import { clubSeasonLabelForDate } from '../../utils/clubSeason';
import { CoachPendingRsvpSheet } from '../../components/coach/CoachPendingRsvpSheet';
import {
  CoachHomeWeekStrip,
  CoachHomeAssiduiteCard,
} from '../../components/coach/CoachHomeWeekStrip';
import { CoachText } from '../../components/coach/coachPortalUi';
import { PressableScale } from '../../motion';
import { Icon } from '../../components/ui/Icon';
import type { IconName } from '../../components/ui/iconNames';
import { CoachAppleRing } from '../../components/coach/coachAppleCards';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useCoachTeamChrome } from '../../hooks/useCoachTeamChrome';
import { useCoachSquadRoster } from '../../hooks/useCoachSquadRoster';
import { teamEventsService } from '../../services/teamEvents.service';
import {
  EVENT_TYPE_LABELS,
  getPendingInviteeUids,
  isCoachMatchEvent,
  isCoachTrainingEvent,
  type TeamEvent,
} from '../../models/TeamEvent';
import {
  coachCalendarEventSummary,
  coachEventPlaceLabel,
  formatCoachCalendarDateStack,
  listCoachCalendarRest,
  listCoachCalendarUpcoming,
} from '../../utils/coachCalendarHome';
import { isInMatchWindow } from '../../utils/matchLive';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { openCoachProdayAi } from '../../features/coach/shell/coachProdayAiOpen';
import {
  COACH_HOME_TOOLS,
  COACH_MENU_ITEMS,
  type CoachNavItemId,
} from '../../features/coach/navigation/coachNavConfig';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { useCoachWorkspace } from '../../features/coach/shell/CoachWorkspaceContext';
import { tabBarScrollInset } from '../../navigation/tabBarLayout';
import { proSemantic } from '../../theme/professionalDesign';
import { withAlpha } from '../../components/navigation/tabBarShared';
import {
  COACH_PROTO_DEFAULT_PAGE,
  COACH_PROTO_RADII,
  COACH_PROTO_SHADOWS,
  COACH_PROTO_SPACING,
  COACH_PROTO_SURFACES,
  COACH_PROTO_TYPE,
} from '../../features/coach/theme/coachProtoTokens';
import {
  CoachBadge,
  CoachCard,
  CoachListGroup,
  CoachListRow,
  CoachPageHeader,
  CoachPrimaryButton,
  CoachSectionTitle,
} from '../../features/coach/ui/coachCommonUi';
import { useTranslation } from '../../context/LocaleContext';
import { formatDateWith, formatTime } from '../../i18n/format';
import { tr } from '../../i18n/translate';

interface Props {
  onNavigate?: (navId: string) => void;
  onOpenMatch?: (matchId: string) => void;
}

const MOBILE_TERRAIN_TILES: {
  id: CoachNavItemId;
  labelKey: string;
  labelFallback: string;
  icon: IconName;
}[] = [
  {
    id: 'equipe',
    labelKey: 'coach.home.terrain.composition',
    labelFallback: 'Composition',
    icon: 'football',
  },
  {
    id: 'entrainements',
    labelKey: 'coach.home.terrain.sessions',
    labelFallback: 'Mes séances',
    icon: 'book',
  },
  {
    id: 'joueurs',
    labelKey: 'coach.home.terrain.squad',
    labelFallback: 'Mon effectif',
    icon: 'people',
  },
];

export const CoachHomeScreen: React.FC<Props> = ({ onNavigate }) => {
  const { t, locale, intlLocale } = useTranslation();
  const profile = useSessionProfile();
  const shellNav = useCoachShellNav();
  const { teamName } = useCoachTeamChrome();
  const { tokens, teamId } = useCoachTheme();
  const workspace = useCoachWorkspace();
  const twoColumns = workspace.columns === 2;
  const surfaces = tokens.isLight ? COACH_PROTO_SURFACES.light : COACH_PROTO_SURFACES.dark;
  const accent = COACH_PROTO_DEFAULT_PAGE.accent;
  const styles = useMemo(
    () => createStyles(surfaces, accent, tokens.isLight !== false),
    [surfaces, accent, tokens.isLight],
  );

  const [refreshing, setRefreshing] = useState(false);
  const [showStandings, setShowStandings] = useState(false);
  const [pendingSheetOpen, setPendingSheetOpen] = useState(false);
  const roster = useCoachSquadRoster();

  const [events, setEvents] = useState<TeamEvent[]>([]);
  const loadEvents = useCallback(() => {
    if (!profile?.uid) return Promise.resolve();
    return teamEventsService
      .listForUser(profile.uid, profile?.profile?.club_id || undefined)
      .then((rows) => setEvents(rows))
      .catch(() => undefined);
  }, [profile?.uid, profile?.profile.club_id]);

  useEffect(() => {
    void loadEvents();
  }, [loadEvents]);

  const teamEvents = useMemo(
    () => (teamId ? events.filter((event) => !event.team_id || event.team_id === teamId) : events),
    [events, teamId],
  );

  const nextEvent = useMemo(
    () => listCoachCalendarUpcoming(teamEvents, Date.now(), 1)[0] ?? null,
    [teamEvents],
  );

  const upcoming = useMemo(
    () => listCoachCalendarRest(teamEvents, nextEvent?.id ?? null, Date.now(), 3),
    [teamEvents, nextEvent?.id],
  );
  const upcomingMatches = useMemo(() => upcoming.filter(isCoachMatchEvent), [upcoming]);
  const upcomingAgenda = useMemo(() => upcoming.filter((event) => !isCoachMatchEvent(event)), [upcoming]);
  const nextMatch = useMemo(
    () => upcomingMatches[0] ?? (nextEvent && isCoachMatchEvent(nextEvent) ? nextEvent : null),
    [upcomingMatches, nextEvent],
  );

  const onRefresh = () => {
    setRefreshing(true);
    void loadEvents().finally(() => setRefreshing(false));
  };

  const pendingRsvpCount = useMemo(
    () => (nextEvent ? getPendingInviteeUids(nextEvent).length : 0),
    [nextEvent],
  );

  const nextEventIsMatch = nextEvent ? isCoachMatchEvent(nextEvent) : false;
  const nextEventIsTraining = nextEvent ? isCoachTrainingEvent(nextEvent) : false;
  const nextEventIsLive = nextEvent !== null && isInMatchWindow(nextEvent);

  const heroKicker = useMemo(() => {
    if (!nextEvent) return 'AUCUN ENTRAÎNEMENT À VENIR';
    if (nextEventIsLive) return nextEventIsMatch ? t('coach.home.live') : t('coach.home.seance.en.cours');
    if (nextEventIsMatch) return t('coach.home.jour.j.match');
    if (nextEventIsTraining) return t('coach.home.jour.j.seance');
    return (EVENT_TYPE_LABELS[nextEvent.event_type] ?? t('coach.home.evenement')).toUpperCase();
  }, [nextEvent, nextEventIsLive, nextEventIsMatch, nextEventIsTraining, t]);

  const heroAction = useMemo(() => {
    if (!nextEvent) {
      return {
        label: 'Préparer une séance d’entraînement',
        nav: 'entrainements' as CoachNavItemId,
        builderEventId: null,
        detailEventId: null,
      };
    }
    if (nextEventIsMatch) {
      return nextEventIsLive
        ? {
            label: tr(t, 'coach.home.ouvrir.le.centre.match', 'Ouvrir le centre match'),
            nav: 'match_center' as CoachNavItemId,
            builderEventId: null,
            detailEventId: null,
          }
        : {
            label: tr(t, 'coach.home.preparer.la.composition', 'Préparer la composition'),
            nav: 'equipe' as CoachNavItemId,
            builderEventId: null,
            detailEventId: null,
          };
    }
    if (nextEventIsTraining) {
      const planned = Boolean(nextEvent.session_plan);
      return {
        label: planned
          ? tr(t, 'coach.home.voir.la.seance', 'Voir la séance')
          : tr(t, 'coach.home.preparer.la.seance', 'Préparer la séance'),
        nav: 'entrainements' as CoachNavItemId,
        builderEventId: planned ? null : nextEvent.id,
        detailEventId: planned ? nextEvent.id : null,
      };
    }
    return {
      label: t('coach.home.voir.le.calendrier'),
      nav: 'calendrier' as CoachNavItemId,
      builderEventId: null,
      detailEventId: null,
    };
  }, [nextEvent, nextEventIsMatch, nextEventIsLive, nextEventIsTraining, t]);

  const nextEventSummary = useMemo(
    () => (nextEvent ? coachCalendarEventSummary(nextEvent) : null),
    [nextEvent],
  );

  const shortcuts = useMemo(
    () =>
      COACH_HOME_TOOLS.map((tool) => ({
        ...tool,
        hint: COACH_MENU_ITEMS.find((item) => item.id === tool.id)?.subtitle ?? '',
      })),
    [],
  );

  const openShortcut = (id: CoachNavItemId) => {
    if (id === 'copilot_chat') {
      const opened = openCoachProdayAi();
      if (opened) return;
      onNavigate?.('copilot_chat');
      return;
    }
    onNavigate?.(id);
  };

  const openAgendaEvent = (event: TeamEvent) => {
    if (isCoachTrainingEvent(event) && event.session_plan && shellNav?.openSessionDetail) {
      shellNav.openSessionDetail(event.id);
      return;
    }
    if (isCoachTrainingEvent(event)) {
      if (shellNav?.openSessionBuilder) {
        shellNav.openSessionBuilder(event.id);
        return;
      }
      onNavigate?.('entrainements');
      return;
    }
    if (isCoachMatchEvent(event)) {
      onNavigate?.('match_center');
      return;
    }
    onNavigate?.('calendrier');
  };

  const runHeroAction = () => {
    if (!heroAction) {
      onNavigate?.('calendrier');
      return;
    }
    if (heroAction.detailEventId && shellNav?.openSessionDetail) {
      shellNav.openSessionDetail(heroAction.detailEventId);
      return;
    }
    if (heroAction.builderEventId && shellNav?.openSessionBuilder) {
      shellNav.openSessionBuilder(heroAction.builderEventId);
      return;
    }
    onNavigate?.(heroAction.nav);
  };

  const season = clubSeasonLabelForDate(new Date());

  const presenceRatio =
    nextEventSummary && nextEventSummary.invited > 0
      ? nextEventSummary.confirmed / nextEventSummary.invited
      : 0;

  const nextEventDurationLabel = useMemo(() => {
    if (!nextEvent?.ends_at || nextEvent.ends_at <= nextEvent.starts_at) return null;
    const minutes = Math.round(
      (nextEvent.ends_at.getTime() - nextEvent.starts_at.getTime()) / 60000,
    );
    return `${minutes} min`;
  }, [nextEvent]);

  const nextEventCard = (
    <View testID="coach-home-next-event">
      <CoachCard style={styles.nextEventCard}>
        <View style={styles.cardHeadRow}>
          <View style={styles.cardHeadLeft}>
            <Icon
              name={nextEventIsMatch ? 'trophy' : nextEventIsTraining ? 'fitness' : 'calendar'}
              size={16}
              color={nextEventIsMatch ? proSemantic.warning : accent}
            />
            <Text style={[styles.cardHeadLabel, { color: nextEventIsMatch ? proSemantic.warning : accent }]}>
              {heroKicker}
            </Text>
          </View>
          <View style={styles.heroTopRight}>
            {nextEvent ? (
              <Text style={styles.heroDateText} numberOfLines={1}>
                {formatDateWith(
                  nextEvent.starts_at,
                  { weekday: 'long', day: 'numeric', month: 'short' },
                  locale,
                )}
              </Text>
            ) : null}
          </View>
        </View>

        {nextEvent ? (
          twoColumns ? (
            <View style={styles.desktopHeroContent}>
              <Text style={styles.desktopHeroTitle} numberOfLines={2}>
                {nextEvent.title || EVENT_TYPE_LABELS[nextEvent.event_type] || t('coach.player360.evenement')}
              </Text>
              <Text style={styles.desktopHeroMeta}>
                {`${formatTime(nextEvent.starts_at, locale)} · ${coachEventPlaceLabel(nextEvent)}`}
              </Text>
            </View>
          ) : (
            <View style={styles.eventBodyRow}>
              <View style={styles.eventDateBlock}>
                <Text style={styles.eventDateMonth}>
                  {formatCoachCalendarDateStack(nextEvent.starts_at, intlLocale).weekday}
                </Text>
                <Text style={styles.eventDateDay}>
                  {formatCoachCalendarDateStack(nextEvent.starts_at, intlLocale).day}
                </Text>
              </View>
              <View style={styles.eventMainInfo}>
                <Text style={styles.eventMainTitle} numberOfLines={2}>
                  {nextEvent.title || EVENT_TYPE_LABELS[nextEvent.event_type] || t('coach.player360.evenement')}
                </Text>
                <Text style={styles.eventMainMeta} numberOfLines={2}>
                  {`${formatTime(nextEvent.starts_at, locale)} · ${coachEventPlaceLabel(nextEvent)}`}
                </Text>
              </View>
            </View>
          )
        ) : (
          <Text style={styles.bodyMuted}>
            Aucun entraînement ou match programmé pour le moment. Préparez votre prochaine séance d’entraînement ci-dessous.
          </Text>
        )}

        {nextEventSummary && nextEventSummary.invited > 0 ? (
          <View style={styles.heroProgressRow}>
            <CoachAppleRing
              progress={presenceRatio}
              tone={pendingRsvpCount > 0 ? proSemantic.warning : proSemantic.success}
              accessibilityLabel={`${nextEventSummary.confirmed} confirmés sur ${nextEventSummary.invited} convoqués`}
            >
              <CoachText variant="caption" style={styles.ringRatio}>
                {`${nextEventSummary.confirmed}/${nextEventSummary.invited}`}
              </CoachText>
            </CoachAppleRing>
            <TouchableOpacity
              style={styles.heroProgressCopy}
              activeOpacity={0.85}
              onPress={() => setPendingSheetOpen(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel={t(
                pendingRsvpCount > 1
                  ? 'coach.home.pendingReplies_plural'
                  : 'coach.home.pendingReplies',
                { count: pendingRsvpCount },
              )}
            >
              <Text
                style={[
                  styles.heroProgressTitle,
                  {
                    color: pendingRsvpCount > 0 ? proSemantic.warning : proSemantic.success,
                  },
                ]}
              >
                {pendingRsvpCount > 0
                  ? t(
                      pendingRsvpCount > 1
                        ? 'coach.home.pendingReplies_plural'
                        : 'coach.home.pendingReplies',
                      { count: pendingRsvpCount },
                    )
                  : t('coach.home.toutes.les.reponses.sont.arrivees')}
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <View
          style={
            twoColumns
              ? styles.desktopEventFooter
              : nextEvent
                ? styles.eventFooterRow
                : styles.eventFooterStack
          }
        >
          {!twoColumns ? (
            <Text style={styles.eventFooterMeta}>
              {nextEventSummary && nextEventSummary.invited > 0
                ? t('coach.home.confirmedPresent', {
                    confirmed: nextEventSummary.confirmed,
                    invited: nextEventSummary.invited,
                  })
                : nextEventDurationLabel ?? t('coach.home.details.a.completer')}
            </Text>
          ) : null}
          <CoachPrimaryButton
            label={heroAction?.label ?? t('coach.home.planifier.un.rendez.vous')}
            onPress={runHeroAction}
            /** Proto `.eventfoot` : action soft `.pill` ; empty → primary pleine largeur. */
            variant={twoColumns || !nextEvent ? 'primary' : 'pill'}
            style={nextEvent && !twoColumns ? styles.heroCtaPill : styles.heroCtaBtn}
          />
        </View>
      </CoachCard>
    </View>
  );

  const profileAction = !twoColumns ? (
    <Pressable
      onPress={() => {
        shellNav?.requestNav('profil');
        onNavigate?.('profil');
      }}
      style={({ pressed }) => [styles.avatarBtn, pressed && { opacity: 0.7 }]}
      accessibilityRole="button"
      accessibilityLabel={t('coach.home.profil.et.parametres')}
      testID="coach-home-profile"
    >
      {profile?.avatar_url ? (
        <Image source={{ uri: profile.avatar_url }} style={styles.avatarImg} />
      ) : (
        <View style={styles.avatarFallback}>
          <Text style={styles.avatarInitial}>
            {(profile?.display_name || profile?.email || 'MC')
              .split(' ')
              .map((part) => part.charAt(0).toUpperCase())
              .slice(0, 2)
              .join('')}
          </Text>
        </View>
      )}
    </Pressable>
  ) : undefined;

  const weekStrip = (
    <CoachHomeWeekStrip
      events={teamEvents}
      nextEvent={nextEvent}
      twoColumns={twoColumns}
      teamName={teamName}
      onOpenCalendar={() => onNavigate?.('calendrier')}
      onOpenSquad={() => onNavigate?.('equipe')}
      onOpenPendingRsvp={() => setPendingSheetOpen(true)}
      onSelectEvent={openAgendaEvent}
      onOpenStandings={() => setShowStandings(true)}
    />
  );

  const aVenirSection = (
    <View style={styles.section}>
      <CoachSectionTitle
        title={tr(t, 'coach.home.section.upcoming', 'À venir')}
        action={
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => onNavigate?.('calendrier')}
            accessibilityRole="button"
            accessibilityLabel={t('coach.home.ouvrir.le.calendrier')}
          >
            <Text style={styles.sectionActionLabel}>
              {tr(t, 'coach.home.action.calendar', 'Calendrier')}
            </Text>
          </TouchableOpacity>
        }
      />

      {upcomingMatches.length > 0 ? (
        <CoachListGroup>
          {upcomingMatches.slice(0, 2).map((match) => (
            <CoachListRow
              key={match.id}
              title={match.title || EVENT_TYPE_LABELS[match.event_type] || t('coach.live.prochain.match')}
              subtitle={`${formatDateWith(
                match.starts_at,
                { weekday: 'long', day: 'numeric', month: 'short' },
                locale,
              )} · ${coachEventPlaceLabel(match)}`}
              leading={<Icon name="football" size={18} color={accent} />}
              onPress={() => openAgendaEvent(match)}
              trailing={<Icon name="chevron-forward" size={15} color={surfaces.muted} />}
            />
          ))}
        </CoachListGroup>
      ) : null}

      {upcomingAgenda.length > 0 ? (
        <CoachListGroup>
          {upcomingAgenda.map((event) => {
            const stack = formatCoachCalendarDateStack(event.starts_at, intlLocale);
            const summary = coachCalendarEventSummary(event);
            const pending = getPendingInviteeUids(event).length;
            return (
              <CoachListRow
                key={event.id}
                title={
                  event.title ||
                  EVENT_TYPE_LABELS[event.event_type] ||
                  tr(t, 'coach.home.agenda.appointment', 'Rendez-vous')
                }
                subtitle={`${stack.time} · ${coachEventPlaceLabel(event)}`}
                leading={
                  <View style={styles.agendaLead}>
                    <Text style={styles.agendaLeadWeekday}>{stack.weekday}</Text>
                    <Text style={styles.agendaLeadDay}>{stack.day}</Text>
                  </View>
                }
                trailing={
                  <View style={styles.agendaRight}>
                    <View style={styles.agendaKindRow}>
                      <MaterialCommunityIcons name="whistle-outline" size={12} color={accent} />
                      <Text style={styles.agendaKind}>
                        {tr(t, 'coach.home.agenda.session', 'Séance')}
                      </Text>
                    </View>
                    {summary.invited > 0 ? (
                      <Text
                        style={[
                          styles.agendaPresence,
                          pending > 0 ? styles.agendaPresenceWarn : null,
                        ]}
                      >
                        {pending > 0
                          ? t('coach.home.agenda.pending', { count: pending })
                          : t('coach.home.agenda.confirmed', {
                              confirmed: summary.confirmed,
                              invited: summary.invited,
                            })}
                      </Text>
                    ) : null}
                  </View>
                }
                onPress={() => openAgendaEvent(event)}
              />
            );
          })}
        </CoachListGroup>
      ) : null}

      {upcoming.length === 0 ? (
        <CoachCard>
          <Text style={[COACH_PROTO_TYPE.rowTitle, { color: surfaces.ink }]}>
            {tr(t, 'coach.home.empty.noAppointments', 'Aucun rendez-vous à venir')}
          </Text>
          <Text style={[COACH_PROTO_TYPE.rowSub, { color: surfaces.sub, marginTop: 6 }]}>
            {tr(
              t,
              'coach.home.empty.calendarUpToDate',
              'Votre calendrier est à jour pour cette équipe.',
            )}
          </Text>
          <CoachPrimaryButton
            label={t('coach.home.planifier.un.rendez.vous')}
            onPress={() => onNavigate?.('calendrier')}
          />
        </CoachCard>
      ) : null}
    </View>
  );

  /**
   * DEF-PF-001b — first-fold dock clearance is owned by shell pane pad
   * (`TAB_BAR_CONTENT_INSET`). Accueil keeps light content breathing only; end
   * of scroll no longer needs a double dock inset.
   */
  return (
    <View style={styles.root} testID="coach-home-screen">
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          twoColumns
            ? {
                paddingHorizontal: workspace.gutter,
                paddingTop: workspace.gutter,
                paddingBottom: 40,
              }
            : { paddingBottom: tabBarScrollInset({ extra: 8 }) },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={accent} />
        }
      >
        <CoachPageHeader
          title={tr(t, 'coach.home.header.resume', 'Résumé')}
          subtitle={tr(t, 'coach.home.header.brandSubtitle', 'PRODAY · COACH')}
          action={profileAction}
        />
        <Text style={styles.coachSubtitle} numberOfLines={2}>
          {`${teamName || tr(t, 'coach.home.teamFallback', t('club.create.label.team'))} · ${formatDateWith(
            new Date(),
            { weekday: 'long', day: 'numeric', month: 'long' },
            locale,
          )} · ${t('coach.home.subtitle.season', { season })}`}
        </Text>

        {twoColumns ? (
          <View style={styles.desktopGrid} testID="coach-home-desktop">
            <View style={styles.desktopMain} testID="coach-home-desktop-main">
              {weekStrip}

              <View style={styles.desktopLowerRow}>
                <CoachHomeAssiduiteCard
                  desktop
                  onPress={() => onNavigate?.('equipe')}
                  events={teamEvents}
                />
                <View style={styles.desktopCard}>
                  <Text style={styles.desktopCardTitle}>
                    {tr(t, 'coach.home.desktop.resume', 'À reprendre')}
                  </Text>
                  <CoachListGroup style={styles.flushGroup}>
                    <CoachListRow
                      title={t('coach.squad.composition.de.l.equipe')}
                      subtitle={t('coach.home.affecter.les.titulaires.et.le.banc')}
                      leading={<Icon name="football" size={18} color={accent} />}
                      onPress={() => onNavigate?.('equipe')}
                      trailing={<Icon name="chevron-forward" size={15} color={surfaces.muted} />}
                    />
                    <CoachListRow
                      title={t('coach.home.analyse.video')}
                      subtitle={t('coach.home.retrouver.les.sequences.du.groupe')}
                      leading={<Icon name="videocam" size={18} color={accent} />}
                      onPress={() => onNavigate?.('mes_videos')}
                      trailing={<Icon name="chevron-forward" size={15} color={surfaces.muted} />}
                    />
                  </CoachListGroup>
                </View>
              </View>

              {aVenirSection}
            </View>

            <View style={styles.desktopAside} testID="coach-home-desktop-aside">
              {nextEventCard}

              <View style={styles.desktopCard}>
                <Text style={styles.desktopCardTitle}>
                  {tr(t, 'coach.home.desktop.toSettle', 'À régler')}
                </Text>
                <CoachListGroup style={styles.flushGroup}>
                  <CoachListRow
                    title={
                      pendingRsvpCount > 0
                        ? t(
                            pendingRsvpCount > 1
                              ? 'coach.home.pendingReplies_plural'
                              : 'coach.home.pendingReplies',
                            { count: pendingRsvpCount },
                          )
                        : t('coach.home.presences.a.jour')
                    }
                    subtitle={
                      pendingRsvpCount > 0
                        ? t('coach.home.consulter.les.presences')
                        : t('coach.home.toutes.les.reponses.confirmees')
                    }
                    leading={
                      <Icon
                        name={pendingRsvpCount > 0 ? 'time' : 'checkmark-circle'}
                        size={18}
                        color={pendingRsvpCount > 0 ? proSemantic.warning : proSemantic.success}
                      />
                    }
                    onPress={() => setPendingSheetOpen(true)}
                    trailing={<Icon name="chevron-forward" size={15} color={surfaces.muted} />}
                  />
                  <CoachListRow
                    title={t('coach.home.bilan.de.seance')}
                    subtitle={t('coach.home.observations.et.objectifs')}
                    leading={<Icon name="document-text" size={18} color={accent} />}
                    onPress={() => onNavigate?.('entrainements')}
                    trailing={<Icon name="chevron-forward" size={15} color={surfaces.muted} />}
                  />
                </CoachListGroup>
              </View>

              <View style={styles.desktopCard}>
                <View style={styles.desktopCardHeader}>
                  <Text style={styles.desktopCardTitle}>
                    {tr(t, 'coach.home.desktop.yourGroup', 'Votre poule')}
                  </Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => setShowStandings(true)}
                    accessibilityRole="button"
                    accessibilityLabel={t('coach.home.ouvrir.le.classement.complet')}
                  >
                    <Text style={styles.desktopCardLink}>
                      {tr(t, 'coach.home.desktop.seeAll', 'Tout voir →')}
                    </Text>
                  </TouchableOpacity>
                </View>
                <CoachStandingsTable compact teamId={teamId} teamName={teamName} />
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.mobileStack}>
            <View style={styles.section}>
              <CoachSectionTitle
                title={tr(t, 'coach.home.section.pinned', 'Épinglés')}
                style={styles.firstSectionTitle}
                action={
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => onNavigate?.('calendrier')}
                    accessibilityRole="button"
                    accessibilityLabel={t('coach.home.modifier.ou.ouvrir.le.calendrier')}
                  >
                    <Text style={styles.sectionActionLabel}>
                      {tr(t, 'coach.home.action.edit', 'Modifier')}
                    </Text>
                  </TouchableOpacity>
                }
              />
              {nextEventCard}
              {weekStrip}
            </View>

            <View style={styles.section}>
              <CoachSectionTitle
                title={tr(t, 'coach.home.section.season', 'Votre saison')}
                style={styles.seasonSectionTitle}
              />
              <CoachListGroup style={styles.seasonListGroup}>
                <CoachListRow
                  title={tr(t, 'coach.home.season.standings', 'Classement')}
                  subtitle={tr(t, 'coach.home.season.standingsHint', 'Poule et points officiels')}
                  leading={<Icon name="trophy" size={18} color={proSemantic.warning} />}
                  trailing={
                    showStandings ? (
                      <CoachBadge label={tr(t, 'coach.home.season.open', 'Ouvert')} />
                    ) : (
                      <Icon name="chevron-forward" size={15} color={surfaces.muted} />
                    )
                  }
                  onPress={() => setShowStandings((prev) => !prev)}
                  style={styles.seasonListRow}
                />
                <CoachListRow
                  title={
                    nextMatch
                      ? nextMatch.title || tr(t, 'coach.home.season.nextMatch', t('coach.live.prochain.match'))
                      : tr(t, 'coach.home.season.nextMatch', t('coach.live.prochain.match'))
                  }
                  subtitle={
                    nextMatch
                      ? `${formatDateWith(
                          nextMatch.starts_at,
                          { weekday: 'long', day: 'numeric', month: 'short' },
                          locale,
                        )} · ${coachEventPlaceLabel(nextMatch)}`
                      : tr(
                          t,
                          'coach.home.season.noMatch',
                          'Aucun match planifié pour cette équipe',
                        )
                  }
                  leading={<Icon name="football" size={18} color={accent} />}
                  onPress={() =>
                    nextMatch ? openAgendaEvent(nextMatch) : onNavigate?.('calendrier')
                  }
                  trailing={<Icon name="chevron-forward" size={15} color={surfaces.muted} />}
                  style={styles.seasonListRow}
                />
                <CoachListRow
                  title={tr(t, 'coach.home.season.squad', 'Effectif')}
                  subtitle={tr(t, 'coach.home.season.squadHint', 'Fiches et objectifs')}
                  leading={<Icon name="people" size={18} color={accent} />}
                  onPress={() => onNavigate?.('joueurs')}
                  trailing={<Icon name="chevron-forward" size={15} color={surfaces.muted} />}
                  style={styles.seasonListRow}
                />
              </CoachListGroup>
              {showStandings ? (
                <View style={styles.standingsContainer}>
                  <CoachStandingsTable compact={false} teamId={teamId} teamName={teamName} />
                </View>
              ) : null}
            </View>

            <View style={styles.section}>
              <CoachSectionTitle
                title={tr(t, 'coach.home.section.keyPoints', 'Points clés')}
                action={
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => onNavigate?.('equipe')}
                    accessibilityRole="button"
                    accessibilityLabel={t('coach.home.ouvrir.le.suivi.des.presences.de')}
                  >
                    <Text style={styles.sectionActionLabel}>
                      {tr(t, 'coach.home.action.seeSquad', 'Voir l’effectif')}
                    </Text>
                  </TouchableOpacity>
                }
              />
              <CoachHomeAssiduiteCard onPress={() => onNavigate?.('equipe')} events={teamEvents} />
            </View>

            <View style={styles.section}>
              <CoachSectionTitle
                title={tr(t, 'coach.home.section.preparePitch', 'Préparer le terrain')}
              />
              <View style={styles.toolsGridRow}>
                {MOBILE_TERRAIN_TILES.map((tile) => {
                  const label = tr(t, tile.labelKey, tile.labelFallback);
                  return (
                    <PressableScale
                      key={tile.id}
                      style={styles.toolTile}
                      haptic
                      onPress={() => onNavigate?.(tile.id)}
                      accessibilityRole="button"
                      accessibilityLabel={label}
                    >
                      <View style={styles.toolTileIconWrap}>
                        <Icon name={tile.icon} size={23} color={accent} />
                      </View>
                      <Text style={styles.toolTileLabel} numberOfLines={2}>
                        {label}
                      </Text>
                    </PressableScale>
                  );
                })}
              </View>
            </View>

            {aVenirSection}

            <View style={styles.section}>
              <CoachSectionTitle title={tr(t, 'coach.home.section.shortcuts', 'Raccourcis')} />
              <View style={styles.toolsGridRow}>
                {shortcuts.map((tool) => (
                  <PressableScale
                    key={tool.id}
                    style={styles.toolTile}
                    haptic
                    onPress={() => openShortcut(tool.id)}
                    accessibilityRole="button"
                    accessibilityLabel={tool.label}
                    testID={`coach-home-shortcut-${tool.id}`}
                  >
                    <View style={styles.toolTileIconWrap}>
                      <Icon name={tool.icon} size={22} color={accent} />
                    </View>
                    <Text style={styles.toolTileLabel} numberOfLines={2}>
                      {tool.label}
                    </Text>
                  </PressableScale>
                ))}
              </View>
            </View>
          </View>
        )}

        <CoachPendingRsvpSheet
          visible={pendingSheetOpen}
          onClose={() => setPendingSheetOpen(false)}
          event={roster.attendanceEvent}
          players={roster.players}
          onMark={roster.setAttendanceMark}
          tokens={tokens}
        />
      </ScrollView>
    </View>
  );
};

type Surfaces =
  | (typeof COACH_PROTO_SURFACES)['light']
  | (typeof COACH_PROTO_SURFACES)['dark'];

const createStyles = (surfaces: Surfaces, accent: string, isLight: boolean) =>
  StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: 'transparent',
    },
    scroll: { flex: 1 },
    content: {
      padding: COACH_PROTO_SPACING.pageGutter,
      /** Runtime overrides: desktop 40 / mobile `tabBarScrollInset` (shell clears dock). */
      paddingBottom: tabBarScrollInset({ extra: 8 }),
    },
    coachSubtitle: {
      ...COACH_PROTO_TYPE.caption,
      color: surfaces.sub,
      marginTop: 2,
      marginBottom: 18,
    },
    desktopGrid: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 24,
    },
    desktopMain: {
      flex: 1,
      minWidth: 0,
      gap: 22,
    },
    desktopLowerRow: {
      flexDirection: 'row',
      alignItems: 'stretch',
      gap: 18,
    },
    desktopAside: {
      width: 310,
      flexShrink: 0,
      gap: 17,
    },
    desktopCard: {
      flex: 1,
      backgroundColor: surfaces.card,
      borderRadius: COACH_PROTO_RADII.card,
      padding: COACH_PROTO_SPACING.cardPaddingH,
      gap: 12,
      ...(isLight ? COACH_PROTO_SHADOWS.card : COACH_PROTO_SHADOWS.none),
    },
    desktopCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    desktopCardTitle: {
      ...COACH_PROTO_TYPE.desktopSection,
      color: surfaces.ink,
    },
    desktopCardLink: {
      fontSize: 11,
      fontWeight: '600',
      color: accent,
    },
    flushGroup: { marginVertical: 0 },
    /**
     * Espacement via `CoachSectionTitle` (marginTop 18) uniquement —
     * éviter section.mb + title.mt (= ~36) entre Épinglés et Votre saison.
     */
    mobileStack: { gap: 0 },
    section: { marginBottom: 0 },
    /** Proto `.pagecontent>h2:first-child{margin-top:0}`. */
    firstSectionTitle: { marginTop: 0 },
    seasonSectionTitle: { marginBottom: 6 },
    seasonListGroup: { marginTop: 0, marginBottom: 0 },
    seasonListRow: {
      minHeight: 64,
      paddingVertical: 18,
    },
    sectionActionLabel: {
      ...COACH_PROTO_TYPE.caption,
      color: accent,
      fontWeight: '600',
    },
    nextEventCard: { gap: 14, marginBottom: 0 },
    cardHeadRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    cardHeadLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
    cardHeadLabel: {
      ...COACH_PROTO_TYPE.badge,
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    heroTopRight: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexShrink: 1,
    },
    heroDateText: {
      ...COACH_PROTO_TYPE.caption,
      color: surfaces.muted,
    },
    desktopHeroContent: { gap: 6, marginVertical: 2 },
    desktopHeroTitle: {
      fontSize: 18,
      fontWeight: '700',
      letterSpacing: -0.3,
      color: surfaces.ink,
    },
    desktopHeroMeta: {
      fontSize: 13,
      lineHeight: 19,
      color: surfaces.sub,
    },
    desktopEventFooter: { marginTop: 4 },
    bodyMuted: {
      ...COACH_PROTO_TYPE.body,
      color: surfaces.sub,
      fontSize: 14,
      lineHeight: 20,
    },
    eventBodyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 18,
      marginTop: 4,
      marginBottom: 4,
    },
    eventDateBlock: {
      minWidth: 66,
      paddingRight: 18,
      borderRightWidth: StyleSheet.hairlineWidth,
      borderRightColor: surfaces.divider,
      alignItems: 'center',
      justifyContent: 'center',
    },
    eventDateMonth: {
      fontSize: 12,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 0.6,
      color: accent,
    },
    eventDateDay: {
      fontSize: 40,
      fontWeight: '700',
      lineHeight: 44,
      letterSpacing: -1.8,
      color: surfaces.ink,
      marginTop: 2,
    },
    eventMainInfo: { flex: 1, minWidth: 0, gap: 4 },
    eventMainTitle: {
      fontSize: 20,
      fontWeight: '700',
      letterSpacing: -0.5,
      lineHeight: 24,
      color: surfaces.ink,
    },
    eventMainMeta: {
      fontSize: 14,
      lineHeight: 20,
      color: surfaces.sub,
    },
    /** Proto `.eventfoot` : margin-top 19 · padding-top 15 · gap 12. */
    eventFooterRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      marginTop: 19,
      paddingTop: 15,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: surfaces.divider,
    },
    eventFooterStack: {
      marginTop: 19,
      paddingTop: 15,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: surfaces.divider,
      gap: 12,
    },
    eventFooterMeta: {
      fontSize: 13,
      fontWeight: '500',
      color: surfaces.sub,
      flexShrink: 1,
      flex: 1,
      minWidth: 0,
    },
    heroProgressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    heroProgressCopy: { flex: 1, minWidth: 0, gap: 2 },
    heroProgressTitle: {
      ...COACH_PROTO_TYPE.rowTitle,
      fontSize: 14,
    },
    ringRatio: {
      ...COACH_PROTO_TYPE.caption,
      fontWeight: '800',
      color: surfaces.ink,
    },
    heroCtaBtn: {
      marginVertical: 0,
      alignSelf: 'stretch',
    },
    heroCtaPill: {
      marginVertical: 0,
      flexShrink: 0,
      alignSelf: 'center',
    },
    avatarBtn: {
      width: 49,
      height: 49,
      borderRadius: 24.5,
      overflow: 'hidden',
      borderWidth: 2,
      borderColor: surfaces.card,
      backgroundColor: accent,
    },
    avatarImg: { width: 45, height: 45, borderRadius: 22.5 },
    avatarFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: accent,
    },
    avatarInitial: { fontSize: 17, fontWeight: '700', color: surfaces.card },
    toolsGridRow: { flexDirection: 'row', gap: 10 },
    toolTile: {
      flex: 1,
      minHeight: 88,
      borderRadius: COACH_PROTO_RADII.tool,
      paddingVertical: 16,
      paddingHorizontal: 8,
      backgroundColor: surfaces.card,
      alignItems: 'center',
      justifyContent: 'center',
      gap: 9,
      ...(isLight ? COACH_PROTO_SHADOWS.cardHairline : COACH_PROTO_SHADOWS.none),
    },
    toolTileIconWrap: {
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: COACH_PROTO_DEFAULT_PAGE.tint,
      alignItems: 'center',
      justifyContent: 'center',
    },
    toolTileLabel: {
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: -0.2,
      color: surfaces.ink,
      textAlign: 'center',
    },
    agendaLead: { alignItems: 'center', justifyContent: 'center', minWidth: 28 },
    agendaLeadWeekday: {
      fontSize: 9,
      fontWeight: '800',
      lineHeight: 11,
      textTransform: 'uppercase',
      color: surfaces.muted,
    },
    agendaLeadDay: {
      fontSize: 15,
      fontWeight: '800',
      letterSpacing: -0.4,
      lineHeight: 17,
      color: surfaces.ink,
    },
    agendaRight: { alignItems: 'flex-end', gap: 2, flexShrink: 0 },
    agendaKindRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    agendaKind: {
      color: surfaces.muted,
      fontSize: 9.5,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    agendaPresence: {
      color: proSemantic.success,
      fontSize: 10.5,
      fontWeight: '700',
    },
    agendaPresenceWarn: { color: proSemantic.warning },
    standingsContainer: {
      marginTop: 8,
      paddingBottom: COACH_PROTO_SPACING.sectionGap,
    },
  });
