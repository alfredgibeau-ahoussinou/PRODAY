import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  TextInput,
} from 'react-native';
import { PressableSpring, StaggerReveal } from '../motion';
import type { User, UserRole } from '../../models/User';
import type { ProdayPulseResult, PulseBreakdownItem } from '../../utils/prodayPulse';
import type { AppSpaceId } from '../../models/AppSpace';
import { APP_SPACE_LABELS } from '../../models/AppSpace';
import { getProfileChapters, type ProfileChapterId } from '../../content/profileChapters';
import { useTranslation } from '../../context/LocaleContext';
import { getUniverseIdentity } from '../../content/brandExperience';
import { ProfileIdentityHeader } from './ProfileIdentityHeader';
import { ProfileSection } from './ProfileSection';
import { ProfileQuickGrid, type ProfileQuickAction } from './ProfileQuickGrid';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { ProfileCompletionPanel } from './ProfileCompletionPanel';
import { MercatoVisibilityChecklist } from '../mercato/MercatoVisibilityChecklist';
import { ProfileSubscriptionCard } from './ProfileSubscriptionCard';
import { ProfileMenuSection } from './ProfileMenuSection';
import { PlayerCvLivePreview } from './PlayerCvLivePreview';
import { ProfileGalleryEditor } from './ProfileGalleryEditor';
import { PlayerPositionPitchPicker } from './PlayerPositionPitchPicker';
import { AppSpacePill } from '../appSpace/AppSpaceBanner';
import { OrganizerReminderCard } from '../OrganizerReminderCard';
import { ProDayTabPager } from '../ui/ProDayTabPager';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDayText } from '../ui/ProDayText';
import { GlassCard } from '../aurora/GlassCard';
import { ProDaySurface } from '../ui/ProDaySurface';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import { isFemalePresentationForUser } from '../../utils/playerSegment';
import { isAmateurProductLine, type ProductLineId } from '../../models/ProductLine';
import type { OrganizerReminderItem } from '../../hooks/useOrganizerReminders';
import type { SubscriptionUsagePeriod } from '../../models/Subscription';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { screenScrollPad } from '../../navigation/screenLayout';
import { spacing, radius } from '../../theme/designTokens';
import { ProfilePreferencesCard } from './ProfilePreferencesCard';
import { LanguageSettingControl } from '../settings/LanguageSettingControl';
import { ProgressionBlock } from '../../features/home/components/ProgressionBlock';
import type { SectionIntelligence } from '../../features/v3/models/sectionIntelligence';
import type { GamificationState } from '../../features/v3/models/gamification';
import { getRoleLabel } from '../../screens/signup/signupFlowConfig';
import { PlayerActivityFeed } from '../player/PlayerActivityFeed';
import { CareerScoreCard } from '../player/CareerScoreCard';
import { WeeklyGoalSettings } from '../player/WeeklyGoalSettings';
import { usePlayerActivities, useCareerProgression } from '../../hooks/useCareerProgression';
import { JoueurProfileHub } from '../player/JoueurProfileHub';
import {
  JoueurActivitePanel,
  JoueurParamsPanel,
  JoueurVitrinePanel,
} from '../player/JoueurAccountPanels';
import { CoachProfileHub } from '../coach/CoachProfileHub';
import { CoachPane } from '../coach/CoachScreenHeader';
import { getCoachPageIdentity } from '../../content/coachPageIdentity';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { coachTokensAsAppColors } from '../../features/coach/shell/coachTokensAsAppColors';
import {
  CoachActivitePanel,
  CoachParamsPanel,
  CoachVitrinePanel,
} from '../coach/CoachAccountPanels';
import { computeHealthSnapshot } from '../../core/health/healthState.engine';
import { useJoueurSession } from '../../context/JoueurSessionContext';
import {
  resolveJoueurAgeGroup,
  resolveJoueurGenderVisual,
} from '../../utils/joueurExperienceTheme';
import { resolveJoueurPageIdentity } from '../../content/joueurPageIdentity';
import { PLAYER_DARK } from '../../theme/playerDarkPremium';

