import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Linking,
} from 'react-native';
import { PressableSpring, StaggerReveal } from '../motion';
import type { User } from '../../models/User';
import type { ProdayPulseResult, PulseBreakdownItem } from '../../utils/prodayPulse';
import type { AppSpaceId } from '../../models/AppSpace';
import { APP_SPACE_LABELS } from '../../models/AppSpace';
import { getProfileChapters, type ProfileChapterId } from '../../content/profileChapters';
import { getUniverseIdentity } from '../../content/brandExperience';
import { ProfileIdentityHeader } from './ProfileIdentityHeader';
import { ProfileSection } from './ProfileSection';
import { ProfileQuickGrid, type ProfileQuickAction } from './ProfileQuickGrid';
import { getProfileCompletion } from '../../utils/profileCompletion';
import { ProfileCompletionPanel } from './ProfileCompletionPanel';
import { ProfilePulseCard } from './ProfilePulseCard';
import { ProfileSubscriptionCard } from './ProfileSubscriptionCard';
import { ProfileMenuSection } from './ProfileMenuSection';
import { PlayerCvLivePreview } from './PlayerCvLivePreview';
import { ProfileGalleryEditor } from './ProfileGalleryEditor';
import { AppSpacePill } from '../appSpace/AppSpaceBanner';
import { OrganizerReminderCard } from '../OrganizerReminderCard';
import { ProDayTabPager } from '../ui/ProDayTabPager';
import { ProDayGradient } from '../ui/ProDayGradient';
import { ProDayText } from '../ui/ProDayText';
import { ProDaySurface } from '../ui/ProDaySurface';
import { Icon } from '../ui/Icon';
import { useAppTheme } from '../../context/ProductLineContext';
import type { AppColors } from '../../theme/universeTheme';
import type { ProductLineId } from '../../models/ProductLine';
import type { OrganizerReminderItem } from '../../hooks/useOrganizerReminders';
import type { SubscriptionUsagePeriod } from '../../models/Subscription';
import { TAB_BAR_CONTENT_INSET } from '../../navigation/tabBarLayout';
import { spacing, radius } from '../../theme/designTokens';
import { V3TabShell } from '../v3/V3TabShell';
import { ProgressionBlock } from '../../features/home/components/ProgressionBlock';
import { V3PreferencesCard } from '../v3/V3PreferencesCard';
import { isV3ShellEnabled } from '../../config/featureFlags';
import type { SectionIntelligence } from '../../features/v3/models/sectionIntelligence';
import type { GamificationState } from '../../features/v3/models/gamification';

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
  onPayments: () => void;
  onCreateClub: () => void;
  onJoinClub: () => void;
  onVerificationSuccess: () => void;
  onParental: () => void;
  onGuardianPortal: () => void;
  onLegal: (id: 'terms' | 'privacy') => void;
  onSignOut: () => void;
  onSetAppSpace: (space: AppSpaceId) => void;
  onGalleryAdd: () => void;
  onGalleryRemove: (url: string) => void;
  quickActions: ProfileQuickAction[];
  initialChapter?: ProfileChapterId;
  intelligence?: SectionIntelligence | null;
  progression?: GamificationState;
}

const pagePad = {
  paddingHorizontal: spacing.lg,
  paddingBottom: TAB_BAR_CONTENT_INSET + spacing.sm,
};

const scrollProps = {
  showsVerticalScrollIndicator: false,
  nestedScrollEnabled: true,
  keyboardShouldPersistTaps: 'handled' as const,
};

