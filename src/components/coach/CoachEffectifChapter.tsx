import React, { useCallback, useEffect, useState } from 'react';
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
import { COACH_SITE, getCoachPageIdentity } from '../../content/coachPageIdentity';
import { teamsService } from '../../services/teams.service';
import type { Team } from '../../models/Team';
import { CoachPlayerNoteSheet } from './CoachPlayerNoteSheet';
import { coachEvaluationsService } from '../../services/coachEvaluations.service';
import { wellnessCheckinsService } from '../../services/wellnessCheckins.service';
import type { CoachPlayerEvaluation } from '../../models/CoachEvaluation';
import type { WellnessSignals } from '../../models/SmartTactics';
import { Icon } from '../ui/Icon';

function jerseyOf(user: User, index: number): number {
  const n = user.profile?.jersey_number;
  return typeof n === 'number' && n > 0 ? n : index + 1;
}

export const CoachEffectifChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  members,
  events,
  onRefresh,
}) => {
  const { t } = useTranslation();
  const { openChat } = useTabNavigation();
  const nav = useTabNavigationActions();
  const shellNav = useCoachShellNav();
  const clubId = profile.profile.club_id;
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

  const openGestion = () => {
    if (shellNav) shellNav.requestNav('gestion');
    else nav.openDashboard('gestion');
  };

  const messageUser = async (uid: string, name: string) => {
    await openCarpoolDriverChat(profile, uid, name, openChat);
  };

  if (!clubId) {
    return (
      <CoachPane
        title={getCoachPageIdentity('effectif').title}
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
      title={getCoachPageIdentity('effectif').title}
      actions={[{ icon: 'add', onPress: openGestion, accessibilityLabel: 'Ajouter un membre' }]}
    >
      <CoachChapterScroll>
        <CoachSportEasyPitch
          teams={teams}
          memberships={memberships}
          members={members}
          clubId={clubId}
        />

        <View style={styles.listHead}>
          <CoachText variant="section" style={styles.listTitle}>
            {t('coach.portal.effectif.roster')}
          </CoachText>
          <PressableSpring onPress={openGestion} scaleTo={0.98} haptic>
            <CoachText variant="caption" muted style={styles.manageLink}>
              Gérer licences
            </CoachText>
          </PressableSpring>
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
                <CoachText variant="section" numberOfLines={1} style={styles.playerName}>
                  {m.display_name}
                </CoachText>
              </PressableSpring>
              <Pressable
                accessibilityLabel="Message"
                onPress={() => void messageUser(m.uid, m.display_name)}
                style={styles.msgBtn}
              >
                <Icon name="chat" size={16} color={COACH_SITE.muted} />
              </Pressable>
            </View>
          ))
        )}

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

const styles = StyleSheet.create({
  listHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  listTitle: {
    color: COACH_SITE.foreground,
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
    backgroundColor: COACH_SITE.surface,
    marginBottom: 2,
  },
  playerRowMain: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  msgBtn: {
    padding: spacing.sm,
  },
  playerNumWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COACH_SITE.elevated,
  },
  playerNum: {
    fontWeight: '800',
    color: COACH_SITE.foreground,
  },
  playerName: {
    flex: 1,
    fontWeight: '600',
    color: COACH_SITE.foreground,
    fontSize: 17,
  },
  pendingLine: {
    paddingVertical: spacing.md,
  },
});
