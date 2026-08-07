import React, { useEffect, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import type { CoachChapterCommonProps } from './coachPortalUi';
import { CoachChapterScroll, CoachEmptyState } from './coachPortalUi';
import { ProDaySurface } from '../ui/ProDaySurface';
import { ProDayText } from '../ui/ProDayText';
import { PressableSpring } from '../motion';
import { ProDayFutCard } from '../cards/ProDayFutCard';
import { membershipsService } from '../../services/memberships.service';
import { usersService } from '../../services/users.service';
import { teamStaffService } from '../../services/teamStaff.service';
import { openCarpoolDriverChat } from '../../utils/openCarpoolDriverChat';
import { userToProDayCard } from '../../utils/prodayFutCard';
import type { Membership } from '../../models/Membership';
import type { User } from '../../models/User';
import type { TeamStaffMember, TeamStaffRole } from '../../models/TeamStaffMember';
import { TEAM_STAFF_ROLE_LABELS } from '../../models/TeamStaffMember';
import { countAttendanceMark, countRsvpYes } from '../../models/TeamEvent';
import { canManageClubEntity } from '../../utils/roleCapabilities';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useAppTheme } from '../../context/ProductLineContext';
import { useTranslation } from '../../context/LocaleContext';
import { radius, spacing } from '../../theme/designTokens';
import { ClubRosterBoardPanel } from '../club/ClubRosterBoardPanel';
export const CoachEffectifChapter: React.FC<CoachChapterCommonProps> = ({
  profile,
  events,
  members,
  onRefresh,
}) => {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { openChat } = useTabNavigation();
  const clubId = profile.profile.club_id;
  const canManage = canManageClubEntity(profile.role);
  const [pending, setPending] = useState<Membership[]>([]);
  const [staff, setStaff] = useState<TeamStaffMember[]>([]);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [staffUid, setStaffUid] = useState('');
  const [staffName, setStaffName] = useState('');
  const [staffRole, setStaffRole] = useState<TeamStaffRole>('assistant');

  useEffect(() => {
    if (!clubId) return;
    void membershipsService.listByClub(clubId).then((rows) => {
      setPending(rows.filter((m) => m.status === 'pending'));
    });
    void teamStaffService.listForClub(clubId).then(setStaff);
  }, [clubId, members.length]);

  const attendanceRollup = useMemo(() => {
    const recent = [...events]
      .filter((e) => e.starts_at.getTime() < Date.now())
      .sort((a, b) => b.starts_at.getTime() - a.starts_at.getTime())
      .slice(0, 5);
    return recent.map((e) => ({
      id: e.id,
      title: e.title,
      yes: countRsvpYes(e),
      present: countAttendanceMark(e, 'present'),
      absent: countAttendanceMark(e, 'absent'),
    }));
  }, [events]);

  const messageUser = async (uid: string, name: string) => {
    await openCarpoolDriverChat(profile, uid, name, openChat);
  };

  const runSearch = async () => {
    if (!search.trim()) return;
    const players = await usersService.listPlayers(search.trim());
    const memberUids = new Set(members.map((m) => m.uid));
    const pendingUids = new Set(pending.map((m) => m.player_uid));
    setResults(players.filter((p) => !memberUids.has(p.uid) && !pendingUids.has(p.uid)).slice(0, 8));
  };

  const invite = async (player: User) => {
    if (!clubId || !canManage) return;
    try {
      await membershipsService.invitePlayer({
        club_id: clubId,
        player_uid: player.uid,
        player_name: player.display_name,
        invited_by_uid: profile.uid,
      });
      Alert.alert('OK', t('coach.portal.effectif.invited'));
      setSearch('');
      setResults([]);
      onRefresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.error'));
    }
  };

  const approve = async (id: string) => {
    try {
      await membershipsService.approve(id, profile.uid);
      setPending((p) => p.filter((m) => m.id !== id));
      onRefresh();
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.saveFailed'));
    }
  };

  const addStaff = async () => {
    if (!clubId || !staffUid.trim()) return;
    try {
      await teamStaffService.add({
        club_id: clubId,
        uid: staffUid.trim(),
        display_name: staffName.trim() || staffUid.trim(),
        staff_role: staffRole,
      });
      setStaffUid('');
      setStaffName('');
      setStaff(await teamStaffService.listForClub(clubId));
    } catch (e) {
      Alert.alert(t('common.error'), e instanceof Error ? e.message : t('common.saveFailed'));
    }
  };

  if (!clubId) {
    return (
      <CoachChapterScroll>
        <CoachEmptyState
          title={t('coach.portal.effectif.noClub')}
          body={t('coach.portal.effectif.noClubBody')}
        />
      </CoachChapterScroll>
    );
  }

  return (
    <CoachChapterScroll>
      <ProDayText variant="section">{t('coach.portal.effectif.title')}</ProDayText>
      <ProDayText variant="caption" muted>
        {t('coach.portal.effectif.subtitle', { n: members.length })}
      </ProDayText>

      <ClubRosterBoardPanel
        clubId={clubId}
        profile={profile}
        members={members}
        defaultTeamLabel={profile.profile.category}
      />

      {members.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cardsRow}
        >
          {members.slice(0, 8).map((m) => (
            <View key={`card_${m.uid}`} style={styles.cardSlot}>
              <ProDayFutCard card={userToProDayCard(m)} width={148} />
            </View>
          ))}
        </ScrollView>
      ) : null}

      {pending.length > 0 ? (
        <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
          <ProDayText variant="caption" accent style={styles.section}>
            {t('coach.portal.effectif.pending')}
          </ProDayText>
          {pending.map((m) => (
            <View key={m.id} style={styles.row}>
              <ProDayText variant="caption" style={{ flex: 1 }}>
                {m.player_name}
              </ProDayText>
              <PressableSpring onPress={() => void approve(m.id)} scaleTo={0.96} haptic>
                <ProDayText variant="caption" accent style={styles.link}>
                  OK
                </ProDayText>
              </PressableSpring>
            </View>
          ))}
        </ProDaySurface>
      ) : null}

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent style={styles.section}>
          {t('coach.portal.effectif.roster')}
        </ProDayText>
        {members.length === 0 ? (
          <ProDayText variant="caption" muted>
            {t('coach.portal.effectif.rosterEmpty')}
          </ProDayText>
        ) : (
          members.slice(0, 24).map((m) => (
            <View key={m.uid} style={styles.row}>
              <View style={{ flex: 1 }}>
                <ProDayText variant="caption" style={{ fontWeight: '700' }}>
                  {m.display_name}
                </ProDayText>
                <ProDayText variant="caption" muted>
                  {m.city ?? m.email}
                </ProDayText>
              </View>
              <PressableSpring
                onPress={() => void messageUser(m.uid, m.display_name)}
                scaleTo={0.96}
                haptic
              >
                <ProDayText variant="caption" accent style={styles.link}>
                  Msg
                </ProDayText>
              </PressableSpring>
            </View>
          ))
        )}
      </ProDaySurface>

      {canManage ? (
        <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
          <ProDayText variant="caption" accent style={styles.section}>
            {t('coach.portal.effectif.invite')}
          </ProDayText>
          <TextInput
            style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
            value={search}
            onChangeText={setSearch}
            placeholder={t('coach.portal.effectif.searchPlaceholder')}
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={() => void runSearch()}
          />
          <PressableSpring onPress={() => void runSearch()} scaleTo={0.96} haptic>
            <ProDayText variant="caption" accent style={styles.link}>
              {t('common.search')}
            </ProDayText>
          </PressableSpring>
          {results.map((u) => (
            <View key={u.uid} style={styles.row}>
              <ProDayText variant="caption" style={{ flex: 1 }}>
                {u.display_name}
              </ProDayText>
              <PressableSpring
                onPress={() => void invite(u)}
                scaleTo={0.96}
                haptic
              >
                <ProDayText variant="caption" accent style={styles.link}>
                  {t('coach.portal.effectif.inviteCta')}
                </ProDayText>
              </PressableSpring>
            </View>
          ))}
        </ProDaySurface>
      ) : null}

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent style={styles.section}>
          {t('coach.portal.effectif.staff')}
        </ProDayText>
        {staff.map((s) => (
          <View key={s.id} style={styles.row}>
            <View style={{ flex: 1 }}>
              <ProDayText variant="caption" style={{ fontWeight: '700' }}>
                {s.display_name}
              </ProDayText>
              <ProDayText variant="caption" muted>
                {TEAM_STAFF_ROLE_LABELS[s.staff_role]}
              </ProDayText>
            </View>
            <PressableSpring
              onPress={() => void messageUser(s.uid, s.display_name)}
              scaleTo={0.96}
              haptic
            >
              <ProDayText variant="caption" accent style={styles.link}>
                Msg
              </ProDayText>
            </PressableSpring>
          </View>
        ))}
        {canManage ? (
          <View style={styles.form}>
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
              value={staffName}
              onChangeText={setStaffName}
              placeholder={t('coach.portal.effectif.staffName')}
              placeholderTextColor={colors.textMuted}
            />
            <TextInput
              style={[styles.input, { borderColor: colors.border, color: colors.ink }]}
              value={staffUid}
              onChangeText={setStaffUid}
              placeholder={t('coach.portal.effectif.staffUid')}
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.roleRow}>
              {(['assistant', 'analyst', 'physio', 'coach'] as TeamStaffRole[]).map((r) => (
                <PressableSpring
                  key={r}
                  onPress={() => setStaffRole(r)}
                  scaleTo={0.96}
                  style={[
                    styles.roleChip,
                    {
                      borderColor: staffRole === r ? colors.accent : colors.border,
                      backgroundColor: staffRole === r ? colors.accentSoft : colors.surfaceMuted,
                    },
                  ]}
                >
                  <ProDayText variant="caption" accent={staffRole === r} muted={staffRole !== r}>
                    {TEAM_STAFF_ROLE_LABELS[r]}
                  </ProDayText>
                </PressableSpring>
              ))}
            </View>
            <PressableSpring onPress={() => void addStaff()} scaleTo={0.96} haptic>
              <ProDayText variant="caption" accent style={styles.link}>
                {t('coach.portal.effectif.addStaff')}
              </ProDayText>
            </PressableSpring>
          </View>
        ) : null}
      </ProDaySurface>

      <ProDaySurface variant="module" style={[styles.card, { borderColor: colors.border }]}>
        <ProDayText variant="caption" accent style={styles.section}>
          {t('coach.portal.effectif.attendanceRollup')}
        </ProDayText>
        {attendanceRollup.length === 0 ? (
          <ProDayText variant="caption" muted>
            {t('coach.portal.effectif.attendanceEmpty')}
          </ProDayText>
        ) : (
          attendanceRollup.map((r) => (
            <ProDayText key={r.id} variant="caption" muted>
              {r.title} — oui {r.yes} · présent {r.present} · absent {r.absent}
            </ProDayText>
          ))
        )}
      </ProDaySurface>
    </CoachChapterScroll>
  );
};

const styles = StyleSheet.create({
  card: { borderWidth: 1, borderRadius: radius.lg, padding: spacing.md, gap: spacing.xs },
  cardsRow: { gap: spacing.sm, paddingVertical: spacing.sm, paddingRight: spacing.md },
  cardSlot: { marginRight: spacing.xs },
  section: { fontWeight: '800', textTransform: 'uppercase', fontSize: 11, letterSpacing: 0.6 },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  link: { fontWeight: '800' },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
  },
  form: { gap: spacing.xs, marginTop: spacing.xs },
  roleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  roleChip: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
});
