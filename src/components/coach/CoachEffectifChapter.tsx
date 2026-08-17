import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import {
  CoachChapterScroll,
  CoachEmptyState,
  CoachText,
} from './coachPortalUi';
import { PressableSpring } from '../motion';
import { membershipsService } from '../../services/memberships.service';
import { openCarpoolDriverChat } from '../../utils/openCarpoolDriverChat';
import type { Membership } from '../../models/Membership';
import type { User } from '../../models/User';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useTabNavigationActions } from '../../hooks/useTabNavigationActions';
import { useTranslation } from '../../context/LocaleContext';
import { spacing } from '../../theme/designTokens';
import { CoachSportEasyPitch } from './CoachSportEasyPitch';
import { CoachPane } from './CoachScreenHeader';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import {
  useCoachTheme,
  useCoachThemedStyles,
} from '../../features/coach/shell/CoachThemeContext';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import type { CoachThemeTokens } from '../../utils/coachTeamTheme';
import { teamsService } from '../../services/teams.service';
import type { Team } from '../../models/Team';
import { CoachPlayerNoteSheet } from './CoachPlayerNoteSheet';
import { coachEvaluationsService } from '../../services/coachEvaluations.service';
import { wellnessCheckinsService } from '../../services/wellnessCheckins.service';
import type { CoachPlayerEvaluation } from '../../models/CoachEvaluation';
import type { WellnessSignals } from '../../models/SmartTactics';
import { Icon } from '../ui/Icon';

import { CoachPlayerAiPanel } from './CoachPlayerAiPanel';

export type CoachEffectifFocus = 'equipe' | 'joueurs' | 'all';

type EffectifSegment = 'effectif' | 'joueurs';

type EffectifProps = CoachChapterCommonProps & {
  focus?: CoachEffectifFocus;
};

function jerseyOf(user: User, index: number): number {
  const n = user.profile?.jersey_number;
  return typeof n === 'number' && n > 0 ? n : index + 1;
}

