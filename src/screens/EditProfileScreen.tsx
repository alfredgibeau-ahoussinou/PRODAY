import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { PressableSpring } from '../components/motion';
import type { User } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { profileService } from '../services/profile.service';
import { ProfileCompletionBar } from '../components/ProfileCompletionBar';
import { SignupOptionPicker } from '../components/signup/SignupOptionPicker';
import {
  PLAYER_CATEGORIES,
  PLAYER_LEVELS,
} from '../constants/playerProfile';
import { parseAgeInput } from '../utils/minor';
import { mergePlayerParentalOnProfileEdit } from '../utils/minorProfileGuard';
import { isSponsorRole, SPONSOR_THEME } from '../content/sponsorExperience';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';
import { JoueurScreenChrome } from '../components/joueur/JoueurScreenChrome';
import { useJoueurSession } from '../context/JoueurSessionContext';
import { useJoueurTheme } from '../hooks/useJoueurTheme';
import { PLAYER_DARK } from '../theme/playerDarkPremium';
import { ProDayTabPager } from '../components/ui/ProDayTabPager';
import { ProDaySurface } from '../components/ui/ProDaySurface';
import { ProDayText } from '../components/ui/ProDayText';
import { ProfileAvatarButton } from '../components/profile/ProfileAvatarButton';
import { ProfileGalleryEditor } from '../components/profile/ProfileGalleryEditor';
import { ProfileVideoEditor } from '../components/profile/ProfileVideoEditor';
import { PlayerPositionPitchPicker } from '../components/profile/PlayerPositionPitchPicker';
import { pickGalleryImage, pickProfileImage } from '../utils/pickMedia';
import { pickReelVideo } from '../utils/pickReelVideo';

type FieldUi = {
  surface: string;
  surfaceMuted: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  accent: string;
  onAccent: string;
};

type PlayerTab = 'media' | 'identity' | 'sport' | 'presentation';
type StaffTab = 'identity' | 'career' | 'presentation';
type SponsorTab = 'identity' | 'brand' | 'presentation';

interface EditProfileScreenProps {
  user: User;
  onBack: () => void;
  onSaved: () => void | Promise<void>;
}

const AVAILABILITY_OPTIONS = [
  { value: 'available' as const, label: 'Disponible' },
  { value: 'negotiating' as const, label: 'En discussion' },
  { value: 'unavailable' as const, label: 'Indisponible' },
];

const FOOT_OPTIONS = [
  { value: 'right' as const, label: 'Droit' },
  { value: 'left' as const, label: 'Gauche' },
  { value: 'both' as const, label: 'Ambidextre' },
];

