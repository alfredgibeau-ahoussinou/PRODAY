import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import type { User } from '../models/User';
import { profileService } from '../services/profile.service';
import { pickProfileImage } from '../utils/pickMedia';
import { ProfileGalleryEditor } from '../components/profile/ProfileGalleryEditor';
import { ProfileCompletionBar } from '../components/ProfileCompletionBar';
import { Icon } from '../components/ui/Icon';
import { EditProfileScreen } from './EditProfileScreen';
import { VerificationFlowScreen } from './VerificationFlowScreen';
import { PlayerVerificationScreen } from './PlayerVerificationScreen';
import { AppSpacePill } from '../components/appSpace/AppSpaceBanner';
import { useAppSpace } from '../context/AppSpaceContext';
import { APP_SPACE_LABELS } from '../models/AppSpace';
import { PlayerCvEditorScreen } from './PlayerCvEditorScreen';
import { PlayerCvLivePreview } from '../components/profile/PlayerCvLivePreview';
import { ProfileHubHeader } from '../components/profile/ProfileHubHeader';
import { ProfileMenuSection, type ProfileMenuItem } from '../components/profile/ProfileMenuSection';
import { HubSection } from '../components/ui/HubSection';
import { getUniverseIdentity } from '../content/brandExperience';
import { getSelectableAppSpaces } from '../utils/appSpaceProductLine';
import { playerVerificationProgress } from '../models/User';
import { VerificationSuccessScreen } from './VerificationSuccessScreen';
import { ParentalControlScreen } from './ParentalControlScreen';
import { CreateClubScreen } from './CreateClubScreen';
import { JoinClubScreen } from './JoinClubScreen';
import { MyPaymentsScreen } from './MyPaymentsScreen';
import { ClubAnnouncementsScreen } from './ClubAnnouncementsScreen';
import { MyApplicationsScreen } from './MyApplicationsScreen';
import { PlayerProfileScreen } from './PlayerProfileScreen';
import { LegalDocumentScreen } from './LegalDocumentScreen';
import type { LegalDocumentId } from '../content/legalDocuments';
import { OrganizerReminderCard } from '../components/OrganizerReminderCard';
import { useOrganizerReminders } from '../hooks/useOrganizerReminders';
import { teamEventsService } from '../services/teamEvents.service';
import { TAB_BAR_CONTENT_INSET } from '../components/navigation/BottomTabBar';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { computeProdayPulse, getPulseBreakdown } from '../utils/prodayPulse';
import { ProfilePulseCard } from '../components/profile/ProfilePulseCard';
import { ProfileSubscriptionCard } from '../components/profile/ProfileSubscriptionCard';
import { isMinorUser } from '../utils/minor';
import { shouldShowPlayerVerificationReminder } from '../utils/onboardingGate';
import { verificationDocumentTypeForRole } from '../models/User';
import { spacing, radius } from '../theme/designTokens';
import type { AppColors } from '../theme/universeTheme';
import { useAppTheme } from '../context/ProductLineContext';
import { useSubscriptionOptional } from '../context/SubscriptionContext';