export interface ProfileHomeScreenProps {
  profile: User;
  productLine: ProductLineId;
  pulse: ProdayPulseResult;
  pulseBreakdown: PulseBreakdownItem[];
  uploadingAvatar: boolean;
  uploadingGallery: boolean;
  gallery: string[];
  videos: string[];
  appSpace: AppSpaceId;
  selectableAppSpaces: AppSpaceId[];
  subscriptionTier: 'free' | 'pro';
  subscriptionUsage?: SubscriptionUsagePeriod | null;
  onSubscriptionPress?: () => void;
  isOrganizer: boolean;
  reminderItems: OrganizerReminderItem[];
  loadingReminders: boolean;
  remindingId: string | null;
  onOrganizerPress: () => void;
  onRemind: (eventId: string) => void;
  showPlayerVerificationReminder: boolean;
  needsDocumentUpload?: boolean;
  onDocumentVerification?: () => void;
  playerVerifyLabel?: string;
  pendingVerify: boolean;
  docLoading: boolean;
  canManageClub: boolean;
  verifiedStaff: boolean;
  isPlayerMinor: boolean;
  hasStats: boolean;
  stats?: { matches: number; goals: number; assists: number };
  onAvatarPress: () => void;
  onEdit: () => void;
  onCvEditor: () => void;
  onPublicProfile: () => void;
  onApplications: () => void;
  onPlayerVerification: () => void;
  onPickDocument: () => void;
  onVerificationFlow: () => void;
  onAnnouncements: () => void;
  onTeamManagement?: () => void;
  onCreateClub: () => void;
  onJoinClub: () => void;
  onVerificationSuccess: () => void;
  onLegal: (id: 'terms' | 'privacy') => void;
  onReferral?: () => void;
  onSignOut: () => void;
  onSetAppSpace: (space: AppSpaceId) => void;
  onGalleryAdd: () => void;
  onGalleryRemove: (url: string) => void;
  onPositionChange?: (position: string) => void | Promise<void>;
  onJerseyNumberChange?: (jersey: number | null) => void | Promise<void>;
  savingPosition?: boolean;
  quickActions: ProfileQuickAction[];
  initialChapter?: ProfileChapterId;
  intelligence?: SectionIntelligence | null;
  progression?: GamificationState;
}

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingTop: spacing.xs,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
};

const scrollProps = {
  showsVerticalScrollIndicator: false,
  nestedScrollEnabled: true,
  keyboardShouldPersistTaps: 'handled' as const,
};

