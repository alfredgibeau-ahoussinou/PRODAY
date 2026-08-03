import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { Icon } from '../../components/ui/Icon';
import { PhysioScreenHeader } from '../../components/medical/PhysioScreenHeader';
import { ProfileMenuSection, type ProfileMenuItem } from '../../components/profile/ProfileMenuSection';
import { ProfileSubscriptionCard } from '../../components/profile/ProfileSubscriptionCard';
import { EditProfileScreen } from '../EditProfileScreen';
import { VerificationFlowScreen } from '../VerificationFlowScreen';
import { LegalDocumentScreen } from '../LegalDocumentScreen';
import { ReferralScreen } from '../ReferralScreen';
import { PhysioAvailabilityScreen } from './PhysioAvailabilityScreen';
import type { LegalDocumentId } from '../../content/legalDocuments';
import { isPhysioBookingEnabled } from '../../services/medicalAppointments.service';
import { pickProfileImage } from '../../utils/pickMedia';
import { profileService } from '../../services/profile.service';
import { TAB_BAR_CONTENT_INSET } from '../../components/navigation/BottomTabBar';
import { spacing, radius } from '../../theme/designTokens';
import { useSubscriptionOptional } from '../../context/SubscriptionContext';
import { useMedicalStyles } from '../../components/medical/medicalStyles';
import { PushScreenTransition } from '../../components/motion';
import type { AppColors } from '../../theme/universeTheme';

