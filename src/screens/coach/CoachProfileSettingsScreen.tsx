import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Linking,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { PressableSpring } from '../../components/motion';
import { Icon, type IconName } from '../../components/ui/Icon';
import { useAuth } from '../../context/AuthContext';
import { useSessionProfile } from '../../hooks/useSessionProfile';
import { useAccountDeletion } from '../../hooks/useAccountDeletion';
import { useAppearance } from '../../context/AppearanceContext';
import { useTabNavigation } from '../../context/TabNavigationContext';
import { useSubscriptionOptional } from '../../context/SubscriptionContext';
import { useCoachShellNav } from '../../features/coach/shell/CoachShellNavContext';
import { hasActiveBetaSubscription } from '../../utils/betaSubscriptions';
import { isSubscriptionAccessActive } from '../../utils/subscriptionLogic';
import { CoachBackRow } from '../../components/coach/CoachScreenHeader';
import { CoachSquadImportPanel } from '../../components/coach/CoachSquadImportPanel';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';
import { CoachEmptyState } from '../../components/coach/coachPortalUi';
import { isDevCoachPreview } from '../../utils/devCoachPreview';
import { profileService } from '../../services/profile.service';
import { authService } from '../../services/auth.service';
import { pickProfileImage } from '../../utils/pickMedia';
import {
  isBiometricLoginEnabled,
  setBiometricLoginEnabled,
  clearAllSavedAuth,
} from '../../services/authCredentialVault.service';
import {
  isCalendarSyncEnabled,
  setCalendarSyncEnabled,
} from '../../services/v3Preferences.service';
import { LanguageSettingControl } from '../../components/settings/LanguageSettingControl';
import { useTranslation } from '../../context/LocaleContext';
import type { TranslateFn } from '../../i18n/types';
import { tCoachChrome } from '../../i18n/coachChromeLabels';
import { tr } from '../../i18n/translate';
import { ContactPrivacySettingsCard } from '../../components/profile/ContactPrivacySettingsCard';
import { prodayAlert } from '../../utils/prodayAlert';
import { prodayHaptics } from '../../utils/prodayHaptics';
import { proSemantic } from '../../theme/professionalDesign';
import { tabBarScrollInset } from '../../navigation/tabBarLayout';
import { classifyAccountType, ACCOUNT_TYPE_LABEL } from '../../domain/accountType';
import { LEGAL_DOCUMENTS, type LegalDocumentId } from '../../content/legal';
import { LegalDocumentScreen } from '../LegalDocumentScreen';
import { CoachAppearanceModal } from '../../components/coach/CoachAppearanceModal';
import {
  CoachInteractiveGuideModal,
  COACH_GUIDE_ELEMENTS,
  COACH_GUIDE_SEEN_STORAGE_KEY,
  type CoachGuideTabMode,
} from '../../components/coach/CoachInteractiveGuideModal';
import { coachTokensAsAppColors } from '../../features/coach/shell/coachTokensAsAppColors';
import {
  COACH_PROTO_DESKTOP,
  COACH_PROTO_RADII,
  COACH_PROTO_SPACING,
  coachProtoCategoryColor,
  resolveCoachProtoSurfaces,
} from '../../features/coach/theme/coachProtoTokens';
import { coachNotificationPrefsService } from '../../services/coachNotificationPrefs.service';
import {
  CoachBadge,
  CoachCard,
  CoachField,
  CoachListGroup,
  CoachListRow,
  CoachPageHeader,
  CoachPrimaryButton,
  CoachSectionTitle,
  CoachSegmented,
} from '../../features/coach/ui/coachCommonUi';

interface CoachSportMeta {
  experience: string;
  specialty: string;
  availability: string;
}

function buildDefaultSportMeta(t: TranslateFn): CoachSportMeta {
  return {
  experience: t('coach.espace.settings.8.ans'),
  specialty: t('coach.espace.settings.jeu.de.position.transition'),
  availability: t('coach.espace.settings.disponible.seances.matchs'),
};
}

const VISIBILITY_PREF_KEY = '@proday_coach_visibility';

type ProfileVisibilityOption = 'club' | 'staff' | 'public';

/**
 * WAVE 4 / P-017 — « Mon espace » (accountHub + profile / profileEdit / settings / privacy).
 *
 * Une seule page réelle : les vues proto sont des sections, pas des routes.
 * Guides = modal existante (GAP-GUIDES backlog — pas de pages guides inventées).
 * Desktop ≥ 850 : gutters proto + colonnes profil | services.
 */