interface ProfileScreenProps {
  profile: User;
  onRefresh: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  profile,
  onRefresh,
  onSignOut,
}) => {
  const [showEdit, setShowEdit] = useState(false);
  const [showVerificationFlow, setShowVerificationFlow] = useState(false);
  const [showPlayerVerification, setShowPlayerVerification] = useState(false);
  const { appSpace, setAppSpace } = useAppSpace();
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [showParental, setShowParental] = useState(false);
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [showJoinClub, setShowJoinClub] = useState(false);
  const [showPayments, setShowPayments] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const { pendingProfileView, clearPendingProfile } = useTabNavigation();
  const nav = useTabNavigationActions();
  const { productLine, colors: themeColors } = useAppTheme();
  const styles = useMemo(() => createProfileStyles(themeColors), [themeColors]);
  const brand = getUniverseIdentity(productLine);
  const selectableAppSpaces = getSelectableAppSpaces(productLine);
  const subscriptionCtx = useSubscriptionOptional();
  const subscriptionTier = subscriptionCtx?.subscription?.tier ?? 'free';
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [showCvEditor, setShowCvEditor] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocumentId | null>(null);

  useEffect(() => {
    if (pendingProfileView === 'applications') {
      setShowApplications(true);
      clearPendingProfile();
    }
    if (pendingProfileView === 'cv') {
      setShowCvEditor(true);
      clearPendingProfile();
    }
  }, [pendingProfileView, clearPendingProfile]);

  const p = profile.profile;
  const isStaff =
    profile.role === 'coach' ||
    profile.role === 'agent' ||
    profile.role === 'recruiter' ||
    profile.role === 'club';
  const isOrganizer =
    profile.role === 'coach' ||
    profile.role === 'organizer' ||
    profile.role === 'agent' ||
    profile.role === 'club';
  const pendingVerify = isStaff && profile.verification_status === 'PENDING';
  const verifiedStaff = isStaff && profile.verification_status === 'VERIFIED';
  const canManageClub =
    profile.role === 'organizer' ||
    profile.role === 'coach' ||
    profile.role === 'agent' ||
    profile.role === 'club';
  const isPlayerMinor = profile.role === 'player' && isMinorUser(profile);
  const showPlayerVerificationReminder = shouldShowPlayerVerificationReminder(profile);
  const playerVerifyProgress = showPlayerVerificationReminder
    ? playerVerificationProgress(profile.player_verification)
    : null;

  const { items: reminderItems, loading: loadingReminders, refresh: refreshReminders } =
    useOrganizerReminders(isOrganizer ? profile.uid : undefined);

  const gallery = p.gallery_urls?.filter(Boolean) ?? [];
  const videos = p.highlight_video_urls?.filter(Boolean) ?? [];
  const stats = p.season_stats;
  const hasStats =
    stats && (stats.matches > 0 || stats.goals > 0 || stats.assists > 0);

  const handleAvatarPick = async () => {
    const file = await pickProfileImage();
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await profileService.uploadAvatar(profile.uid, file);
      await onRefresh();
      Alert.alert('Photo mise à jour', 'Votre photo de profil est en ligne.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Upload impossible.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleGalleryAdd = async () => {
    const file = await pickProfileImage();
    if (!file) return;
    setUploadingGallery(true);
    try {
      await profileService.addGalleryPhoto(profile.uid, file);
      await onRefresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Ajout impossible.');
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleGalleryRemove = (url: string) => {
    Alert.alert('Supprimer la photo', 'Retirer cette image de votre galerie ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            await profileService.removeGalleryPhoto(profile.uid, url);
            await onRefresh();
          } catch (e) {
            Alert.alert('Erreur', e instanceof Error ? e.message : 'Suppression impossible.');
          }
        },
      },
    ]);
  };

  const handlePickDocument = async () => {
    const pick = await DocumentPicker.getDocumentAsync({
      type: ['image/*', 'application/pdf'],
      copyToCacheDirectory: true,
    });
    if (pick.canceled || !pick.assets?.[0]) return;

    const asset = pick.assets[0];
    setDocLoading(true);
    try {
      const result = await profileService.uploadVerificationDocument(
        profile.uid,
        { uri: asset.uri, mimeType: asset.mimeType ?? 'image/jpeg' },
        verificationDocumentTypeForRole(profile.role)
      );
      if (!result.success) throw new Error(result.error);
      await onRefresh();
      Alert.alert('Document envoyé', 'Votre dossier est en cours de validation.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Envoi impossible.');
    } finally {
      setDocLoading(false);
    }
  };

  const handleQuickRemind = async (eventId: string) => {
    setRemindingId(eventId);
    try {
      const n = await teamEventsService.sendReminders(eventId);
      Alert.alert(
        'Relance',
        n > 0
          ? productLine === 'woman'
            ? `${n} joueuse${n > 1 ? 's' : ''} relancée${n > 1 ? 's' : ''}.`
            : `${n} joueur${n > 1 ? 's' : ''} relancé${n > 1 ? 's' : ''}.`
          : 'Aucune réponse en attente.'
      );
      refreshReminders();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Relance impossible.');
    } finally {
      setRemindingId(null);
    }
  };

  if (showEdit) {
    return (
      <EditProfileScreen
        user={profile}
        onBack={() => setShowEdit(false)}
        onSaved={onRefresh}
      />
    );
  }
  if (showVerificationSuccess && verifiedStaff) {
    return (
      <VerificationSuccessScreen onBack={() => setShowVerificationSuccess(false)} />
    );
  }
  if (showPlayerVerification && profile.role === 'player') {
    return (
      <PlayerVerificationScreen
        user={profile}
        onBack={() => setShowPlayerVerification(false)}
        onUpdated={onRefresh}
      />
    );
  }
  if (showVerificationFlow && (pendingVerify || verifiedStaff)) {
    return (
      <VerificationFlowScreen
        user={profile}
        onBack={() => setShowVerificationFlow(false)}
        initialSuccess={verifiedStaff}
      />
    );
  }
  if (showParental) {
    return <ParentalControlScreen onBack={() => setShowParental(false)} />;
  }
  if (showCreateClub) {
    return (
      <CreateClubScreen
        profile={profile}
        onBack={() => setShowCreateClub(false)}
        onCreated={onRefresh}
      />
    );
  }
  if (showJoinClub) {
    return (
      <JoinClubScreen
        profile={profile}
        onBack={() => setShowJoinClub(false)}
        onJoined={() => {
          setShowJoinClub(false);
          onRefresh();
        }}
      />
    );
  }
  if (showPayments) {
    return <MyPaymentsScreen profile={profile} onBack={() => setShowPayments(false)} />;
  }
  if (showAnnouncements) {
    return (
      <ClubAnnouncementsScreen
        profile={profile}
        onBack={() => setShowAnnouncements(false)}
      />
    );
  }
  if (showPublicProfile && profile.role === 'player') {
    return (
      <PlayerProfileScreen
        player={profile}
        onBack={() => setShowPublicProfile(false)}
      />
    );
  }

  if (showCvEditor && profile.role === 'player') {
    return (
      <PlayerCvEditorScreen
        profile={profile}
        onBack={() => setShowCvEditor(false)}
        onSaved={onRefresh}
      />
    );
  }

  if (showApplications && profile.role === 'player') {
    return (
      <MyApplicationsScreen
        playerUid={profile.uid}
        onBack={() => setShowApplications(false)}
      />
    );
  }

  if (legalDocument) {
    return (
      <LegalDocumentScreen
        documentId={legalDocument}
        onBack={() => setLegalDocument(null)}
      />
    );
  }

  const pulse = computeProdayPulse(profile);
  const pulseBreakdown = getPulseBreakdown(profile);

  const accountMenu: ProfileMenuItem[] = [
    {
      icon: 'person',
      title: 'Modifier le profil',
      subtitle: 'Identité, fiche sportive, contacts',
      onPress: () => setShowEdit(true),
    },
  ];

  if (profile.role === 'player') {
    accountMenu.unshift({
      icon: 'document',
      title: brand.cvLabel,
      subtitle: 'Compléter et publier en ligne',
      onPress: () => setShowCvEditor(true),
      accent: true,
    });
    accountMenu.push({
      icon: 'eye',
      title: 'Profil public',
      subtitle: 'Aperçu visible par les clubs',
      onPress: () => setShowPublicProfile(true),
    });
  }

  const mercatoMenu: ProfileMenuItem[] = [];
  if (profile.role === 'player') {
    mercatoMenu.push({
      icon: 'briefcase',
      title: 'Mes candidatures',
      subtitle: 'Suivi des annonces Mercato',
      onPress: () => setShowApplications(true),
    });
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: themeColors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <ProfileHubHeader
        profile={profile}
        productLine={productLine}
        colors={themeColors}
        uploadingAvatar={uploadingAvatar}
        onAvatarPress={handleAvatarPick}
      />

      {profile.role === 'player' ? (
        <HubSection
          title={brand.cvLabel}
          subtitle="Votre vitrine sportive — remplissez-la ici, sans PDF."
          colors={themeColors}
        >
          <PlayerCvLivePreview user={profile} colors={themeColors} />
          <TouchableOpacity
            style={[styles.cvPrimaryBtn, { backgroundColor: themeColors.ink }]}
            onPress={() => setShowCvEditor(true)}
            activeOpacity={0.9}
          >
            <Icon name="document" size={20} color={themeColors.brandInverse} />
            <Text style={[styles.cvPrimaryText, { color: themeColors.brandInverse }]}>
              Compléter mon CV
            </Text>
          </TouchableOpacity>
        </HubSection>
      ) : null}

      <ProfilePulseCard pulse={pulse} breakdown={pulseBreakdown} />
      <ProfileCompletionBar user={profile} />

      {subscriptionCtx ? (
        <ProfileSubscriptionCard
          profile={profile}
          tier={subscriptionTier}
          usage={subscriptionCtx.usage}
          onPress={() => subscriptionCtx.openPlansScreen()}
        />
      ) : null}

      <ProfileMenuSection title="Mon compte" items={accountMenu} colors={themeColors} />

      {profile.role === 'player' && (
        <>
          {profile.role === 'player' && hasStats && stats ? (
            <View style={styles.statsRow}>
              <StatChip value={String(stats.matches)} label="Matchs" colors={themeColors} styles={styles} />
              <StatChip value={String(stats.goals)} label="Buts" colors={themeColors} styles={styles} />
              <StatChip value={String(stats.assists)} label="Passes d." colors={themeColors} styles={styles} />
            </View>
          ) : null}

          <HubSection
            title="Galerie & médias"
            colors={themeColors}
            compact
          >
            <ProfileGalleryEditor
              urls={gallery}
              productLine={productLine}
              uploading={uploadingGallery}
              onAdd={handleGalleryAdd}
              onRemove={handleGalleryRemove}
            />
            {videos.length > 0 ? (
              videos.map((url) => (
                <TouchableOpacity
                  key={url}
                  style={[styles.videoRow, { borderColor: themeColors.border }]}
                  onPress={() => Linking.openURL(url).catch(() => {})}
                >
                  <Icon name="time" size={18} color={themeColors.accent} />
                  <Text style={[styles.videoLink, { color: themeColors.textSecondary }]} numberOfLines={1}>
                    {url}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={[styles.hintText, { color: themeColors.textMuted }]}>
                Ajoutez des liens vidéo dans « Modifier le profil ».
              </Text>
            )}
          </HubSection>
        </>
      )}

      {profile.role === 'player' && (
        <HubSection
          title={
            productLine === 'woman'
              ? 'Mercato F (optionnel)'
              : productLine === 'pro'
                ? 'Mercato Pro'
                : 'Mercato (optionnel)'
          }
          subtitle="Postuler aux annonces — votre CV reste votre priorité."
          colors={themeColors}
          compact
        >
          {mercatoMenu.map((item) => (
            <TouchableOpacity
              key={item.title}
              style={[styles.mercatoRow, { borderColor: themeColors.border }]}
              onPress={item.onPress}
              activeOpacity={0.85}
            >
              <Icon name={item.icon} size={20} color={themeColors.accent} />
              <View style={styles.mercatoBody}>
                <Text style={[styles.mercatoTitle, { color: themeColors.text }]}>{item.title}</Text>
                {item.subtitle ? (
                  <Text style={[styles.mercatoSub, { color: themeColors.textSecondary }]}>
                    {item.subtitle}
                  </Text>
                ) : null}
              </View>
              <Icon name="chevron-forward" size={18} color={themeColors.textMuted} />
            </TouchableOpacity>
          ))}
          <View style={styles.spacePills}>
            {selectableAppSpaces.map((space) => (
              <AppSpacePill
                key={space}
                space={space}
                active={appSpace === space}
                onPress={() => void setAppSpace(space)}
              />
            ))}
          </View>
          <Text style={[styles.spaceHint, { color: themeColors.textSecondary }]}>
            {APP_SPACE_LABELS[appSpace]} — filtre des annonces.
          </Text>
        </HubSection>
      )}

      {showPlayerVerificationReminder && playerVerifyProgress && (
        <View style={[styles.card, styles.warnCard, { borderColor: themeColors.border }]}>
          <Text style={[styles.warnTitle, { color: themeColors.text }]}>
            Vérification ({playerVerifyProgress.label})
          </Text>
          <Text style={[styles.warnSub, { color: themeColors.textSecondary }]}>
            Pièce d’identité pour la messagerie. Licence club pour le badge complet.
          </Text>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: themeColors.border }]}
            onPress={() => setShowPlayerVerification(true)}
          >
            <Text style={[styles.secondaryBtnText, { color: themeColors.text }]}>Compléter</Text>
          </TouchableOpacity>
        </View>
      )}

      {isOrganizer && (
        <OrganizerReminderCard
          items={reminderItems}
          loading={loadingReminders}
          onPress={() => {
            const firstId = reminderItems[0]?.event.id;
            if (firstId) nav.openTeamEvent(firstId);
            else nav.openMatchs();
          }}
          onRemind={handleQuickRemind}
          remindingId={remindingId}
        />
      )}

      {(profile.role === 'coach' || profile.role === 'agent' || profile.role === 'recruiter') && (
        <HubSection title="Parcours pro" colors={themeColors} compact>
          <InfoLine label="Titre" value={p.job_title} colors={themeColors} styles={styles} />
          <InfoLine label="Diplôme" value={p.diploma} colors={themeColors} styles={styles} />
          <InfoLine label="N° licence" value={p.license_number} colors={themeColors} styles={styles} />
          {p.specialties?.length ? (
            <Text style={[styles.specialties, { color: themeColors.textSecondary }]}>
              Spécialités : {p.specialties.join(' · ')}
            </Text>
          ) : null}
        </HubSection>
      )}

      {pendingVerify && (
        <View style={[styles.card, styles.warnCard, { borderColor: themeColors.border }]}>
          <Text style={[styles.warnTitle, { color: themeColors.text }]}>Vérification requise</Text>
          <Text style={[styles.warnSub, { color: themeColors.textSecondary }]}>
            Envoyez votre diplôme ou licence pour débloquer la messagerie.
          </Text>
          <TouchableOpacity
            style={[styles.secondaryBtn, { borderColor: themeColors.border }]}
            onPress={handlePickDocument}
            disabled={docLoading}
          >
            <Text style={[styles.secondaryBtnText, { color: themeColors.text }]}>
              {docLoading ? 'Envoi…' : 'Envoyer un document'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowVerificationFlow(true)}>
            <Text style={[styles.link, { color: themeColors.accent }]}>Suivi de vérification</Text>
          </TouchableOpacity>
        </View>
      )}

      {profile.profile.club_id ? (
        <ProfileMenuSection
          title="Mon club"
          colors={themeColors}
          items={[
            {
              icon: 'notifications',
              title: 'Annonces club',
              subtitle: 'Actualités de votre structure',
              onPress: () => setShowAnnouncements(true),
            },
            {
              icon: 'calendar',
              title: 'Mes cotisations',
              subtitle: 'Paiements club',
              onPress: () => setShowPayments(true),
            },
          ]}
        />
      ) : null}

      {(canManageClub || verifiedStaff) && (
        <ProfileMenuSection
          title="Structure"
          colors={themeColors}
          items={[
            ...(canManageClub && !profile.profile.club_id
              ? [
                  {
                    icon: 'business' as const,
                    title: 'Créer mon club',
                    subtitle: 'Lier votre structure',
                    onPress: () => setShowCreateClub(true),
                  },
                  {
                    icon: 'people' as const,
                    title: 'Rejoindre un club',
                    subtitle: 'Convocations et calendrier',
                    onPress: () => setShowJoinClub(true),
                  },
                ]
              : []),
            ...(!profile.profile.club_id && profile.role === 'player'
              ? [
                  {
                    icon: 'people' as const,
                    title: 'Rejoindre mon club',
                    subtitle: 'Calendrier équipe',
                    onPress: () => setShowJoinClub(true),
                  },
                ]
              : []),
            ...(verifiedStaff
              ? [
                  {
                    icon: 'shield' as const,
                    title: 'Diplôme vérifié',
                    subtitle: 'Badge actif',
                    onPress: () => setShowVerificationSuccess(true),
                  },
                ]
              : []),
          ]}
        />
      )}

      {isPlayerMinor && (
        <ProfileMenuSection
          title="Famille"
          colors={themeColors}
          items={[
            {
              icon: 'shield',
              title: 'Contrôle parental',
              subtitle: 'Supervision compte mineur',
              onPress: () => setShowParental(true),
            },
          ]}
        />
      )}

      <ProfileMenuSection
        title="Informations"
        colors={themeColors}
        items={[
          {
            icon: 'document',
            title: 'Conditions d’utilisation',
            onPress: () => setLegalDocument('terms'),
          },
          {
            icon: 'lock',
            title: 'Confidentialité',
            onPress: () => setLegalDocument('privacy'),
          },
        ]}
      />

      <TouchableOpacity
        style={[styles.logoutBtn, { borderColor: themeColors.border }]}
        onPress={() => {
          Alert.alert('Déconnexion', 'Voulez-vous quitter votre session ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnexion', style: 'destructive', onPress: () => void onSignOut() },
          ]);
        }}
        activeOpacity={0.85}
      >
        <Text style={[styles.logoutText, { color: themeColors.error }]}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const StatChip: React.FC<{
  value: string;
  label: string;
  colors: { surface: string; border: string; text: string; textMuted: string };
  styles: ReturnType<typeof createProfileStyles>;
}> = ({ value, label, colors: c, styles }) => (
  <View style={[styles.statChip, { backgroundColor: c.surface, borderColor: c.border }]}>
    <Text style={[styles.statValue, { color: c.text }]}>{value}</Text>
    <Text style={[styles.statLabel, { color: c.textMuted }]}>{label}</Text>
  </View>
);

