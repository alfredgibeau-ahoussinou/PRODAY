import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import type { User } from '../models/User';
import { profileService } from '../services/profile.service';
import { PlayerCvLivePreview } from '../components/profile/PlayerCvLivePreview';
import { ScreenHeader } from '../components/ui/ScreenHeader';
import { Icon } from '../components/ui/Icon';
import { useAppTheme } from '../context/ProductLineContext';
import { getUniverseIdentity } from '../content/brandExperience';
import { TAB_BAR_CONTENT_INSET } from '../navigation/tabBarLayout';
import { spacing, radius } from '../theme/designTokens';

interface PlayerCvEditorScreenProps {
  profile: User;
  onBack: () => void;
  onSaved?: () => void;
}

export const PlayerCvEditorScreen: React.FC<PlayerCvEditorScreenProps> = ({
  profile,
  onBack,
  onSaved,
}) => {
  const { colors, productLine } = useAppTheme();
  const brand = getUniverseIdentity(productLine);
  const p = profile.profile;

  const [headline, setHeadline] = useState(p.cv_headline ?? '');
  const [bio, setBio] = useState(p.bio ?? '');
  const [objectives, setObjectives] = useState(p.cv_objectives ?? '');
  const [achievements, setAchievements] = useState<string[]>(p.achievements ?? []);
  const [newAchievement, setNewAchievement] = useState('');
  const [saving, setSaving] = useState(false);

  const previewUser: User = {
    ...profile,
    profile: {
      ...p,
      cv_headline: headline,
      bio,
      cv_objectives: objectives,
      achievements,
    },
  };

  const addAchievement = () => {
    const trimmed = newAchievement.trim();
    if (!trimmed) return;
    setAchievements((prev) => [...prev, trimmed]);
    setNewAchievement('');
  };

  const removeAchievement = (index: number) => {
    setAchievements((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await profileService.updateProfile(profile.uid, {
        profile: {
          cv_headline: headline.trim() || undefined,
          bio: bio.trim() || undefined,
          cv_objectives: objectives.trim() || undefined,
          achievements,
        },
      });
      onSaved?.();
      Alert.alert('CV enregistré', 'Votre CV en ligne est à jour.');
      onBack();
    } catch {
      Alert.alert('Erreur', 'Impossible d’enregistrer le CV. Réessayez.');
    } finally {
      setSaving(false);
    }
  }, [profile.uid, headline, bio, objectives, achievements, onBack, onSaved]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScreenHeader title={brand.cvLabel} onBack={onBack} centered />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: TAB_BAR_CONTENT_INSET + spacing.xl }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={[styles.lead, { color: colors.textSecondary }]}>
          Complétez votre CV directement ici. Visible sur votre profil et partageable sans PDF.
        </Text>

        <PlayerCvLivePreview user={previewUser} colors={colors} />

        <Field
          label="Accroche CV"
          value={headline}
          onChangeText={setHeadline}
          placeholder="Ex. Milieu créatif, vision de jeu et pressing"
          colors={colors}
        />
        <Field
          label="Présentation"
          value={bio}
          onChangeText={setBio}
          placeholder="Parcours, qualités, contexte sportif…"
          colors={colors}
          multiline
        />
        <Field
          label="Objectifs"
          value={objectives}
          onChangeText={setObjectives}
          placeholder="Ex. Viser un club R1, progresser en préparation physique…"
          colors={colors}
          multiline
        />

        <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>Palmarès & faits marquants</Text>
        {achievements.map((a, i) => (
          <View
            key={`${a}-${i}`}
            style={[styles.achievementRow, { borderColor: colors.border, backgroundColor: colors.surface }]}
          >
            <Text style={[styles.achievementText, { color: colors.text }]}>{a}</Text>
            <TouchableOpacity onPress={() => removeAchievement(i)} hitSlop={8}>
              <Icon name="close" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        ))}
        <View style={styles.addRow}>
          <TextInput
            style={[
              styles.input,
              styles.addInput,
              { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
            ]}
            value={newAchievement}
            onChangeText={setNewAchievement}
            placeholder="Ajouter une ligne…"
            placeholderTextColor={colors.textMuted}
            onSubmitEditing={addAchievement}
          />
          <TouchableOpacity
            style={[styles.addBtn, { backgroundColor: colors.accent }]}
            onPress={addAchievement}
          >
            <Icon name="add" size={20} color={colors.brandInverse} />
          </TouchableOpacity>
        </View>

        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Poste, catégorie et stats saison se modifient depuis « Modifier le profil ».
        </Text>

        <TouchableOpacity
          style={[styles.saveBtn, { backgroundColor: colors.accent }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.9}
        >
          {saving ? (
            <ActivityIndicator color={colors.brandInverse} />
          ) : (
            <>
              <Icon name="checkmark-circle" size={20} color={colors.brandInverse} />
              <Text style={[styles.saveText, { color: colors.brandInverse }]}>Enregistrer mon CV</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  colors: { text: string; textMuted: string; border: string; surface: string };
  multiline?: boolean;
}> = ({ label, value, onChangeText, placeholder, colors, multiline }) => (
  <View style={styles.fieldWrap}>
    <Text style={[styles.fieldLabel, { color: colors.textMuted }]}>{label}</Text>
    <TextInput
      style={[
        styles.input,
        multiline && styles.inputMulti,
        { color: colors.text, borderColor: colors.border, backgroundColor: colors.surface },
      ]}
      value={value}
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textMuted}
      multiline={multiline}
      textAlignVertical={multiline ? 'top' : 'center'}
    />
  </View>
);

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  lead: { fontSize: 14, lineHeight: 21, marginBottom: spacing.lg },
  fieldWrap: { marginTop: spacing.md },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    fontSize: 15,
  },
  inputMulti: { minHeight: 88, paddingTop: spacing.sm },
  achievementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.xs,
  },
  achievementText: { flex: 1, fontSize: 14, marginRight: spacing.sm },
  addRow: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
  addInput: { flex: 1 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: { fontSize: 12, lineHeight: 18, marginTop: spacing.lg },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    marginTop: spacing.lg,
  },
  saveText: { fontSize: 16, fontWeight: '800' },
});
