import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { PressableSpring } from '../components/motion';
import type { TeamEventType } from '../models/TeamEvent';
import type { User } from '../models/User';
import type { Team } from '../models/Team';
import type { Membership } from '../models/Membership';
import { Icon } from "../components/ui/Icon";
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { teamEventsService } from '../services/teamEvents.service';
import { usersService } from '../services/users.service';
import { clubsService } from '../services/clubs.service';
import { teamsService } from '../services/teams.service';
import { membershipsService } from '../services/memberships.service';
import { useAuth } from '../context/AuthContext';
import {
  defaultTrainingSchedule,
  formatFrenchDate,
  parseFrenchDate,
} from '../utils/parseFrenchDate';
import { filterMembersByCategory } from '../utils/clubMembersFilter';
import {
  countActivePlayersForTeam,
  resolveConvocationInviteeUids,
  resolveEventTeamId,
  resolveInviteesForTeams,
  teamConvocationChipLabel,
} from '../utils/teamConvocation';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import { userCanManageConvocations } from '../utils/clubFeatureAccess';
import {
  useCoachTheme,
  useIsCoachShell,
} from '../features/coach/shell/CoachThemeContext';
import {
  CoachActionRow,
  CoachChapterScroll,
  CoachSectionCard,
  CoachSettingsGroup,
  CoachText,
} from '../components/coach/coachPortalUi';
import { coachChipContainerStyle, coachChipTextProps } from '../utils/coachChipUi';
import { CoachPane } from '../components/coach/CoachScreenHeader';
import { FootballCategoryChipPicker } from '../components/football/FootballCategoryChipPicker';
import type { CoachThemeTokens } from '../utils/coachTeamTheme';
import { useTranslation } from '../context/LocaleContext';

const EVENT_TYPES: { id: TeamEventType; label: string }[] = [
  { id: 'training', label: 'Entraînement' },
  { id: 'detection', label: 'Journée détection' },
  { id: 'meeting', label: 'Réunion' },
  { id: 'friendly', label: 'Match' },
  { id: 'other', label: 'Autre' },
];

interface CreateTeamEventScreenProps {
  onBack: () => void;
  onCreated: (eventId: string) => void;
  defaultType?: TeamEventType;
  /** Équipe active coach — appliquée aux entraînements créés. */
  activeTeamId?: string;
  /** Style coach (shell) ou legacy générique. Par défaut : coach si shell actif. */
  variant?: 'coach' | 'default';
}

