import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
} from 'react-native';
import type { User } from '../models/User';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { profileService } from '../services/profile.service';
import { ProfileCompletionBar } from '../components/ProfileCompletionBar';
import { SignupOptionPicker } from '../components/signup/SignupOptionPicker';
import { DEFAULT_PARENTAL_SETTINGS } from '../models/ParentalSettings';
import {
  PLAYER_CATEGORIES,
  PLAYER_LEVELS,
  PLAYER_POSITIONS,
} from '../constants/playerProfile';
import { isMinorAge, parseAgeInput } from '../utils/minor';
import { isSponsorRole, SPONSOR_THEME } from '../content/sponsorExperience';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import type { AppColors } from '../theme/universeTheme';

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
  const [videoUrlsText, setVideoUrlsText] = useState(
    (p.highlight_video_urls ?? []).join('\n')
  );
  const [diploma, setDiploma] = useState(p.diploma ?? '');
  const [licenseNumber, setLicenseNumber] = useState(p.license_number ?? '');
  const [jobTitle, setJobTitle] = useState(p.job_title ?? '');
  const [specialtiesText, setSpecialtiesText] = useState(
    (p.specialties ?? []).join(', ')
  );
  const [saving, setSaving] = useState(false);
  const isSponsor = isSponsorRole(user.role);
  const { colors: c, productLine, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const isWoman = productLine === 'woman';

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
    [isSponsor, c]
  );

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
        profileUpdate.season_stats = {
          matches: parseStat(statMatches),
          goals: parseStat(statGoals),
          assists: parseStat(statAssists),
        };
        const achievements = parseLines(achievementsText);
        profileUpdate.achievements = achievements.length > 0 ? achievements : undefined;
        const videos = parseLines(videoUrlsText).filter((u) => u.startsWith('http'));
        profileUpdate.highlight_video_urls = videos.length > 0 ? videos : undefined;
      }

      if (user.role === 'coach' || user.role === 'agent' || user.role === 'recruiter') {
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
        const minor = parsedAge != null && isMinorAge(parsedAge);
        const base = user.parental_settings ?? DEFAULT_PARENTAL_SETTINGS;
        updatePayload.parental_settings = {
          ...base,
          is_minor: minor,
          ...(minor
            ? {
                supervision_enabled: base.supervision_enabled ?? true,
                contacts_filter_enabled: base.contacts_filter_enabled ?? true,
              }
            : {}),
        };
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

  return (
    <View
      style={[
        styles.root,
        !isSponsor && rootStyle,
        isSponsor && { backgroundColor: SPONSOR_THEME.background },
      ]}
    >
      <ScreenHeader
        title={isSponsor ? 'Modifier la marque' : 'Modifier le profil'}
        onBack={onBack}
        centered
        sponsorDark={isSponsor}
      />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!isSponsor ? <ProfileCompletionBar user={user} /> : null}

        <Text style={[styles.section, { color: ui.accent }]}>Identité</Text>
        <Field styles={styles} label="Nom affiché *" value={displayName} onChangeText={setDisplayName} ui={ui} />
        <Field styles={styles} label="Email" value={email} editable={false} muted ui={ui} />
        <Field styles={styles} label="Téléphone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" ui={ui} />
        <Field styles={styles} label="Ville" value={city} onChangeText={setCity} ui={ui} />
        <Field styles={styles} label="Département" value={department} onChangeText={setDepartment} ui={ui} />

        {isSponsor ? (
          <>
            <Text style={[styles.section, { color: ui.accent }]}>Marque</Text>
            <Field
              styles={styles}
              label="Nom de la marque / entreprise *"
              value={jobTitle}
              onChangeText={setJobTitle}
              ui={ui}
            />
          </>
        ) : null}

        {user.role === 'player' && (
          <>
            <Text style={[styles.section, { color: ui.accent }]}>
              {isWoman ? 'Joueuse' : 'Joueur'}
            </Text>
            <SignupOptionPicker
              label="Poste"
              options={PLAYER_POSITIONS}
              value={position}
              onChange={setPosition}
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
            <Text style={styles.fieldLabel}>Pied fort</Text>
            <View style={styles.chipRow}>
              {FOOT_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, strongFoot === opt.value && styles.chipActive]}
                  onPress={() => setStrongFoot(opt.value)}
                >
                  <Text style={[styles.chipText, strongFoot === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
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
            <Text style={styles.fieldLabel}>Disponibilité</Text>
            <View style={styles.chipRow}>
              {AVAILABILITY_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt.value}
                  style={[styles.chip, availability === opt.value && styles.chipActive]}
                  onPress={() => setAvailability(opt.value)}
                >
                  <Text style={[styles.chipText, availability === opt.value && styles.chipTextActive]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <Text style={styles.fieldLabel}>Stats saison</Text>
            <View style={styles.statRow}>
              <Field styles={styles} label="Matchs" value={statMatches} onChangeText={setStatMatches} keyboardType="number-pad" compact ui={ui} />
              <Field styles={styles} label="Buts" value={statGoals} onChangeText={setStatGoals} keyboardType="number-pad" compact ui={ui} />
              <Field styles={styles} label="Passes d." value={statAssists} onChangeText={setStatAssists} keyboardType="number-pad" compact ui={ui} />
            </View>
            <Field
              styles={styles}
              label="Vidéos (une URL par ligne)"
              value={videoUrlsText}
              onChangeText={setVideoUrlsText}
              multiline
              placeholder="https://youtube.com/…"
              ui={ui}
            />
            <Field
              styles={styles}
              label="Palmarès (une ligne par distinction)"
              value={achievementsText}
              onChangeText={setAchievementsText}
              multiline
              ui={ui}
            />
          </>
        )}

        {(user.role === 'coach' || user.role === 'agent' || user.role === 'recruiter') && (
          <>
            <Text style={[styles.section, { color: ui.accent }]}>Staff</Text>
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
        )}

        <Text style={[styles.section, { color: ui.accent }]}>Présentation</Text>
        <Field
          styles={styles}
          label="Bio"
          value={bio}
          onChangeText={setBio}
          multiline
          placeholder={isSponsor ? 'Présentez votre marque en quelques lignes…' : 'Présentez-vous en quelques lignes…'}
          ui={ui}
        />

        {!isSponsor ? (
          <Text style={[styles.hintPhoto, { color: ui.textMuted }]}>
            Photo et galerie : modifiez-les depuis l’onglet Profil (tap sur la photo ou galerie).
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.primary,
            isSponsor && {
              backgroundColor: ui.accent,
              borderColor: ui.accent,
            },
          ]}
          onPress={handleSave}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFF" />
          ) : (
            <Text style={[styles.primaryText, isSponsor && { color: ui.onAccent }]}>Enregistrer</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  section: {
    fontSize: 11,
    fontWeight: '800',
    color: c.accent,
    letterSpacing: 1,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  field: { marginBottom: spacing.md },
  fieldCompact: { flex: 1, marginBottom: spacing.sm },
  fieldLabel: { fontSize: 12, fontWeight: '700', color: c.textSecondary, marginBottom: 4 },
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
  inputMulti: { minHeight: 88, textAlignVertical: 'top' },
  inputMuted: { color: c.textMuted, backgroundColor: c.surfaceMuted },
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
  chipActive: { backgroundColor: c.ink, borderColor: c.accent },
  chipText: { fontSize: 12, fontWeight: '800', color: c.text },
  chipTextActive: { color: c.brandInverse },
  hintPhoto: {
    fontSize: 12,
    color: c.textMuted,
    lineHeight: 17,
    marginBottom: spacing.lg,
  },
  primary: {
    backgroundColor: c.ink,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.accent,
  },
  primaryText: { color: c.brandInverse, fontWeight: '900', fontSize: 16 },
  });
}
