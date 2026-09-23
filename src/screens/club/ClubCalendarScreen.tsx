import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useClubWorkspace } from '../../features/club/hooks/useClubWorkspace';
import { useClubShellNav } from '../../features/club/shell/ClubShellNavContext';
import { useClubTheme } from '../../features/club/shell/ClubThemeContext';
import {
  ClubChapterScroll,
  ClubLoading,
  ClubText,
} from '../../features/club/ui/clubUi';
import { ClubBrandHeader } from '../../features/club/ui/ClubBrandHeader';
import { CalendarMonthGrid } from '../../features/calendar/CalendarMonthGrid';
import { PressableSpring, PushScreenTransition } from '../../components/motion';
import { Icon } from '../../components/ui/Icon';
import { detectPitchConflicts } from '../../features/club/ui/clubFacilitiesModel';
import { isCoachMatchEvent, isCoachTrainingEvent, type TeamEvent } from '../../models/TeamEvent';
import { MatchEventHubScreen } from '../MatchEventHubScreen';
import { TeamEventDetailScreen } from '../TeamEventDetailScreen';
import type { ClubThemeTokens } from '../../features/club/theme/clubTokens';
import { clubRadius, clubSpace } from '../../features/club/theme/clubDesignSystem';

/**
 * Calendrier Club — Grille mensuelle interactive, agenda liste, hero et raccourcis.
 *
 * `initialEventId` permet d'arriver depuis la recherche avec l'événement trouvé déjà ouvert.
 */
export function ClubCalendarScreen({
  initialEventId = null,
}: {
  initialEventId?: string | null;
} = {}) {
  const shellNav = useClubShellNav();
  const { tokens } = useClubTheme();
  const ws = useClubWorkspace();
  const [detailEventId, setDetailEventId] = useState<string | null>(null);
  const [detailKind, setDetailKind] = useState<'match' | 'training' | null>(null);
  /** Résultat de recherche introuvable dans le périmètre chargé (supprimé ou accès modifié). */
  const [unavailableResult, setUnavailableResult] = useState(false);
  const styles = useMemo(() => createStyles(tokens), [tokens]);

  const pitchConflicts = useMemo(
    () => detectPitchConflicts(ws.events),
    [ws.events],
  );

  /**
   * Consomme la demande venue de la recherche, **une seule fois** : sans ce garde, fermer le
   * détail le rouvrirait au rendu suivant.
   */
  const consumedSeedRef = useRef<string | null>(null);
  useEffect(() => {
    if (!initialEventId || ws.loading) return;
    if (consumedSeedRef.current === initialEventId) return;
    consumedSeedRef.current = initialEventId;

    const event = ws.events.find((e) => e.id === initialEventId);
    if (!event) {
      setUnavailableResult(true);
      return;
    }
    if (isCoachMatchEvent(event)) {
      setDetailKind('match');
      setDetailEventId(event.id);
      return;
    }
    if (isCoachTrainingEvent(event)) {
      setDetailKind('training');
      setDetailEventId(event.id);
      return;
    }
    openList('events');
  }, [initialEventId, ws.loading, ws.events]);

  const openList = (nav: 'matches' | 'trainings' | 'events') => {
    shellNav?.requestNav(nav);
  };

  const openDetail = (event: TeamEvent | any) => {
    const rawId = event.id || event.team_event_id;
    if (isCoachMatchEvent(event)) {
      setDetailKind('match');
      setDetailEventId(rawId);
      return;
    }
    if (isCoachTrainingEvent(event)) {
      setDetailKind('training');
      setDetailEventId(rawId);
      return;
    }
    openList('events');
  };

  if (ws.loading) return <ClubLoading />;

  return (
    <View style={styles.root}>
      <ClubChapterScroll refreshing={ws.refreshing} onRefresh={() => void ws.refresh()}>
        <ClubBrandHeader
          title="Calendrier"
          subtitle={`${ws.events.length} événements autorisés`}
        />

        {/* Raccourcis rapides Club */}
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

        {unavailableResult ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginHorizontal: 16,
              marginBottom: 12,
              padding: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(148, 163, 184, 0.12)',
              borderWidth: 1,
              borderColor: 'rgba(148, 163, 184, 0.3)',
            }}
          >
            <Icon name="alert-circle" size={20} color="#94A3B8" />
            <View style={{ flex: 1 }}>
              <ClubText variant="section" style={{ fontSize: 13, fontWeight: '800' }}>
                Résultat indisponible
              </ClubText>
              <ClubText variant="caption" muted style={{ marginTop: 2 }}>
                Cet événement ne figure plus dans le calendrier autorisé : il a peut-être été
                supprimé ou vos droits ont changé.
              </ClubText>
              {shellNav?.openSearch ? (
                <PressableSpring
                  onPress={() => shellNav.openSearch?.()}
                  scaleTo={0.97}
                  haptic
                  style={{ marginTop: 8, alignSelf: 'flex-start' }}
                >
                  <ClubText variant="caption" style={{ color: tokens.accent, fontWeight: '700' }}>
                    Relancer la recherche
                  </ClubText>
                </PressableSpring>
              ) : null}
            </View>
          </View>
        ) : null}

        {pitchConflicts.length > 0 ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              marginHorizontal: 16,
              marginBottom: 12,
              padding: 12,
              borderRadius: 12,
              backgroundColor: 'rgba(239, 68, 68, 0.12)',
              borderWidth: 1,
              borderColor: 'rgba(239, 68, 68, 0.3)',
            }}
          >
            <Icon name="warning" size={20} color="#F87171" />
            <View style={{ flex: 1 }}>
              <ClubText variant="section" style={{ fontSize: 13, color: '#F87171', fontWeight: '800' }}>
                Conflit horaire sur terrain ({pitchConflicts.length})
              </ClubText>
              <ClubText variant="caption" muted style={{ color: 'rgba(255,255,255,0.7)', marginTop: 2 }}>
                {pitchConflicts[0].pitchName} · {pitchConflicts[0].eventATitle} et {pitchConflicts[0].eventBTitle} ({pitchConflicts[0].timeSlotLabel})
              </ClubText>
            </View>
          </View>
        ) : null}

        {/* Grille Mensuelle & Liste Interactive */}
        <CalendarMonthGrid
          events={ws.events}
          onSelectEvent={openDetail}
          defaultViewMode="month"
          tokens={tokens}
          emptyMessage="Aucun événement planifié pour ce club"
        />
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
      marginBottom: 12,
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
  });
