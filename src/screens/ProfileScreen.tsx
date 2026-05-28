import React, { useState, useEffect } from 'react';
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
import type { User, UserRole } from '../models/User';
import { profileService } from '../services/profile.service';
import { pickProfileImage } from '../utils/pickMedia';
import { buildPlayerCvHtmlFromUser } from '../utils/pdfGenerator';
import { openPlayerCvHtml } from '../utils/openCvHtml';
import { ProfileAvatarButton } from '../components/profile/ProfileAvatarButton';
import { ProfileGalleryEditor } from '../components/profile/ProfileGalleryEditor';
import { ProfileMenuRow } from '../components/profile/ProfileMenuRow';
import { ProfileCompletionBar } from '../components/ProfileCompletionBar';
import { VerificationBadge } from '../components/VerificationBadge';
import { Icon } from '../components/ui/Icon';
import { EditProfileScreen } from './EditProfileScreen';
import { VerificationFlowScreen } from './VerificationFlowScreen';
import { PlayerVerificationScreen } from './PlayerVerificationScreen';
import { AppSpacePill } from '../components/appSpace/AppSpaceBanner';
import { useAppSpace } from '../context/AppSpaceContext';
import { APP_SPACE_IDS, APP_SPACE_LABELS } from '../models/AppSpace';
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
import { FirebaseStatusCard } from '../components/FirebaseStatusCard';
import { isMinorUser } from '../utils/minor';
import { verificationDocumentTypeForRole } from '../models/User';
import { colors, spacing, radius } from '../theme/designTokens';

const ROLE_LABELS: Record<UserRole, string> = {
  player: 'Joueur',
  coach: 'Coach',
  club: 'Club',
  agent: 'Agent',
  organizer: 'Organisateur',
  sponsor: 'Sponsor',
  physio: 'Kinésithérapeute',
};

