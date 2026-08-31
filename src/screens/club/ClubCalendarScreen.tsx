import React, { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubEmptyState,
  ClubLoading,
  ClubSegmentedControl,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { ClubCalendarAgendaRow, ClubCalendarHero } from '../../features/club/ui/ClubCalendarChrome';
import {
  buildClubCalendarItemModel,
  filterClubCalendarEvents,
  resolveClubCalendarHero,
  resolveClubCalendarSubtitle,
  type ClubCalendarRange,
} from '../../features/club/ui/clubCalendarModel';
import { PressableSpring, PushScreenTransition } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { MatchEventHubScreen } from '../MatchEventHubScreen';
import { TeamEventDetailScreen } from '../TeamEventDetailScreen';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';

/**
 * Calendrier Club — Jour / Semaine / Mois, hero prochain RDV, taps Matchs / séances / détail.
 */
export function ClubCalendarScreen() {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [range, setRange] = useState<ClubCalendarRange>('week');
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [detailKind, setDetailKind] = useState<'match' | 'training' | null>(null);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const items = useMemo(
    () => filterClubCalendarEvents(ws.events, range),
    [ws.events, range],
  );
  const heroEvent = useMemo(() => resolveClubCalendarHero(items), [items]);
  const heroModel = useMemo(
    () => (heroEvent ? buildClubCalendarItemModel(heroEvent) : null),
    [heroEvent],
  );
  const listModels = useMemo(
    () =>
      items
        .filter((e) => e.id !== heroEvent?.id)
        .map(buildClubCalendarItemModel),
    [items, heroEvent?.id],
  );
  const subtitle = useMemo(
    () => resolveClubCalendarSubtitle(range, items.length),
    [range, items.length],
  );

  const openList = (nav: 'matches' | 'trainings' | 'events') => {
    shellNav?.requestNav(nav);
  };

  const openDetail = (model: ReturnType<typeof buildClubCalendarItemModel>) => {
    if (model.isMatch) {
      setDetailKind('match');
      setDetailEventId(model.id);
      return;
    }
    if (model.isTraining) {
      setDetailKind('training');
      setDetailEventId(model.id);
      return;
    }
    openList('events');
  };

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader title="Calendrier" subtitle={subtitle} />

        <ClubSegmentedControl
          options={[
            { id: 'day' as const, label: 'Jour' },
            { id: 'week' as const, label: 'Semaine' },
            { id: 'month' as const, label: 'Mois' },
          ]}
          value={range}
          onChange={setRange}
        />

        <View style={styles.shortcutRow}>
          <PressableSpring
            onPress={() => openList('matches')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="trophy" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Matchs
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => openList('trainings')}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="football" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Entraînements
            </ClubText>
          </PressableSpring>
          <PressableSpring
            onPress={() => shellNav?.openCreate?.()}
            scaleTo={0.97}
            haptic
            style={styles.shortcut}
          >
            <Icon name="add" size={14} color={tokens.accent} />
            <ClubText variant="caption" style={styles.shortcutLabel}>
              Créer
            </ClubText>
          </PressableSpring>
        </View>

        {items.length === 0 ? (
          <ClubEmptyState
            title="Rien sur cette période"
            body="Créez un match, un entraînement ou un événement pour remplir le calendrier."
            actionLabel="Créer"
            onAction={() => shellNav?.openCreate?.()}
            icon="calendar"
          />
        ) : (
          <View style={styles.list}>
            {heroModel ? (
              <ClubCalendarHero
                model={heroModel}
                onOpen={() => openDetail(heroModel)}
                onOpenList={() => openList(heroModel.nav)}
              />
            ) : null}

            {listModels.length > 0 ? (
              <View style={styles.sectionHead}>
                <ClubText variant="label" muted style={styles.sectionLabel}>
                  Agenda
                </ClubText>
                <ClubText variant="caption" muted>
                  {listModels.length}
                </ClubText>
              </View>
            ) : null}

            {listModels.map((model, index) => (
              <ClubCalendarAgendaRow
                key={model.id}
                model={model}
                index={index}
                onPress={() => openDetail(model)}
              />
            ))}
          </View>
        )}
      </ClubChapterScroll>

      <PushScreenTransition active={detailEventId != null} backgroundColor={tokens.bg}>
        {detailEventId && detailKind === 'match' ? (
          <MatchEventHubScreen
            eventId={detailEventId}
            onBack={() => {
              setDetailEventId(null);
              setDetailKind(null);
              void ws.refresh();
            }}
          />
        ) : null}
        {detailEventId && detailKind === 'training' ? (
          <TeamEventDetailScreen
            eventId={detailEventId}
            onBack={() => {
              setDetailEventId(null);
              setDetailKind(null);
              void ws.refresh();
            }}
          />
        ) : null}
      </PushScreenTransition>
    </View>
  );
}

const createStyles = (tokens: ClubThemeTokens) =>
  StyleSheet.create({
    root: { flex: 1, backgroundColor: 'transparent' },
    shortcutRow: {
      flexDirection: 'row',
      gap: clubSpace.sm,
    },
    shortcut: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      paddingVertical: 10,
      borderRadius: clubRadius.md,
      backgroundColor: tokens.surface,
      borderWidth: 1,
      borderColor: tokens.border,
    },
    shortcutLabel: {
      color: tokens.foreground,
      fontWeight: '700',
    },
    list: { gap: clubSpace.md },
    sectionHead: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: clubSpace.sm,
      marginTop: clubSpace.xs,
    },
    sectionLabel: {
      letterSpacing: 1.05,
      opacity: 0.92,
    },
  });
