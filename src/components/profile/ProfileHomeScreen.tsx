import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
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
import type { ProductLineId } from '../../models/ProductLine';
import type { OrganizerReminderItem } from '../../hooks/useOrganizerReminders';
import type { SubscriptionUsagePeriod } from '../../models/Subscription';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius } from '../../theme/designTokens';
import { ProfilePreferencesCard } from './ProfilePreferencesCard';
import { LanguageSettingControl } from '../settings/LanguageSettingControl';
import { ProgressionBlock } from '../../features/home/components/ProgressionBlock';
import type { SectionIntelligence } from '../../features/v3/models/sectionIntelligence';
import type { GamificationState } from '../../features/v3/models/gamification';
import { getRoleLabel } from '../../screens/signup/signupFlowConfig';

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
  onSignOut: () => void;
  onSetAppSpace: (space: AppSpaceId) => void;
  onGalleryAdd: () => void;
  onGalleryRemove: (url: string) => void;
  onPositionChange?: (position: string) => void | Promise<void>;
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
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useMemo(() => createStyles(colors), [colors]);
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

  const handleCompletionItem = (itemId: string) => {
    if (itemId === 'position' && props.profile.role === 'player') {
      setChapter('cv');
      return;
    }
    props.onEdit();
  };

  const roleLabel =
    props.profile.role === 'player' && props.productLine === 'woman'
      ? brand.playerLabel
      : getRoleLabel(props.profile.role, t);

  const pages = useMemo(
    () => [
      {
        id: 'apercu' as const,
        render: () => (
          <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
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

            <ProfileSection title={t('profile.section.shortcuts')} subtitle={t('profile.section.shortcutsSub')}>
              <ProfileQuickGrid actions={props.quickActions} compact />
            </ProfileSection>

            {props.onSubscriptionPress ? (
              <ProfileSection title={t('profile.section.subscription')} subtitle={t('profile.section.subscriptionSub')}>
                <ProfileSubscriptionCard
                  profile={props.profile}
                  tier={props.subscriptionTier}
                  usage={props.subscriptionUsage ?? null}
                  onPress={props.onSubscriptionPress}
                />
              </ProfileSection>
            ) : null}

            <ProfileSection title={t('profile.section.completion')} subtitle={t('profile.section.completionSub')}>
              <ProfileCompletionPanel
                user={props.profile}
                onCompletePress={props.onEdit}
                onItemPress={handleCompletionItem}
              />
              {props.profile.role === 'player' ? (
                <MercatoVisibilityChecklist profile={props.profile} />
              ) : null}
            </ProfileSection>

            {props.progression ? (
              <ProfileSection title={t('profile.section.progression')} subtitle={t('profile.section.progressionSub')}>
                <ProgressionBlock progression={props.progression} />
              </ProfileSection>
            ) : null}

            {props.isOrganizer ? (
              <ProfileSection title={t('profile.section.organization')} subtitle={t('profile.section.organizationSub')}>
                <OrganizerReminderCard
                  items={props.reminderItems}
                  loading={props.loadingReminders}
                  onPress={props.onOrganizerPress}
                  onRemind={props.onRemind}
                  remindingId={props.remindingId}
                />
              </ProfileSection>
            ) : null}
          </ScrollView>
        ),
      },
      {
        id: 'cv' as const,
        render: () => (
          <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
            {props.profile.role === 'player' ? (
              <>
                <ProfileSection
                  title={t('profile.section.position')}
                  subtitle={t('profile.section.positionSub')}
                  first
                >
                  <PlayerPositionPitchPicker
                    value={p.position ?? ''}
                    onChange={(position) => void props.onPositionChange?.(position)}
                    saving={props.savingPosition}
                    hint={p.position ? undefined : t('profile.position.hint')}
                  />
                </ProfileSection>
                <ProfileSection
                  title={brand.cvLabel}
                  subtitle={t('profile.section.cvSub')}
                >
                  <PlayerCvLivePreview user={props.profile} colors={colors} />
                  <PressableSpring onPress={props.onCvEditor} scaleTo={0.97} haptic>
                    <ProDayGradient kind="cta" style={styles.cvCta}>
                      <Icon name="document" size={18} color="#FFFFFF" />
                      <ProDayText variant="caption" inverse style={styles.cvCtaText}>
                        {t('profile.completeCv')}
                      </ProDayText>
                    </ProDayGradient>
                  </PressableSpring>
                </ProfileSection>
                {props.hasStats && props.stats ? (
                  <ProfileSection title={t('profile.section.season')} subtitle={t('profile.section.seasonSub')}>
                    <View style={styles.statsRow}>
                      <StatChip value={String(props.stats.matches)} label={t('profile.stats.matches')} colors={colors} />
                      <StatChip value={String(props.stats.goals)} label={t('profile.stats.goals')} colors={colors} />
                      <StatChip value={String(props.stats.assists)} label={t('profile.stats.assists')} colors={colors} />
                    </View>
                  </ProfileSection>
                ) : null}
                <ProfileSection title={t('profile.section.gallery')} subtitle={t('profile.section.gallerySub')}>
                  <ProfileGalleryEditor
                    urls={props.gallery}
                    productLine={props.productLine}
                    uploading={props.uploadingGallery}
                    onAdd={props.onGalleryAdd}
                    onRemove={props.onGalleryRemove}
                  />
                  {props.videos.length > 0 ? (
                    props.videos.map((url, index) => (
                      <StaggerReveal key={url} index={index}>
                        <PressableSpring
                          style={[styles.videoRow, { borderColor: colors.border }]}
                          onPress={() => Linking.openURL(url).catch(() => {})}
                          scaleTo={0.99}
                        >
                          <Icon name="time" size={18} color={colors.accent} />
                          <Text style={[styles.videoLink, { color: colors.textSecondary }]} numberOfLines={1}>
                            {url}
                          </Text>
                        </PressableSpring>
                      </StaggerReveal>
                    ))
                  ) : (
                    <ProDayText variant="caption" muted>
                      {t('profile.videos.addHint')}
                    </ProDayText>
                  )}
                </ProfileSection>
              </>
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
          <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
            {props.profile.role === 'player' ? (
              <ProfileSection title={t('profile.section.mercato')} subtitle={t('profile.section.mercatoSub')} first>
                <ProDaySurface variant="module" style={[styles.activityCard, { borderColor: colors.border }]}>
                  <PressableSpring
                    style={styles.activityRow}
                    onPress={props.onApplications}
                    scaleTo={0.98}
                    haptic
                  >
                    <View style={[styles.activityIcon, { backgroundColor: colors.accentSoft }]}>
                      <Icon name="briefcase" size={20} color={colors.accent} />
                    </View>
                    <View style={styles.activityCopy}>
                      <ProDayText variant="section">{t('profile.mercato.applications')}</ProDayText>
                      <ProDayText variant="caption" muted>
                        {t('profile.mercato.applicationsSub')}
                      </ProDayText>
                    </View>
                    <Icon name="chevron-forward" size={18} color={colors.textMuted} />
                  </PressableSpring>
                </ProDaySurface>
              </ProfileSection>
            ) : null}

            {(props.productLine === 'homme' || props.productLine === 'woman') &&
            props.profile.role === 'player' ? (
              <ProfileSection title={t('profile.section.mercatoUniverse')} subtitle={t('profile.section.mercatoUniverseSub')}>
                <View style={styles.spacePills}>
                  {props.selectableAppSpaces.map((space) => (
                    <AppSpacePill
                      key={space}
                      space={space}
                      active={props.appSpace === space}
                      onPress={() => props.onSetAppSpace(space)}
                    />
                  ))}
                </View>
                <ProDayText variant="caption" muted>
                  {t('profile.mercato.filterHint', { space: APP_SPACE_LABELS[props.appSpace] })}
                </ProDayText>
              </ProfileSection>
            ) : null}

            <ProfileSection
              title={t('profile.section.club')}
              subtitle={
                props.profile.profile.club_id
                  ? t('profile.club.linked')
                  : t('profile.club.join')
              }
              first={props.profile.role !== 'player'}
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
          </ScrollView>
        ),
      },
      {
        id: 'reglages' as const,
        render: () => (
          <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
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
                    ...(!props.profile.profile.club_id && props.profile.role === 'player'
                      ? [
                          {
                            icon: 'people' as const,
                            title: t('profile.club.joinMyClub'),
                            subtitle: t('profile.club.teamCalendar'),
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
          </ScrollView>
        ),
      },
    ],
    [props, colors, brand, p, roleLabel, t]
  );

  const identityHeader = (
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
        variant="pills"
        badges={{
          reglages:
            props.pendingVerify || props.showPlayerVerificationReminder ? 1 : undefined,
        }}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      {identityHeader}
      {pager}
    </View>
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
    cvCta: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      marginTop: spacing.md,
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
    activityCard: { borderWidth: 1, marginBottom: spacing.md },
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