export const ProfileHomeScreen: React.FC<ProfileHomeScreenProps> = (props) => {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const useV3Header = isV3ShellEnabled();
  const brand = getUniverseIdentity(props.productLine);
  const chapters = useMemo(() => getProfileChapters(props.profile.role), [props.profile.role]);
  const [chapter, setChapter] = useState<ProfileChapterId>(props.initialChapter ?? 'apercu');
  const p = props.profile.profile;
  const completionPercent = useMemo(
    () => getProfileCompletion(props.profile).percent,
    [props.profile]
  );

  const pages = useMemo(
    () => [
      {
        id: 'apercu' as const,
        render: () => (
          <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
            {props.progression ? (
              <ProgressionBlock progression={props.progression} />
            ) : null}

            <ProfileSection title="Raccourcis" subtitle="Navigation rapide" first={!props.progression}>
              <StaggerReveal index={0}>
                <ProfileQuickGrid actions={props.quickActions} />
              </StaggerReveal>
            </ProfileSection>

            <ProfileSection title="Pulse ProDay" subtitle="Visibilité et activité sur la plateforme">
              <StaggerReveal index={1}>
                <ProfilePulseCard
                  pulse={props.pulse}
                  breakdown={props.pulseBreakdown}
                  compact
                />
              </StaggerReveal>
            </ProfileSection>

            <ProfileSection title="Complétion" subtitle="Éléments à finaliser sur votre fiche">
              <StaggerReveal index={2}>
                <ProfileCompletionPanel user={props.profile} onCompletePress={props.onEdit} />
              </StaggerReveal>
            </ProfileSection>

            {props.onSubscriptionPress ? (
              <ProfileSection title="Abonnement" subtitle="Formule et consommation">
                <StaggerReveal index={3}>
                  <ProfileSubscriptionCard
                    profile={props.profile}
                    tier={props.subscriptionTier}
                    usage={props.subscriptionUsage ?? null}
                    onPress={props.onSubscriptionPress}
                  />
                </StaggerReveal>
              </ProfileSection>
            ) : null}

            {props.isOrganizer ? (
              <ProfileSection title="Organisation" subtitle="Relances et convocations">
                <StaggerReveal index={4}>
                  <OrganizerReminderCard
                    items={props.reminderItems}
                    loading={props.loadingReminders}
                    onPress={props.onOrganizerPress}
                    onRemind={props.onRemind}
                    remindingId={props.remindingId}
                  />
                </StaggerReveal>
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
                  title={brand.cvLabel}
                  subtitle="Votre vitrine sportive — sans PDF"
                  first
                >
                  <PlayerCvLivePreview user={props.profile} colors={colors} />
                  <PressableSpring onPress={props.onCvEditor} scaleTo={0.97} haptic>
                    <ProDayGradient kind="cta" style={styles.cvCta}>
                      <Icon name="document" size={18} color="#FFFFFF" />
                      <ProDayText variant="caption" inverse style={styles.cvCtaText}>
                        Compléter mon CV
                      </ProDayText>
                    </ProDayGradient>
                  </PressableSpring>
                </ProfileSection>
                {props.hasStats && props.stats ? (
                  <ProfileSection title="Saison" subtitle="Statistiques enregistrées">
                    <View style={styles.statsRow}>
                      <StatChip value={String(props.stats.matches)} label="Matchs" colors={colors} />
                      <StatChip value={String(props.stats.goals)} label="Buts" colors={colors} />
                      <StatChip value={String(props.stats.assists)} label="Passes d." colors={colors} />
                    </View>
                  </ProfileSection>
                ) : null}
                <ProfileSection title="Galerie & médias" subtitle="Photos et liens vidéo">
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
                      Ajoutez des liens vidéo dans « Modifier le profil ».
                    </ProDayText>
                  )}
                </ProfileSection>
              </>
            ) : (
              <ProfileSection title="Parcours professionnel" subtitle="Expérience et qualifications" first>
                <InfoLine label="Titre" value={p.job_title} colors={colors} />
                <InfoLine label="Diplôme" value={p.diploma} colors={colors} />
                <InfoLine label="N° licence" value={p.license_number} colors={colors} />
                {p.specialties?.length ? (
                  <ProDayText variant="body" muted>
                    Spécialités : {p.specialties.join(' · ')}
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
              <ProfileSection title="Mercato" subtitle="Candidatures et réponses clubs" first>
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
                      <ProDayText variant="section">Mes candidatures</ProDayText>
                      <ProDayText variant="caption" muted>
                        Suivi Mercato et réponses clubs
                      </ProDayText>
                    </View>
                    <Icon name="chevron-forward" size={18} color={colors.textMuted} />
                  </PressableSpring>
                </ProDaySurface>
              </ProfileSection>
            ) : null}

            {(props.productLine === 'homme' || props.productLine === 'woman') &&
            props.profile.role === 'player' ? (
              <ProfileSection title="Univers Mercato" subtitle="Filtre des annonces selon votre espace">
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
                  {APP_SPACE_LABELS[props.appSpace]} — filtre des annonces.
                </ProDayText>
              </ProfileSection>
            ) : null}

            <ProfileSection
              title="Club"
              subtitle={
                props.profile.profile.club_id
                  ? 'Espace lié à votre structure'
                  : 'Rejoignez une structure'
              }
              first={props.profile.role !== 'player'}
            >
              {props.profile.profile.club_id ? (
                <ProfileMenuSection
                  title=""
                  colors={colors}
                  items={[
                    {
                      icon: 'notifications',
                      title: 'Annonces club',
                      subtitle: 'Actualités de votre structure',
                      onPress: props.onAnnouncements,
                    },
                    {
                      icon: 'calendar',
                      title: 'Mes cotisations',
                      subtitle: 'Paiements club',
                      onPress: props.onPayments,
                    },
                  ]}
                />
              ) : (
                <ProDaySurface variant="flat" style={styles.hint}>
                  <Icon name="people" size={18} color={colors.textMuted} />
                  <ProDayText variant="caption" muted style={styles.hintText}>
                    Rejoignez un club pour accéder au calendrier et aux convocations.
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
            {useV3Header ? (
              <ProfileSection title="ProDay V3" subtitle="Préférences intelligentes" first>
                <V3PreferencesCard profile={props.profile} />
              </ProfileSection>
            ) : null}

            {props.showPlayerVerificationReminder && props.playerVerifyLabel ? (
              <ProfileSection
                title="Vérification"
                subtitle="Documents et badge de confiance"
                first={!useV3Header}
              >
                <AlertCard
                  title={`Vérification (${props.playerVerifyLabel})`}
                  body="Pièce d'identité pour la messagerie. Licence club pour le badge complet."
                  cta="Compléter"
                  onPress={props.onPlayerVerification}
                  colors={colors}
                />
              </ProfileSection>
            ) : null}
            {props.pendingVerify ? (
              <ProfileSection
                title="Vérification"
                subtitle="Documents et badge de confiance"
                first={!props.showPlayerVerificationReminder}
              >
                <AlertCard
                  title="Vérification requise"
                  body="Envoyez votre diplôme ou licence pour débloquer la messagerie."
                  cta={props.docLoading ? 'Envoi…' : 'Envoyer un document'}
                  onPress={props.onPickDocument}
                  colors={colors}
                  secondaryCta="Suivi de vérification"
                  onSecondaryPress={props.onVerificationFlow}
                />
              </ProfileSection>
            ) : null}

            {(props.canManageClub || props.verifiedStaff) ? (
              <ProfileSection
                title="Structure"
                subtitle="Club et organisation"
                first={!props.showPlayerVerificationReminder && !props.pendingVerify}
              >
                <ProfileMenuSection
                  title=""
                  colors={colors}
                  items={[
                    ...(props.canManageClub && !props.profile.profile.club_id
                      ? [
                          {
                            icon: 'business' as const,
                            title: 'Créer mon club',
                            subtitle: 'Lier votre structure',
                            onPress: props.onCreateClub,
                          },
                          {
                            icon: 'people' as const,
                            title: 'Rejoindre un club',
                            subtitle: 'Convocations et calendrier',
                            onPress: props.onJoinClub,
                          },
                        ]
                      : []),
                    ...(!props.profile.profile.club_id && props.profile.role === 'player'
                      ? [
                          {
                            icon: 'people' as const,
                            title: 'Rejoindre mon club',
                            subtitle: 'Calendrier équipe',
                            onPress: props.onJoinClub,
                          },
                        ]
                      : []),
                    ...(props.verifiedStaff
                      ? [
                          {
                            icon: 'shield' as const,
                            title: 'Diplôme vérifié',
                            subtitle: 'Badge actif',
                            onPress: props.onVerificationSuccess,
                          },
                        ]
                      : []),
                  ]}
                />
              </ProfileSection>
            ) : null}

            {props.isPlayerMinor ? (
              <ProfileSection title="Famille" subtitle="Compte mineur">
                <ProfileMenuSection
                  title=""
                  colors={colors}
                  items={[
                    {
                      icon: 'shield',
                      title: 'Contrôle parental',
                      subtitle: 'Supervision compte mineur',
                      onPress: props.onParental,
                    },
                  ]}
                />
              </ProfileSection>
            ) : (
              <ProfileSection title="Tuteur" subtitle="Comptes mineurs supervisés">
                <ProfileMenuSection
                  title=""
                  colors={colors}
                  items={[
                    {
                      icon: 'time',
                      title: 'Espace tuteur',
                      subtitle: 'Temps d’écran à distance',
                      onPress: props.onGuardianPortal,
                    },
                  ]}
                />
              </ProfileSection>
            )}

            <ProfileSection title="Informations légales" subtitle="CGU et confidentialité">
              <ProfileMenuSection
                title=""
                colors={colors}
                items={[
                  {
                    icon: 'document',
                    title: "Conditions d'utilisation",
                    onPress: () => props.onLegal('terms'),
                  },
                  { icon: 'lock', title: 'Confidentialité', onPress: () => props.onLegal('privacy') },
                ]}
              />
            </ProfileSection>

            <ProfileSection title="Session">
              <PressableSpring
                style={[
                  styles.logoutBtn,
                  { borderColor: colors.error, backgroundColor: colors.errorBg },
                ]}
                onPress={props.onSignOut}
                scaleTo={0.97}
              >
                <ProDayText variant="caption" style={{ color: colors.error, fontWeight: '800' }}>
                  Se déconnecter
                </ProDayText>
              </PressableSpring>
            </ProfileSection>
          </ScrollView>
        ),
      },
    ],
    [props, colors, brand, p]
  );

  return (
    <View style={styles.root}>
      {useV3Header ? (
        <V3TabShell
          title="Profil"
          subtitle={brand.tagline}
          flat
          intelligence={props.intelligence}
          stats={[
            { value: String(props.pulse.score), label: 'Pulse' },
            { value: `${completionPercent}%`, label: 'Profil' },
            {
              value: props.progression ? String(props.progression.level) : '—',
              label: 'Niveau',
            },
          ]}
        >
          <ProfileIdentityHeader
            profile={props.profile}
            productLine={props.productLine}
            uploadingAvatar={props.uploadingAvatar}
            completionPercent={completionPercent}
            pulse={props.pulse}
            subscriptionTier={props.subscriptionTier}
            onAvatarPress={props.onAvatarPress}
            onEditPress={props.onEdit}
            onPublicProfile={
              props.profile.role === 'player' ? props.onPublicProfile : undefined
            }
          />
          <View style={styles.pager}>
            <ProDayTabPager
              chapters={chapters}
              pages={pages}
              activeChapter={chapter}
              onChapterChange={setChapter}
              showFooter={false}
              compact
              badges={{
                reglages:
                  props.pendingVerify || props.showPlayerVerificationReminder ? 1 : undefined,
              }}
            />
          </View>
        </V3TabShell>
      ) : (
        <>
          <ProfileIdentityHeader
            profile={props.profile}
            productLine={props.productLine}
            uploadingAvatar={props.uploadingAvatar}
            completionPercent={completionPercent}
            pulse={props.pulse}
            subscriptionTier={props.subscriptionTier}
            onAvatarPress={props.onAvatarPress}
            onEditPress={props.onEdit}
            onPublicProfile={
              props.profile.role === 'player' ? props.onPublicProfile : undefined
            }
          />
          <View style={styles.pager}>
            <ProDayTabPager
              chapters={chapters}
              pages={pages}
              activeChapter={chapter}
              onChapterChange={setChapter}
              showFooter={false}
              compact
              badges={{
                reglages:
                  props.pendingVerify || props.showPlayerVerificationReminder ? 1 : undefined,
              }}
            />
          </View>
        </>
      )}
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
    pager: { flex: 1, minHeight: 0 },
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
  });
}
