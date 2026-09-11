import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, View, TextInput, ScrollView } from 'react-native';
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
import { radius, spacing } from '../../theme/designTokens';
import { CoachSportEasyPitch } from './CoachSportEasyPitch';
import { CoachPane } from './CoachScreenHeader';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import {
  useCoachTheme,
  useCoachThemedStyles,
} from '../../features/coach/shell/CoachThemeContext';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import {
  filterMembersForTeam,
  filterPendingForTeam,
  type CoachThemeTokens,
} from '../../utils/coachTeamTheme';
import { CoachTeamSwitcher } from './CoachTeamSwitcher';
import { CoachPlayerNoteSheet } from './CoachPlayerNoteSheet';
import { coachEvaluationsService } from '../../services/coachEvaluations.service';
import { wellnessCheckinsService } from '../../services/wellnessCheckins.service';
import type { CoachPlayerEvaluation } from '../../models/CoachEvaluation';
import type { WellnessSignals } from '../../models/SmartTactics';
import { hasAnyCoachRating } from '../../utils/coachEvaluationRatings';
import { Icon } from '../ui/Icon';
import { resolveJoueurPositionGroup, type JoueurPositionGroup } from '../../utils/joueurExperienceTheme';

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

function positionGroupLabel(group: JoueurPositionGroup): string {
  switch (group) {
    case 'goalkeeper':
      return 'GB';
    case 'defender':
      return 'DEF';
    case 'midfielder':
      return 'MIL';
    case 'forward':
      return 'ATT';
    default:
      return 'JOU';
  }
}

function positionGroupColor(group: JoueurPositionGroup): string {
  switch (group) {
    case 'goalkeeper':
      return '#F59E0B';
    case 'defender':
      return '#3B82F6';
    case 'midfielder':
      return '#10B981';
    case 'forward':
      return '#EF4444';
    default:
      return '#8B5CF6';
  }
}