export const ProfileHomeScreen: React.FC<ProfileHomeScreenProps> = (props) => {
  const { colors: appColors } = useAppTheme();
  const { t } = useTranslation();
  const brand = getUniverseIdentity(props.productLine);
  const chapters = useMemo(
    () => getProfileChapters(props.profile.role, t),
    [props.profile.role, t]
  );
  const [chapter, setChapter] = useState<ProfileChapterId>(props.initialChapter ?? 'apercu');
  const p = props.profile.profile;
  const completionPercent = useMemo(
    () => getProfileCompletion(props.profile).percent,
    [props.profile]
  );
  const isPlayer = props.profile.role === 'player';
  const isCoach = props.profile.role === 'coach';
  const useHubChrome = isPlayer || isCoach;
  const coachShellNav = useCoachShellNav();
  const { tokens: coachTokens } = useCoachTheme();
  const inCoachShell = isCoach && Boolean(coachShellNav);
  const colors = useMemo(
    () => (inCoachShell ? coachTokensAsAppColors(coachTokens) : appColors),
    [inCoachShell, coachTokens, appColors],
  );
  const styles = useMemo(() => createStyles(colors), [colors]);
  const joueurSession = useJoueurSession();
  const joueurIdentity = useMemo(() => {
    if (!isPlayer) return null;
    const ageGroup =
      joueurSession?.ageGroup ??
      resolveJoueurAgeGroup({
        age: joueurSession?.ageYears ?? props.profile.profile.age,
        gender: joueurSession?.gate?.gender ?? props.profile.profile.gender,
        birthDate: props.profile.profile.birth_date,
      });
    const gender = resolveJoueurGenderVisual(
      joueurSession?.gate?.gender ?? props.profile.profile.gender,
    );
    return resolveJoueurPageIdentity({ ageGroup, gender });
  }, [
    isPlayer,
    joueurSession?.ageGroup,
    joueurSession?.ageYears,
    joueurSession?.gate?.gender,
    props.profile.profile.age,
    props.profile.profile.gender,
    props.profile.profile.birth_date,
  ]);
  const joueurAccent = joueurIdentity?.accent ?? colors.accent;
  const joueurPagerColors = useMemo(
    () =>
      ({
        ...appColors,
        background: PLAYER_DARK.bg,
        surface: PLAYER_DARK.surfaceRaised,
        border: PLAYER_DARK.border,
        text: PLAYER_DARK.text,
        textMuted: PLAYER_DARK.textMuted,
        accent: PLAYER_DARK.accent,
        brandInverse: PLAYER_DARK.bg,
      }) as AppColors,
    [appColors],
  );
  const { activities, loading: activitiesLoading, refresh: refreshActivities } =
    usePlayerActivities(isPlayer ? props.profile.uid : undefined);
  const career = useCareerProgression(isPlayer ? props.profile : null, {
    activities,
    streakDays: props.progression?.streakDays,
  });

  const playerHealth = useMemo(
    () =>
      computeHealthSnapshot({
        globalScore: props.pulse.score,
        upcomingEventsCount: 0,
        pendingConvocations: 0,
        recentMatchCount: props.stats?.matches ?? 0,
        streakDays: props.progression?.streakDays ?? 0,
        profileCompletion: completionPercent,
      }),
    [
      props.pulse.score,
      props.stats?.matches,
      props.progression?.streakDays,
      completionPercent,
    ],
  );

  const handleCompletionItem = (itemId: string) => {
    if (itemId === 'position' && props.profile.role === 'player') {
      setChapter('cv');
      return;
    }
    setChapter('apercu');
    props.onEdit();
  };

  const handleEdit = () => {
    setChapter('apercu');
    props.onEdit();
  };

  const roleLabel =
    props.profile.role === 'player' && isFemalePresentationForUser(props.profile, props.productLine)
      ? brand.playerLabel
      : getRoleLabel(props.profile.role, t);

  const pages = useMemo(
    () => [
      {
        id: 'apercu' as const,
        render: () => (
          <ScrollView
            style={styles.chapterScroll}
            contentContainerStyle={useHubChrome ? screenScrollPad(spacing.lg) : pagePad}
            {...scrollProps}
          >
            {isPlayer ? (
              <JoueurProfileHub
                profile={props.profile}
                health={playerHealth}
                gateAge={joueurSession?.ageYears ?? props.profile.profile.age}
                gateGender={
                  joueurSession?.gate?.gender ?? props.profile.profile.gender
                }
                gateAgeGroup={joueurSession?.ageGroup}
                onEdit={handleEdit}
              />
            ) : isCoach ? (
              <CoachProfileHub
                profile={props.profile}
                subscriptionTier={props.subscriptionTier}
                onEdit={handleEdit}
                onPublicProfile={props.onPublicProfile}
                onAvatarPress={props.onAvatarPress}
                onSubscriptionPress={props.onSubscriptionPress}
              />
            ) : (
              <>
                {props.needsDocumentUpload && props.onDocumentVerification ? (
                  <ProfileSection
                    title={t('profile.verify.title')}
                    subtitle={t('profile.verify.documentsRequired')}
                    first
                  >
                    <AlertCard
                      title={t('profile.verify.sendDocuments')}
                      body={t('profile.verify.player.body')}
                      cta={t('profile.verify.complete')}
                      onPress={props.onDocumentVerification}
                      colors={colors}
                    />
                  </ProfileSection>
                ) : null}

                <ProfileSection
                  title={t('profile.section.preferences')}
                  subtitle={t('profile.section.preferencesSub')}
                  first={!props.needsDocumentUpload}
                >
                  <ProfilePreferencesCard profile={props.profile} />
                </ProfileSection>

                <ProfileSection
                  title={t('profile.section.shortcuts')}
                  subtitle={t('profile.section.shortcutsSub')}
                >
                  <ProfileQuickGrid actions={props.quickActions} compact />
                </ProfileSection>

                {props.onSubscriptionPress ? (
                  <ProfileSection
                    title={t('profile.section.subscription')}
                    subtitle={t('profile.section.subscriptionSub')}
                  >
                    <ProfileSubscriptionCard
                      profile={props.profile}
                      tier={props.subscriptionTier}
                      usage={props.subscriptionUsage ?? null}
                      onPress={props.onSubscriptionPress}
                    />
                  </ProfileSection>
                ) : null}

                <ProfileSection
                  title={t('profile.section.completion')}
                  subtitle={t('profile.section.completionSub')}
                >
                  <ProfileCompletionPanel
                    user={props.profile}
                    onCompletePress={handleEdit}
                    onItemPress={handleCompletionItem}
                  />
                </ProfileSection>

                {props.progression ? (
                  <ProfileSection
                    title={t('profile.section.progression')}
                    subtitle={t('profile.section.progressionSub')}
                  >
                    <ProgressionBlock
                      progression={props.progression}
                      weeklyGoalPercent={career?.weeklyGoalPercent ?? 0}
                    />
                  </ProfileSection>
                ) : null}

                {props.isOrganizer ? (
                  <ProfileSection
                    title={t('profile.section.organization')}
                    subtitle={t('profile.section.organizationSub')}
                  >
                    <OrganizerReminderCard
                      items={props.reminderItems}
                      loading={props.loadingReminders}
                      onPress={props.onOrganizerPress}
                      onRemind={props.onRemind}
                      remindingId={props.remindingId}
                    />
                  </ProfileSection>
                ) : null}
              </>
            )}
          </ScrollView>
        ),
      },
      {
        id: 'cv' as const,
        render: () => (
          <ScrollView
            style={styles.chapterScroll}
            contentContainerStyle={useHubChrome ? styles.managementPad : pagePad}
            {...scrollProps}
          >
            {props.profile.role === 'player' ? (
              <JoueurVitrinePanel
                profile={props.profile}
                colors={colors}
                productLine={props.productLine}
                accent={joueurAccent}
                wash={joueurIdentity?.wash}
                gallery={props.gallery}
                videos={props.videos}
                uploadingGallery={props.uploadingGallery}
                savingPosition={props.savingPosition}
                hasStats={props.hasStats}
                stats={props.stats}
                onPositionChange={props.onPositionChange}
                onJerseyNumberChange={props.onJerseyNumberChange}
                onCvEditor={props.onCvEditor}
                onGalleryAdd={props.onGalleryAdd}
                onGalleryRemove={props.onGalleryRemove}
                JerseyField={
                  <JerseyNumberField
                    value={p.jersey_number}
                    onCommit={(jersey) => void props.onJerseyNumberChange?.(jersey)}
                    colors={colors}
                    style={styles.jerseyInput}
                  />
                }
              />
            ) : isCoach ? (
              <CoachVitrinePanel
                profile={props.profile}
                onEdit={handleEdit}
                onPublicProfile={props.onPublicProfile}
              />
            ) : (
              <ProfileSection title={t('profile.section.career')} subtitle={t('profile.section.careerSub')} first>
                <InfoLine label={t('profile.field.title')} value={p.job_title} colors={colors} />
                <InfoLine label={t('profile.diploma')} value={p.diploma} colors={colors} />
                <InfoLine label={t('profile.field.license')} value={p.license_number} colors={colors} />
                {p.specialties?.length ? (
                  <ProDayText variant="body" muted>
                    {t('profile.specialties')} : {p.specialties.join(' · ')}
                  </ProDayText>
                ) : null}
              </ProfileSection>
            )}
          </ScrollView>
        ),
      },
      {
        id: 'activite' as const,
        render: () => (
          <ScrollView
            style={styles.chapterScroll}
            contentContainerStyle={useHubChrome ? styles.managementPad : pagePad}
            {...scrollProps}
          >
            {props.profile.role === 'player' ? (
              <JoueurActivitePanel
                accent={joueurAccent}
                wash={joueurIdentity?.wash}
                productLine={props.productLine}
                playerUid={props.profile.uid}
                clubId={props.profile.profile.club_id}
                appSpace={props.appSpace}
                selectableAppSpaces={props.selectableAppSpaces}
                canManageClub={props.canManageClub}
                onApplications={props.onApplications}
                onAnnouncements={props.onAnnouncements}
                onTeamManagement={props.onTeamManagement}
                onSetAppSpace={props.onSetAppSpace}
              />
            ) : isCoach ? (
              <CoachActivitePanel
                profile={props.profile}
                canManageClub={props.canManageClub}
                onTeamManagement={props.onTeamManagement}
                onAnnouncements={props.onAnnouncements}
              />
            ) : (
              <ProfileSection
                title={t('profile.section.club')}
                subtitle={
                  props.profile.profile.club_id
                    ? t('profile.club.linked')
                    : t('profile.club.join')
                }
                first
              >
                {props.profile.profile.club_id ? (
                  <ProfileMenuSection
                    title=""
                    colors={colors}
                    items={[
                      ...(props.canManageClub && props.onTeamManagement
                        ? [
                            {
                              icon: 'people' as const,
                              title: t('profile.team.manage'),
                              subtitle: t('profile.team.manageSub'),
                              onPress: props.onTeamManagement,
                            },
                          ]
                        : []),
                      {
                        icon: 'notifications',
                        title: t('profile.club.announcements'),
                        subtitle: t('profile.club.news'),
                        onPress: props.onAnnouncements,
                      },
                    ]}
                  />
                ) : (
                  <ProDaySurface variant="flat" style={styles.hint}>
                    <Icon name="people" size={18} color={colors.textMuted} />
                    <ProDayText variant="caption" muted style={styles.hintText}>
                      {t('profile.club.joinHint')}
                    </ProDayText>
                  </ProDaySurface>
                )}
              </ProfileSection>
            )}
          </ScrollView>
        ),
      },
      {
        id: 'reglages' as const,
        render: () => (
          <ScrollView
            style={styles.chapterScroll}
            contentContainerStyle={useHubChrome ? styles.managementPad : pagePad}
            {...scrollProps}
          >
            {isPlayer ? (
              <JoueurParamsPanel
                accent={joueurAccent}
                wash={joueurIdentity?.wash}
                colors={colors}
                AlertCard={AlertCard}
                showPlayerVerificationReminder={props.showPlayerVerificationReminder}
                playerVerifyLabel={props.playerVerifyLabel}
                pendingVerify={props.pendingVerify}
                docLoading={props.docLoading}
                canManageClub={props.canManageClub}
                verifiedStaff={props.verifiedStaff}
                clubId={props.profile.profile.club_id}
                isPlayer
                onPlayerVerification={props.onPlayerVerification}
                onPickDocument={props.onPickDocument}
                onVerificationFlow={props.onVerificationFlow}
                onTeamManagement={props.onTeamManagement}
                onCreateClub={props.onCreateClub}
                onJoinClub={props.onJoinClub}
                onVerificationSuccess={props.onVerificationSuccess}
                onReferral={props.onReferral}
                onLegal={props.onLegal}
                onSignOut={props.onSignOut}
              />
            ) : isCoach ? (
              <CoachParamsPanel
                profile={props.profile}
                verifiedStaff={props.verifiedStaff}
                pendingVerify={props.pendingVerify}
                showVerificationReminder={props.showPlayerVerificationReminder}
                onVerificationFlow={props.onVerificationFlow}
                onVerificationSuccess={props.onVerificationSuccess}
                onPickDocument={props.onPickDocument}
                onCreateClub={props.onCreateClub}
                onJoinClub={props.onJoinClub}
                onLegal={props.onLegal}
                onReferral={props.onReferral}
                onSignOut={props.onSignOut}
              />
            ) : (
              <>
                <ProfileSection title={t('preferences.language')} subtitle={t('preferences.languageHint')} first>
                  <LanguageSettingControl variant="card" />
                </ProfileSection>

                {props.showPlayerVerificationReminder && props.playerVerifyLabel ? (
                  <ProfileSection
                    title={t('profile.verify.title')}
                    subtitle={t('profile.verify.staffSubtitle')}
                  >
                    <AlertCard
                      title={t('profile.verify.playerReminderTitle', {
                        label: props.playerVerifyLabel,
                      })}
                      body={t('profile.verify.identityHint')}
                      cta={t('profile.verify.complete')}
                      onPress={props.onPlayerVerification}
                      colors={colors}
                    />
                  </ProfileSection>
                ) : null}
                {props.pendingVerify ? (
                  <ProfileSection
                    title={t('profile.verify.title')}
                    subtitle={t('profile.verify.staffSubtitle')}
                  >
                    <AlertCard
                      title={t('profile.verify.staff.title')}
                      body={t('profile.verify.staff.body')}
                      cta={props.docLoading ? t('verification.upload.sending') : t('profile.verify.complete')}
                      onPress={props.onPickDocument}
                      colors={colors}
                      secondaryCta={t('profile.verify.tracking')}
                      onSecondaryPress={props.onVerificationFlow}
                    />
                  </ProfileSection>
                ) : null}

                {(props.canManageClub || props.verifiedStaff) ? (
                  <ProfileSection
                    title={t('profile.section.structure')}
                    subtitle={t('profile.section.structureSub')}
                  >
                    <ProfileMenuSection
                      title=""
                      colors={colors}
                      items={[
                        ...(props.canManageClub && props.profile.profile.club_id && props.onTeamManagement
                          ? [
                              {
                                icon: 'people' as const,
                                title: t('profile.team.manage'),
                                subtitle: t('profile.team.manageSub'),
                                onPress: props.onTeamManagement,
                              },
                            ]
                          : []),
                        ...(props.canManageClub && !props.profile.profile.club_id
                          ? [
                              {
                                icon: 'business' as const,
                                title: t('profile.club.create'),
                                subtitle: t('profile.club.joinActionSub'),
                                onPress: props.onCreateClub,
                              },
                              {
                                icon: 'people' as const,
                                title: t('profile.club.joinAction'),
                                subtitle: t('profile.club.convocationsSub'),
                                onPress: props.onJoinClub,
                              },
                            ]
                          : []),
                        ...(props.verifiedStaff
                          ? [
                              {
                                icon: 'shield' as const,
                                title: t('profile.diploma.verified'),
                                subtitle: t('profile.diploma.badgeActive'),
                                onPress: props.onVerificationSuccess,
                              },
                            ]
                          : []),
                      ]}
                    />
                  </ProfileSection>
                ) : null}

                <ProfileSection title={t('profile.section.legal')} subtitle={t('profile.section.legalSub')}>
                  <ProfileMenuSection
                    title=""
                    colors={colors}
                    items={[
                      ...(props.onReferral
                        ? [
                            {
                              icon: 'people' as const,
                              title: t('profile.referral'),
                              subtitle: t('profile.referralSub'),
                              onPress: props.onReferral,
                            },
                          ]
                        : []),
                      {
                        icon: 'document',
                        title: t('legal.terms'),
                        onPress: () => props.onLegal('terms'),
                      },
                      { icon: 'lock', title: t('profile.privacy'), onPress: () => props.onLegal('privacy') },
                    ]}
                  />
                </ProfileSection>

                <ProfileSection title={t('profile.section.session')}>
                  <PressableSpring
                    style={[
                      styles.logoutBtn,
                      { borderColor: colors.error, backgroundColor: colors.errorBg },
                    ]}
                    onPress={props.onSignOut}
                    scaleTo={0.97}
                  >
                    <ProDayText variant="caption" style={{ color: colors.error, fontWeight: '800' }}>
                      {t('profile.logout')}
                    </ProDayText>
                  </PressableSpring>
                </ProfileSection>
              </>
            )}
          </ScrollView>
        ),
      },
    ],
    [
      props,
      colors,
      brand,
      p,
      roleLabel,
      t,
      isPlayer,
      isCoach,
      useHubChrome,
      joueurAccent,
      playerHealth,
      career,
      activities,
      activitiesLoading,
      refreshActivities,
      handleCompletionItem,
    ]
  );

  const identityHeader = useHubChrome ? null : (
    <ProfileIdentityHeader
      profile={props.profile}
      productLine={props.productLine}
      uploadingAvatar={props.uploadingAvatar}
      completionPercent={completionPercent}
      pulse={props.pulse}
      subscriptionTier={props.subscriptionTier}
      onAvatarPress={props.onAvatarPress}
      onEditPress={props.onEdit}
      onPublicProfile={props.profile.role === 'player' ? props.onPublicProfile : undefined}
      compact
    />
  );

  const pager = (
    <View style={styles.pager}>
      <ProDayTabPager
        chapters={chapters}
        pages={pages}
        activeChapter={chapter}
        onChapterChange={setChapter}
        showFooter={false}
        variant={useHubChrome ? (isPlayer ? 'pills' : 'rail') : 'pills'}
        compact={useHubChrome}
        colors={
          isPlayer && useHubChrome
            ? joueurPagerColors
            : inCoachShell
              ? colors
              : undefined
        }
        badges={{
          reglages:
            props.pendingVerify || props.showPlayerVerificationReminder ? 1 : undefined,
        }}
      />
    </View>
  );

  const content = (
    <View
      style={[
        styles.root,
        inCoachShell && { backgroundColor: coachTokens.bg },
        isPlayer && useHubChrome && { backgroundColor: PLAYER_DARK.bg },
      ]}
    >
      {identityHeader}
      <View style={useHubChrome ? styles.playerPager : undefined}>{pager}</View>
    </View>
  );
  if (inCoachShell) {
    return <CoachPane title={getCoachPageIdentity('profil').title}>{content}</CoachPane>;
  }
  return content;
};