export const EditProfileScreen: React.FC<EditProfileScreenProps> = ({
  user,
  onBack,
  onSaved,
}) => {
  const p = user.profile;
  const [displayName, setDisplayName] = useState(user.display_name);
  const [email] = useState(user.email);
  const [phone, setPhone] = useState(user.phone ?? '');
  const [city, setCity] = useState(user.city ?? '');
  const [department, setDepartment] = useState(user.department ?? '');
  const [position, setPosition] = useState(p.position ?? '');
  const [category, setCategory] = useState(p.category ?? '');
  const [level, setLevel] = useState(p.level ?? '');
  const [strongFoot, setStrongFoot] = useState(p.strong_foot);
  const [age, setAge] = useState(p.age != null ? String(p.age) : '');
  const [heightCm, setHeightCm] = useState(p.height_cm != null ? String(p.height_cm) : '');
  const [weightKg, setWeightKg] = useState(p.weight_kg != null ? String(p.weight_kg) : '');
  const [yearsExp, setYearsExp] = useState(
    p.years_experience != null ? String(p.years_experience) : ''
  );
  const [availability, setAvailability] = useState(p.availability);
  const [statMatches, setStatMatches] = useState(String(p.season_stats?.matches ?? ''));
  const [statGoals, setStatGoals] = useState(String(p.season_stats?.goals ?? ''));
  const [statAssists, setStatAssists] = useState(String(p.season_stats?.assists ?? ''));
  const [bio, setBio] = useState(p.bio ?? '');
  const [achievementsText, setAchievementsText] = useState(
    (p.achievements ?? []).join('\n')
  );
  const [diploma, setDiploma] = useState(p.diploma ?? '');
  const [licenseNumber, setLicenseNumber] = useState(p.license_number ?? '');
  const [jobTitle, setJobTitle] = useState(p.job_title ?? '');
  const [specialtiesText, setSpecialtiesText] = useState(
    (p.specialties ?? []).join(', ')
  );
  const [galleryUrls, setGalleryUrls] = useState(p.gallery_urls ?? []);
  const [videoUrls, setVideoUrls] = useState(p.highlight_video_urls ?? []);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [playerTab, setPlayerTab] = useState<PlayerTab>('media');
  const [staffTab, setStaffTab] = useState<StaffTab>('identity');
  const [sponsorTab, setSponsorTab] = useState<SponsorTab>('identity');

  const isSponsor = isSponsorRole(user.role);
  const isPlayer = user.role === 'player';
  const isStaff =
    user.role === 'coach' || user.role === 'agent' || user.role === 'recruiter';
  const { colors: c, productLine, isWoman, rootStyle } = useThemedScreen();
  const joueurSession = useJoueurSession();
  const joueurTheme = useJoueurTheme();
  const joueurLive =
    isPlayer &&
    Boolean(joueurSession?.isJoueurPlayer && joueurSession.ready && !joueurSession.needsGate);
  const styles = useMemo(() => createStyles(c), [c]);
  

  useEffect(() => {
    setGalleryUrls(user.profile.gallery_urls ?? []);
    setVideoUrls(user.profile.highlight_video_urls ?? []);
  }, [user.profile.gallery_urls, user.profile.highlight_video_urls]);

  const ui: FieldUi = useMemo(
    () =>
      isSponsor
        ? {
            surface: SPONSOR_THEME.surface,
            surfaceMuted: SPONSOR_THEME.surfaceMuted,
            border: SPONSOR_THEME.borderSubtle,
            text: SPONSOR_THEME.text,
            textSecondary: SPONSOR_THEME.textSecondary,
            textMuted: SPONSOR_THEME.textMuted,
            accent: SPONSOR_THEME.primary,
            onAccent: SPONSOR_THEME.onPrimary,
          }
        : joueurLive && joueurSession
          ? {
              surface: PLAYER_DARK.surface,
              surfaceMuted: PLAYER_DARK.bgElevated,
              border: PLAYER_DARK.border,
              text: joueurSession.identity.ink,
              textSecondary: joueurSession.identity.inkMuted,
              textMuted: joueurSession.identity.inkMuted,
              accent: joueurTheme.accent,
              onAccent: PLAYER_DARK.bg,
            }
          : {
              surface: c.surface,
              surfaceMuted: c.surfaceMuted,
              border: c.border,
              text: c.text,
              textSecondary: c.textSecondary,
              textMuted: c.textMuted,
              accent: c.accent,
              onAccent: c.brandInverse,
            },
    [isSponsor, joueurLive, joueurSession, joueurTheme.accent, c]
  );

  const pagePad = styles.pagePad;

  const parseStat = (value: string) => {
    const n = parseInt(value.replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n >= 0 ? n : 0;
  };

  const parseOptionalInt = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return undefined;
    const n = parseInt(trimmed.replace(/\D/g, ''), 10);
    return Number.isFinite(n) && n > 0 ? n : undefined;
  };

  const parseLines = (text: string) =>
    text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);

  const parseCommaList = (text: string) =>
    text
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

  const handleAvatarPick = async () => {
    const file = await pickProfileImage();
    if (!file) return;
    setUploadingAvatar(true);
    try {
      await profileService.uploadAvatar(user.uid, file);
      await onSaved();
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
      const next = await profileService.addGalleryPhoto(user.uid, file);
      setGalleryUrls(next);
      await onSaved();
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
            const next = await profileService.removeGalleryPhoto(user.uid, url);
            setGalleryUrls(next);
            await onSaved();
          } catch (e) {
            Alert.alert('Erreur', e instanceof Error ? e.message : 'Suppression impossible.');
          }
        },
      },
    ]);
  };

  const handleVideoAdd = async () => {
    const file = await pickReelVideo();
    if (!file) return;
    setUploadingVideo(true);
    try {
      const next = await profileService.addHighlightVideo(user.uid, file);
      setVideoUrls(next);
      await onSaved();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Ajout impossible.');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleVideoRemove = (url: string) => {
    Alert.alert('Supprimer la vidéo', 'Retirer cette vidéo de votre profil ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: async () => {
          try {
            const next = await profileService.removeHighlightVideo(user.uid, url);
            setVideoUrls(next);
            await onSaved();
          } catch (e) {
            Alert.alert('Erreur', e instanceof Error ? e.message : 'Suppression impossible.');
          }
        },
      },
    ]);
  };

  const handleSave = async () => {
    if (!displayName.trim()) {
      Alert.alert('Champ requis', 'Indiquez un nom affiché.');
      return;
    }
    setSaving(true);
    try {
      const profileUpdate: Partial<User['profile']> = {
        bio: bio.trim() || undefined,
      };

      let parsedAge: number | null = null;

      if (user.role === 'player') {
        parsedAge = parseAgeInput(age);
        if (age.trim() && parsedAge == null) {
          Alert.alert('Âge invalide', 'Indiquez un âge entre 5 et 99 ans.');
          setSaving(false);
          return;
        }
        profileUpdate.position = position.trim() || undefined;
        profileUpdate.category = category.trim() || undefined;
        profileUpdate.level = level.trim() || undefined;
        profileUpdate.strong_foot = strongFoot;
        profileUpdate.age = parsedAge ?? undefined;
        profileUpdate.height_cm = parseOptionalInt(heightCm);
        profileUpdate.weight_kg = parseOptionalInt(weightKg);
        profileUpdate.years_experience = parseOptionalInt(yearsExp);
        profileUpdate.availability = availability;
        const achievements = parseLines(achievementsText);
        profileUpdate.achievements = achievements.length > 0 ? achievements : undefined;
      }

      if (isStaff) {
        profileUpdate.diploma = diploma.trim() || undefined;
        profileUpdate.license_number = licenseNumber.trim() || undefined;
        profileUpdate.job_title = jobTitle.trim() || undefined;
        const specs = parseCommaList(specialtiesText);
        profileUpdate.specialties = specs.length > 0 ? specs : undefined;
      }

      if (user.role === 'sponsor') {
        profileUpdate.job_title = jobTitle.trim() || undefined;
      }

      const updatePayload: Parameters<typeof profileService.updateProfile>[1] = {
        display_name: displayName.trim(),
        city: city.trim(),
        phone: phone.trim(),
        department: department.trim() || undefined,
        profile: profileUpdate,
      };

      if (user.role === 'player') {
        updatePayload.parental_settings = mergePlayerParentalOnProfileEdit(user, parsedAge);
      }

      await profileService.updateProfile(user.uid, updatePayload);
      Alert.alert('Profil mis à jour', 'Vos informations ont été enregistrées.');
      await onSaved();
      onBack();
    } catch (e) {
      Alert.alert('Erreur', e instanceof Error ? e.message : 'Enregistrement impossible.');
    } finally {
      setSaving(false);
    }
  };

  const identityFields = (
    <>
      <SectionTitle ui={ui} label="Coordonnées" />
      <Field styles={styles} label="Nom affiché *" value={displayName} onChangeText={setDisplayName} ui={ui} />
      <Field styles={styles} label="Email" value={email} editable={false} muted ui={ui} />
      <Field styles={styles} label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" ui={ui} />
      <Field styles={styles} label="Ville" value={city} onChangeText={setCity} ui={ui} />
      <Field styles={styles} label="Département" value={department} onChangeText={setDepartment} ui={ui} />
    </>
  );

  const presentationFields = (
    <Field
      styles={styles}
      label="Bio"
      value={bio}
      onChangeText={setBio}
      multiline
      placeholder={
        isSponsor
          ? 'Présentez votre marque en quelques lignes…'
          : 'Présentez-vous en quelques lignes…'
      }
      ui={ui}
    />
  );

  const avatarBlock = !isSponsor ? (
    <ProDaySurface variant="module" style={styles.mediaCard}>
      <ProDayText variant="section" style={styles.mediaTitle}>
        Photo de profil
      </ProDayText>
      <ProDayText variant="caption" muted style={styles.mediaHint}>
        Visible sur votre vitrine et dans les recherches.
      </ProDayText>
      <View style={styles.avatarRow}>
        <ProfileAvatarButton
          displayName={displayName}
          avatarUrl={user.avatar_url}
          uploading={uploadingAvatar}
          onPress={handleAvatarPick}
          size={96}
        />
        <PressableSpring onPress={handleAvatarPick} disabled={uploadingAvatar} scaleTo={0.97}>
          <ProDayText variant="body" accent>
            {user.avatar_url ? 'Changer la photo' : 'Ajouter une photo'}
          </ProDayText>
        </PressableSpring>
      </View>
    </ProDaySurface>
  ) : null;

  const playerSportFields = (
    <>
      <SectionTitle
        ui={ui}
        label={isWoman ? 'Profil joueuse' : 'Profil joueur'}
      />
      <PlayerPositionPitchPicker
        value={position}
        onChange={(next) => setPosition(next)}
        label="Poste principal"
        hint="Sélectionnez la zone où vous jouez le plus souvent."
      />
      <SignupOptionPicker
        label="Catégorie"
        options={PLAYER_CATEGORIES}
        value={category}
        onChange={setCategory}
      />
      <SignupOptionPicker
        label="Niveau"
        options={PLAYER_LEVELS}
        value={level}
        onChange={setLevel}
      />
      <Text style={[styles.fieldLabel, { color: ui.textSecondary }]}>Pied fort</Text>
      <View style={styles.chipRow}>
        {FOOT_OPTIONS.map((opt) => (
          <PressableSpring
            key={opt.value}
            style={[styles.chip, strongFoot === opt.value && styles.chipActive]}
            onPress={() => setStrongFoot(opt.value)}
          >
            <Text style={[styles.chipText, strongFoot === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </PressableSpring>
        ))}
      </View>
      <View style={styles.row2}>
        <View style={styles.half}>
          <Field styles={styles} label="Âge" value={age} onChangeText={setAge} keyboardType="number-pad" ui={ui} />
        </View>
        <View style={styles.half}>
          <Field styles={styles} label="Exp. (ans)" value={yearsExp} onChangeText={setYearsExp} keyboardType="number-pad" ui={ui} />
        </View>
      </View>
      <View style={styles.row2}>
        <View style={styles.half}>
          <Field styles={styles} label="Taille (cm)" value={heightCm} onChangeText={setHeightCm} keyboardType="number-pad" ui={ui} />
        </View>
        <View style={styles.half}>
          <Field styles={styles} label="Poids (kg)" value={weightKg} onChangeText={setWeightKg} keyboardType="number-pad" ui={ui} />
        </View>
      </View>
      <Text style={[styles.fieldLabel, { color: ui.textSecondary }]}>Disponibilité</Text>
      <View style={styles.chipRow}>
        {AVAILABILITY_OPTIONS.map((opt) => (
          <PressableSpring
            key={opt.value}
            style={[styles.chip, availability === opt.value && styles.chipActive]}
            onPress={() => setAvailability(opt.value)}
          >
            <Text style={[styles.chipText, availability === opt.value && styles.chipTextActive]}>
              {opt.label}
            </Text>
          </PressableSpring>
        ))}
      </View>
      <Text style={[styles.fieldLabel, { color: ui.textSecondary }]}>Stats saison</Text>
      <Text style={[styles.statsReadOnlyHint, { color: ui.textMuted }]}>
        Mises à jour par votre coach après chaque match validé. Non modifiables ici.
      </Text>
      <View style={styles.statRow}>
        <Field styles={styles} label="Matchs" value={statMatches} onChangeText={() => {}} keyboardType="number-pad" compact ui={ui} editable={false} />
        <Field styles={styles} label="Buts" value={statGoals} onChangeText={() => {}} keyboardType="number-pad" compact ui={ui} editable={false} />
        <Field styles={styles} label="Passes d." value={statAssists} onChangeText={() => {}} keyboardType="number-pad" compact ui={ui} editable={false} />
      </View>
      <Field
        styles={styles}
        label="Palmarès (une ligne par distinction)"
        value={achievementsText}
        onChangeText={setAchievementsText}
        multiline
        ui={ui}
      />
    </>
  );

  const staffCareerFields = (
    <>
      <SectionTitle ui={ui} label="Parcours professionnel" />
      <Field styles={styles} label="Titre / fonction" value={jobTitle} onChangeText={setJobTitle} ui={ui} />
      <Field styles={styles} label="Diplôme" value={diploma} onChangeText={setDiploma} placeholder="BEF, UEFA B…" ui={ui} />
      <Field styles={styles} label="N° licence" value={licenseNumber} onChangeText={setLicenseNumber} ui={ui} />
      <Field
        styles={styles}
        label="Spécialités (séparées par des virgules)"
        value={specialtiesText}
        onChangeText={setSpecialtiesText}
        placeholder="Gardien, U17, Préparation physique"
        ui={ui}
      />
    </>
  );

  const sponsorBrandFields = (
    <>
      <SectionTitle ui={ui} label="Marque" />
      <Field
        styles={styles}
        label="Nom de la marque / entreprise *"
        value={jobTitle}
        onChangeText={setJobTitle}
        ui={ui}
      />
    </>
  );

  const scrollProps = { keyboardShouldPersistTaps: 'handled' as const, showsVerticalScrollIndicator: false };

  const playerPages = [
    {
      id: 'media' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
          {avatarBlock}
          <ProDaySurface variant="module" style={styles.mediaCard}>
            <ProfileGalleryEditor
              urls={galleryUrls}
              productLine={productLine}
              uploading={uploadingGallery}
              onAdd={handleGalleryAdd}
              onRemove={handleGalleryRemove}
            />
            <ProfileVideoEditor
              urls={videoUrls}
              uploading={uploadingVideo}
              onAdd={handleVideoAdd}
              onRemove={handleVideoRemove}
            />
          </ProDaySurface>
        </ScrollView>
      ),
    },
    {
      id: 'identity' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
          {identityFields}
        </ScrollView>
      ),
    },
    {
      id: 'sport' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
          {playerSportFields}
        </ScrollView>
      ),
    },
    {
      id: 'presentation' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
          <SectionTitle ui={ui} label="Présentation" />
          {presentationFields}
        </ScrollView>
      ),
    },
  ];

  const staffPages = [
    {
      id: 'identity' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
          {avatarBlock}
          {identityFields}
        </ScrollView>
      ),
    },
    {
      id: 'career' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
          {staffCareerFields}
        </ScrollView>
      ),
    },
    {
      id: 'presentation' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
          <SectionTitle ui={ui} label="Présentation" />
          {presentationFields}
        </ScrollView>
      ),
    },
  ];

  const sponsorPages = [
    {
      id: 'identity' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
          {identityFields}
        </ScrollView>
      ),
    },
    {
      id: 'brand' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
          {sponsorBrandFields}
        </ScrollView>
      ),
    },
    {
      id: 'presentation' as const,
      render: () => (
        <ScrollView contentContainerStyle={pagePad} {...scrollProps}>
          <SectionTitle ui={ui} label="Présentation" />
          {presentationFields}
        </ScrollView>
      ),
    },
  ];

  const inner = (
    <>
      <ScreenHeader
        title={isSponsor ? 'Modifier la marque' : 'Modifier le profil'}
        onBack={onBack}
        centered
        sponsorDark={isSponsor}
      />
      {!isSponsor ? (
        <View style={styles.completionWrap}>
          <ProfileCompletionBar user={user} />
        </View>
      ) : null}

      <View style={styles.pager}>
        {isPlayer ? (
          <ProDayTabPager
            variant="pills"
            compact
            showFooter={false}
            chapters={[
              { id: 'media', label: 'Médias' },
              { id: 'identity', label: 'Identité' },
              { id: 'sport', label: 'Sport' },
              { id: 'presentation', label: 'Bio' },
            ]}
            pages={playerPages}
            activeChapter={playerTab}
            onChapterChange={setPlayerTab}
          />
        ) : isStaff ? (
          <ProDayTabPager
            variant="pills"
            compact
            showFooter={false}
            chapters={[
              { id: 'identity', label: 'Identité' },
              { id: 'career', label: 'Parcours' },
              { id: 'presentation', label: 'Bio' },
            ]}
            pages={staffPages}
            activeChapter={staffTab}
            onChapterChange={setStaffTab}
          />
        ) : (
          <ProDayTabPager
            variant="pills"
            compact
            showFooter={false}
            chapters={[
              { id: 'identity', label: 'Identité' },
              { id: 'brand', label: 'Marque' },
              { id: 'presentation', label: 'Bio' },
            ]}
            pages={sponsorPages}
            activeChapter={sponsorTab}
            onChapterChange={setSponsorTab}
          />
        )}
      </View>

      <View style={[styles.footer, { borderTopColor: ui.border, backgroundColor: isSponsor ? SPONSOR_THEME.surface : joueurLive ? PLAYER_DARK.surface : c.surface }]}>
        <PressableSpring
          style={[
            styles.primary,
            isSponsor && {
              backgroundColor: ui.accent,
              borderColor: ui.accent,
            },
            joueurLive && { backgroundColor: ui.accent, borderColor: ui.accent },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[styles.primaryText, (isSponsor || joueurLive) && { color: ui.onAccent }]}>Enregistrer</Text>
          )}
        </PressableSpring>
      </View>
    </>
  );

  if (joueurLive && joueurSession) {
    return (
      <JoueurScreenChrome
        identity={joueurSession.identity}
        variant="minimal"
        title="Modifier le profil"
        subtitle="Médias, identité, sport, bio."
        hideHero
      >
        {inner}
      </JoueurScreenChrome>
    );
  }

  return (
    <View
      style={[
        styles.root,
        !isSponsor && rootStyle,
        isSponsor && { backgroundColor: SPONSOR_THEME.background },
      ]}
    >
      {inner}
    </View>
  );
};