const InfoLine: React.FC<{
  label: string;
  value?: string;
  colors: { textMuted: string; text: string };
  styles: ReturnType<typeof createProfileStyles>;
}> = ({ label, value, colors: c, styles }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={[styles.infoLabel, { color: c.textMuted }]}>{label}</Text>
      <Text style={[styles.infoValue, { color: c.text }]}>{value}</Text>
    </View>
  );
};

function createProfileStyles(c: AppColors) {
  return StyleSheet.create({
  container: { flex: 1, backgroundColor: c.background },
  content: {
    padding: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: c.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  heroInner: {
    alignItems: 'center',
    paddingTop: spacing.xs,
  },
  cvPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.md,
  },
  cvPrimaryText: { fontSize: 16, fontWeight: '800' },
  mercatoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: spacing.sm,
  },
  mercatoBody: { flex: 1 },
  mercatoTitle: { fontSize: 15, fontWeight: '800' },
  mercatoSub: { fontSize: 12, marginTop: 2 },
  hintText: { fontSize: 13, lineHeight: 19 },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
  },
  videoLink: { flex: 1, fontSize: 13 },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.xs,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: c.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  meta: {
    fontSize: 13,
    color: c.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  email: {
    fontSize: 12,
    color: c.textMuted,
    marginTop: 2,
    textAlign: 'center',
    alignSelf: 'stretch',
  },
  badgeWrap: { marginTop: spacing.sm },
  spacePills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  spaceHint: {
    fontSize: 12,
    color: c.textSecondary,
    marginTop: spacing.sm,
    textAlign: 'center',
    lineHeight: 18,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statChip: {
    flex: 1,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: c.text },
  statLabel: { fontSize: 10, color: c.textMuted, fontWeight: '700', marginTop: 4 },
  actionRow: { gap: spacing.sm, marginBottom: spacing.lg, width: '100%' },
  actionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: c.ink,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.accent,
  },
  actionPrimaryText: { color: c.brandInverse, fontWeight: '900', fontSize: 15 },
  actionOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: c.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: c.border,
  },
  actionOutlineText: { color: c.accent, fontWeight: '800', fontSize: 14 },
  card: {
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: c.border,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 14, fontWeight: '900', color: c.accent, marginBottom: spacing.sm },
  bioText: { fontSize: 14, color: c.textSecondary, lineHeight: 21 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: c.border,
  },
  infoLabel: { fontSize: 13, color: c.textMuted, fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '800', color: c.text },
  specialties: { fontSize: 13, color: c.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  achievement: { fontSize: 13, color: c.textSecondary, lineHeight: 20, marginTop: 4 },
  warnCard: { backgroundColor: c.warningBg },
  warnTitle: { fontWeight: '900', fontSize: 15, color: c.text },
  warnSub: { fontSize: 13, color: c.textSecondary, marginTop: 4, marginBottom: spacing.md, lineHeight: 18 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryBtnText: { fontWeight: '800', color: c.text },
  link: {
    color: c.accent,
    fontWeight: '800',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  menuCard: { paddingVertical: spacing.xs },
  candidaturesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: c.accent,
  },
  candidaturesIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: c.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidaturesBody: { flex: 1 },
  candidaturesTitle: { fontSize: 16, fontWeight: '900', color: c.text },
  candidaturesSub: { fontSize: 12, color: c.textMuted, marginTop: 2 },
  parentalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: c.brand,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  parentalIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentalBody: { flex: 1 },
  parentalTitle: { fontSize: 16, fontWeight: '900', color: c.brandInverse },
  parentalSub: {
    fontSize: 12,
    color: c.heroMuted,
    marginTop: 2,
    lineHeight: 17,
  },
  logoutBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    marginTop: spacing.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: c.border,
    backgroundColor: 'transparent',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: c.textMuted },
  });
}