export const CoachProfileSettingsScreen: React.FC = () => {
  const { signOut, refreshProfile } = useAuth();
  const profile = useSessionProfile();
  const { openAuth } = useTabNavigation();
  const shellNav = useCoachShellNav();
  const subscriptionCtx = useSubscriptionOptional();
  const { tokens, teamName } = useCoachTheme();
  const { confirmDeleteAccount, deleting } = useAccountDeletion();
  const {
    themeMode,
    setThemeMode,
    reduceMotion,
    setMotionMode,
    highContrast,
    setHighContrast,
  } = useAppearance();
  const preferReduceMotion = reduceMotion === 'reduce';
  const { t } = useTranslation();
  const DEFAULT_SPORT_META = useMemo(() => buildDefaultSportMeta(t), [t]);
  const coachPreview = isDevCoachPreview();

  const { width } = useWindowDimensions();
  const isDesktop = width >= 850;

  const appColors = useMemo(() => coachTokensAsAppColors(tokens), [tokens]);
  const catColor = useMemo(
    () => coachProtoCategoryColor('mon_espace', tokens.isLight),
    [tokens.isLight],
  );
  const surfaces = useMemo(
    () => resolveCoachProtoSurfaces(tokens.isLight, highContrast),
    [tokens.isLight, highContrast],
  );
  const switchTrackOff = surfaces.segmentedTrack;

  const [appearanceModalVisible, setAppearanceModalVisible] = useState(false);
  const [guideModalVisible, setGuideModalVisible] = useState(false);
  const [guideModalTab, setGuideModalTab] = useState<CoachGuideTabMode>('chapters');
  const [guideSeenCount, setGuideSeenCount] = useState(0);
  const [squadImportVisible, setSquadImportVisible] = useState(false);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [localAvatarUri, setLocalAvatarUri] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [bio, setBio] = useState(profile?.profile?.bio ?? '');
  const [diploma, setDiploma] = useState(profile?.profile?.diploma ?? '');
  const [experience, setExperience] = useState(DEFAULT_SPORT_META.experience);
  const [specialty, setSpecialty] = useState(DEFAULT_SPORT_META.specialty);
  const [availability, setAvailability] = useState(DEFAULT_SPORT_META.availability);

  const [eventReminders, setEventReminders] = useState(true);
  const [playerReplies, setPlayerReplies] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState<ProfileVisibilityOption>('club');

  const [signingOut, setSigningOut] = useState(false);
  const [resetSending, setResetSending] = useState(false);
  const [calendarSync, setCalendarSync] = useState(true);
  const [biometricOn, setBiometricOn] = useState(false);
  const [legalDoc, setLegalDoc] = useState<LegalDocumentId | null>(null);

  useEffect(() => {
    if (!profile?.uid) return;
    let cancelled = false;

    const storageKey = `@proday_coach_avatar_${profile.uid}`;
    void AsyncStorage.getItem(storageKey).then((saved) => {
      if (!cancelled && saved && !profile.avatar_url) {
        setLocalAvatarUri(saved);
      }
    });

    const sportMetaKey = `@proday_coach_sport_meta_${profile.uid}`;
    void AsyncStorage.getItem(sportMetaKey).then((raw) => {
      if (cancelled || !raw) return;
      try {
        const parsed = JSON.parse(raw) as Partial<CoachSportMeta>;
        if (parsed.experience) setExperience(parsed.experience);
        if (parsed.specialty) setSpecialty(parsed.specialty);
        if (parsed.availability) setAvailability(parsed.availability);
      } catch {
        // ignore
      }
    });

    void coachNotificationPrefsService.get(profile.uid).then((prefs) => {
      if (cancelled) return;
      setEventReminders(prefs.eventReminders);
      setPlayerReplies(prefs.playerReplies);
    });

    void AsyncStorage.getItem(`${VISIBILITY_PREF_KEY}_${profile.uid}`).then((raw) => {
      if (!cancelled && (raw === 'club' || raw === 'staff' || raw === 'public')) {
        setProfileVisibility(raw);
      }
    });

    void isCalendarSyncEnabled(profile.uid).then((v) => {
      if (!cancelled) setCalendarSync(v);
    });

    void isBiometricLoginEnabled().then((v) => {
      if (!cancelled) setBiometricOn(v);
    });

    return () => {
      cancelled = true;
    };
  }, [profile?.uid, profile?.avatar_url]);

  useEffect(() => {
    let cancelled = false;
    void AsyncStorage.getItem(COACH_GUIDE_SEEN_STORAGE_KEY)
      .then((raw) => {
        if (cancelled) return;
        if (!raw) {
          setGuideSeenCount(0);
          return;
        }
        try {
          const parsed = JSON.parse(raw) as Record<string, boolean>;
          const count = COACH_GUIDE_ELEMENTS.filter((el) => !!parsed?.[el.id]).length;
          setGuideSeenCount(count);
        } catch {
          setGuideSeenCount(0);
        }
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [guideModalVisible]);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setPhone(profile?.phone ?? '');
    setCity(profile?.city ?? '');
    setBio(profile?.profile?.bio ?? '');
    setDiploma(profile?.profile?.diploma ?? '');
  }, [
    profile?.display_name,
    profile?.phone,
    profile?.city,
    profile?.profile?.bio,
    profile?.profile?.diploma,
  ]);

  const accountType = useMemo(
    () => (profile ? classifyAccountType(profile).accountType : null),
    [profile],
  );

  const version = useMemo(
    () =>
      Constants.expoConfig?.version ??
      (Constants.manifest2 as { extra?: { expoClient?: { version?: string } } })?.extra
        ?.expoClient?.version ??
      '1.0.10',
    [],
  );

  const onPickAvatar = useCallback(async () => {
    if (!profile?.uid || uploadingAvatar) return;
    prodayHaptics.press();
    try {
      const file = await pickProfileImage();
      if (!file) return;
      if (file.uri) {
        setLocalAvatarUri(file.uri);
      }
      setUploadingAvatar(true);
      const storageKey = `@proday_coach_avatar_${profile.uid}`;
      try {
        const uploadedUrl = await profileService.uploadAvatar(profile.uid, file);
        if (uploadedUrl) {
          setLocalAvatarUri(uploadedUrl);
          await AsyncStorage.setItem(storageKey, uploadedUrl);
        }
      } catch (uploadErr) {
        console.warn('[CoachProfileSettings] Upload error, keeping local image:', uploadErr);
        if (file.uri) {
          setLocalAvatarUri(file.uri);
          await AsyncStorage.setItem(storageKey, file.uri);
        }
      }
      await refreshProfile();
      prodayHaptics.confirm();
      prodayAlert.alert(
        t('coach.espace.alert.photoUpdatedTitle'),
        t('coach.espace.alert.photoUpdatedBody'),
      );
    } catch {
      prodayAlert.alert(
        t('coach.espace.alert.photoFailTitle'),
        t('coach.espace.alert.photoFailBody'),
      );
    } finally {
      setUploadingAvatar(false);
    }
  }, [profile?.uid, refreshProfile, uploadingAvatar, t]);

  const onSaveProfile = useCallback(async () => {
    if (!profile?.uid || saving) return;
    const name = displayName.trim();
    if (!name) {
      prodayAlert.alert(
        t('coach.espace.alert.nameRequiredTitle'),
        t('coach.espace.alert.nameRequiredBody'),
      );
      return;
    }
    setSaving(true);
    try {
      const nextSportMeta: CoachSportMeta = {
        experience: experience.trim() || DEFAULT_SPORT_META.experience,
        specialty: specialty.trim() || DEFAULT_SPORT_META.specialty,
        availability: availability.trim() || DEFAULT_SPORT_META.availability,
      };
      setExperience(nextSportMeta.experience);
      setSpecialty(nextSportMeta.specialty);
      setAvailability(nextSportMeta.availability);
      await AsyncStorage.setItem(
        `@proday_coach_sport_meta_${profile.uid}`,
        JSON.stringify(nextSportMeta),
      );

      await profileService.updateProfile(profile.uid, {
        display_name: name,
        phone: phone.trim() || undefined,
        city: city.trim() || undefined,
        profile: {
          ...(profile.profile ?? {}),
          bio: bio.trim() || undefined,
          diploma: diploma.trim() || undefined,
        },
      });
      await refreshProfile();
      setEditing(false);
      prodayHaptics.confirm();
      prodayAlert.alert(
        t('coach.espace.alert.savedTitle'),
        t('coach.espace.alert.savedBody'),
      );
    } catch (e: unknown) {
      prodayAlert.alert(
        t('coach.espace.alert.saveFailTitle'),
        e instanceof Error ? e.message : t('coach.espace.alert.saveFailBody'),
      );
    } finally {
      setSaving(false);
    }
  }, [
    availability,
    bio,
    city,
    diploma,
    displayName,
    experience,
    phone,
    profile,
    refreshProfile,
    saving,
    specialty,
    t,
  ]);

  const onSendPasswordReset = useCallback(async () => {
    const email = profile?.email;
    if (!email) {
      prodayAlert.alert(t('common.info'), t('coach.espace.alert.noEmailBody'));
      return;
    }
    prodayAlert.alert(
      t('coach.espace.alert.resetTitle'),
      t('coach.espace.alert.resetBody', { email }),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.send'),
          onPress: async () => {
            setResetSending(true);
            try {
              await authService.sendPasswordReset(email);
              prodayAlert.alert(
                t('coach.espace.alert.emailSentTitle'),
                t('coach.espace.alert.emailSentBody'),
              );
            } catch (e: unknown) {
              prodayAlert.alert(
                t('coach.espace.alert.sendFailTitle'),
                e instanceof Error ? e.message : t('coach.espace.alert.sendFailBody'),
              );
            } finally {
              setResetSending(false);
            }
          },
        },
      ],
    );
  }, [profile?.email, t]);

  const onToggleBiometric = useCallback(async (value: boolean) => {
    prodayHaptics.press();
    try {
      await setBiometricLoginEnabled(value);
      setBiometricOn(value);
      if (!value) await clearAllSavedAuth();
    } catch {
      prodayAlert.alert(
        t('coach.espace.settings.reglages.de.securite'),
        t('coach.espace.settings.votre.appareil.ne.permet.pas.d'),
      );
    }
  }, []);

  const onToggleCalendar = useCallback(
    (value: boolean) => {
      if (!profile?.uid) return;
      prodayHaptics.press();
      setCalendarSync(value);
      void setCalendarSyncEnabled(profile.uid, value);
    },
    [profile?.uid],
  );

  const onToggleHighContrast = useCallback((value: boolean) => {
    prodayHaptics.press();
    void setHighContrast(value);
  }, [setHighContrast]);

  const onToggleReminders = useCallback(
    (value: boolean) => {
      if (!profile?.uid) return;
      prodayHaptics.press();
      setEventReminders(value);
      void coachNotificationPrefsService.setEventReminders(profile.uid, value);
    },
    [profile?.uid],
  );

  const onToggleReplies = useCallback(
    (value: boolean) => {
      if (!profile?.uid) return;
      prodayHaptics.press();
      setPlayerReplies(value);
      void coachNotificationPrefsService.setPlayerReplies(profile.uid, value);
    },
    [profile?.uid],
  );

  const onChangeVisibility = useCallback(
    (option: ProfileVisibilityOption) => {
      if (!profile?.uid) return;
      prodayHaptics.selection();
      setProfileVisibility(option);
      void AsyncStorage.setItem(`${VISIBILITY_PREF_KEY}_${profile.uid}`, option);
    },
    [profile?.uid],
  );

  const onOpenGuideModal = useCallback((tab: CoachGuideTabMode) => {
    prodayHaptics.press();
    setGuideModalTab(tab);
    setGuideModalVisible(true);
  }, []);

  const onExportDataJson = useCallback(async () => {
    if (!profile) return;
    prodayHaptics.press();
    const payload = {
      exportedAt: new Date().toISOString(),
      uid: profile.uid,
      displayName: profile.display_name || 'Coach',
      email: profile.email || '',
      phone: profile.phone || '',
      city: city || profile.city || '',
      club: teamName || profile.profile?.club_id || '',
      diploma: diploma || profile.profile?.diploma || '',
      bio: bio || profile.profile?.bio || '',
      parcoursSportif: {
        experience,
        specialty,
        availability,
      },
      preferences: {
        themeMode,
        reducedMotion: preferReduceMotion,
        highContrast,
        calendarSync,
        eventReminders,
        playerReplies,
        profileVisibility,
        biometricOn,
      },
      guidesProgress: {
        seenElements: guideSeenCount,
        totalElements: COACH_GUIDE_ELEMENTS.length,
      },
    };
    try {
      await Share.share({
        title: 'profil-coach-proday.json',
        message: JSON.stringify(payload, null, 2),
      });
    } catch {
      prodayAlert.alert(
        'Export JSON',
        t('coach.espace.settings.impossible.d.ouvrir.la.feuille.de'),
      );
    }
  }, [
    availability,
    bio,
    biometricOn,
    calendarSync,
    city,
    diploma,
    eventReminders,
    experience,
    guideSeenCount,
    highContrast,
    preferReduceMotion,
    playerReplies,
    profile,
    profileVisibility,
    specialty,
    teamName,
    themeMode,
  ]);

  const onSignOutPress = useCallback(async () => {
    prodayHaptics.warning();
    prodayAlert.alert(t('coach.espace.settings.se.deconnecter'), t('coach.espace.settings.vous.devrez.vous.identifier.a.nouveau'), [
      { text: 'Annuler', style: 'cancel' },
      {
        text: t('coach.espace.settings.se.deconnecter.2'),
        style: 'destructive',
        onPress: async () => {
          setSigningOut(true);
          try {
            await shellNav?.signOut?.();
            await signOut();
          } catch (e: unknown) {
            prodayAlert.alert(
              t('coach.espace.settings.deconnexion.impossible'),
              e instanceof Error ? e.message : t('coach.espace.settings.reessayez.dans.quelques.instants'),
            );
          } finally {
            setSigningOut(false);
          }
        },
      },
    ]);
  }, [shellNav, signOut]);

  if (!profile) {
    /**
     * Preview coach : Mon espace reste navigable (DEF-W7-005) — chrome + CTA auth
     * réelle, pas de spinner infini ni overlay Auth forcé par l’onglet profil.
     */
    if (coachPreview) {
      return (
        <View style={screenStyles.previewGuest} testID="coach-profile-settings-preview-guest">
          <CoachBackRow fallbackNavId="today" />
          <View style={screenStyles.previewGuestPad}>
            <CoachEmptyState
              title={tr(t, 'coach.espace.title', t('coach.desktop.mon.espace'))}
              body={tr(
                t,
                'coach.espace.previewGuestBody',
                'Connectez-vous pour gérer votre profil coach, préférences et compte.',
              )}
              cta={tr(t, 'common.guest.login', 'Se connecter')}
              onPress={() => openAuth('login')}
            />
          </View>
        </View>
      );
    }
    return (
      <View style={screenStyles.loading} testID="coach-profile-settings-loading">
        <ActivityIndicator size="large" color={catColor} />
      </View>
    );
  }

  if (legalDoc) {
    return <LegalDocumentScreen documentId={legalDoc} onBack={() => setLegalDoc(null)} />;
  }

  const initial = (profile.display_name || profile.email || 'C').charAt(0).toUpperCase();
  const themeLabel = tokens.isLight
    ? tCoachChrome(t, 'Clair')
    : tCoachChrome(t, 'Sombre');

  const roleBadgeLabel =
    accountType === 'COACH'
      ? t('coach.espace.settings.entraineur.certifie')
      : accountType
        ? ACCOUNT_TYPE_LABEL[accountType]
        : t('coach.espace.settings.staff.certifie');

  const clubDisplayName =
    teamName || (profile.profile?.club_id ? t('coach.espace.settings.club.affilie') : t('coach.espace.settings.aucun.club.relie'));

  const switchTrack = {
    false: switchTrackOff,
    true: catColor,
  };

  const profileBlock = (
    <>
      <CoachCard
        style={[screenStyles.profileCard, highContrast && screenStyles.highContrastBorder]}
      >
        <View testID="coach-profile-identity">
          <View style={screenStyles.profileHeaderRow}>
            <PressableSpring
              onPress={onPickAvatar}
              accessibilityRole="button"
              accessibilityLabel={t('coach.espace.settings.modifier.la.photo.de.profil')}
              testID="coach-profile-avatar"
              style={screenStyles.avatarWrap}
            >
              {localAvatarUri || profile.avatar_url ? (
                <Image
                  source={{ uri: localAvatarUri || profile.avatar_url }}
                  style={[screenStyles.avatar, { borderColor: catColor }]}
                />
              ) : (
                <View
                  style={[
                    screenStyles.avatarFallback,
                    {
                      backgroundColor: surfaces.inputBg,
                      borderColor: catColor,
                    },
                  ]}
                >
                  <Text style={[screenStyles.avatarInitial, { color: catColor }]}>{initial}</Text>
                </View>
              )}
              <View
                style={[
                  screenStyles.avatarBadge,
                  {
                    backgroundColor: surfaces.ink,
                    borderColor: surfaces.card,
                  },
                ]}
              >
                {uploadingAvatar ? (
                  <ActivityIndicator size="small" color={surfaces.card} />
                ) : (
                  <Ionicons name="camera" size={13} color={surfaces.card} />
                )}
              </View>
            </PressableSpring>

            <View style={screenStyles.identityCopy}>
              <View style={screenStyles.nameRow}>
                <Text style={[screenStyles.nameText, { color: surfaces.ink }]} numberOfLines={1}>
                  {profile.display_name || t('coach.espace.settings.marc.coach')}
                </Text>
                <Ionicons name="checkmark-circle" size={17} color={catColor} />
              </View>

              <View style={screenStyles.badgesRow}>
                <CoachBadge label={roleBadgeLabel} category="mon_espace" />
                {diploma ? <CoachBadge label={diploma} category="mon_espace" /> : null}
                {experience ? <CoachBadge label={experience} category="mon_espace" /> : null}
              </View>

              <View style={screenStyles.clubMetaRow}>
                <Ionicons name="shield-checkmark-outline" size={14} color={surfaces.sub} />
                <Text style={[screenStyles.clubMetaText, { color: surfaces.sub }]} numberOfLines={1}>
                  {diploma ? `${diploma} · ${clubDisplayName}` : clubDisplayName}
                </Text>
              </View>
            </View>
          </View>

          {profile.profile?.bio && !editing ? (
            <View
              style={[
                screenStyles.bioBox,
                {
                  backgroundColor: surfaces.inputBg,
                  borderColor: surfaces.divider,
                },
              ]}
            >
              <Text style={[screenStyles.bioText, { color: surfaces.ink }]} numberOfLines={3}>
                {profile?.profile?.bio}
              </Text>
            </View>
          ) : null}

          {!editing ? (
            <View testID="coach-profile-edit-open">
              <CoachPrimaryButton
                category="mon_espace"
                variant="pill"
                label={tr(t, 'coach.espace.editProfile', 'Modifier le profil complet')}
                onPress={() => setEditing(true)}
                style={{ marginTop: 14 }}
              />
            </View>
          ) : (
            <View style={screenStyles.editContainer}>
              <View style={[screenStyles.editDivider, { backgroundColor: surfaces.divider }]} />

              <Text style={[screenStyles.editHeading, { color: surfaces.ink }]}>
                Identité et coordonnées
              </Text>
              <CoachField
                label={t('coach.espace.settings.nom.affiche')}
                value={displayName}
                onChangeText={setDisplayName}
                placeholder={t('coach.espace.settings.votre.nom')}
                testID="coach-profile-name-input"
              />
              <CoachListRow
                title={t('coach.espace.settings.adresse.e.mail')}
                subtitle={profile.email || t('coach.espace.settings.non.renseignee')}
                leading={renderRowIcon('mail', catColor, surfaces.inputBg)}
              />
              <CoachField
                label={t('edit?.profile?.telephone')}
                value={phone}
                onChangeText={setPhone}
                placeholder="+33 6 …"
                keyboardType="phone-pad"
                testID="coach-profile-phone-input"
              />
              <CoachField
                label="Ville"
                value={city}
                onChangeText={setCity}
                placeholder="Ville"
                testID="coach-profile-city-input"
              />

              <View style={[screenStyles.editDivider, { backgroundColor: surfaces.divider }]} />

              <Text style={[screenStyles.editHeading, { color: surfaces.ink }]}>Parcours sportif</Text>
              <CoachField
                label={t('edit?.profile?.diplome')}
                value={diploma}
                onChangeText={setDiploma}
                placeholder="BEF, BMF, UEFA B, Licence FFF…"
                testID="coach-profile-diploma-input"
              />
              <CoachField
                label={t('coach.espace.settings.annees.d.experience')}
                value={experience}
                onChangeText={setExperience}
                placeholder="Ex. 8"
                testID="coach-profile-experience-input"
              />
              <CoachField
                label={t('coach.espace.settings.specialite')}
                value={specialty}
                onChangeText={setSpecialty}
                placeholder="Ex. Jeu de position & Transition"
                testID="coach-profile-specialty-input"
              />
              <CoachField
                label="Club"
                value={clubDisplayName}
                editable={false}
                placeholder="Club"
              />
              <CoachField
                label={t('coach.espace.settings.equipe')}
                value={teamName || '—'}
                editable={false}
                placeholder={t('coach.espace.settings.equipe')}
              />
              <CoachField
                label={t('coach.espace.settings.disponibilite')}
                value={availability}
                onChangeText={setAvailability}
                placeholder={t('coach.espace.settings.ex.disponible.seances.matchs')}
                testID="coach-profile-availability-input"
              />
              <CoachField
                label={t('edit?.profile?.presentation')}
                value={bio}
                onChangeText={setBio}
                placeholder={t('coach.espace.settings.parcours.de.coach.principes.de.jeu')}
                multiline
                style={{ minHeight: 90 }}
                testID="coach-profile-bio-input"
              />

              <View style={screenStyles.editActionsRow}>
                <PressableSpring
                  onPress={() => setEditing(false)}
                  accessibilityRole="button"
                  accessibilityLabel={t('coach.espace.settings.annuler.la.modification')}
                  style={[
                    screenStyles.editCancelBtn,
                    {
                      backgroundColor: surfaces.inputBg,
                      borderColor: surfaces.divider,
                    },
                  ]}
                >
                  <Text style={[screenStyles.editCancelBtnText, { color: surfaces.ink }]}>
                    Annuler
                  </Text>
                </PressableSpring>

                <View style={{ flex: 1 }} testID="coach-profile-save">
                  <CoachPrimaryButton
                    category="mon_espace"
                    label={saving ? 'Enregistrement…' : t('coach.espace.settings.enregistrer.mon.profil')}
                    disabled={saving}
                    onPress={onSaveProfile}
                    style={{ marginVertical: 0 }}
                  />
                </View>
              </View>
            </View>
          )}
        </View>
      </CoachCard>

      {!editing ? (
        <>
          <CoachSectionTitle
            title={tr(t, 'coach.espace.section.account', 'Compte & Parcours sportif')}
            category="mon_espace"
          />
          <CoachListGroup>
            <CoachListRow
              title="E-mail"
              subtitle={profile.email}
              leading={renderRowIcon('mail', catColor, surfaces.inputBg)}
            />
            <CoachListRow
              title={t('edit?.profile?.telephone')}
              subtitle={profile.phone || t('coach.espace.settings.non.renseigne')}
              leading={renderRowIcon('call', catColor, surfaces.inputBg)}
            />
            <CoachListRow
              title="Ville"
              subtitle={city || profile.city || t('coach.espace.settings.non.renseignee')}
              leading={renderRowIcon('location', catColor, surfaces.inputBg)}
            />
            <CoachListRow
              title={t('coach.espace.settings.diplome.officiel')}
              subtitle={profile.profile?.diploma || diploma || t('coach.espace.settings.non.renseigne')}
              leading={renderRowIcon('trophy-outline', catColor, surfaces.inputBg)}
            />
            <CoachListRow
              title={t('coach.espace.settings.club.affilie')}
              subtitle={clubDisplayName}
              leading={renderRowIcon('business', catColor, surfaces.inputBg)}
            />
            <CoachListRow
              title={t('coach.espace.settings.experience')}
              subtitle={experience || DEFAULT_SPORT_META.experience}
              leading={renderRowIcon('time', catColor, surfaces.inputBg)}
            />
            <CoachListRow
              title={t('coach.espace.settings.specialite')}
              subtitle={specialty || DEFAULT_SPORT_META.specialty}
              leading={renderRowIcon('football-outline', catColor, surfaces.inputBg)}
            />
            <CoachListRow
              title={t('coach.espace.settings.disponibilite')}
              subtitle={availability || DEFAULT_SPORT_META.availability}
              leading={renderRowIcon('checkmark-circle', catColor, surfaces.inputBg)}
            />
          </CoachListGroup>
        </>
      ) : null}

      {/* settings proto — Apparence / langue / notifications */}
      <CoachSectionTitle
        title={tr(t, 'coach.espace.section.preferences', 'Préférences')}
        category="mon_espace"
      />
      <Text style={[screenStyles.sectionCaption, { color: surfaces.sub }]}>
        {tr(t, 'coach.espace.caption.appearance', 'Apparence')}
      </Text>
      <CoachListGroup>
        <CoachListRow
          title={tr(t, 'coach.espace.row.reduceMotion', 'Réduire les animations')}
          subtitle={tr(
            t,
            'coach.espace.row.reduceMotionHint',
            'Fluidité optimisée et transition rapide',
          )}
          leading={renderRowIcon('flash', catColor, surfaces.inputBg)}
          trailing={
            <Switch
              value={preferReduceMotion}
              onValueChange={(v) => void setMotionMode(v ? 'reduce' : 'auto')}
              trackColor={switchTrack}
              thumbColor={Platform.OS === 'android' ? surfaces.card : undefined}
              testID="coach-settings-motion"
            />
          }
        />
        <CoachListRow
          title={tr(t, 'coach.espace.row.highContrast', 'Contraste renforcé')}
          subtitle={tr(
            t,
            'coach.espace.row.highContrastHint',
            'Lisibilité accrue des bordures et surfaces',
          )}
          leading={renderRowIcon('eye', catColor, surfaces.inputBg)}
          trailing={
            <Switch
              value={highContrast}
              onValueChange={onToggleHighContrast}
              trackColor={switchTrack}
              thumbColor={Platform.OS === 'android' ? surfaces.card : undefined}
            />
          }
        />
        <CoachListRow
          title={tCoachChrome(t, 'Apparence')}
          subtitle={`${themeLabel} · ${t('coach.chrome.appearance.oledOrLight')}`}
          leading={renderRowIcon('tune', catColor, surfaces.inputBg)}
          onPress={() => setAppearanceModalVisible(true)}
          trailing={
            <View style={screenStyles.rowEndChevron}>
              <CoachBadge label={themeLabel} category="mon_espace" />
              <Ionicons name="chevron-forward" size={17} color={surfaces.sub} />
            </View>
          }
        />
      </CoachListGroup>

      <CoachCard style={screenStyles.themeCard}>
        <Text style={[screenStyles.embeddedSectionTitle, { color: surfaces.ink }]}>
          {tCoachChrome(t, t('coach.espace.settings.theme'))}
        </Text>
        <CoachSegmented
          category="mon_espace"
          options={[
            { key: 'light', label: tCoachChrome(t, 'Clair') },
            { key: 'dark', label: tCoachChrome(t, 'Sombre') },
          ]}
          value={tokens.isLight ? 'light' : 'dark'}
          onChange={(mode) => void setThemeMode(mode === 'dark' ? 'dark' : 'light')}
        />
        <View style={[screenStyles.languageBlock, { borderTopColor: surfaces.divider }]}>
          <Text style={[screenStyles.embeddedSectionTitle, { color: surfaces.ink }]}>
            {tCoachChrome(t, 'Langue')}
          </Text>
          <LanguageSettingControl variant="card" colors={appColors} />
        </View>
      </CoachCard>

      <Text style={[screenStyles.sectionCaption, { color: surfaces.sub }]}>
        {tr(t, 'coach.espace.caption.notifications', 'Notifications et outils')}
      </Text>
      <CoachListGroup>
        <CoachListRow
          title={tr(t, 'coach.espace.row.eventReminders', 'Rappels des événements')}
          subtitle={tr(
            t,
            'coach.espace.row.eventRemindersHint',
            'Séances, matchs et échéances à venir',
          )}
          leading={renderRowIcon('notifications', catColor, surfaces.inputBg)}
          trailing={
            <Switch
              value={eventReminders}
              onValueChange={onToggleReminders}
              trackColor={switchTrack}
              thumbColor={Platform.OS === 'android' ? surfaces.card : undefined}
            />
          }
        />
        <CoachListRow
          title={tr(t, 'coach.espace.row.playerReplies', 'Réponses des joueurs')}
          subtitle={tr(
            t,
            'coach.espace.row.playerRepliesHint',
            'Alertes en temps réel sur les confirmations RSVP',
          )}
          leading={renderRowIcon('people', catColor, surfaces.inputBg)}
          trailing={
            <Switch
              value={playerReplies}
              onValueChange={onToggleReplies}
              trackColor={switchTrack}
              thumbColor={Platform.OS === 'android' ? surfaces.card : undefined}
            />
          }
        />
        <CoachListRow
          title={tr(t, 'coach.espace.row.calendarSync', 'Synchroniser le calendrier')}
          subtitle={tr(
            t,
            'coach.espace.row.calendarSyncHint',
            'Séances et matchs dans votre agenda',
          )}
          leading={renderRowIcon('calendar', catColor, surfaces.inputBg)}
          trailing={
            <Switch
              value={calendarSync}
              onValueChange={onToggleCalendar}
              trackColor={switchTrack}
              thumbColor={Platform.OS === 'android' ? surfaces.card : undefined}
              testID="coach-settings-calendar"
            />
          }
        />
        <CoachListRow
          title={tr(t, 'coach.espace.row.systemPermissions', 'Autorisations système')}
          subtitle={tr(
            t,
            'coach.espace.row.systemPermissionsHint',
            'Gérer les notifications sur cet appareil',
          )}
          leading={renderRowIcon('settings', catColor, surfaces.inputBg)}
          onPress={() => {
            if (Platform.OS !== 'web') void Linking.openSettings().catch(() => undefined);
            else
              prodayAlert.alert(
                'Notifications',
                t('coach.espace.settings.gerez.les.autorisations.depuis.les.reglages'),
              );
          }}
          trailing={<Ionicons name="chevron-forward" size={17} color={surfaces.sub} />}
        />
      </CoachListGroup>
    </>
  );

  const servicesBlock = (
    <>
      {/* privacy proto */}
      <CoachSectionTitle
        title={tr(t, 'coach.espace.section.privacy', 'Confidentialité et sécurité')}
        category="mon_espace"
      />
      <CoachCard style={screenStyles.privacyCard}>
        <Text style={[screenStyles.embeddedSectionTitle, { color: surfaces.ink }]}>
          {tr(t, 'coach.espace.privacy.whoCanSee', 'Qui peut consulter mon profil ?')}
        </Text>
        <CoachSegmented
          category="mon_espace"
          options={[
            { key: 'club', label: tr(t, 'coach.espace.privacy.clubOnly', 'Club uniquement') },
            { key: 'staff', label: tr(t, 'coach.espace.privacy.staffOnly', 'Staff uniquement') },
            { key: 'public', label: tr(t, 'coach.espace.privacy.public', 'Public') },
          ]}
          value={profileVisibility}
          onChange={onChangeVisibility}
        />
        <View style={screenStyles.privacyControlBlock}>
          <ContactPrivacySettingsCard
            profile={profile}
            colors={appColors}
            onUpdated={() => void refreshProfile()}
          />
        </View>
      </CoachCard>

      <Text style={[screenStyles.sectionCaption, { color: surfaces.sub }]}>
        {tr(t, 'coach.espace.caption.access', 'Accès et coordonnées')}
      </Text>
      <CoachListGroup>
        <CoachListRow
          title={tr(t, 'coach.espace.row.biometric', 'Connexion biométrique')}
          subtitle={tr(t, 'coach.espace.row.biometricHint', 'Face ID / Empreinte digitale')}
          leading={renderRowIcon('lock', catColor, surfaces.inputBg)}
          trailing={
            <Switch
              value={biometricOn}
              onValueChange={onToggleBiometric}
              trackColor={switchTrack}
              thumbColor={Platform.OS === 'android' ? surfaces.card : undefined}
              testID="coach-settings-biometric"
            />
          }
        />
        <CoachListRow
          title={tr(t, 'coach.espace.row.changePassword', 'Changer le mot de passe')}
          subtitle={
            resetSending
              ? tr(t, 'coach.espace.row.changePasswordSending', 'Envoi en cours…')
              : tr(t, 'coach.espace.row.changePasswordHint', 'Envoyer un lien sécurisé par e-mail')
          }
          leading={renderRowIcon('shield', catColor, surfaces.inputBg)}
          onPress={onSendPasswordReset}
          trailing={<Ionicons name="chevron-forward" size={17} color={surfaces.sub} />}
        />
      </CoachListGroup>

      {/* Aide — modal guides existante (pas de route GAP-GUIDES) */}
      <CoachSectionTitle
        title={tr(t, 'coach.espace.section.help', 'Aide')}
        category="mon_espace"
      />
      <CoachListGroup>
        <View testID="coach-open-guide-elements">
          <CoachListRow
            title={tr(t, 'coach.espace.row.fullGuide', 'Guide complet')}
            subtitle={tr(t, 'coach.espace.row.fullGuideHint', 'Chaque élément de l’espace coach')}
            leading={renderRowIcon('help', catColor, surfaces.inputBg)}
            onPress={() => onOpenGuideModal('elements')}
            trailing={
              <View style={screenStyles.rowEndChevron}>
                <CoachBadge
                  label={t('coach.espace.guide.seen', {
                    seen: guideSeenCount,
                    total: COACH_GUIDE_ELEMENTS.length,
                  })}
                  category="mon_espace"
                />
                <Ionicons name="chevron-forward" size={17} color={surfaces.sub} />
              </View>
            }
          />
        </View>
        <View testID="coach-open-guide-chapters">
          <CoachListRow
            title={tr(t, 'coach.espace.row.guideManage', 'Gestion des guides')}
            subtitle={tr(t, 'coach.espace.row.guideManageHint', 'Progression et chapitres')}
            leading={renderRowIcon('bookmark-outline', catColor, surfaces.inputBg)}
            onPress={() => onOpenGuideModal('chapters')}
            trailing={
              <View style={screenStyles.rowEndChevron}>
                <CoachBadge
                  label={tr(t, 'coach.espace.guide.chapters', '6 chapitres')}
                  category="mon_espace"
                />
                <Ionicons name="chevron-forward" size={17} color={surfaces.sub} />
              </View>
            }
          />
        </View>
      </CoachListGroup>

      {/* accountHub services — destinations réelles */}
      <CoachSectionTitle
        title={tr(t, 'coach.espace.section.services', 'Services')}
        category="mon_espace"
      />
      <CoachListGroup>
        {subscriptionCtx ? (
          <View testID="coach-espace-subscription">
            <CoachListRow
              title={tr(t, 'coach.espace.row.subscription', 'Abonnement')}
              subtitle={
                profile && hasActiveBetaSubscription(profile)
                  ? tr(
                      t,
                      'coach.espace.row.subscriptionBeta',
                      'Abonnement actif bêta · dès inscription et validation du compte',
                    )
                  : profile && isSubscriptionAccessActive(profile)
                    ? tr(t, 'coach.espace.row.subscriptionPro', 'Formule Coach Pro active')
                    : tr(
                        t,
                        'coach.espace.row.subscriptionFree',
                        'Gratuit · débloquer Tactique IA & convocations',
                      )
              }
              leading={renderRowIcon('star', catColor, surfaces.inputBg)}
              onPress={() => subscriptionCtx.openPlansScreen()}
              trailing={
                <View style={screenStyles.rowEndChevron}>
                  <CoachBadge
                    label={
                      profile && hasActiveBetaSubscription(profile)
                        ? tr(t, 'coach.espace.badge.beta', 'BÊTA')
                        : profile && isSubscriptionAccessActive(profile)
                          ? tr(t, 'coach.espace.badge.pro', 'PRO')
                          : tr(t, 'coach.espace.badge.free', 'GRATUIT')
                    }
                    category="mon_espace"
                  />
                  <Ionicons name="chevron-forward" size={17} color={surfaces.sub} />
                </View>
              }
            />
          </View>
        ) : null}
        <CoachListRow
          title={tr(t, 'coach.espace.row.teamManage', t('coach.desktop.gestion.de.l.equipe'))}
          subtitle={tr(
            t,
            'coach.espace.row.teamManageHint',
            'Catégorie, licences et documents',
          )}
          leading={renderRowIcon('briefcase', catColor, surfaces.inputBg)}
          onPress={() => shellNav?.requestNav('gestion')}
          trailing={<Ionicons name="chevron-forward" size={17} color={surfaces.sub} />}
        />
        <CoachListRow
          title={tr(t, 'coach.squad.importer.des.effectifs', 'Centre d’importation Footclubs FFF')}
          subtitle={tr(
            t,
            'coach.espace.row.importSquadHint',
            'Licences, calendriers officiels, discipline et sync FFF',
          )}
          leading={renderRowIcon('cloud-upload', catColor, surfaces.inputBg)}
          onPress={() => setSquadImportVisible(true)}
          trailing={<Ionicons name="chevron-forward" size={17} color={surfaces.sub} />}
          testID="coach-settings-import-squad"
        />
        <CoachListRow
          title={tr(t, 'coach.espace.row.prodayAi', 'ProDay IA')}
          subtitle={tr(t, 'coach.espace.row.prodayAiHint', t('coach.desktop.assistant.du.coach'))}
          leading={renderRowIcon('sparkles', catColor, surfaces.inputBg)}
          onPress={() => shellNav?.requestNav('coach_ia')}
          trailing={<Ionicons name="chevron-forward" size={17} color={surfaces.sub} />}
        />
        <CoachListRow
          title={tr(t, 'coach.espace.row.messaging', t('coach.desktop.messagerie'))}
          subtitle={tr(t, 'coach.espace.row.messagingHint', 'Staff & parents')}
          leading={renderRowIcon('chatbubbles', catColor, surfaces.inputBg)}
          onPress={() => shellNav?.requestNav('com_staff')}
          trailing={<Ionicons name="chevron-forward" size={17} color={surfaces.sub} />}
        />
        <CoachListRow
          title={tr(t, 'coach.espace.row.carpool', t('coach.desktop.covoiturage'))}
          subtitle={tr(t, 'coach.espace.row.carpoolHint', 'Trajets & places disponibles')}
          leading={renderRowIcon('car', catColor, surfaces.inputBg)}
          onPress={() => shellNav?.requestNav('carpool')}
          trailing={<Ionicons name="chevron-forward" size={17} color={surfaces.sub} />}
        />
        <CoachListRow
          title={tr(t, 'coach.espace.row.rsvpHistory', t('coach.desktop.historique.des.relances'))}
          subtitle={tr(
            t,
            'coach.espace.row.rsvpHistoryHint',
            'Suivi des réponses RSVP et disponibilités',
          )}
          leading={renderRowIcon('notifications', catColor, surfaces.inputBg)}
          onPress={() => shellNav?.requestNav('rsvp_log')}
          trailing={<Ionicons name="chevron-forward" size={17} color={surfaces.sub} />}
        />
      </CoachListGroup>

      <CoachSectionTitle
        title={tr(t, 'coach.espace.section.about', 'À propos')}
        category="mon_espace"
      />
      <CoachListGroup>
        <CoachListRow
          title={LEGAL_DOCUMENTS.terms.title}
          leading={renderRowIcon('document-text', catColor, surfaces.inputBg)}
          onPress={() => setLegalDoc('terms')}
          trailing={<Ionicons name="chevron-forward" size={17} color={surfaces.sub} />}
        />
        <CoachListRow
          title={LEGAL_DOCUMENTS.privacy.title}
          leading={renderRowIcon('shield-outline', catColor, surfaces.inputBg)}
          onPress={() => setLegalDoc('privacy')}
          trailing={<Ionicons name="chevron-forward" size={17} color={surfaces.sub} />}
        />
        <CoachListRow
          title={tr(t, 'coach.espace.row.appVersion', "Version de l'application")}
          subtitle={`ProDay Coach v${version}`}
          leading={renderRowIcon('globe', catColor, surfaces.inputBg)}
          trailing={<CoachBadge label={`v${version}`} category="mon_espace" />}
        />
      </CoachListGroup>

      {/* privacy proto — Vos données */}
      <CoachSectionTitle
        title={tr(t, 'coach.espace.section.data', 'Vos données')}
        category="mon_espace"
      />
      <CoachListGroup>
        <View testID="coach-export-data-json">
          <CoachListRow
            title={tr(t, 'coach.espace.row.exportProfile', 'Exporter le profil')}
            subtitle={tr(
              t,
              'coach.espace.row.exportProfileHint',
              'Copie JSON de vos informations coach',
            )}
            leading={renderRowIcon('download', catColor, surfaces.inputBg)}
            onPress={onExportDataJson}
            trailing={
              <View style={screenStyles.rowEndChevron}>
                <CoachBadge label="JSON" category="mon_espace" />
                <Ionicons name="share-outline" size={17} color={surfaces.sub} />
              </View>
            }
          />
        </View>
      </CoachListGroup>

      <View style={screenStyles.logoutZone}>
        <CoachCard style={screenStyles.dangerCard}>
          <PressableSpring
            onPress={onSignOutPress}
            accessibilityRole="button"
            accessibilityLabel={t('coach.espace.settings.se.deconnecter.2')}
            testID="coach-signout"
            style={screenStyles.dangerRow}
          >
            <Ionicons name="log-out-outline" size={20} color={proSemantic.danger} />
            {signingOut ? (
              <ActivityIndicator size="small" color={proSemantic.danger} />
            ) : (
              <Text style={screenStyles.dangerText}>Se déconnecter</Text>
            )}
          </PressableSpring>
        </CoachCard>
        <Text style={[screenStyles.logoutCaption, { color: surfaces.sub }]}>
          Vous serez déconnecté de cet appareil après confirmation.
        </Text>

        <CoachCard style={screenStyles.dangerCard}>
          <PressableSpring
            onPress={confirmDeleteAccount}
            accessibilityRole="button"
            accessibilityLabel="Supprimer mon compte"
            testID="coach-delete-account"
            style={screenStyles.dangerRow}
          >
            <Ionicons name="trash-outline" size={20} color={proSemantic.danger} />
            {deleting ? (
              <ActivityIndicator size="small" color={proSemantic.danger} />
            ) : (
              <Text style={screenStyles.dangerText}>Supprimer mon compte</Text>
            )}
          </PressableSpring>
        </CoachCard>
        <Text style={[screenStyles.deleteHintText, { color: surfaces.sub }]}>
          La suppression de compte est irréversible et soumise à double confirmation. Vos
          statistiques et historiques restent archivés de façon anonymisée.
        </Text>
      </View>
    </>
  );

  return (
    <View style={screenStyles.root}>
      <CoachBackRow fallbackNavId="today" />

      <ScrollView
        style={screenStyles.scroll}
        contentContainerStyle={[
          screenStyles.content,
          isDesktop && screenStyles.contentDesktop,
        ]}
        showsVerticalScrollIndicator={false}
        testID="coach-profile-settings"
      >
        <View
          style={[
            screenStyles.innerContainer,
            isDesktop && screenStyles.innerContainerDesktop,
          ]}
        >
          <CoachPageHeader
            category="mon_espace"
            title={tr(t, 'coach.espace.title', t('coach.desktop.mon.espace'))}
            subtitle={t('coach.espace.settings.profil.preferences.et.services')}
          />

          {isDesktop ? (
            <View style={screenStyles.desktopColumns}>
              <View style={screenStyles.desktopCol}>{profileBlock}</View>
              <View style={screenStyles.desktopCol}>{servicesBlock}</View>
            </View>
          ) : (
            <>
              {profileBlock}
              {servicesBlock}
            </>
          )}
        </View>
      </ScrollView>

      <CoachAppearanceModal
        visible={appearanceModalVisible}
        onClose={() => setAppearanceModalVisible(false)}
        highContrast={highContrast}
        onToggleHighContrast={onToggleHighContrast}
      />

      <CoachInteractiveGuideModal
        visible={guideModalVisible}
        initialTab={guideModalTab}
        onClose={() => setGuideModalVisible(false)}
        onNavigate={(navId) => shellNav?.requestNav(navId)}
      />

      <CoachSquadImportPanel
        visible={squadImportVisible}
        onClose={() => setSquadImportVisible(false)}
        onImported={(summary) => {
          setSquadImportVisible(false);
          void refreshProfile();
          prodayAlert.alert(
            'Import terminé',
            `${summary.updated} joueur(s) mis à jour.\n${summary.pending} nouveau(x) en attente.`
          );
        }}
        tokens={tokens}
      />
    </View>
  );
};

