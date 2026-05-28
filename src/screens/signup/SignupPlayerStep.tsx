import React, { useMemo, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { defaultCategoriesForAppSpace } from '../../constants/appSpaces';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getPlayerStepSubtitle, suggestAppSpaceFromAge } from './signupFlowConfig';
import { isUnderU13AppSpace } from '../../models/AppSpace';
import { APP_SPACE_LABELS } from '../../models/AppSpace';
import { PLAYER_LEVELS, PLAYER_POSITIONS } from '../../constants/playerProfile';
import { colors, spacing, radius } from '../../theme/designTokens';

interface SignupPlayerStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
  onSubmit: () => void;
}

export const SignupPlayerStep: React.FC<SignupPlayerStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
  onSubmit,
}) => {
  const underU13 = isUnderU13AppSpace(form.appSpace);
  const categoryOptions = useMemo(
    () => [...defaultCategoriesForAppSpace(form.appSpace)],
    [form.appSpace]
  );

  const suggestedSpace = useMemo(() => {
    const parsed = parseInt(form.age.replace(/\D/g, ''), 10);
    if (!Number.isFinite(parsed) || parsed < 5) return null;
    return suggestAppSpaceFromAge(parsed);
  }, [form.age]);

  useEffect(() => {
    if (form.category && !categoryOptions.includes(form.category)) {
      form.setCategory('');
    }
  }, [categoryOptions, form.category, form.setCategory]);

  const willNeedParental =
    form.isMinor || underU13;

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title="Profil sportif"
      subtitle={getPlayerStepSubtitle(form.appSpace)}
      onBack={onBack}
      footer={
        <SignupFooterButton
          label="Continuer"
          onPress={onSubmit}
          loading={form.loading}
        />
      }
    >
      {form.error ? <Text style={styles.error}>{form.error}</Text> : null}

      {form.ageSpaceMismatch && suggestedSpace ? (
        <View style={styles.mismatchBox}>
          <Text style={styles.mismatchText}>{form.ageSpaceMismatch}</Text>
          <TouchableOpacity
            style={styles.mismatchBtn}
            onPress={() => form.setAppSpace(suggestedSpace)}
          >
            <Text style={styles.mismatchBtnText}>
              Passer à {APP_SPACE_LABELS[suggestedSpace]}
            </Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <SignupOptionPicker
        label="Poste *"
        options={PLAYER_POSITIONS}
        value={form.position}
        onChange={form.setPosition}
        error={form.fieldErrors.position}
      />
      <SignupOptionPicker
        label="Catégorie *"
        options={categoryOptions}
        value={form.category}
        onChange={form.setCategory}
        error={form.fieldErrors.category}
      />
      <SignupOptionPicker
        label="Niveau *"
        options={PLAYER_LEVELS}
        value={form.level}
        onChange={form.setLevel}
        error={form.fieldErrors.level}
      />

      <AuthTextField
        label="Âge *"
        placeholder="Ex. 17"
        value={form.age}
        onChangeText={form.setAge}
        keyboardType="number-pad"
        error={form.fieldErrors.age}
      />
      {willNeedParental ? (
        <Text style={styles.minorHint}>
          {underU13
            ? 'Une étape « responsable légal » suivra avant la création du compte.'
            : 'Compte mineur — une étape de contrôle parental suivra.'}
        </Text>
      ) : null}

      <AuthTextField
        label="Ville *"
        icon="location"
        placeholder="Paris, Lyon…"
        value={form.city}
        onChangeText={form.setCity}
        error={form.fieldErrors.city}
      />
      <AuthTextField
        label="Département (optionnel)"
        placeholder="Ex. 75, 69…"
        value={form.department}
        onChangeText={form.setDepartment}
        keyboardType="number-pad"
      />

      <Text style={styles.statsLabel}>Stats saison (optionnel)</Text>
      <View style={styles.statRow}>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Matchs</Text>
          <TextInput
            style={styles.statInput}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            value={form.statMatches}
            onChangeText={form.setStatMatches}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Buts</Text>
          <TextInput
            style={styles.statInput}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            value={form.statGoals}
            onChangeText={form.setStatGoals}
            keyboardType="number-pad"
          />
        </View>
        <View style={styles.statCell}>
          <Text style={styles.statLabel}>Passes d.</Text>
          <TextInput
            style={styles.statInput}
            placeholder="0"
            placeholderTextColor={colors.textMuted}
            value={form.statAssists}
            onChangeText={form.setStatAssists}
            keyboardType="number-pad"
          />
        </View>
      </View>
    </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
  error: { color: colors.error, fontSize: 13, marginBottom: spacing.md, fontWeight: '600' },
  mismatchBox: {
    backgroundColor: colors.accentSoft,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  mismatchText: { fontSize: 13, color: colors.text, lineHeight: 19, fontWeight: '600' },
  mismatchBtn: {
    marginTop: spacing.sm,
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: colors.ink,
    borderRadius: radius.sm,
  },
  mismatchBtnText: { color: colors.brandInverse, fontSize: 12, fontWeight: '800' },
  minorHint: {
    fontSize: 12,
    color: colors.warning,
    fontWeight: '600',
    marginTop: -spacing.sm,
    marginBottom: spacing.md,
  },
  statsLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  statRow: { flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md },
  statCell: { flex: 1 },
  statLabel: { fontSize: 11, fontWeight: '700', color: colors.textMuted, marginBottom: 4 },
  statInput: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    fontSize: 16,
    textAlign: 'center',
  },
});