export const CreateTeamEventScreen: React.FC<CreateTeamEventScreenProps> = ({
  onBack,
  onCreated,
  defaultType = 'training',
  activeTeamId,
  variant,
}) => {
  const { profile } = useAuth();
  const { t } = useTranslation();
  const isCoachShell = useIsCoachShell();
  const isCoach = (variant ?? (isCoachShell ? 'coach' : 'default')) === 'coach';
  const { colors: c, isWoman, rootStyle } = useThemedScreen();
  const { tokens, coachTeams, teamId, teamName } = useCoachTheme();
  const trainingDefault = useMemo(() => defaultTrainingSchedule(), []);
  const defaultStyles = useMemo(() => createDefaultStyles(c), [c]);
  const coachStyles = useMemo(() => createCoachStyles(tokens), [tokens]);

  const activeTeamCategory = useMemo(() => {
    const id = activeTeamId ?? teamId;
    return coachTeams.find((row) => row.id === id)?.category?.trim();
  }, [activeTeamId, teamId, coachTeams]);

  const [eventType, setEventType] = useState<TeamEventType | null>(null);
  const [title, setTitle] = useState('');
  const [dateStr, setDateStr] = useState(
    defaultType === 'training' ? trainingDefault.date : '',
  );
  const [timeStr, setTimeStr] = useState(
    defaultType === 'training' ? trainingDefault.time : '18:00',
  );
  const [city, setCity] = useState(profile?.city ?? '');
  const [locationLabel, setLocationLabel] = useState('');
  const [description, setDescription] = useState('');
  const [convocationMode, setConvocationMode] = useState<'teams' | 'manual'>('teams');
  const [clubTeams, setClubTeams] = useState<Team[]>([]);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedTeamIds, setSelectedTeamIds] = useState<string[]>([]);
  const [teamsInitialized, setTeamsInitialized] = useState(false);
  const [clubMembers, setClubMembers] = useState<{ uid: string; name: string }[]>([]);
  const [clubMembersRaw, setClubMembersRaw] = useState<User[]>([]);
  const [selectedUids, setSelectedUids] = useState<string[]>([]);
  const [maxParticipants, setMaxParticipants] = useState('30');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const formValid = useMemo(
    () => Boolean(title.trim() && city.trim() && parseFrenchDate(dateStr)),
    [title, city, dateStr],
  );

  const convokedMembers = useMemo(() => {
    if (!profile?.profile.club_id) return [] as User[];
    if (convocationMode === 'manual') {
      return clubMembersRaw.filter((m) => selectedUids.includes(m.uid));
    }
    const fromTeams = resolveInviteesForTeams(clubMembersRaw, memberships, selectedTeamIds);
    return selectedCategories.length > 0
      ? filterMembersByCategory(fromTeams, selectedCategories)
      : fromTeams;
  }, [
    profile?.profile.club_id,
    convocationMode,
    selectedUids,
    clubMembersRaw,
    memberships,
    selectedTeamIds,
    selectedCategories,
  ]);

  const convokedCount = convokedMembers.length;

  useEffect(() => {
    if (selectedCategories.length > 0 || eventType === 'meeting') return;
    if (
      activeTeamCategory &&
      (eventType === 'training' || eventType === 'friendly' || eventType === 'detection')
    ) {
      setSelectedCategories([activeTeamCategory]);
      return;
    }
    if (eventType === 'detection') {
      setSelectedCategories(['Seniors']);
    }
  }, [eventType, activeTeamCategory, selectedCategories.length]);

  useEffect(() => {
    const clubId = profile?.profile.club_id;
    if (!clubId) {
      setClubMembers([]);
      setClubMembersRaw([]);
      setClubTeams([]);
      setMemberships([]);
      setSelectedTeamIds([]);
      setTeamsInitialized(false);
      return;
    }
    void Promise.all([
      usersService.listMembersByClubId(clubId),
      teamsService.listByClubId(clubId),
      membershipsService.listByClub(clubId),
    ]).then(([list, teams, mems]) => {
      const others = list.filter((m) => m.uid !== profile?.uid);
      setClubMembersRaw(others);
      setClubMembers(others.map((m) => ({ uid: m.uid, name: m.display_name })));
      setClubTeams(teams);
      setMemberships(mems);
      setTeamsInitialized(false);
    });
  }, [profile?.profile.club_id, profile?.uid]);

  useEffect(() => {
    if (teamsInitialized || clubTeams.length === 0) return;
    const preferred = activeTeamId ?? teamId;
    if (preferred && clubTeams.some((row) => row.id === preferred)) {
      setSelectedTeamIds([preferred]);
    } else if (clubTeams.length === 1) {
      setSelectedTeamIds([clubTeams[0].id]);
    }
    setTeamsInitialized(true);
  }, [clubTeams, activeTeamId, teamId, teamsInitialized]);

  useEffect(() => {
    if (eventType === 'detection' && !title) {
      setTitle('Journée détection ProDay');
    }
  }, [eventType, title]);

  useEffect(() => {
    if (eventType === 'training' && !title.trim() && teamName) {
      setTitle(t('coach.event.create.trainingTitleDefault', { team: teamName }));
    }
  }, [eventType, teamName, title, t]);

  const toggleCategory = (cat: string) => {
    setSelectedCategories((prev) =>
      prev.includes(cat) ? prev.filter((x) => x !== cat) : [...prev, cat],
    );
  };

  const toggleTeam = (teamIdToToggle: string) => {
    setSelectedTeamIds((prev) =>
      prev.includes(teamIdToToggle)
        ? prev.filter((id) => id !== teamIdToToggle)
        : [...prev, teamIdToToggle],
    );
  };

  const switchConvocationMode = (mode: 'teams' | 'manual') => {
    setConvocationMode(mode);
    if (mode === 'manual') {
      const fromTeams = resolveInviteesForTeams(clubMembersRaw, memberships, selectedTeamIds);
      setSelectedUids(fromTeams.map((m) => m.uid));
    }
  };

  const handleSubmit = async () => {
    if (!profile || submitting) return;
    if (!userCanManageConvocations(profile)) {
      Alert.alert(
        'Convocations',
        'Les convocations sont réservées au coach Premium (ou couvert par un Tout inclus). Activez votre offre Coach ou demandez à votre club.',
      );
      return;
    }
    if (!title.trim() || !city.trim()) {
      Alert.alert('Champs requis', 'Titre et ville obligatoires.');
      return;
    }
    const parsed = parseFrenchDate(dateStr);
    if (!parsed) {
      Alert.alert('Date invalide', 'Utilisez le format JJ/MM/AAAA.');
      return;
    }
    const [h, min] = timeStr.split(':').map((x) => parseInt(x, 10));
    parsed.setHours(Number.isFinite(h) ? h : 18, Number.isFinite(min) ? min : 0, 0, 0);

    setSubmitting(true);
    try {
      const clubId = profile.profile.club_id;
      let clubName: string | undefined;
      let inviteeUids: string[] = [];

      if (clubId) {
        const club = await clubsService.getById(clubId);
        clubName = club?.name;
        const members = await usersService.listMembersByClubId(clubId);
        const clubMemberships = await membershipsService.listByClub(clubId);

        if (convocationMode === 'manual') {
          inviteeUids = selectedUids.filter((uid) => uid !== profile.uid);
        } else {
          inviteeUids = resolveConvocationInviteeUids(
            members,
            clubMemberships,
            selectedTeamIds,
            selectedCategories,
            profile.uid,
          );
        }
      }

      const eventTeamId = resolveEventTeamId(selectedTeamIds);

      const id = await teamEventsService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        event_type: eventType as TeamEventType,
        organizer_uid: profile.uid,
        organizer_name: profile.display_name,
        club_id: clubId,
        club_name: clubName,
        team_id: eventTeamId,
        starts_at: parsed,
        city: city.trim(),
        location_label: locationLabel.trim() || undefined,
        invitee_uids: inviteeUids,
        max_participants:
          eventType === 'detection' ? parseInt(maxParticipants, 10) || undefined : undefined,
        categories: selectedCategories.length > 0 ? selectedCategories : undefined,
        reminder_hours_before: 24,
      });

      if (isCoach) {
        onCreated(id);
      } else {
        Alert.alert(
          'Événement créé',
          inviteeUids.length > 0
            ? `${inviteeUids.length} personne(s) convoquée(s).`
            : "Partagez l'événement à votre effectif.",
        );
        onCreated(id);
      }
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Création impossible.');
    } finally {
      setSubmitting(false);
    }
  };

  const showCategories =
    eventType !== 'meeting' &&
    (eventType === 'detection' || Boolean(profile?.profile.club_id));

  const convokedCountLabel =
    convocationMode === 'teams' && convokedCount > 0
      ? isWoman
        ? t('coach.event.create.convokedSummaryWomen', {
            players: convokedCount,
            teams: selectedTeamIds.length,
          })
        : t('coach.event.create.convokedSummaryMen', {
            players: convokedCount,
            teams: selectedTeamIds.length,
          })
      : convokedCount > 0
        ? isWoman
          ? t('coach.event.create.convokedCountWomen', { count: convokedCount })
          : t('coach.event.create.convokedCountMen', { count: convokedCount })
        : isWoman
          ? t('coach.event.create.convokedCountEmptyWomen')
          : t('coach.event.create.convokedCountEmptyMen');

  const categoryHint =
    eventType === 'detection'
      ? t('coach.event.create.categoriesDetectionHint')
      : isWoman
        ? t('coach.event.create.categoriesConvocHintWomen')
        : t('coach.event.create.categoriesConvocHintMen');

  const categorySection = showCategories ? (
    <>
      {isCoach ? (
        <CoachText variant="caption" muted style={coachStyles.hint}>
          {categoryHint}
        </CoachText>
      ) : (
        <Text style={defaultStyles.hint}>{categoryHint}</Text>
      )}
      <FootballCategoryChipPicker
        selected={selectedCategories}
        onToggle={toggleCategory}
        variant={isCoach ? 'coach' : 'default'}
        mode="grouped"
        prioritizeGroup={eventType === 'detection' ? 'adultes' : undefined}
        colors={c}
      />
    </>
  ) : null;

  const convocationSection = profile?.profile.club_id ? (
    <>
      <View style={isCoach ? coachStyles.modeRow : defaultStyles.typeRow}>
        {(['teams', 'manual'] as const).map((mode) => {
          const on = convocationMode === mode;
          const label =
            mode === 'teams'
              ? t('coach.event.create.teamsMode')
              : t('coach.event.create.manualMode');
          return (
            <PressableSpring
              key={mode}
              style={[
                isCoach ? coachStyles.modeChip : defaultStyles.typeChip,
                isCoach
                  ? coachChipContainerStyle(on, tokens)
                  : on && defaultStyles.typeChipActive,
              ]}
              onPress={() => switchConvocationMode(mode)}
              scaleTo={0.96}
              haptic
            >
              {isCoach ? (
                <CoachText variant="caption" {...coachChipTextProps(on, tokens)}>
                  {label}
                </CoachText>
              ) : (
                <Text style={[defaultStyles.typeText, on && defaultStyles.typeTextActive]}>
                  {label}
                </Text>
              )}
            </PressableSpring>
          );
        })}
      </View>

      {convocationMode === 'teams' ? (
        <>
          {isCoach ? (
            <CoachText variant="caption" muted style={coachStyles.hint}>
              {t('coach.event.create.teamsHint')}
            </CoachText>
          ) : (
            <Text style={defaultStyles.hint}>{t('coach.event.create.teamsHint')}</Text>
          )}
                    {isCoach ? (
            <View style={{ gap: spacing.sm, marginTop: spacing.sm }}>
              {clubTeams.map((team) => {
                const on = selectedTeamIds.includes(team.id);
                const playerCount = countActivePlayersForTeam(memberships, team.id);
                return (
                  <PressableSpring
                    key={team.id}
                    onPress={() => toggleTeam(team.id)}
                    scaleTo={0.97}
                    haptic
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 12,
                      borderRadius: 16,
                      backgroundColor: tokens.surface,
                      borderWidth: 1,
                      borderColor: on ? tokens.accent : tokens.border,
                    }}
                  >
                    <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: on ? tokens.accent + '22' : tokens.bg, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      <Icon name="shield" size={20} color={on ? tokens.accent : tokens.muted} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <CoachText variant="section" style={{ color: tokens.foreground, fontSize: 16, marginBottom: 2 }}>{team.name}</CoachText>
                      <CoachText variant="caption" muted>{team.category || 'Catégorie'} • {playerCount} joueurs</CoachText>
                    </View>
                    <View style={{ width: 24, height: 24, borderRadius: 12, borderWidth: 2, borderColor: on ? tokens.accent : tokens.muted, justifyContent: 'center', alignItems: 'center', backgroundColor: on ? tokens.accent : 'transparent' }}>
                      {on && <Icon name="checkmark-circle" size={16} color={tokens.onAccent} />}
                    </View>
                  </PressableSpring>
                );
              })}
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={defaultStyles.typeRow}
            >
              {clubTeams.map((team) => {
                const on = selectedTeamIds.includes(team.id);
                const playerCount = countActivePlayersForTeam(memberships, team.id);
                const chipLabel = teamConvocationChipLabel(team.name, team.category, playerCount);
                return (
                  <PressableSpring
                    key={team.id}
                    style={[defaultStyles.typeChip, on && defaultStyles.typeChipActive]}
                    onPress={() => toggleTeam(team.id)}
                    scaleTo={0.97}
                    haptic
                  >
                    <Text
                      style={[defaultStyles.typeText, on && defaultStyles.typeTextActive]}
                      numberOfLines={1}
                    >
                      {chipLabel}
                    </Text>
                  </PressableSpring>
                );
              })}
            </ScrollView>
          )}
          {isCoach ? (
            <CoachText variant="caption" muted style={coachStyles.convokedCount}>
              {convokedCountLabel}
            </CoachText>
          ) : (
            <Text style={defaultStyles.hint}>{convokedCountLabel}</Text>
          )}
        </>
      ) : clubMembers.length > 0 ? (
        <>
          {isCoach ? (
            <CoachText variant="caption" muted style={coachStyles.fieldLabel}>
              {isWoman ? t('coach.event.create.invitedWomen') : t('coach.event.create.invitedMen')}
            </CoachText>
          ) : (
            <Text style={defaultStyles.label}>
              {isWoman ? 'Joueuses convoquées' : 'Joueurs convoqués'}
            </Text>
          )}
                    {isCoach ? (
            <View style={{ gap: 8, marginTop: spacing.sm }}>
              {clubMembers.map((m) => {
                const on = selectedUids.includes(m.uid);
                return (
                  <PressableSpring
                    key={m.uid}
                    onPress={() =>
                      setSelectedUids((prev) =>
                        on ? prev.filter((id) => id !== m.uid) : [...prev, m.uid],
                      )
                    }
                    scaleTo={0.98}
                    haptic
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      padding: 10,
                      borderRadius: 12,
                      backgroundColor: tokens.surface,
                      borderWidth: 1,
                      borderColor: on ? tokens.accent : tokens.border,
                    }}
                  >
                    <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: on ? tokens.accent + '22' : tokens.bg, justifyContent: 'center', alignItems: 'center', marginRight: 12 }}>
                      {false ? (
                        <View style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: tokens.muted, overflow: 'hidden' }} />
                      ) : (
                        <CoachText variant="caption" style={{ color: on ? tokens.accent : tokens.muted, fontWeight: '700' }}>
                          {m.name.charAt(0).toUpperCase()}
                        </CoachText>
                      )}
                    </View>
                    <CoachText variant="body" style={{ flex: 1, color: tokens.foreground, fontWeight: on ? '700' : '400' }}>
                      {m.name}
                    </CoachText>
                    <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: on ? tokens.accent : tokens.muted, justifyContent: 'center', alignItems: 'center', backgroundColor: on ? tokens.accent : 'transparent' }}>
                      {on && <Icon name="checkmark-circle" size={14} color={tokens.onAccent} />}
                    </View>
                  </PressableSpring>
                );
              })}
            </View>
          ) : (
            <View style={defaultStyles.typeRow}>
              {clubMembers.map((m) => {
                const on = selectedUids.includes(m.uid);
                return (
                  <PressableSpring
                    key={m.uid}
                    style={[defaultStyles.memberChip, on && defaultStyles.memberChipOn]}
                    onPress={() =>
                      setSelectedUids((prev) =>
                        on ? prev.filter((id) => id !== m.uid) : [...prev, m.uid],
                      )
                    }
                  >
                    <Text
                      style={[
                        defaultStyles.memberChipText,
                        on && defaultStyles.memberChipTextOn,
                      ]}
                    >
                      {m.name}
                    </Text>
                  </PressableSpring>
                );
              })}
            </View>
          )}
          {isCoach ? (
            <CoachText variant="caption" muted style={coachStyles.convokedCount}>
              {convokedCountLabel}
            </CoachText>
          ) : (
            <Text style={defaultStyles.hint}>{convokedCountLabel}</Text>
          )}
        </>
      ) : null}
    </>
  ) : isCoach ? (
    <CoachText variant="caption" muted style={coachStyles.hint}>
      {t('coach.event.create.noClubHint')}
    </CoachText>
  ) : (
    <Text style={defaultStyles.hint}>
      Liez un club à votre profil pour convoquer automatiquement l&apos;effectif.
    </Text>
  );

  if (isCoach) {
    return (
      <CoachPane
        title={t('coach.event.create.title')}
        actions={[
          {
            icon: eventType ? 'arrow-back' : 'close',
            onPress: eventType ? () => setEventType(null) : onBack,
            accessibilityLabel: t('common.close'),
          },
        ]}
      >
        <CoachChapterScroll>
          {!eventType ? (
            <View style={{ gap: 12, padding: 16 }}>
              {EVENT_TYPES.map((item) => (
                <PressableSpring
                  key={item.id}
                  style={{
                    backgroundColor: tokens.surface,
                    padding: 20,
                    borderRadius: 16,
                    borderWidth: 1,
                    borderColor: tokens.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 16
                  }}
                  onPress={() => setEventType(item.id)}
                  scaleTo={0.96}
                  haptic
                >
                  <Icon 
                    name={item.id === 'training' ? 'football' : item.id === 'friendly' ? 'trophy' : item.id === 'detection' ? 'search' : item.id === 'meeting' ? 'people' : 'calendar'} 
                    size={28} 
                    color={tokens.accent} 
                  />
                  <View style={{ flex: 1 }}>
                    <CoachText variant="section" style={{ color: tokens.foreground, fontSize: 18 }}>{item.label}</CoachText>
                    <CoachText variant="caption" muted style={{ marginTop: 4 }}>
                      {item.id === 'training' ? "Organiser une séance sur le terrain" : item.id === 'friendly' ? "Programmer un match ou amical" : item.id === 'detection' ? "Créer une journée de recrutement" : item.id === 'meeting' ? "Planifier une réunion tactique" : "Autre événement"}
                    </CoachText>
                  </View>
                  <Icon name="chevron-forward" size={20} color={tokens.muted} />
                </PressableSpring>
              ))}
            </View>
          ) : (
            <>

          <CoachSectionCard
            kicker={eventType === 'training' ? "SÉANCE" : eventType === 'friendly' ? "MATCH" : eventType === 'detection' ? "DÉTECTION" : "RÉUNION"}
            title={eventType === 'training' ? "Détails de l'entraînement" : eventType === 'friendly' ? "Détails du match" : "Détails de l'événement"}
          >
            <CoachSettingsGroup>
              <CoachFormField
                placeholder={t('coach.event.create.titlePlaceholder')}
                value={title}
                onChangeText={setTitle}
                tokens={tokens}
              />
              <View style={coachStyles.dateRow}>
                <CoachFormField
                  placeholder={t('coach.event.create.datePlaceholder')}
                  value={dateStr}
                  onChangeText={setDateStr}
                  tokens={tokens}
                  style={coachStyles.dateField}
                />
                <PressableSpring
                  style={[coachStyles.todayBtn, coachChipContainerStyle(false, tokens)]}
                  onPress={() => setDateStr(formatFrenchDate(new Date()))}
                  scaleTo={0.96}
                  haptic
                >
                  <CoachText variant="caption" muted>
                    {t('coach.event.create.today')}
                  </CoachText>
                </PressableSpring>
              </View>
              <CoachFormField
                placeholder={t('coach.event.create.timePlaceholder')}
                value={timeStr}
                onChangeText={setTimeStr}
                tokens={tokens}
              />
              <CoachFormField
                placeholder={t('coach.event.create.cityPlaceholder')}
                value={city}
                onChangeText={setCity}
                tokens={tokens}
              />
              <CoachFormField
                placeholder={t('coach.event.create.locationPlaceholder')}
                value={locationLabel}
                onChangeText={setLocationLabel}
                tokens={tokens}
              />
              <CoachFormField
                placeholder={t('coach.event.create.descriptionPlaceholder')}
                value={description}
                onChangeText={setDescription}
                tokens={tokens}
                multiline
                last
              />
            </CoachSettingsGroup>
          </CoachSectionCard>

          {showCategories ? (
            <CoachSectionCard
              kicker={t('coach.event.create.categoriesKicker')}
              title={
                eventType === 'detection'
                  ? t('coach.event.create.categoriesDetectionTitle')
                  : t('coach.event.create.categoriesConvocTitle')
              }
            >
              {eventType === 'detection' ? (
                <CoachFormField
                  placeholder={t('coach.event.create.maxPlacesPlaceholder')}
                  value={maxParticipants}
                  onChangeText={setMaxParticipants}
                  tokens={tokens}
                  keyboardType="number-pad"
                />
              ) : null}
              {categorySection}
            </CoachSectionCard>
          ) : null}

          <CoachSectionCard
            kicker={t('coach.event.create.convocKicker')}
            title={t('coach.event.create.convocTitle')}
          >
            {convocationSection}
          </CoachSectionCard>

          <CoachActionRow
            primary={
              submitting ? t('coach.event.create.submitting') : t('coach.event.create.submit')
            }
            onPrimary={handleSubmit}
            primaryDisabled={!formValid || submitting}
          />
          {submitting ? (
            <ActivityIndicator color={tokens.accent} style={coachStyles.loader} />
          ) : null}
          </>
          )}
        </CoachChapterScroll>
      </CoachPane>
    );
  }

  return (
    <View style={[defaultStyles.root, rootStyle]}>
      <ScreenHeader title={eventType ? "Détails" : "Nouvel événement"} onBack={eventType ? () => setEventType(null) : onBack} centered />
      <ScrollView contentContainerStyle={defaultStyles.content} keyboardShouldPersistTaps="handled">
        {!eventType ? (
           <View style={{ gap: 12 }}>
              {EVENT_TYPES.map((item) => (
                <PressableSpring
                  key={item.id}
                  style={{
                    backgroundColor: c.surface,
                    padding: 16,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: c.border,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                  onPress={() => setEventType(item.id)}
                >
                  <Text style={{ fontSize: 16, fontWeight: '700', color: c.text }}>{item.label}</Text>
                  <Text style={{ color: c.textMuted }}>➔</Text>
                </PressableSpring>
              ))}
            </View>
        ) : (
          <>

        <TextInput
          style={defaultStyles.input}
          placeholder="Titre"
          placeholderTextColor={c.textMuted}
          value={title}
          onChangeText={setTitle}
        />
        <TextInput
          style={defaultStyles.input}
          placeholder="Date (JJ/MM/AAAA)"
          placeholderTextColor={c.textMuted}
          value={dateStr}
          onChangeText={setDateStr}
        />
        <TextInput
          style={defaultStyles.input}
          placeholder="Heure (14:00)"
          placeholderTextColor={c.textMuted}
          value={timeStr}
          onChangeText={setTimeStr}
        />
        <TextInput
          style={defaultStyles.input}
          placeholder="Ville"
          placeholderTextColor={c.textMuted}
          value={city}
          onChangeText={setCity}
        />
        <TextInput
          style={defaultStyles.input}
          placeholder="Lieu (stade, adresse…)"
          placeholderTextColor={c.textMuted}
          value={locationLabel}
          onChangeText={setLocationLabel}
        />
        <TextInput
          style={[defaultStyles.input, defaultStyles.textArea]}
          placeholder="Description (optionnel)"
          placeholderTextColor={c.textMuted}
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {showCategories ? (
          <>
            <Text style={defaultStyles.label}>
              {eventType === 'detection' ? 'Catégories' : 'Catégories convoquées (optionnel)'}
            </Text>
            {categorySection}
            {eventType === 'detection' ? (
              <TextInput
                style={defaultStyles.input}
                placeholder="Places max"
                placeholderTextColor={c.textMuted}
                value={maxParticipants}
                onChangeText={setMaxParticipants}
                keyboardType="number-pad"
              />
            ) : null}
          </>
        ) : null}

        {convocationSection}

        <PressableSpring
          style={[defaultStyles.submit, submitting && defaultStyles.submitDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <Text style={defaultStyles.submitText}>Créer et convoquer</Text>
          )}
        </PressableSpring>
        </>
        )}
      </ScrollView>
    </View>
  );
};

function CoachFormField({
  placeholder,
  value,
  onChangeText,
  tokens,
  multiline,
  keyboardType,
  last,
  style,
}: {
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  tokens: CoachThemeTokens;
  multiline?: boolean;
  keyboardType?: 'number-pad' | 'default';
  last?: boolean;
  style?: object;
}) {
  return (
    <TextInput
      placeholder={placeholder}
      placeholderTextColor={tokens.muted}
      value={value}
      onChangeText={onChangeText}
      multiline={multiline}
      keyboardType={keyboardType}
      style={[
        {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.md,
          fontSize: 15,
          color: tokens.foreground,
          minHeight: multiline ? 80 : 48,
          textAlignVertical: multiline ? 'top' : 'center',
        },
        !last && {
          borderBottomWidth: StyleSheet.hairlineWidth,
          borderBottomColor: tokens.border,
        },
        style,
      ]}
    />
  );
}

function createCoachStyles(tokens: CoachThemeTokens) {
  return StyleSheet.create({
    chipRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
    },
    typeChipScroll: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingVertical: 2,
    },
    typeChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: tokens.border,
    },
    dateField: {
      flex: 1,
      borderBottomWidth: 0,
    },
    todayBtn: {
      marginRight: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    memberChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    modeRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    modeChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
    },
    teamChipScroll: {
      flexDirection: 'row',
      gap: spacing.xs,
      paddingVertical: 2,
      marginBottom: spacing.xs,
    },
    teamChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: 8,
      borderRadius: radius.pill,
      borderWidth: StyleSheet.hairlineWidth,
      maxWidth: 200,
    },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    switchLabel: { flex: 1 },
    fieldLabel: { marginBottom: spacing.xs },
    hint: { lineHeight: 18, marginBottom: spacing.sm },
    convokedCount: { marginTop: spacing.xs, lineHeight: 18 },
    loader: { marginTop: spacing.sm },
  });
}

function createDefaultStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: { padding: spacing.lg, paddingBottom: spacing.xxl },
    label: {
      fontSize: 12,
      fontWeight: '800',
      color: c.textSecondary,
      marginBottom: spacing.sm,
      marginTop: spacing.sm,
    },
    typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.md },
    typeChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    typeChipActive: { backgroundColor: c.accent, borderColor: c.accent },
    typeText: { fontSize: 11, fontWeight: '700', color: c.textSecondary },
    typeTextActive: { color: c.brandInverse },
    input: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.sm,
      borderWidth: 1,
      borderColor: c.border,
      fontSize: 15,
      color: c.text,
    },
    textArea: { minHeight: 80, textAlignVertical: 'top' },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginVertical: spacing.md,
    },
    switchLabel: { fontSize: 14, fontWeight: '700', color: c.text, flex: 1 },
    hint: { fontSize: 12, color: c.textMuted, marginBottom: spacing.md, lineHeight: 18 },
    memberChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    memberChipOn: { backgroundColor: c.accent, borderColor: c.accent },
    memberChipText: { fontSize: 11, fontWeight: '700', color: c.textSecondary },
    memberChipTextOn: { color: c.brandInverse },
    submit: {
      backgroundColor: c.accent,
      borderRadius: radius.md,
      padding: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      marginTop: spacing.md,
    },
    submitDisabled: { opacity: 0.6 },
    submitText: { color: c.brandInverse, fontWeight: '900', fontSize: 16 },
  });
}
