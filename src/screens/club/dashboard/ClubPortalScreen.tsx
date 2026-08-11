import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { TabScreenShell } from '../../../components/app/TabScreenShell';
import { ClubPageFrame } from '../../../components/club/ClubPageFrame';
import { getClubPageIdentity } from '../../../content/clubPageIdentity';
import { HomeScreen } from '../../HomeScreen';
import { TeamManagementScreen } from '../../TeamManagementScreen';
import { ClubQuoteRequestScreen } from './ClubQuoteRequestScreen';
import {
  ClubChapterRail,
  ClubChapterScroll,
  ClubSectionCard,
  ClubKpiRow,
  ClubActionRow,
  ClubLightPanel,
  ClubEmptyState,
} from '../../../components/club/clubPortalUi';
import { ClubRosterBoardPanel } from '../../../components/club/ClubRosterBoardPanel';
import { ClubEventOrganization } from '../../../components/club/ClubEventOrganization';
import { ClubMatchInvitePanel } from '../../../components/club/ClubMatchInvitePanel';
import { ClubOffersComparePanel } from '../../../components/club/ClubOffersComparePanel';
import { ClubVideoHardwarePanel } from '../../../components/club/ClubVideoHardwarePanel';
import { ClubEquipmentMarketPanel } from '../../../components/club/ClubEquipmentMarketPanel';
import { ClubTrialSheetsPanel } from '../../../components/club/ClubTrialSheetsPanel';
import { ClubTeamStadiumPanel } from '../../../components/club/ClubTeamStadiumPanel';
import { StaffPrioritiesStrip } from '../../../features/v3/components/StaffPrioritiesStrip';
import { ProDayText } from '../../../components/ui/ProDayText';
import { PressableSpring, PushScreenTransition } from '../../../components/motion';
import { useSessionProfile } from '../../../hooks/useSessionProfile';
import { useAppTheme } from '../../../context/ProductLineContext';
import { useTabNavigationActions } from '../../../hooks/useTabNavigationActions';
import { clubsService } from '../../../services/clubs.service';
import { teamsService } from '../../../services/teams.service';
import { membershipsService } from '../../../services/memberships.service';
import { usersService } from '../../../services/users.service';
import { clubRosterBoardService } from '../../../services/clubRosterBoard.service';
import type { Club } from '../../../models/Club';
import type { Membership } from '../../../models/Membership';
import type { Team } from '../../../models/Team';
import type { User } from '../../../models/User';
import {
  buildClubTeamRows,
  buildStaffSummary,
  formatTeamRowLabel,
} from '../../../utils/clubStructureView';
import { buildClubAiBriefing } from '../../../utils/clubAiBriefing';
import {
  CLUB_PORTAL_CHAPTERS,
  type ClubPortalChapterId,
} from '../../../content/clubPortalChapters';
import { defaultMatchSponsorPackage, CLUB_SPONSOR_PAYMENT_NOTICE } from '../../../models/ClubSponsorPackage';
import type { StaffPriorityItem } from '../../../features/v3/engines/staffHome.engine';
import { useClubShellNav } from '../../../features/club/shell/ClubShellNavContext';
import type {
  ClubCompetitionFocus,
  ClubNavItemId,
} from '../../../features/club/navigation/clubNavConfig';
import { userHasClubAiAssistant } from '../../../utils/clubFeatureAccess';
import { spacing } from '../../../theme/designTokens';

export type ClubPortalScreenProps = {
  chapter?: ClubPortalChapterId;
  hideRail?: boolean;
  embedded?: boolean;
  outilsFocus?: 'video' | 'offers' | 'equipment' | 'sponsors' | 'all';
  competitionFocus?: ClubCompetitionFocus;
};

/**
 * Portail Club — standalone (rail) ou embarqué dans ClubAppShell (sidebar dossiers).
 */