export const PhysioProfileTabScreen: React.FC = () => {
  const { colors: c, rootStyle } = useMedicalStyles();
  const styles = useMemo(() => createStyles(c), [c]);
  const { refreshProfile, signOut } = useAuth();
  const profile = useSessionProfile();
  const subscriptionCtx = useSubscriptionOptional();
  const [showEdit, setShowEdit] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [showAvailability, setShowAvailability] = useState(false);
  const [legalDocument, setLegalDocument] = useState<LegalDocumentId | null>(null);
  const [showReferral, setShowReferral] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  if (!profile) {
    return (
      <View style={[styles.root, rootStyle]}>
        <Text style={styles.guest}>Connectez-vous pour gérer votre cabinet.</Text>
      </View>
    );
  }

  const verified = profile.verification_status === 'VERIFIED';

  const p = profile.profile;
  const specialty = p.medical_specialty ?? p.job_title ?? 'Praticien';
  const bookingOnline = isPhysioBookingEnabled(profile);
  const pendingVerify = profile.verification_status === 'PENDING';

  const handleAvatarPick = async () => {
    const file = await pickProfileImage();
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await profileService.uploadAvatar(profile.uid, file);
      await refreshProfile();
      Alert.alert('Photo mise à jour', 'Votre photo de cabinet est en ligne.');
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Upload impossible.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = () => {
    Alert.alert('Déconnexion', 'Quitter votre session cabinet ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => void signOut() },
    ]);
  };

  const cabinetItems: ProfileMenuItem[] = [
    {
      title: 'Créneaux & RDV en ligne',
      subtitle: bookingOnline ? 'Réservations actives' : 'Configurer les horaires',
      icon: 'calendar',
      onPress: () => setShowAvailability(true),
    },
    {
      title: 'Informations cabinet',
      subtitle: 'Spécialité, ville, présentation',
      icon: 'settings',
      onPress: () => setShowEdit(true),
    },
    {
      title: verified ? 'Diplôme vérifié' : 'Vérifier mon diplôme',
      subtitle: verified
        ? 'Badge professionnel actif'
        : pendingVerify
          ? 'Validation en cours'
          : 'Obligatoire pour la messagerie',
      icon: verified ? 'checkmark-circle' : 'shield',
      onPress: () => setShowVerification(true),
    },
  ];

  const accountItems: ProfileMenuItem[] = [
    {
      title: 'Parrainage',
      subtitle: 'Invitez 2 amis, gagnez 1 mois Pro',
      icon: 'people',
      onPress: () => setShowReferral(true),
    },
    {
      title: 'Conditions générales',
      icon: 'document',
      onPress: () => setLegalDocument('terms'),
    },
    {
      title: 'Politique de confidentialité',
      icon: 'lock',
      onPress: () => setLegalDocument('privacy'),
    },
  ];

  return (
    <View style={[styles.root, rootStyle]}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <PhysioScreenHeader
          title="Mon cabinet"
          subtitle="Profil public, horaires et paramètres de votre espace praticien."
        />

        <View style={styles.identityCard}>
          <TouchableOpacity style={styles.avatarWrap} onPress={() => void handleAvatarPick()}>
            {uploadingAvatar ? (
              <ActivityIndicator color={c.accent} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarLetter}>
                  {profile.display_name.charAt(0).toUpperCase()}
                </Text>
              </View>
            )}
            <View style={styles.avatarEdit}>
              <Icon name="camera" size={12} color={c.brandInverse} />
            </View>
          </TouchableOpacity>

          <View style={styles.identityCopy}>
            <Text
              style={styles.name}
              numberOfLines={2}
              adjustsFontSizeToFit
              minimumFontScale={0.75}
            >
              {profile.display_name}
            </Text>
            <View style={styles.specialtyRow}>
              <Icon name="heart" size={14} color={c.accent} variant="filled" />
              <Text style={styles.specialty}>{specialty}</Text>
            </View>
            {profile.city ? (
              <Text style={styles.location}>
                {profile.city}
                {profile.department ? ` · ${profile.department}` : ''}
              </Text>
            ) : null}
            <View
              style={[
                styles.statusPill,
                bookingOnline ? styles.statusOn : styles.statusOff,
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  bookingOnline ? styles.statusTextOn : styles.statusTextOff,
                ]}
              >
                {bookingOnline ? 'RDV en ligne actifs' : 'RDV en ligne inactifs'}
              </Text>
            </View>
          </View>
        </View>

        {p.bio ? (
          <View style={styles.bioCard}>
            <Text style={styles.bioLabel}>Présentation</Text>
            <Text style={styles.bioText}>{p.bio}</Text>
          </View>
        ) : null}

        {subscriptionCtx ? (
          <ProfileSubscriptionCard
            profile={profile}
            tier={subscriptionCtx.subscription?.tier ?? 'free'}
            usage={subscriptionCtx.usage}
            onPress={() => subscriptionCtx.openPlansScreen()}
          />
        ) : null}

        <ProfileMenuSection title="Cabinet" items={cabinetItems} colors={c} />
        <ProfileMenuSection title="Compte" items={accountItems} colors={c} />

        <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.85}>
          <Text style={styles.logoutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      <PushScreenTransition
        active={showEdit || showVerification || legalDocument != null || showAvailability || showReferral}
      >
        {showEdit ? (
          <EditProfileScreen
            user={profile}
            onBack={() => setShowEdit(false)}
            onSaved={async () => {
              await refreshProfile();
              setShowEdit(false);
            }}
          />
        ) : showVerification ? (
          <VerificationFlowScreen
            user={profile}
            onBack={() => setShowVerification(false)}
            initialSuccess={verified}
          />
        ) : showReferral ? (
          <ReferralScreen onBack={() => setShowReferral(false)} />
        ) : legalDocument ? (
          <LegalDocumentScreen
            documentId={legalDocument}
            onBack={() => setLegalDocument(null)}
          />
        ) : showAvailability ? (
          <PhysioAvailabilityScreen
            profile={profile}
            onBack={() => setShowAvailability(false)}
          />
        ) : null}
      </PushScreenTransition>
    </View>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: {
      padding: spacing.lg,
      paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl,
    },
    guest: {
      textAlign: 'center',
      color: c.textMuted,
      padding: spacing.xl,
    },
    identityCard: {
      flexDirection: 'row',
      gap: spacing.md,
      backgroundColor: c.surface,
      borderRadius: radius.xl,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.lg,
    },
    avatarWrap: { position: 'relative' },
    avatar: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
    },
    avatarLetter: { fontSize: 28, fontWeight: '900', color: c.brandInverse },
    avatarEdit: {
      position: 'absolute',
      bottom: 0,
      right: 0,
      width: 24,
      height: 24,
      borderRadius: 12,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 2,
      borderColor: c.surface,
    },
    identityCopy: { flex: 1, flexShrink: 1, minWidth: 0, justifyContent: 'center' },
    name: { fontSize: 18, lineHeight: 22, fontWeight: '800', color: c.text, flexShrink: 1 },
    specialtyRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs,
    },
    specialty: { fontSize: 13, fontWeight: '800', color: c.accent },
    location: { fontSize: 12, color: c.textMuted, marginTop: 4, fontWeight: '600' },
    statusPill: {
      alignSelf: 'flex-start',
      marginTop: spacing.sm,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
    },
    statusOn: { backgroundColor: c.accent },
    statusOff: { backgroundColor: c.surfaceMuted },
    statusText: { fontSize: 10, fontWeight: '900', textTransform: 'uppercase' },
    statusTextOn: { color: c.brandInverse },
    statusTextOff: { color: c.textMuted },
    bioCard: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.lg,
    },
    bioLabel: {
      fontSize: 10,
      fontWeight: '900',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom: spacing.xs,
    },
    bioText: { fontSize: 14, color: c.textSecondary, lineHeight: 20 },
    logoutBtn: {
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: c.border,
      alignItems: 'center',
    },
    logoutText: { fontSize: 15, fontWeight: '800', color: c.error },
  });
}
