import React, { useState, useEffect, useMemo } from 'react';
import { Alert } from 'react-native';
import type { User } from '../models/User';
import { profileService } from '../services/profile.service';
import { pickGalleryImage, pickProfileImage } from '../utils/pickMedia';
import { EditProfileScreen } from './EditProfileScreen';
import { VerificationFlowScreen } from './VerificationFlowScreen';
import { PlayerVerificationScreen } from './PlayerVerificationScreen';
import { useAppSpace } from '../context/AppSpaceContext';
import { getSelectableAppSpacesForUser } from '../utils/minorYouthSpace';
import { playerVerificationProgress } from '../models/User';
import { VerificationSuccessScreen } from './VerificationSuccessScreen';
import { ParentalControlScreen } from './ParentalControlScreen';
import { GuardianPortalScreen } from './GuardianPortalScreen';
import { TeamManagementScreen } from './TeamManagementScreen';
import { CreateClubScreen } from './CreateClubScreen';
import { JoinClubScreen } from './JoinClubScreen';
import { ClubAnnouncementsScreen } from './ClubAnnouncementsScreen';
import { MyApplicationsScreen } from './MyApplicationsScreen';
import { PlayerProfileScreen } from './PlayerProfileScreen';
import { CoachProfileScreen } from './CoachProfileScreen';
import { LegalDocumentScreen } from './LegalDocumentScreen';
import type { LegalDocumentId } from '../content/legalDocuments';
import { ReferralScreen } from './ReferralScreen';
import { referralService } from '../services/referral.service';
import { PlayerCvEditorScreen } from './PlayerCvEditorScreen';
import { useOrganizerReminders } from '../hooks/useOrganizerReminders';
import { teamEventsService } from '../services/teamEvents.service';
import { useTabNavigation } from '../context/TabNavigationContext';
import { useTabNavigationActions } from '../hooks/useTabNavigationActions';
import { computeProdayPulse, getPulseBreakdown } from '../utils/prodayPulse';
import { ProfileHomeScreen } from '../components/profile/ProfileHomeScreen';
import type { ProfileQuickAction } from '../components/profile/ProfileQuickGrid';
import { isMinorUser } from '../utils/minor';
import { needsOnboardingDocumentUpload, shouldShowPlayerVerificationReminder } from '../utils/onboardingGate';
import { pickVerificationFromGallery, pickVerificationPdf } from '../utils/pickVerificationDocument';
import { maybeRecordProfileCompletion } from '../utils/recordV3Action';
import { verificationDocumentTypeForRole } from '../models/User';
import { useAppTheme } from '../context/ProductLineContext';
import { isMedicalPractitionerRole } from '../content/medicalExperience';
import { useSubscriptionOptional } from '../context/SubscriptionContext';
import { useProDayBrain } from '../hooks/useProDayBrain';
import { useSectionIntelligence } from '../hooks/useSectionIntelligence';
import { OnboardingDocumentsScreen } from './OnboardingDocumentsScreen';
import { PushScreenTransition } from '../components/motion';

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
  const [showDocumentVerification, setShowDocumentVerification] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showVerificationFlow, setShowVerificationFlow] = useState(false);
  const [showPlayerVerification, setShowPlayerVerification] = useState(false);
  const { appSpace, setAppSpace } = useAppSpace();
  const [showVerificationSuccess, setShowVerificationSuccess] = useState(false);
  const [showParental, setShowParental] = useState(false);
  const [showGuardian, setShowGuardian] = useState(false);
  const [showTeamManagement, setShowTeamManagement] = useState(false);
  const [showCreateClub, setShowCreateClub] = useState(false);
  const [showJoinClub, setShowJoinClub] = useState(false);
  const [showAnnouncements, setShowAnnouncements] = useState(false);
  const [showApplications, setShowApplications] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [savingPosition, setSavingPosition] = useState(false);
  const [docLoading, setDocLoading] = useState(false);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const { pendingProfileView, clearPendingProfile } = useTabNavigation();
  const nav = useTabNavigationActions();
  const { productLine, isWoman } = useAppTheme();
  const selectableAppSpaces = getSelectableAppSpacesForUser(profile, productLine);
  const subscriptionCtx = useSubscriptionOptional();
  const subscriptionTier = subscriptionCtx?.subscription?.tier ?? 'free';
  const brain = useProDayBrain(profile, productLine);
  const intelligence = useSectionIntelligence('profil', profile, productLine);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [showCvEditor, setShowCvEditor] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocumentId | null>(null);
  const [showReferral, setShowReferral] = useState(false);

  useEffect(() => {
    maybeRecordProfileCompletion(profile);
  }, [profile]);

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
  const needsDocumentUpload = needsOnboardingDocumentUpload(profile);
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
    const file = await pickGalleryImage();
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

  const handlePositionChange = async (position: string) => {
    if (profile.profile.position === position) return;
    setSavingPosition(true);
    try {
      await profileService.updateProfile(profile.uid, { profile: { position } });
      await onRefresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible.');
    } finally {
      setSavingPosition(false);
    }
  };

  const handleJerseyNumberChange = async (jersey: number | null) => {
    if ((profile.profile.jersey_number ?? null) === jersey) return;
    try {
      await profileService.updateProfile(profile.uid, {
        profile: { jersey_number: jersey ?? undefined },
      });
      await onRefresh();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Mise à jour impossible.');
    }
  };

  const handlePickDocument = async () => {
    const file = (await pickVerificationFromGallery()) ?? (await pickVerificationPdf());
    if (!file) return;

    setDocLoading(true);
    try {
      const result = await profileService.uploadVerificationDocument(
        profile.uid,
        { uri: file.uri, mimeType: file.mimeType },
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
          ? isWoman
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

  const pulse = useMemo(() => computeProdayPulse(profile), [profile]);
  const pulseBreakdown = useMemo(() => getPulseBreakdown(profile), [profile]);
  const quickActions = useMemo((): ProfileQuickAction[] => {
    const actions: ProfileQuickAction[] = [
      { id: 'edit', label: 'Éditer', icon: 'person', onPress: () => setShowEdit(true) },
    ];

    if (profile.role === 'player') {
      actions.push({
        id: 'cv',
        label: 'Mon CV',
        icon: 'document',
        onPress: () => setShowCvEditor(true),
      });
    }

    if (isMedicalPractitionerRole(profile.role)) {
      actions.push({
        id: 'agenda',
        label: 'Agenda',
        icon: 'calendar',
        onPress: () => nav.setActiveTab('matchs'),
      });
    } else if (
      profile.role === 'coach' ||
      profile.role === 'club' ||
      profile.role === 'organizer' ||
      profile.role === 'agent'
    ) {
      actions.push(
        {
          id: 'team',
          label: 'Équipe',
          icon: 'people',
          onPress: () => setShowTeamManagement(true),
        },
        {
          id: 'matchs',
          label: 'Matchs',
          icon: 'handshake',
          onPress: () => nav.setActiveTab('matchs'),
        },
        {
          id: 'mercato',
          label: 'Mercato',
          icon: 'briefcase',
          onPress: () => nav.setActiveTab('recrutement'),
        }
      );
    }

    actions.push({
      id: 'messages',
      label: 'Messages',
      icon: 'chat',
      onPress: () => nav.setActiveTab('messages'),
    });

    if (!isMedicalPractitionerRole(profile.role) && productLine !== 'sante') {
      actions.push(
        {
          id: 'carpool',
          label: 'Covoiturage',
          icon: 'car',
          onPress: () => nav.openCarpool({ chapter: 'reserver' }),
        },
        {
          id: 'shop',
          label: 'Shop',
          icon: 'bag',
          onPress: () => nav.openShop(),
        }
      );
    }

    if (profile.role === 'player') {
      actions.push({
        id: 'applications',
        label: 'Candidatures',
        icon: 'briefcase',
        onPress: () => setShowApplications(true),
      });
    }

    return actions;
  }, [profile.role, productLine, nav]);

  const handleOrganizerPress = () => {
    const firstId = reminderItems[0]?.event.id;
    if (firstId) nav.openTeamEvent(firstId);
    else nav.openMatchs();
  };

  const handleSignOutPress = () => {
    Alert.alert('Déconnexion', 'Voulez-vous quitter votre session ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => void onSignOut() },
    ]);
  };

  if (showDocumentVerification && needsDocumentUpload) {
    return (
      <OnboardingDocumentsScreen
        profile={profile}
        onComplete={async () => {
          await onRefresh();
          setShowDocumentVerification(false);
        }}
        onSignOut={onSignOut}
        onDismiss={() => setShowDocumentVerification(false)}
        variant="profile"
      />
    );
  }

  const renderOverlay = (): React.ReactNode => {
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
      return <VerificationSuccessScreen onBack={() => setShowVerificationSuccess(false)} />;
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
    if (showGuardian) {
      return <GuardianPortalScreen onBack={() => setShowGuardian(false)} />;
    }
    if (showTeamManagement && canManageClub) {
      return (
        <TeamManagementScreen profile={profile} onBack={() => setShowTeamManagement(false)} />
      );
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
    if (showAnnouncements) {
      return (
        <ClubAnnouncementsScreen profile={profile} onBack={() => setShowAnnouncements(false)} />
      );
    }
    if (showPublicProfile && profile.role === 'player') {
      return (
        <PlayerProfileScreen player={profile} onBack={() => setShowPublicProfile(false)} />
      );
    }
    if (showPublicProfile && profile.role === 'coach') {
      return (
        <CoachProfileScreen staff={profile} onBack={() => setShowPublicProfile(false)} />
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
        <LegalDocumentScreen documentId={legalDocument} onBack={() => setLegalDocument(null)} />
      );
    }
    if (showReferral && referralService.isEligibleRole(profile.role)) {
      return <ReferralScreen onBack={() => setShowReferral(false)} />;
    }
    return null;
  };

  const hasOverlay =
    showEdit ||
    (showVerificationSuccess && verifiedStaff) ||
    (showPlayerVerification && profile.role === 'player') ||
    (showVerificationFlow && (pendingVerify || verifiedStaff)) ||
    showParental ||
    showGuardian ||
    (showTeamManagement && canManageClub) ||
    showCreateClub ||
    showJoinClub ||
    showAnnouncements ||
    (showPublicProfile && (profile.role === 'player' || profile.role === 'coach')) ||
    (showCvEditor && profile.role === 'player') ||
    (showApplications && profile.role === 'player') ||
    legalDocument != null ||
    showReferral;

  return (
    <>
      <ProfileHomeScreen
        profile={profile}
        productLine={productLine}
        pulse={pulse}
        pulseBreakdown={pulseBreakdown}
        uploadingAvatar={uploadingAvatar}
        uploadingGallery={uploadingGallery}
        gallery={gallery}
        videos={videos}
        appSpace={appSpace}
        selectableAppSpaces={selectableAppSpaces}
        subscriptionTier={subscriptionTier}
        subscriptionUsage={subscriptionCtx?.usage ?? undefined}
        onSubscriptionPress={
          subscriptionCtx ? () => subscriptionCtx.openPlansScreen() : undefined
        }
        isOrganizer={isOrganizer}
        reminderItems={reminderItems}
        loadingReminders={loadingReminders}
        remindingId={remindingId}
        onOrganizerPress={handleOrganizerPress}
        onRemind={handleQuickRemind}
        showPlayerVerificationReminder={showPlayerVerificationReminder}
        needsDocumentUpload={needsDocumentUpload}
        onDocumentVerification={() => setShowDocumentVerification(true)}
        playerVerifyLabel={playerVerifyProgress?.label}
        pendingVerify={pendingVerify}
        docLoading={docLoading}
        canManageClub={canManageClub}
        verifiedStaff={verifiedStaff}
        isPlayerMinor={isPlayerMinor}
        hasStats={Boolean(hasStats)}
        stats={stats ?? undefined}
        onAvatarPress={handleAvatarPick}
        onEdit={() => setShowEdit(true)}
        onCvEditor={() => setShowCvEditor(true)}
        onPublicProfile={() => setShowPublicProfile(true)}
        onApplications={() => setShowApplications(true)}
        onPlayerVerification={() => setShowPlayerVerification(true)}
        onPickDocument={handlePickDocument}
        onVerificationFlow={() => setShowVerificationFlow(true)}
        onAnnouncements={() => setShowAnnouncements(true)}
        onTeamManagement={() => setShowTeamManagement(true)}
        onCreateClub={() => setShowCreateClub(true)}
        onJoinClub={() => setShowJoinClub(true)}
        onVerificationSuccess={() => setShowVerificationSuccess(true)}
        onLegal={(id) => setLegalDocument(id)}
        onReferral={
          referralService.isEligibleRole(profile.role)
            ? () => setShowReferral(true)
            : undefined
        }
        onSignOut={handleSignOutPress}
        onSetAppSpace={(space) => void setAppSpace(space)}
        onGalleryAdd={handleGalleryAdd}
        onGalleryRemove={handleGalleryRemove}
        onPositionChange={handlePositionChange}
        onJerseyNumberChange={handleJerseyNumberChange}
        savingPosition={savingPosition}
        quickActions={quickActions}
        intelligence={intelligence}
        progression={brain.progression}
      />
      <PushScreenTransition active={hasOverlay}>{renderOverlay()}</PushScreenTransition>
    </>
  );
};
