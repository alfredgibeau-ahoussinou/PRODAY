import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, View } from 'react-native';
import { TabScreenShell } from '../components/app/TabScreenShell';
import { ProDayText } from '../components/ui/ProDayText';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { PressableSpring, PushScreenTransition } from '../components/motion';
import { HomeScreen } from './HomeScreen';
import { ClubContactsScreen } from './club/ClubContactsScreen';
import { useSessionProfile } from '../hooks/useSessionProfile';
import { useTranslation } from '../context/LocaleContext';
import { useAppTheme } from '../context/ProductLineContext';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { clubsService } from '../services/clubs.service';
import { teamsService } from '../services/teams.service';
import { membershipsService } from '../services/memberships.service';
import { usersService } from '../services/users.service';
import type { Club } from '../models/Club';
import type { Membership } from '../models/Membership';
import type { Team } from '../models/Team';
import type { User } from '../models/User';
import {
  aggregateTopScorers,
  buildClubTeamRows,
  buildStaffSummary,
  countPendingMemberships,
  formatTeamRowLabel,
} from '../utils/clubStructureView';
import { radius, spacing } from '../theme/designTokens';

/** Onglet Structure du shell club pro — arbre équipes, adhésions, staff. */
export const ClubStructureScreen: React.FC = () => {
  const profile = useSessionProfile();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const nav = useTabNavigationActions();
  const [club, setClub] = useState<Club | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [coachNames, setCoachNames] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [showContacts, setShowContacts] = useState(false);

  const clubId = profile?.profile.club_id ?? profile?.uid;

  const loadStructure = useCallback(async () => {
    if (!clubId) return;
    setLoading(true);
    try {
      const [clubRow, teamRows, membershipRows, memberRows] = await Promise.all([
        clubsService.getById(clubId),
        teamsService.listByClubId(clubId),
        membershipsService.listByClub(clubId),
        usersService.listMembersByClubId(clubId),
      ]);
      setClub(clubRow);
      setTeams(teamRows);
      setMemberships(membershipRows);
      setMembers(memberRows);

      const coachUids = Array.from(new Set(teamRows.flatMap((team) => team.coach_uids)));
      const coachProfiles = await Promise.all(coachUids.map((uid) => usersService.getById(uid)));
      const names = new Map<string, string>();
      coachProfiles.forEach((coach) => {
        if (coach) names.set(coach.uid, coach.display_name);
      });
      setCoachNames(names);
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    void loadStructure();
  }, [loadStructure]);

  const teamRows = useMemo(
    () => buildClubTeamRows(teams, memberships, coachNames),
    [teams, memberships, coachNames]
  );
  const staff = useMemo(() => buildStaffSummary(teams), [teams]);
  const pending = useMemo(
    () => memberships.filter((m) => m.status === 'pending'),
    [memberships]
  );
  const topScorers = useMemo(() => aggregateTopScorers(members, 3), [members]);

  const handleApprove = async (membershipId: string) => {
    if (!profile?.uid) return;
    setActionId(membershipId);
    try {
      await membershipsService.approve(membershipId, profile.uid);
      await loadStructure();
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (membershipId: string) => {
    if (!profile?.uid) return;
    setActionId(membershipId);
    try {
      await membershipsService.reject(membershipId, profile.uid);
      await loadStructure();
    } finally {
      setActionId(null);
    }
  };

  if (!profile || profile.role !== 'club') {
    return <HomeScreen />;
  }

  return (
    <>
      <TabScreenShell
        caption={t('clubStructure.shell.caption')}
        title={t('clubStructure.title')}
        subtitle={t('clubStructure.subtitle')}
        flat
      >
        {loading ? (
          <View style={styles.loader}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.content}>
            <ProDaySurface variant="accent" style={[styles.clubHeader, { borderColor: colors.border }]}>
              <ProDayText variant="title">{club?.name ?? profile.display_name}</ProDayText>
              {club?.city ? (
                <ProDayText variant="caption" muted>
                  {club.city}
                </ProDayText>
              ) : null}
            </ProDaySurface>

            <ProDayText variant="eyebrow" muted>
              {t('clubStructure.teams')}
            </ProDayText>
            {teamRows.length > 0 ? (
              teamRows.map((row, index) => (
                <View key={row.teamId} style={styles.treeRow}>
                  <ProDayText variant="caption" muted style={styles.treePrefix}>
                    {index === teamRows.length - 1 ? '└──' : '├──'}
                  </ProDayText>
                  <ProDaySurface variant="module" style={[styles.teamCard, { borderColor: colors.border }]}>
                    <ProDayText variant="section">{formatTeamRowLabel(row)}</ProDayText>
                    <ProDayText variant="caption" muted>
                      {t('clubStructure.licensedCount', { n: String(row.licensedCount) })}
                      {row.coachNames.length > 0
                        ? `. ${t('clubStructure.coach', { name: row.coachNames.join(', ') })}`
                        : `. ${t('clubStructure.noCoach')}`}
                    </ProDayText>
                  </ProDaySurface>
                </View>
              ))
            ) : (
              <ProDaySurface variant="module" style={[styles.empty, { borderColor: colors.border }]}>
                <ProDayText variant="body">{t('clubStructure.noTeams')}</ProDayText>
              </ProDaySurface>
            )}

            <ProDaySurface variant="module" style={[styles.staffCard, { borderColor: colors.border }]}>
              <ProDayText variant="section">{t('clubStructure.staffTitle')}</ProDayText>
              <ProDayText variant="caption" muted>
                {t('clubStructure.staffSummary', { coaches: String(staff.coachCount) })}
              </ProDayText>
            </ProDaySurface>

            {pending.length > 0 ? (
              <>
                <ProDayText variant="eyebrow" muted style={styles.sectionTitle}>
                  {t('clubStructure.pendingTitle', { n: String(countPendingMemberships(memberships)) })}
                </ProDayText>
                {pending.map((membership) => (
                  <ProDaySurface
                    key={membership.id}
                    variant="module"
                    style={[styles.pendingCard, { borderColor: colors.border }]}
                  >
                    <ProDayText variant="section">{membership.player_name}</ProDayText>
                    <ProDayText variant="caption" muted>
                      {t('clubStructure.pendingSince', {
                        date: membership.requested_at.toLocaleDateString('fr-FR'),
                      })}
                    </ProDayText>
                    <View style={styles.pendingActions}>
                      <PressableSpring
                        onPress={() => void handleApprove(membership.id)}
                        disabled={actionId === membership.id}
                        style={[styles.pendingBtn, { backgroundColor: colors.accent, borderColor: colors.accent }]}
                      >
                        <ProDayText variant="caption" style={{ color: '#fff' }}>
                          {t('clubStructure.approve')}
                        </ProDayText>
                      </PressableSpring>
                      <PressableSpring
                        onPress={() => void handleReject(membership.id)}
                        disabled={actionId === membership.id}
                        style={[styles.pendingBtn, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
                      >
                        <ProDayText variant="caption" muted>
                          {t('clubStructure.reject')}
                        </ProDayText>
                      </PressableSpring>
                    </View>
                  </ProDaySurface>
                ))}
              </>
            ) : null}

            <ProDayText variant="eyebrow" muted style={styles.sectionTitle}>
              {t('clubStructure.quickActions')}
            </ProDayText>
            <ProDaySurface variant="module" style={[styles.actionCard, { borderColor: colors.border }]}>
              <ProDayText variant="section">{t('clubStructure.scorersTitle')}</ProDayText>
              {topScorers.length > 0 ? (
                topScorers.map((scorer, index) => (
                  <ProDayText key={scorer.uid} variant="caption" muted>
                    {index + 1}. {scorer.name}. {scorer.goals} {t('clubStructure.goals')}
                  </ProDayText>
                ))
              ) : (
                <ProDayText variant="caption" muted>
                  {t('clubStructure.scorersSoon')}
                </ProDayText>
              )}
            </ProDaySurface>

            <PressableSpring
              onPress={() => setShowContacts(true)}
              style={[styles.linkBtn, { borderColor: colors.accent, backgroundColor: colors.accentSoft }]}
            >
              <ProDayText variant="caption" style={{ color: colors.accent }}>
                Contacter arbitres & dirigeants
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              onPress={() => nav.openProfile()}
              style={[styles.linkBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <ProDayText variant="caption" muted>
                Vitrine & image du club
              </ProDayText>
            </PressableSpring>

            <PressableSpring
              onPress={() => nav.openMercato('home')}
              style={[styles.linkBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            >
              <ProDayText variant="caption" muted>
                Annonces & recrutement
              </ProDayText>
            </PressableSpring>
          </ScrollView>
        )}
      </TabScreenShell>

      <PushScreenTransition active={showContacts}>
        {showContacts && clubId ? (
          <ClubContactsScreen
            clubId={clubId}
            canEdit
            onBack={() => setShowContacts(false)}
          />
        ) : null}
      </PushScreenTransition>
    </>
  );
};

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xxl,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },
  clubHeader: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
    marginBottom: spacing.sm,
  },
  treeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xs,
  },
  treePrefix: {
    width: 28,
    paddingTop: spacing.md,
  },
  teamCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  staffCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
    marginTop: spacing.sm,
  },
  sectionTitle: {
    marginTop: spacing.md,
  },
  pendingCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.xs,
  },
  pendingActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  pendingBtn: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  actionCard: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: 4,
  },
  linkBtn: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  empty: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
});