function mockPlayerAiInsight(index: number, group: JoueurPositionGroup): string {
  if (group === 'goalkeeper') return 'Réflexes & Relance';
  if (group === 'defender') return index % 2 === 0 ? 'Duels & Anticipation' : 'Couloir & Vitesse';
  if (group === 'midfielder') return index % 2 === 0 ? 'Distribution & Vision' : 'Box-to-Box & Impact';
  return index % 2 === 0 ? 'Vitesse & Percussion' : 'Finition & Pivot';
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
  const { tokens, teamId: activeTeamId } = useCoachTheme();
  const styles = useCoachThemedStyles(createStyles);
  const clubId = profile.profile.club_id;
  const [segment, setSegment] = useState<EffectifSegment>(
    focus === 'joueurs' ? 'joueurs' : 'effectif',
  );
  const [pending, setPending] = useState<Membership[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [evaluations, setEvaluations] = useState<CoachPlayerEvaluation[]>([]);
  const [wellnessByUid, setWellnessByUid] = useState<Record<string, WellnessSignals>>({});
  const [notePlayer, setNotePlayer] = useState<User | null>(null);

  // Search & Position filters for Joueurs tab
  const [playerSearchQuery, setPlayerSearchQuery] = useState('');
  const [positionFilter, setPositionFilter] = useState<'all' | 'goalkeeper' | 'defender' | 'midfielder' | 'forward'>('all');

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

  const teamMembers = useMemo(
    () => filterMembersForTeam(members, memberships, activeTeamId),
    [members, memberships, activeTeamId],
  );
  const teamPending = useMemo(
    () => filterPendingForTeam(pending, activeTeamId),
    [pending, activeTeamId],
  );

  const filteredRoster = useMemo(() => {
    let list = teamMembers;
    if (positionFilter !== 'all') {
      list = list.filter((m) => resolveJoueurPositionGroup(m.profile?.position) === positionFilter);
    }
    if (playerSearchQuery.trim()) {
      const q = playerSearchQuery.toLowerCase().trim();
      list = list.filter((m) => m.display_name?.toLowerCase().includes(q));
    }
    return list;
  }, [teamMembers, positionFilter, playerSearchQuery]);

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
    teamPending.length === 1
      ? '1 demande → Gérer'
      : `${teamPending.length} demandes → Gérer`;

  return (
    <CoachPane
      title={getCoachPageIdentity(pageId).title}
      actions={[{ icon: 'add', onPress: openGestion, accessibilityLabel: 'Ajouter un membre' }]}
    >
      <View style={styles.teamSwitcherWrap}>
        <CoachTeamSwitcher />
      </View>
      {showSegment ? (
        <View style={styles.segmentTrack}>
          {(
            [
              { id: 'effectif' as const, label: 'Compositions & Terrain' },
              { id: 'joueurs' as const, label: 'Effectif Joueurs' },
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
            memberships={memberships}
            members={teamMembers}
            clubId={clubId}
          />
        ) : null}

        {showRoster ? (
          <>
            {/* Search and filter bar for players */}
            <View style={[styles.searchBar, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
              <Icon name="search" size={16} color={tokens.muted} />
              <TextInput
                style={[styles.searchInput, { color: tokens.foreground }]}
                placeholder="Rechercher un joueur..."
                placeholderTextColor={tokens.muted}
                value={playerSearchQuery}
                onChangeText={setPlayerSearchQuery}
              />
              {playerSearchQuery.length > 0 && (
                <PressableSpring onPress={() => setPlayerSearchQuery('')}>
                  <Icon name="close" size={16} color={tokens.muted} />
                </PressableSpring>
              )}
            </View>

            {/* Position filter chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.posChipsRow}
            >
              {[
                { id: 'all' as const, label: `Tous (${teamMembers.length})` },
                {
                  id: 'goalkeeper' as const,
                  label: `Gardiens (${teamMembers.filter((m) => resolveJoueurPositionGroup(m.profile?.position) === 'goalkeeper').length})`,
                },
                {
                  id: 'defender' as const,
                  label: `Défenseurs (${teamMembers.filter((m) => resolveJoueurPositionGroup(m.profile?.position) === 'defender').length})`,
                },
                {
                  id: 'midfielder' as const,
                  label: `Milieux (${teamMembers.filter((m) => resolveJoueurPositionGroup(m.profile?.position) === 'midfielder').length})`,
                },
                {
                  id: 'forward' as const,
                  label: `Attaquants (${teamMembers.filter((m) => resolveJoueurPositionGroup(m.profile?.position) === 'forward').length})`,
                },
              ].map((pill) => {
                const isSelected = positionFilter === pill.id;
                return (
                  <PressableSpring
                    key={pill.id}
                    onPress={() => setPositionFilter(pill.id)}
                    style={[
                      styles.posChip,
                      {
                        backgroundColor: isSelected ? tokens.accent : tokens.surface,
                        borderColor: isSelected ? tokens.accent : tokens.border,
                      },
                    ]}
                  >
                    <CoachText
                      style={[
                        styles.posChipText,
                        { color: isSelected ? tokens.onAccent : tokens.muted },
                      ]}
                    >
                      {pill.label}
                    </CoachText>
                  </PressableSpring>
                );
              })}
            </ScrollView>

            <View style={styles.listHead}>
              <CoachText variant="section" style={styles.listTitle}>
                {filteredRoster.length} Joueur{filteredRoster.length > 1 ? 's' : ''}
              </CoachText>
              <PressableSpring onPress={openGestion} scaleTo={0.98} haptic>
                <CoachText variant="caption" muted style={styles.manageLink}>
                  Gérer licences & effectif
                </CoachText>
              </PressableSpring>
            </View>

            {filteredRoster.length === 0 ? (
              <View style={[styles.emptyCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                <Icon name="people" size={28} color={tokens.muted} />
                <CoachText style={{ color: tokens.muted, marginTop: spacing.sm, textAlign: 'center' }}>
                  Aucun joueur ne correspond à cette recherche.
                </CoachText>
              </View>
            ) : (
              filteredRoster.map((m, index) => {
                const group = resolveJoueurPositionGroup(m.profile?.position);
                const posBadge = positionGroupLabel(group);
                const posColor = positionGroupColor(group);
                const insight = mockPlayerAiInsight(index, group);
                const hasPrivateNote = evaluations.some(
                  (e) => e.player_uid === m.uid && (Boolean(e.notes?.trim()) || hasAnyCoachRating(e.ratings)),
                );

                return (
                  <View key={m.uid} style={[styles.playerCard, { backgroundColor: tokens.surface, borderColor: tokens.border }]}>
                    <PressableSpring
                      onPress={() => setNotePlayer(m)}
                      scaleTo={0.98}
                      haptic
                      style={styles.playerCardMain}
                    >
                      {/* Jersey number circle */}
                      <View style={[styles.playerNumWrap, { backgroundColor: tokens.elevated, borderColor: posColor + '40' }]}>
                        <CoachText style={[styles.playerNum, { color: tokens.foreground }]}>
                          {jerseyOf(m, index)}
                        </CoachText>
                      </View>

                      {/* Player Details */}
                      <View style={styles.playerInfo}>
                        <View style={styles.playerNameRow}>
                          <CoachText numberOfLines={1} style={[styles.playerName, { color: tokens.foreground }]}>
                            {m.display_name}
                          </CoachText>
                          <View style={[styles.posBadge, { backgroundColor: posColor + '20', borderColor: posColor + '60' }]}>
                            <CoachText style={[styles.posBadgeText, { color: posColor }]}>
                              {posBadge}
                            </CoachText>
                          </View>
                          {hasPrivateNote && (
                            <View style={[styles.privateNoteBadge, { backgroundColor: tokens.accent + '25' }]}>
                              <Icon name="document" size={12} color={tokens.accent} />
                            </View>
                          )}
                        </View>

                        {/* Player AI Insight Pill & Readiness */}
                        <View style={styles.playerTagsRow}>
                          <View style={styles.aiInsightPill}>
                            <CoachText style={styles.aiInsightText}>{insight}</CoachText>
                          </View>
                          <View style={styles.readinessPill}>
                            <View style={[styles.readinessDot, { backgroundColor: '#10B981' }]} />
                            <CoachText style={styles.readinessText}>96% Forme</CoachText>
                          </View>
                        </View>
                      </View>
                    </PressableSpring>

                    {/* Quick Action Buttons */}
                    <View style={styles.playerCardActions}>
                      <Pressable
                        accessibilityLabel="Note coach"
                        onPress={() => setNotePlayer(m)}
                        style={[styles.actionBtn, { backgroundColor: tokens.elevated }]}
                      >
                        <Icon name="document" size={15} color={tokens.foreground} />
                      </Pressable>
                      <Pressable
                        accessibilityLabel="Message"
                        onPress={() => void messageUser(m.uid, m.display_name)}
                        style={[styles.actionBtn, { backgroundColor: tokens.elevated }]}
                      >
                        <Icon name="chat" size={15} color={tokens.foreground} />
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </>
        ) : null}

        {teamPending.length > 0 ? (
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
    teamSwitcherWrap: {
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
    },
    segmentTrack: {
      flexDirection: 'row',
      marginHorizontal: spacing.md,
      marginBottom: spacing.sm,
      padding: 4,
      borderRadius: 14,
      backgroundColor: tokens.surface,
      gap: 6,
    },
    segmentBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 9,
      borderRadius: 10,
    },
    segmentBtnOn: {
      backgroundColor: tokens.isLight ? tokens.soft : tokens.elevated,
    },
    segmentLabel: {
      fontWeight: '600',
      color: tokens.muted,
      fontSize: 13,
    },
    segmentLabelOn: {
      color: tokens.isLight ? tokens.accent : tokens.foreground,
      fontWeight: '800',
    },
    searchBar: {
      flexDirection: 'row',
      alignItems: 'center',
      height: 44,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      marginBottom: spacing.sm,
    },
    searchInput: { flex: 1, marginLeft: spacing.sm, fontSize: 13 },
    posChipsRow: { gap: spacing.xs, marginBottom: spacing.md },
    posChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    posChipText: { fontSize: 12, fontWeight: '700' },
    listHead: {
      flexDirection: 'row',
      alignItems: 'baseline',
      justifyContent: 'space-between',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    listTitle: {
      color: tokens.foreground,
      fontWeight: '800',
      fontSize: 16,
      letterSpacing: -0.3,
    },
    manageLink: {
      fontWeight: '700',
      color: tokens.accent,
    },
    emptyCard: {
      padding: spacing.xl,
      borderRadius: radius.xl,
      borderWidth: 1,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.md,
    },
    playerCard: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.xl,
      borderWidth: 1,
      marginBottom: spacing.xs,
    },
    playerCardMain: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    playerInfo: { flex: 1, gap: 4 },
    playerNumWrap: {
      width: 40,
      height: 40,
      borderRadius: 20,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1.5,
    },
    playerNum: {
      fontWeight: '900',
      fontSize: 15,
    },
    playerNameRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    playerName: {
      fontWeight: '800',
      fontSize: 15,
      maxWidth: 160,
    },
    posBadge: {
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: radius.pill,
      borderWidth: 1,
    },
    posBadgeText: {
      fontSize: 10,
      fontWeight: '900',
    },
    privateNoteBadge: {
      padding: 4,
      borderRadius: radius.pill,
    },
    playerTagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      flexWrap: 'wrap',
    },
    aiInsightPill: {
      backgroundColor: 'rgba(139, 92, 246, 0.15)',
      paddingHorizontal: 6,
      paddingVertical: 2,
      borderRadius: 4,
    },
    aiInsightText: {
      color: '#A78BFA',
      fontSize: 11,
      fontWeight: '600',
    },
    readinessPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    readinessDot: { width: 6, height: 6, borderRadius: 3 },
    readinessText: { color: '#10B981', fontSize: 11, fontWeight: '700' },
    playerCardActions: { flexDirection: 'row', gap: 6, marginLeft: spacing.xs },
    actionBtn: {
      width: 34,
      height: 34,
      borderRadius: 17,
      alignItems: 'center',
      justifyContent: 'center',
    },
    pendingLine: {
      paddingVertical: spacing.md,
    },
  });
}
