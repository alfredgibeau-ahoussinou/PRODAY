import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { PressableSpring } from '../components/motion';
import type { TeamEventType } from '../models/TeamEvent';
import type { User } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { teamEventsService } from '../services/teamEvents.service';
import { usersService } from '../services/users.service';
import { clubsService } from '../services/clubs.service';
import { useAuth } from '../context/AuthContext';
import {
  defaultTrainingSchedule,
  formatFrenchDate,
  parseFrenchDate,
} from '../utils/parseFrenchDate';
import { filterMembersByCategory, memberUidsExcluding } from '../utils/clubMembersFilter';
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
  { id: 'friendly', label: 'Convocation match' },
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

  const [eventType, setEventType] = useState<TeamEventType>(defaultType);
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
  const [inviteClub, setInviteClub] = useState(true);
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

  const convokedCount = useMemo(() => {
    if (!profile?.profile.club_id) return 0;
    if (!inviteClub) return selectedUids.length;
    const pool =
      selectedCategories.length > 0
        ? filterMembersByCategory(clubMembersRaw, selectedCategories)
        : clubMembersRaw;
    return pool.length;
  }, [profile?.profile.club_id, inviteClub, selectedUids.length, clubMembersRaw, selectedCategories]);

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
      return;
    }
    void usersService.listMembersByClubId(clubId).then((list) => {
      const others = list.filter((m) => m.uid !== profile?.uid);
      setClubMembersRaw(others);
      setClubMembers(
        others.map((m) => ({ uid: m.uid, name: m.display_name })),
      );
      if (!inviteClub) setSelectedUids(others.map((m) => m.uid));
    });
  }, [profile?.profile.club_id, profile?.uid, inviteClub]);

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
        if (inviteClub) {
          const members = await usersService.listMembersByClubId(clubId);
          const filtered =
            selectedCategories.length > 0
              ? filterMembersByCategory(members, selectedCategories)
              : members;
          inviteeUids = memberUidsExcluding(filtered, profile.uid);
        } else if (selectedUids.length > 0) {
          inviteeUids = selectedUids.filter((uid) => uid !== profile.uid);
        }
      }

      const id = await teamEventsService.create({
        title: title.trim(),
        description: description.trim() || undefined,
        event_type: eventType,
        organizer_uid: profile.uid,
        organizer_name: profile.display_name,
        club_id: clubId,
        club_name: clubName,
        team_id: eventType === 'training' && activeTeamId ? activeTeamId : undefined,
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
    convokedCount > 0
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
      <View style={isCoach ? coachStyles.switchRow : defaultStyles.switchRow}>
        {isCoach ? (
          <CoachText variant="section" style={coachStyles.switchLabel}>
            {t('coach.event.create.inviteClub')}
          </CoachText>
        ) : (
          <Text style={defaultStyles.switchLabel}>Convoquer tout le club</Text>
        )}
        <Switch
          value={inviteClub}
          onValueChange={(v) => {
            setInviteClub(v);
            if (!v) setSelectedUids(clubMembers.map((m) => m.uid));
          }}
          trackColor={{ false: tokens.border, true: tokens.accent }}
          thumbColor={isCoach ? tokens.onAccent : undefined}
        />
      </View>
      {inviteClub && showCategories ? (
        isCoach ? (
          <CoachText variant="caption" muted style={coachStyles.convokedCount}>
            {convokedCountLabel}
          </CoachText>
        ) : (
          <Text style={defaultStyles.hint}>{convokedCountLabel}</Text>
        )
      ) : null}
      {!inviteClub && clubMembers.length > 0 ? (
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
          <View style={isCoach ? coachStyles.chipRow : defaultStyles.typeRow}>
            {clubMembers.map((m) => {
              const on = selectedUids.includes(m.uid);
              return (
                <PressableSpring
                  key={m.uid}
                  style={[
                    isCoach ? coachStyles.memberChip : defaultStyles.memberChip,
                    isCoach ? coachChipContainerStyle(on, tokens) : on && defaultStyles.memberChipOn,
                  ]}
                  onPress={() =>
                    setSelectedUids((prev) =>
                      on ? prev.filter((id) => id !== m.uid) : [...prev, m.uid],
                    )
                  }
                >
                  {isCoach ? (
                    <CoachText variant="caption" {...coachChipTextProps(on, tokens)}>
                      {m.name}
                    </CoachText>
                  ) : (
                    <Text
                      style={[
                        defaultStyles.memberChipText,
                        on && defaultStyles.memberChipTextOn,
                      ]}
                    >
                      {m.name}
                    </Text>
                  )}
                </PressableSpring>
              );
            })}
          </View>
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
            icon: 'close',
            onPress: onBack,
            accessibilityLabel: t('common.close'),
          },
        ]}
      >
        <CoachChapterScroll>
          <CoachSectionCard
            kicker={t('coach.event.create.typeKicker')}
            title={t('coach.event.create.typeTitle')}
          >
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={coachStyles.typeChipScroll}
            >
              {EVENT_TYPES.map((item) => {
                const on = eventType === item.id;
                return (
                  <PressableSpring
                    key={item.id}
                    style={[coachStyles.typeChip, coachChipContainerStyle(on, tokens)]}
                    onPress={() => setEventType(item.id)}
                    scaleTo={0.96}
                    haptic
                  >
                    <CoachText variant="caption" {...coachChipTextProps(on, tokens)}>
                      {item.label}
                    </CoachText>
                  </PressableSpring>
                );
              })}
            </ScrollView>
          </CoachSectionCard>

          <CoachSectionCard
            kicker={t('coach.event.create.infoKicker')}
            title={t('coach.event.create.infoTitle')}
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
        </CoachChapterScroll>
      </CoachPane>
    );
  }

  return (
    <View style={[defaultStyles.root, rootStyle]}>
      <ScreenHeader title="Nouvel événement" onBack={onBack} centered />
      <ScrollView contentContainerStyle={defaultStyles.content} keyboardShouldPersistTaps="handled">
        <Text style={defaultStyles.label}>Type</Text>
        <View style={defaultStyles.typeRow}>
          {EVENT_TYPES.map((item) => (
            <PressableSpring
              key={item.id}
              style={[defaultStyles.typeChip, eventType === item.id && defaultStyles.typeChipActive]}
              onPress={() => setEventType(item.id)}
            >
              <Text
                style={[
                  defaultStyles.typeText,
                  eventType === item.id && defaultStyles.typeTextActive,
                ]}
              >
                {item.label}
              </Text>
            </PressableSpring>
          ))}
        </View>

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