export const ClubPortalScreen: React.FC<ClubPortalScreenProps> = ({
  chapter: chapterProp,
  hideRail = false,
  embedded = false,
  outilsFocus = 'all',
  competitionFocus = 'all',
}) => {
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
  const nav = useTabNavigationActions();
  const shellNav = useClubShellNav();
  const hasAiAssistant = userHasClubAiAssistant(profile);
  const [chapterState, setChapterState] = useState<ClubPortalChapterId>(chapterProp ?? 'aujourdhui');
  const chapter = chapterProp ?? chapterState;
  const setChapter = (id: ClubPortalChapterId) => {
    if (shellNav) {
      const map: Partial<Record<ClubPortalChapterId, ClubNavItemId>> = {
        aujourdhui: 'today',
        structure: 'structure',
        vivier: 'vivier',
        competition: 'invites',
        outils: 'offers',
      };
      const target = map[id];
      if (target) {
        shellNav.requestNav(target);
        return;
      }
    }
    setChapterState(id);
  };
  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [coachNames, setCoachNames] = useState<Map<string, string>>(new Map());
  const [openInternalNeeds, setOpenInternalNeeds] = useState(0);
  const [openExternalNeeds, setOpenExternalNeeds] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showManagement, setShowManagement] = useState(false);
  const [showQuote, setShowQuote] = useState(false);
  const [stadiumTeamId, setStadiumTeamId] = useState<string | null>(null);

  useEffect(() => {
    if (chapterProp) setChapterState(chapterProp);
  }, [chapterProp]);

  const clubId = profile?.profile.club_id ?? profile?.uid;
  const chapterMeta = CLUB_PORTAL_CHAPTERS.find((c) => c.id === chapter)!;

  const load = useCallback(async () => {
    if (!clubId) return;
    try {
      const [clubRow, teamRows, membershipRows, memberRows, internalNeeds, externalNeeds] =
        await Promise.all([
          clubsService.getById(clubId),
          teamsService.listByClubId(clubId),
          membershipsService.listByClub(clubId),
          usersService.listMembersByClubId(clubId),
          clubRosterBoardService.listNeedsForClub(clubId, 'internal').catch(() => []),
          clubRosterBoardService.listNeedsForClub(clubId, 'external').catch(() => []),
        ]);
      setClub(clubRow);
      setTeams(teamRows);
      setMemberships(membershipRows);
      setMembers(memberRows);
      setOpenInternalNeeds(internalNeeds.filter((n) => n.status === 'open').length);
      setOpenExternalNeeds(externalNeeds.filter((n) => n.status === 'open').length);
      const coachUids = Array.from(new Set(teamRows.flatMap((t) => t.coach_uids)));
      const coachProfiles = await Promise.all(coachUids.map((uid) => usersService.getById(uid)));
      const names = new Map<string, string>();
      coachProfiles.forEach((c) => {
        if (c) names.set(c.uid, c.display_name);
      });
      setCoachNames(names);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [clubId]);

  useEffect(() => {
    void load();
  }, [load]);

  const teamRows = useMemo(
    () => buildClubTeamRows(teams, memberships, coachNames),
    [teams, memberships, coachNames],
  );
  const staff = useMemo(() => buildStaffSummary(teams), [teams]);
  const pending = useMemo(
    () => memberships.filter((m) => m.status === 'pending'),
    [memberships],
  );
  const teamsWithoutCoach = useMemo(
    () => teams.filter((t) => !t.coach_uids?.length).length,
    [teams],
  );
  const sponsorPkg = useMemo(
    () => defaultMatchSponsorPackage(clubId ?? 'club'),
    [clubId],
  );
  const clubName = club?.name ?? profile?.display_name ?? 'Club';
  const briefing = useMemo(
    () =>
      buildClubAiBriefing({
        clubName,
        teamsCount: teams.length,
        playersCount: members.length,
        coachesCount: staff.coachCount,
        pendingMemberships: pending.length,
        teamsWithoutCoach,
        openInternalNeeds,
        openExternalNeeds,
      }),
    [
      clubName,
      teams.length,
      members.length,
      staff.coachCount,
      pending.length,
      teamsWithoutCoach,
      openInternalNeeds,
      openExternalNeeds,
    ],
  );

  const handleApprove = async (membershipId: string) => {
    if (!profile?.uid) return;
    setActionId(membershipId);
    try {
      await membershipsService.approve(membershipId, profile.uid);
      await load();
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (membershipId: string) => {
    if (!profile?.uid) return;
    setActionId(membershipId);
    try {
      await membershipsService.reject(membershipId, profile.uid);
      await load();
    } finally {
      setActionId(null);
    }
  };

  const onPriorityPress = (item: StaffPriorityItem) => {
    if (item.id === 'pending-members' || item.id === 'create-team' || item.id === 'assign-coach') {
      setChapter('structure');
      if (item.id === 'create-team' || item.id === 'assign-coach') setShowManagement(true);
      return;
    }
    if (item.id === 'bourse-needs') {
      setChapter('vivier');
      return;
    }
    if (item.tab === 'matchs') nav.setActiveTab('matchs');
    if (item.tab === 'recrutement') nav.setActiveTab('recrutement');
  };

  if (!profile || profile.role !== 'club') {
    return <HomeScreen />;
  }

  const showVideo = outilsFocus === 'all' || outilsFocus === 'video';
  const showOffers = outilsFocus === 'all' || outilsFocus === 'offers';
  const showEquipment = outilsFocus === 'all' || outilsFocus === 'equipment';
  const showSponsors = outilsFocus === 'all' || outilsFocus === 'sponsors';

  const content = (
    <>
      {!hideRail ? <ClubChapterRail active={chapter} onChange={setChapter} /> : null}
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <ClubChapterScroll
          refreshing={refreshing}
          onRefresh={() => {
            setRefreshing(true);
            void load();
          }}
        >
          {chapter === 'aujourdhui' ? (
            <View style={styles.stack}>
              <ClubSectionCard
                kicker="État du club"
                title={briefing.headline}
                body={briefing.summary}
              />
              <StaffPrioritiesStrip items={briefing.priorities} onPress={onPriorityPress} />
              {briefing.suggestions.length > 0 ? (
                <ClubSectionCard
                  kicker={hasAiAssistant ? 'Suggestions IA' : 'Priorités'}
                  title={
                    hasAiAssistant
                      ? 'Prochaines actions utiles'
                      : 'Actions recommandées'
                  }
                  body={
                    hasAiAssistant
                      ? undefined
                      : 'Passez en Tout inclus pour l’Assistant IA complet (chatbot + suggestions enrichies).'
                  }
                >
                  {briefing.suggestions.map((s) => (
                    <PressableSpring
                      key={s.id}
                      onPress={() => {
                        if (s.tab === 'recrutement') return nav.setActiveTab('recrutement');
                        if (s.tab === 'matchs') return nav.setActiveTab('matchs');
                        if (s.chapter) setChapter(s.chapter);
                      }}
                      scaleTo={0.98}
                      style={[styles.suggestRow, { borderColor: colors.border }]}
                    >
                      <ProDayText variant="caption" accent style={styles.suggestTitle}>
                        {s.title}
                      </ProDayText>
                      <ProDayText variant="caption" muted>
                        {s.detail}
                      </ProDayText>
                    </PressableSpring>
                  ))}
                  {embedded ? (
                    <ClubActionRow
                      primary="Ouvrir l’Assistant"
                      onPrimary={() => shellNav?.requestNav('assistant')}
                      secondary="Chat live"
                      onSecondary={() => shellNav?.requestNav('assistant')}
                    />
                  ) : (
                    <ClubActionRow
                      primary="Ouvrir l’Assistant"
                      onPrimary={() => shellNav?.requestNav('assistant')}
                    />
                  )}
                </ClubSectionCard>
              ) : null}
              <ClubKpiRow
                items={[
                  { label: 'Équipes', value: String(teams.length) },
                  { label: 'Joueurs', value: String(members.length) },
                  { label: 'Coachs', value: String(staff.coachCount) },
                  { label: 'Attente', value: String(pending.length) },
                ]}
              />
              {!hideRail ? (
                <ClubSectionCard kicker="Raccourcis" title="Aller au travail">
                  <ClubActionRow
                    primary="Structure"
                    onPrimary={() => setChapter('structure')}
                    secondary="Vivier"
                    onSecondary={() => setChapter('vivier')}
                  />
                  <ClubActionRow
                    primary="Compétition"
                    onPrimary={() => setChapter('competition')}
                    secondary="Calendrier"
                    onSecondary={() => nav.setActiveTab('matchs')}
                  />
                </ClubSectionCard>
              ) : null}
            </View>
          ) : null}

          {chapter === 'structure' ? (
            <View style={styles.stack}>
              <ClubTeamStadiumPanel
                teams={teams}
                memberships={memberships}
                members={members}
                coachNamesByUid={coachNames}
                initialTeamId={stadiumTeamId}
                onTeamChange={setStadiumTeamId}
              />
              <ClubSectionCard
                kicker="Équipes"
                title="Arbre des catégories"
                body="U13 → Seniors. Tapez une équipe pour la voir sur le stade. Affectez un coach, validez les adhésions."
              >
                <ClubActionRow primary="Gérer équipes & coachs" onPrimary={() => setShowManagement(true)} />
              </ClubSectionCard>
              {teamRows.length === 0 ? (
                <ClubEmptyState
                  title="Aucune équipe"
                  body="Créez la première catégorie pour activer bourse et calendrier."
                  cta="Créer une équipe"
                  onPress={() => setShowManagement(true)}
                />
              ) : (
                teamRows.map((row, index) => (
                  <PressableSpring
                    key={row.teamId}
                    onPress={() => setStadiumTeamId(row.teamId)}
                    scaleTo={0.98}
                    haptic
                  >
                    <ClubLightPanel>
                      <ProDayText variant="caption" muted>
                        {index === teamRows.length - 1 ? '└──' : '├──'}
                        {stadiumTeamId === row.teamId ? ' · stade' : ''}
                      </ProDayText>
                      <ProDayText variant="section">{formatTeamRowLabel(row)}</ProDayText>
                      <ProDayText variant="caption" muted>
                        {row.licensedCount} licencié(s)
                        {row.coachNames.length > 0
                          ? ` · ${row.coachNames.join(', ')}`
                          : ' · aucun coach'}
                      </ProDayText>
                    </ClubLightPanel>
                  </PressableSpring>
                ))
              )}
              {pending.map((m) => (
                <ClubLightPanel key={m.id}>
                  <ProDayText variant="section">{m.player_name}</ProDayText>
                  <ProDayText variant="caption" muted>
                    Depuis {m.requested_at.toLocaleDateString('fr-FR')}
                  </ProDayText>
                  <ClubActionRow
                    primary="Approuver"
                    onPrimary={() => void handleApprove(m.id)}
                    secondary="Refuser"
                    onSecondary={() => void handleReject(m.id)}
                  />
                  {actionId === m.id ? <ActivityIndicator color={colors.accent} /> : null}
                </ClubLightPanel>
              ))}
            </View>
          ) : null}

          {chapter === 'vivier' ? (
            <View style={styles.stack}>
              <ClubSectionCard
                kicker="Ordre"
                title="1. Bourse interne · 2. Mercato"
                body="Équipe B / réserve d’abord, puis pipeline Observé → Intégré."
              >
                <ClubActionRow
                  primary="Ouvrir le pipeline"
                  onPrimary={() => nav.setActiveTab('recrutement')}
                />
              </ClubSectionCard>
              <ClubRosterBoardPanel
                clubId={clubId ?? profile.uid}
                profile={profile}
                members={members}
                audience="club"
                onOpenMercato={() => nav.setActiveTab('recrutement')}
              />
              <ClubTrialSheetsPanel clubId={clubId ?? profile.uid} profile={profile} />
            </View>
          ) : null}

          {chapter === 'competition' ? (
            <View style={styles.stack}>
              {competitionFocus === 'all' || competitionFocus === 'invites' ? (
                <>
                  <ClubMatchInvitePanel
                    onOrganize={() => nav.openMatchs({ view: 'organize' })}
                    onPropose={() => nav.openMatchs({ view: 'propose' })}
                    onOpenConvocations={() => nav.openMatchs({ homeTab: 'convocations' })}
                  />
                  <ClubActionRow
                    primary="Calendrier club"
                    onPrimary={() => nav.setActiveTab('matchs')}
                    secondary="Covoiturage"
                    onSecondary={() => nav.openCarpool()}
                  />
                </>
              ) : null}
              {competitionFocus === 'all' || competitionFocus === 'events' ? (
                <ClubEventOrganization
                  clubId={clubId ?? profile.uid}
                  userId={profile.uid}
                  organizerName={profile.display_name || 'Dirigeant'}
                />
              ) : null}
            </View>
          ) : null}

          {chapter === 'outils' ? (
            <View style={styles.stack}>
              {showVideo ? (
                <ClubVideoHardwarePanel
                  clubId={clubId ?? profile.uid}
                  profile={profile}
                  onRequestQuote={() => setShowQuote(true)}
                />
              ) : null}
              {showOffers ? (
                <ClubOffersComparePanel
                  onRequestQuote={() => setShowQuote(true)}
                  onOpenSubscription={() => setShowQuote(true)}
                />
              ) : null}
              {showEquipment ? (
                <>
                  <ClubSectionCard
                    kicker="Équipements"
                    title="Marketplace membres"
                    body="Échange / vente entre licenciés. Paiements hors ProDay."
                  />
                  <ClubEquipmentMarketPanel clubId={clubId ?? profile.uid} profile={profile} />
                </>
              ) : null}
              {showSponsors ? (
                <ClubSectionCard
                  kicker="Sponsors"
                  title="Micro-sponsoring"
                  body={`${CLUB_SPONSOR_PAYMENT_NOTICE} Référence : ${sponsorPkg.label}.`}
                >
                  <ClubActionRow
                    primary="Financements"
                    onPrimary={() => nav.openDashboard('sponsors')}
                    secondary="Devis"
                    onSecondary={() => setShowQuote(true)}
                  />
                </ClubSectionCard>
              ) : null}
            </View>
          ) : null}
        </ClubChapterScroll>
      )}
    </>
  );

  const chapterToNav = (id: ClubPortalChapterId): ClubNavItemId => {
    switch (id) {
      case 'structure':
        return 'structure';
      case 'vivier':
        return 'vivier';
      case 'competition':
        return competitionFocus === 'events' ? 'events' : 'invites';
      case 'outils':
        if (outilsFocus === 'video') return 'video';
        if (outilsFocus === 'equipment') return 'equipment';
        if (outilsFocus === 'sponsors') return 'sponsors';
        return 'offers';
      case 'aujourdhui':
      default:
        return 'today';
    }
  };

  return (
    <>
      {embedded ? (
        <View style={styles.embedded}>{content}</View>
      ) : (
        <ClubPageFrame identity={getClubPageIdentity(chapterToNav(chapter))}>
          <TabScreenShell
            caption="Pôle Club"
            title={clubName}
            subtitle={chapterMeta.support}
            flat
          >
            {content}
          </TabScreenShell>
        </ClubPageFrame>
      )}

      <PushScreenTransition active={showManagement}>
        {showManagement ? (
          <TeamManagementScreen profile={profile} onBack={() => setShowManagement(false)} />
        ) : null}
      </PushScreenTransition>
      <PushScreenTransition active={showQuote}>
        {showQuote ? (
          <ClubQuoteRequestScreen
            onBack={() => setShowQuote(false)}
            initialClubName={clubName}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );
};

const styles = StyleSheet.create({
  embedded: { flex: 1, minHeight: 0 },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  stack: { gap: spacing.md },
  suggestRow: {
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 2,
  },
  suggestTitle: { fontWeight: '800' },
});