const JerseyNumberField: React.FC<{
  value?: number;
  onCommit: (jersey: number | null) => void;
  colors: AppColors;
  style: object;
}> = ({ value, onCommit, colors, style }) => {
  const [draft, setDraft] = useState(value != null ? String(value) : '');
  return (
    <TextInput
      value={draft}
      onChangeText={(raw) => setDraft(raw.replace(/[^\d]/g, '').slice(0, 2))}
      onEndEditing={() => {
        if (!draft.trim()) {
          onCommit(null);
          return;
        }
        const n = Number(draft);
        if (Number.isFinite(n) && n >= 0 && n <= 99) onCommit(n);
      }}
      keyboardType="number-pad"
      placeholder="Ex. 10"
      placeholderTextColor={colors.textMuted}
      style={[
        style,
        { borderColor: colors.border, color: colors.text, backgroundColor: colors.surface },
      ]}
    />
  );
};

const StatChip: React.FC<{ value: string; label: string; colors: AppColors }> = ({
  value,
  label,
  colors,
}) => (
  <View style={[statStyles.chip, { backgroundColor: colors.surface, borderColor: colors.border }]}>
    <ProDayText variant="section">{value}</ProDayText>
    <ProDayText variant="caption" muted>
      {label}
    </ProDayText>
  </View>
);