function renderRowIcon(icon: IconName, accent: string, bg: string) {
  return (
    <View
      style={{
        width: 32,
        height: 32,
        borderRadius: COACH_PROTO_RADII.badge,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Icon name={icon} size={17} color={accent} />
    </View>
  );
}

const screenStyles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    paddingHorizontal: COACH_PROTO_SPACING.pageGutter,
    paddingTop: 12,
    paddingBottom: tabBarScrollInset({ extra: 36 }),
  },
  contentDesktop: {
    paddingHorizontal: COACH_PROTO_DESKTOP.shellPaddingX,
    paddingTop: COACH_PROTO_DESKTOP.shellPaddingTop,
    alignItems: 'center',
  },
  innerContainer: {
    width: '100%',
  },
  innerContainerDesktop: {
    maxWidth: Math.min(1100, COACH_PROTO_DESKTOP.contentMaxWidth),
  },
  desktopColumns: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: COACH_PROTO_DESKTOP.dashboardGap,
  },
  desktopCol: {
    flex: 1,
    minWidth: 0,
  },
  previewGuest: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  previewGuestPad: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: COACH_PROTO_SPACING.pageGutter,
    paddingBottom: 48,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  profileCard: {
    marginBottom: 10,
  },
  highContrastBorder: {
    borderWidth: 2,
    borderColor: '#000000',
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  avatarWrap: {
    width: 76,
    height: 76,
    position: 'relative',
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
  },
  avatarFallback: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 30,
    fontWeight: '800',
  },
  avatarBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  identityCopy: {
    flex: 1,
    minWidth: 0,
    gap: 5,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  clubMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
  },
  clubMetaText: {
    fontSize: 13,
    fontWeight: '500',
    flexShrink: 1,
  },
  bioBox: {
    marginTop: 14,
    padding: 12,
    borderRadius: COACH_PROTO_RADII.input,
    borderWidth: StyleSheet.hairlineWidth,
  },
  bioText: {
    fontSize: 13,
    lineHeight: 18,
  },

  editContainer: {
    marginTop: 10,
    gap: 6,
  },
  editDivider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 10,
  },
  editHeading: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  editActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  editCancelBtn: {
    flex: 1,
    minHeight: COACH_PROTO_SPACING.buttonMinHeight,
    borderRadius: COACH_PROTO_RADII.button,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  editCancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },

  sectionCaption: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 2,
    paddingHorizontal: 2,
  },
  themeCard: {
    marginTop: -2,
    marginBottom: 14,
  },
  privacyCard: {
    marginBottom: 12,
  },
  embeddedSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  languageBlock: {
    marginTop: 16,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  privacyControlBlock: {
    marginTop: 14,
  },
  rowEndChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  logoutZone: {
    marginTop: 14,
    gap: 10,
    marginBottom: 8,
  },
  logoutCaption: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: -4,
    marginBottom: 4,
  },
  dangerCard: {
    paddingVertical: 4,
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 48,
  },
  dangerText: {
    fontSize: 15,
    fontWeight: '700',
    color: proSemantic.danger,
  },
  deleteHintText: {
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    paddingHorizontal: 16,
    marginTop: 4,
  },
});