const SectionTitle: React.FC<{ label: string; ui: FieldUi }> = ({ label, ui }) => (
  <Text style={[sectionTitleStyle, { color: ui.accent }]}>{label}</Text>
);

const sectionTitleStyle = {
  fontSize: 11,
  fontWeight: '800' as const,
  letterSpacing: 1,
  marginBottom: spacing.sm,
  marginTop: spacing.xs,
};

const Field: React.FC<{
  styles: ReturnType<typeof createStyles>;
  label: string;
  value: string;
  onChangeText?: (t: string) => void;
  placeholder?: string;
  multiline?: boolean;
  keyboardType?: 'default' | 'number-pad' | 'phone-pad';
  editable?: boolean;
  muted?: boolean;
  compact?: boolean;
  ui: FieldUi;
}> = ({
  styles,
  label,
  value,
  onChangeText,
  placeholder,
  multiline,
  keyboardType,
  editable = true,
  muted,
  compact,
  ui,
}) => (
  <View style={compact ? styles.fieldCompact : styles.field}>
    {!compact ? <Text style={[styles.fieldLabel, { color: ui.textSecondary }]}>{label}</Text> : null}
    <TextInput
      style={[
        styles.input,
        {
          backgroundColor: muted ? ui.surfaceMuted : ui.surface,
          borderColor: ui.border,
          color: muted ? ui.textMuted : ui.text,
        },
        multiline && styles.inputMulti,
        compact && styles.inputCompact,
      ]}
      placeholder={compact ? label : placeholder}
      placeholderTextColor={ui.textMuted}
      value={value}
      onChangeText={onChangeText}
      editable={editable}
      multiline={multiline}
      keyboardType={keyboardType}
    />
  </View>
);

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    completionWrap: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
    pager: { flex: 1 },
    pagePad: { padding: spacing.lg, paddingBottom: spacing.xxl },
    mediaCard: {
      padding: spacing.md,
      marginBottom: spacing.md,
      gap: spacing.sm,
    },
    mediaTitle: { marginBottom: 2 },
    mediaHint: { marginBottom: spacing.sm },
    avatarRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.lg,
    },
    field: { marginBottom: spacing.md },
    fieldCompact: { flex: 1, marginBottom: spacing.sm },
    fieldLabel: { fontSize: 12, fontWeight: '700', marginBottom: 4 },
    statsReadOnlyHint: { fontSize: 12, lineHeight: 18, marginBottom: spacing.sm },
    input: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
      fontSize: 15,
    },
    inputCompact: { textAlign: 'center' },
    inputMulti: { minHeight: 120, textAlignVertical: 'top' },
    statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
    row2: { flexDirection: 'row', gap: spacing.sm },
    half: { flex: 1 },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginBottom: spacing.md },
    chip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: { backgroundColor: c.accent, borderColor: c.accent },
    chipText: { fontSize: 12, fontWeight: '800', color: c.text },
    chipTextActive: { color: c.brandInverse },
    footer: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.lg,
      borderTopWidth: 1,
    },
    primary: {
      backgroundColor: c.accent,
      borderRadius: radius.md,
      padding: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.accent,
    },
    primaryText: { color: c.brandInverse, fontWeight: '900', fontSize: 16 },
  });
}