const statStyles = StyleSheet.create({
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: 2,
  },
});

const InfoLine: React.FC<{ label: string; value?: string; colors: AppColors }> = ({
  label,
  value,
  colors,
}) => {
  if (!value) return null;
  return (
    <View style={infoStyles.row}>
      <ProDayText variant="caption" muted>
        {label}
      </ProDayText>
      <ProDayText variant="body">{value}</ProDayText>
    </View>
  );
};

const infoStyles = StyleSheet.create({
  row: { marginBottom: spacing.sm },
});

const AlertCard: React.FC<{
  title: string;
  body: string;
  cta: string;
  onPress: () => void;
  colors: AppColors;
  secondaryCta?: string;
  onSecondaryPress?: () => void;
}> = ({ title, body, cta, onPress, colors, secondaryCta, onSecondaryPress }) => (
  <ProDaySurface variant="module" style={[alertStyles.wrap, { borderColor: colors.warning }]}>
    <ProDayText variant="section" style={{ color: colors.warning }}>
      {title}
    </ProDayText>
    <ProDayText variant="body" muted>
      {body}
    </ProDayText>
    <PressableSpring
      style={[alertStyles.btn, { borderColor: colors.border }]}
      onPress={onPress}
      scaleTo={0.97}
      haptic
    >
      <ProDayText variant="caption">{cta}</ProDayText>
    </PressableSpring>
    {secondaryCta && onSecondaryPress ? (
      <PressableSpring onPress={onSecondaryPress} scaleTo={0.98}>
        <ProDayText variant="caption" accent>
          {secondaryCta}
        </ProDayText>
      </PressableSpring>
    ) : null}
  </ProDaySurface>
);