export const CoachEffectifChapter: React.FC<EffectifProps> = ({
  profile,
  members,
  events,
  onRefresh,
  focus = 'all',
}) => {
  const { t } = useTranslation();
  const { openChat } = useTabNavigation();
  const nav = useTabNavigationActions();
  const shellNav = useCoachShellNav();
  const { tokens } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const clubId = profile.profile.club_id;
  const [segment, setSegment] = useState<EffectifSegment>(
    focus === 'joueurs' ? 'joueurs' : 'effectif',
  );
  const [pending, setPending] = useState<Membership[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [evaluations, setEvaluations] = useState<CoachPlayerEvaluation[]>([]);
  const [wellnessByUid, setWellnessByUid] = useState<Record<string, WellnessSignals>>({});
  const [notePlayer, setNotePlayer] = useState<User | null>(null);

  const loadNotesData = useCallback(async () => {
    if (!clubId) return;
    const [evals, wellness] = await Promise.all([
      coachEvaluationsService.listForClub(clubId).catch(() => [] as CoachPlayerEvaluation[]),
      wellnessCheckinsService.listLatestForClub(clubId).catch(() => ({})),
    ]);
    setEvaluations(evals);
    setWellnessByUid(wellness);
  }, [clubId]);

  useEffect(() => {
    if (!clubId) return;
    void membershipsService.listByClub(clubId).then((rows) => {
      setPending(rows.filter((m) => m.status === 'pending'));
      setMemberships(rows);
    });
    void teamsService.listByClubId(clubId).then(setTeams).catch(() => setTeams([]));
    void loadNotesData();
  }, [clubId, members.length, loadNotesData]);

  useEffect(() => {
    if (focus === 'joueurs') setSegment('joueurs');
    else if (focus === 'equipe') setSegment('effectif');
  }, [focus]);

  const resolvedFocus = useMemo((): Exclude<CoachEffectifFocus, 'all'> => {
    if (focus === 'equipe' || focus === 'joueurs') return focus;
    return segment === 'joueurs' ? 'joueurs' : 'equipe';
  }, [focus, segment]);

  const openGestion = () => {
    if (shellNav) shellNav.requestNav('gestion');
    else nav.openDashboard('gestion');
  };

  const messageUser = async (uid: string, name: string) => {
    await openCarpoolDriverChat(profile, uid, name, openChat);
  };

  const showPitch = resolvedFocus === 'equipe';
  const showRoster = resolvedFocus === 'joueurs';
  const showSegment = focus === 'all';
  const pageId = resolvedFocus === 'joueurs' ? 'joueurs' : 'equipe';

  if (!clubId) {
    return (
      <CoachPane
        title={getCoachPageIdentity(pageId).title}
        actions={[{ icon: 'add', onPress: openGestion, accessibilityLabel: 'Ajouter un membre' }]}
      >
        <CoachChapterScroll>
          <CoachEmptyState
            title={t('coach.portal.effectif.noClub')}
            body={t('coach.portal.effectif.noClubBody')}
            cta="Ouvrir la gestion"
            onPress={openGestion}
          />
        </CoachChapterScroll>
      </CoachPane>
    );
  }

  const pendingLabel =
    pending.length === 1
      ? '1 demande → Gérer'
      : `${pending.length} demandes → Gérer`;

  return (
    <CoachPane
      title={getCoachPageIdentity(pageId).title}
      actions={[{ icon: 'add', onPress: openGestion, accessibilityLabel: 'Ajouter un membre' }]}
    >
      {showSegment ? (
        <View style={styles.segmentTrack}>
          {(
            [
              { id: 'effectif' as const, label: 'Effectif' },
              { id: 'joueurs' as const, label: 'Joueurs' },
            ] as const
          ).map((tab) => {
            const on = segment === tab.id;
            return (
              <PressableSpring
                key={tab.id}
                onPress={() => setSegment(tab.id)}
                scaleTo={0.98}
                haptic
                style={[styles.segmentBtn, on && styles.segmentBtnOn]}
              >
                <CoachText variant="caption" style={[styles.segmentLabel, on && styles.segmentLabelOn]}>
                  {tab.label}
                </CoachText>
              </PressableSpring>
            );
          })}
        </View>
      ) : null}
      <CoachChapterScroll>
        {showPitch ? (
          <CoachSportEasyPitch
            teams={teams}
            memberships={memberships}
            members={members}
            clubId={clubId}
          />
        ) : null}

        {showRoster ? (
          <>
            <View style={styles.listHead}>
              <CoachText variant="section" style={styles.listTitle}>
                {t('coach.portal.effectif.roster')}
              </CoachText>
              {resolvedFocus === 'joueurs' ? (
                <CoachText variant="caption" muted style={styles.manageLink}>
                  Notes & analyse IA
                </CoachText>
              ) : (
                <PressableSpring onPress={openGestion} scaleTo={0.98} haptic>
                  <CoachText variant="caption" muted style={styles.manageLink}>
                    Gérer licences
                  </CoachText>
                </PressableSpring>
              )}
            </View>

            {members.length === 0 ? (
              <CoachText variant="caption" muted>
                {t('coach.portal.effectif.rosterEmpty')}
              </CoachText>
            ) : (
              members.map((m, index) => (
                <View key={m.uid} style={styles.playerRow}>
                  <PressableSpring
                    onPress={() => setNotePlayer(m)}
                    scaleTo={0.98}
                    haptic
                    style={styles.playerRowMain}
                  >
                    <View style={styles.playerNumWrap}>
                      <CoachText variant="caption" style={styles.playerNum}>
                        {jerseyOf(m, index)}
                      </CoachText>
                    </View>
                    <View style={styles.playerInfo}>
                      <CoachText variant="section" numberOfLines={1} style={styles.playerName}>
                        {m.display_name}
                      </CoachText>
                      {resolvedFocus === 'joueurs' ? (
                        <CoachPlayerAiPanel
                          playerUid={m.uid}
                          playerName={m.display_name}
                          events={events}
                          evaluations={evaluations}
                          wellness={wellnessByUid[m.uid]}
                          compact
                        />
                      ) : null}
                    </View>
                  </PressableSpring>
                  <Pressable
                    accessibilityLabel="Message"
                    onPress={() => void messageUser(m.uid, m.display_name)}
                    style={styles.msgBtn}
                  >
                    <Icon name="chat" size={16} color={tokens.muted} />
                  </Pressable>
                </View>
              ))
            )}
          </>
        ) : null}

        {pending.length > 0 ? (
          <PressableSpring onPress={openGestion} scaleTo={0.98} haptic style={styles.pendingLine}>
            <CoachText variant="caption" muted>
              {pendingLabel}
            </CoachText>
          </PressableSpring>
        ) : null}
      </CoachChapterScroll>

      <CoachPlayerNoteSheet
        visible={notePlayer != null}
        player={notePlayer}
        profile={profile}
        events={events}
        evaluations={evaluations}
        wellness={notePlayer ? wellnessByUid[notePlayer.uid] : undefined}
        onClose={() => setNotePlayer(null)}
        onSaved={() => {
          void loadNotesData();
          onRefresh();
        }}
      />
    </CoachPane>
  );
};

function createStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    segmentTrack: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: 3,
      borderRadius: 12,
      backgroundColor: tokens.surface,
      gap: 4,
    },
    segmentBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 8,
      borderRadius: 10,
      ...(tokens.isLight ? { backgroundColor: tokens.elevated } : null),
    },
    segmentBtnOn: {
      backgroundColor: tokens.isLight ? tokens.soft : tokens.elevated,
    },
    segmentLabel: {
      fontWeight: '600',
      color: tokens.muted,
    },
    segmentLabelOn: {
      color: tokens.isLight ? tokens.accent : tokens.foreground,
      fontWeight: '700',
    },
    listHead: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginTop: spacing.sm,
    },
    listTitle: {
      color: tokens.foreground,
      fontWeight: '700',
      letterSpacing: -0.3,
    },
    manageLink: {
      fontWeight: '600',
      textDecorationLine: 'underline',
    },
    playerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      minHeight: 56,
      paddingVertical: 10,
      paddingHorizontal: spacing.md,
      borderRadius: 18,
      backgroundColor: tokens.surface,
      marginBottom: 2,
    },
    playerRowMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.md,
    },
    playerInfo: { flex: 1, gap: 4 },
    msgBtn: {
      padding: spacing.sm,
    },
    playerNumWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: tokens.elevated,
    },
    playerNum: {
      fontWeight: '800',
      color: tokens.foreground,
    },
    playerName: {
      flex: 1,
      fontWeight: '600',
      color: tokens.foreground,
      fontSize: 17,
    },
    pendingLine: {
      paddingVertical: spacing.md,
    },
  });
}