const FOOT_LABELS = { left: 'Gauche', right: 'Droit', both: 'Ambidextre' } as const;

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
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocumentId | null>(null);

  useEffect(() => {
    if (pendingProfileView === 'applications') {
      setShowApplications(true);
      clearPendingProfile();
    }
  }, [pendingProfileView, clearPendingProfile]);

  const p = profile.profile;
  const isStaff =
    profile.role === 'coach' ||
    profile.role === 'agent' ||
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
  const playerVerifyProgress =
    profile.role === 'player'
      ? playerVerificationProgress(profile.player_verification)
      : null;
  const playerNeedsVerify =
    profile.role === 'player' &&
    profile.player_verification?.identity?.status !== 'verified';

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

  const handleExportCv = () => {
    if (profile.role !== 'player') {
      Alert.alert(
        'CV joueur',
        'L’export CV est optimisé pour les profils joueur. Complétez votre bio et vos stats dans « Modifier le profil ».'
      );
      return;
    }
    const html = buildPlayerCvHtmlFromUser(profile);
    openPlayerCvHtml(html, profile.display_name);
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
      Alert.alert('Relance', n > 0 ? `${n} joueur(s) relancé(s).` : 'Aucune réponse en attente.');
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

  const metaParts: string[] = [ROLE_LABELS[profile.role]];
  if (profile.city) metaParts.push(profile.city);
  if (p.position) metaParts.push(p.position);
  if (p.level) metaParts.push(p.level);

  const pulse = computeProdayPulse(profile);
  const pulseBreakdown = getPulseBreakdown(profile);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.hero}>
        <ProfileAvatarButton
          displayName={profile.display_name}
          avatarUrl={profile.avatar_url}
          uploading={uploadingAvatar}
          onPress={handleAvatarPick}
        />
        <Text style={styles.name}>{profile.display_name}</Text>
        <Text style={styles.meta}>{metaParts.join(' · ')}</Text>
        <Text style={styles.email}>{profile.email}</Text>
        <View style={styles.badgeWrap}>
          <VerificationBadge user={profile} />
        </View>
      </View>

      <ProfilePulseCard pulse={pulse} breakdown={pulseBreakdown} />

      {__DEV__ ? <FirebaseStatusCard profileLoaded={Boolean(profile.uid)} /> : null}

      <ProfileCompletionBar user={profile} />

      <View style={styles.spaceRow}>
        <Text style={styles.spaceLabel}>Espace ProDay</Text>
        <View style={styles.spacePills}>
          {APP_SPACE_IDS.map((space) => (
            <AppSpacePill
              key={space}
              space={space}
              active={appSpace === space}
              onPress={() => void setAppSpace(space)}
            />
          ))}
        </View>
        <Text style={styles.spaceHint}>
          Mode {APP_SPACE_LABELS[appSpace]} — Mercato et annonces filtrés.
        </Text>
      </View>

      {playerNeedsVerify && playerVerifyProgress && (
        <View style={[styles.card, styles.warnCard]}>
          <Text style={styles.warnTitle}>Vérification joueur ({playerVerifyProgress.label})</Text>
          <Text style={styles.warnSub}>
            Pièce d’identité obligatoire pour la messagerie. Licence club pour le badge complet.
          </Text>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => setShowPlayerVerification(true)}
          >
            <Text style={styles.secondaryBtnText}>Compléter mes vérifications</Text>
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

      {profile.role === 'player' && hasStats && stats && (
        <View style={styles.statsRow}>
          <StatChip value={String(stats.matches)} label="Matchs" />
          <StatChip value={String(stats.goals)} label="Buts" />
          <StatChip value={String(stats.assists)} label="Passes d." />
        </View>
      )}

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.actionPrimary} onPress={() => setShowEdit(true)}>
          <Icon name="person" size={18} color={colors.brandInverse} />
          <Text style={styles.actionPrimaryText}>Modifier le profil</Text>
        </TouchableOpacity>
        {profile.role === 'player' ? (
          <TouchableOpacity
            style={styles.actionOutline}
            onPress={() => setShowPublicProfile(true)}
          >
            <Icon name="eye" size={18} color={colors.accent} />
            <Text style={styles.actionOutlineText}>Voir mon profil public</Text>
          </TouchableOpacity>
        ) : null}
        {profile.role === 'player' ? (
          <TouchableOpacity style={styles.actionOutline} onPress={handleExportCv}>
            <Icon name="document" size={18} color={colors.accent} />
            <Text style={styles.actionOutlineText}>CV vivant (PDF)</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {(p.bio || profile.role === 'player') && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Présentation</Text>
          <Text style={styles.bioText}>
            {p.bio?.trim() ||
              'Ajoutez une bio pour vous présenter aux clubs et coachs.'}
          </Text>
        </View>
      )}

      {profile.role === 'player' && (
        <>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Fiche joueur</Text>
            <InfoLine label="Poste" value={p.position} />
            <InfoLine label="Niveau" value={p.level} />
            <InfoLine label="Catégorie" value={p.category} />
            <InfoLine label="Pied fort" value={p.strong_foot ? FOOT_LABELS[p.strong_foot] : undefined} />
            <InfoLine label="Âge" value={p.age ? `${p.age} ans` : undefined} />
            <InfoLine label="Taille" value={p.height_cm ? `${p.height_cm} cm` : undefined} />
            <InfoLine label="Poids" value={p.weight_kg ? `${p.weight_kg} kg` : undefined} />
            <InfoLine label="Expérience" value={p.years_experience ? `${p.years_experience} ans` : undefined} />
            <InfoLine
              label="Disponibilité"
              value={
                p.availability === 'available'
                  ? 'Disponible'
                  : p.availability === 'negotiating'
                    ? 'En discussion'
                    : p.availability === 'unavailable'
                      ? 'Indisponible'
                      : undefined
              }
            />
          </View>

          <View style={styles.card}>
            <ProfileGalleryEditor
              urls={gallery}
              uploading={uploadingGallery}
              onAdd={handleGalleryAdd}
              onRemove={handleGalleryRemove}
            />
          </View>

          <View style={styles.card}>
            <Text style={styles.cardTitle}>Vidéos highlights</Text>
            {videos.length > 0 ? (
              videos.map((url) => (
                <TouchableOpacity
                  key={url}
                  style={styles.videoRow}
                  onPress={() => Linking.openURL(url).catch(() => {})}
                >
                  <Icon name="time" size={18} color={colors.accent} />
                  <Text style={styles.videoLink} numberOfLines={1}>
                    {url}
                  </Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.bioText}>
                Ajoutez des liens YouTube / Vimeo dans « Modifier le profil ».
              </Text>
            )}
          </View>

          {(p.achievements?.length ?? 0) > 0 && (
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Palmarès</Text>
              {p.achievements!.map((a) => (
                <Text key={a} style={styles.achievement}>
                  · {a}
                </Text>
              ))}
            </View>
          )}
        </>
      )}

      {(profile.role === 'coach' || profile.role === 'agent') && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Parcours pro</Text>
          <InfoLine label="Titre" value={p.job_title} />
          <InfoLine label="Diplôme" value={p.diploma} />
          <InfoLine label="N° licence" value={p.license_number} />
          {p.specialties?.length ? (
            <Text style={styles.specialties}>
              Spécialités : {p.specialties.join(' · ')}
            </Text>
          ) : null}
        </View>
      )}

      {pendingVerify && (
        <View style={[styles.card, styles.warnCard]}>
          <Text style={styles.warnTitle}>Vérification requise</Text>
          <Text style={styles.warnSub}>
            Envoyez votre diplôme ou licence pour débloquer la messagerie complète.
          </Text>
          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={handlePickDocument}
            disabled={docLoading}
          >
            <Text style={styles.secondaryBtnText}>
              {docLoading ? 'Envoi…' : 'Choisir un document (PDF / image)'}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowVerificationFlow(true)}>
            <Text style={styles.link}>Suivi de vérification</Text>
          </TouchableOpacity>
        </View>
      )}

      {profile.profile.club_id ? (
        <>
          <TouchableOpacity
            style={styles.candidaturesCard}
            onPress={() => setShowAnnouncements(true)}
            activeOpacity={0.88}
          >
            <View style={styles.candidaturesIcon}>
              <Icon name="notifications" size={22} color={colors.accent} />
            </View>
            <View style={styles.candidaturesBody}>
              <Text style={styles.candidaturesTitle}>Annonces club</Text>
              <Text style={styles.candidaturesSub}>Fil d&apos;actualités de votre structure</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.candidaturesCard}
            onPress={() => setShowPayments(true)}
            activeOpacity={0.88}
          >
            <View style={styles.candidaturesIcon}>
              <Icon name="calendar" size={22} color={colors.accent} />
            </View>
            <View style={styles.candidaturesBody}>
              <Text style={styles.candidaturesTitle}>Mes cotisations</Text>
              <Text style={styles.candidaturesSub}>Statut des paiements club</Text>
            </View>
            <Icon name="chevron-forward" size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </>
      ) : null}

      {profile.role === 'player' && (
        <TouchableOpacity
          style={styles.candidaturesCard}
          onPress={() => setShowApplications(true)}
          activeOpacity={0.88}
        >
          <View style={styles.candidaturesIcon}>
            <Icon name="briefcase" size={22} color={colors.accent} />
          </View>
          <View style={styles.candidaturesBody}>
            <Text style={styles.candidaturesTitle}>Mes candidatures</Text>
            <Text style={styles.candidaturesSub}>Suivi des annonces Mercato</Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.textMuted} />
        </TouchableOpacity>
      )}

      {(canManageClub || verifiedStaff) && (
      <View style={[styles.card, styles.menuCard]}>
        {canManageClub && !profile.profile.club_id && (
          <>
            <ProfileMenuRow
              icon="business"
              title="Créer mon club"
              subtitle="Lier votre structure"
              onPress={() => setShowCreateClub(true)}
            />
            <ProfileMenuRow
              icon="people"
              title="Rejoindre un club"
              subtitle="Accéder aux convocations et cotisations"
              onPress={() => setShowJoinClub(true)}
            />
          </>
        )}
        {profile.profile.club_id && (
          <ProfileMenuRow
            icon="business"
            title="Club lié"
            subtitle={`ID ${profile.profile.club_id.slice(0, 10)}…`}
            onPress={() => setShowCreateClub(true)}
          />
        )}
        {!profile.profile.club_id && profile.role === 'player' && (
          <ProfileMenuRow
            icon="people"
            title="Rejoindre mon club"
            subtitle="Convocations et calendrier équipe"
            onPress={() => setShowJoinClub(true)}
          />
        )}
        {verifiedStaff && (
          <ProfileMenuRow
            icon="shield"
            title="Diplôme vérifié"
            subtitle="Badge actif sur votre profil"
            onPress={() => setShowVerificationSuccess(true)}
          />
        )}
      </View>
      )}

      {isPlayerMinor && (
        <TouchableOpacity
          style={styles.parentalCard}
          onPress={() => setShowParental(true)}
          activeOpacity={0.88}
        >
          <View style={styles.parentalIcon}>
            <Icon name="shield" size={24} color={colors.brandInverse} />
          </View>
          <View style={styles.parentalBody}>
            <Text style={styles.parentalTitle}>Contrôle parental</Text>
            <Text style={styles.parentalSub}>
              Compte mineur — supervision et contacts autorisés
            </Text>
          </View>
          <Icon name="chevron-forward" size={20} color={colors.heroMuted} />
        </TouchableOpacity>
      )}

      <View style={[styles.card, styles.menuCard]}>
        <ProfileMenuRow
          icon="document"
          title="Conditions d’utilisation"
          subtitle="CGU ProDay"
          onPress={() => setLegalDocument('terms')}
        />
        <ProfileMenuRow
          icon="lock"
          title="Confidentialité"
          subtitle="Données personnelles et droits RGPD"
          onPress={() => setLegalDocument('privacy')}
        />
      </View>

      <TouchableOpacity
        style={styles.logoutBtn}
        onPress={() => {
          Alert.alert('Déconnexion', 'Voulez-vous quitter votre session ?', [
            { text: 'Annuler', style: 'cancel' },
            { text: 'Déconnexion', style: 'destructive', onPress: () => void onSignOut() },
          ]);
        }}
        activeOpacity={0.85}
      >
        <Text style={styles.logoutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const StatChip: React.FC<{ value: string; label: string }> = ({ value, label }) => (
  <View style={styles.statChip}>
    <Text style={styles.statValue}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
  </View>
);

const InfoLine: React.FC<{ label: string; value?: string }> = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: {
    padding: spacing.lg,
    paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
  },
  hero: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingTop: spacing.md,
  },
  name: {
    fontSize: 24,
    fontWeight: '900',
    color: colors.text,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  meta: {
    fontSize: 13,
    color: colors.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },
  email: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  badgeWrap: { marginTop: spacing.sm },
  spaceRow: { marginBottom: spacing.lg },
  spaceLabel: { fontSize: 12, fontWeight: '800', color: colors.textMuted, marginBottom: spacing.sm },
  spacePills: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  spaceHint: { fontSize: 11, color: colors.textSecondary, marginTop: spacing.sm },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statChip: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  statValue: { fontSize: 22, fontWeight: '900', color: colors.text },
  statLabel: { fontSize: 10, color: colors.textMuted, fontWeight: '700', marginTop: 4 },
  actionRow: { gap: spacing.sm, marginBottom: spacing.lg },
  actionPrimary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  actionPrimaryText: { color: colors.brandInverse, fontWeight: '900', fontSize: 15 },
  actionOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionOutlineText: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.md,
  },
  cardTitle: { fontSize: 14, fontWeight: '900', color: colors.accent, marginBottom: spacing.sm },
  bioText: { fontSize: 14, color: colors.textSecondary, lineHeight: 21 },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: { fontSize: 13, color: colors.textMuted, fontWeight: '600' },
  infoValue: { fontSize: 13, fontWeight: '800', color: colors.text },
  specialties: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm, lineHeight: 18 },
  videoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  videoLink: { flex: 1, fontSize: 12, color: colors.accent, fontWeight: '600' },
  achievement: { fontSize: 13, color: colors.textSecondary, lineHeight: 20, marginTop: 4 },
  warnCard: { backgroundColor: colors.warningBg },
  warnTitle: { fontWeight: '900', fontSize: 15, color: colors.text },
  warnSub: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: spacing.md, lineHeight: 18 },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  secondaryBtnText: { fontWeight: '800', color: colors.text },
  link: {
    color: colors.accent,
    fontWeight: '800',
    textAlign: 'center',
    textDecorationLine: 'underline',
  },
  menuCard: { paddingVertical: spacing.xs },
  candidaturesCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  candidaturesIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  candidaturesBody: { flex: 1 },
  candidaturesTitle: { fontSize: 16, fontWeight: '900', color: colors.text },
  candidaturesSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  parentalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.brand,
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
  parentalTitle: { fontSize: 16, fontWeight: '900', color: colors.brandInverse },
  parentalSub: {
    fontSize: 12,
    color: colors.heroMuted,
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
    borderColor: colors.border,
    backgroundColor: 'transparent',
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: colors.textMuted },
});