const alertStyles = StyleSheet.create({
  wrap: { borderWidth: 1, marginBottom: spacing.md, gap: spacing.sm },
  btn: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    borderWidth: 1.5,
  },
});

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0 },
    pager: { flex: 1, minHeight: 0, marginTop: spacing.xs },
    playerPager: { flex: 1, minHeight: 0 },
    chapterScroll: { flex: 1, minHeight: 0 },
    managementPad: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
      gap: spacing.xs,
    },
    managementScreen: {
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    managementHero: {
      borderRadius: radius.xl,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      marginBottom: spacing.sm,
      gap: 6,
    },
    managementKicker: {
      color: '#DDEAFE',
      fontSize: 10,
      fontWeight: '900',
      letterSpacing: 2.2,
    },
    managementTitle: {
      color: '#FFFFFF',
      fontWeight: '800',
      fontSize: 18,
      lineHeight: 22,
    },
    managementBody: {
      color: 'rgba(226,232,240,0.92)',
      lineHeight: 18,
    },
    managementSectionCard: {
      borderWidth: 1.2,
      borderColor: 'rgba(148,163,184,0.22)',
      borderRadius: radius.xl,
      backgroundColor: 'rgba(8,14,24,0.84)',
    },
    managementSectionKicker: {
      color: 'rgba(148,163,184,0.95)',
      fontWeight: '900',
      letterSpacing: 1.4,
      fontSize: 10,
      marginBottom: spacing.xs,
    },
    cvCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      marginTop: spacing.md,
    },
    jerseyInput: {
      borderWidth: 1,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      fontSize: 16,
      fontWeight: '700',
    },
    cvCtaText: { fontWeight: '800' },
    statsRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    videoRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
    },
    videoLink: { flex: 1, fontSize: 13 },
    activityCard: { borderWidth: 1, marginBottom: spacing.md, borderRadius: radius.lg },
    activityRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    activityIcon: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
    },
    activityCopy: { flex: 1, gap: 2 },
    spacePills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginBottom: spacing.sm },
    hint: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    hintText: { flex: 1 },
    logoutBtn: {
      alignItems: 'center',
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      marginTop: spacing.md,
    },
    familyTeaser: {
      padding: spacing.md,
      marginBottom: spacing.sm,
    },
    familyTeaserRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    familyTeaserCopy: { flex: 1, gap: 4 },
    familyTeaserTitle: { fontWeight: '800' },
  });
}
