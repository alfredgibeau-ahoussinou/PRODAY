import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { defaultCategoriesForAppSpace } from '../../constants/appSpaces';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { SignupPressable } from '../../components/signup/SignupPressable';

import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { suggestAppSpaceFromAge } from './signupFlowConfig';
import { suggestFeminineAppSpaceFromAge } from './signupWomanConfig';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { APP_SPACE_LABELS } from '../../models/AppSpace';
import { isUnderU13AppSpace } from '../../models/AppSpace';
import { PLAYER_LEVELS, PLAYER_POSITIONS } from '../../constants/playerProfile';
import { colors, spacing, radius } from '../../theme/designTokens';

interface SignupSportStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
}

export const SignupSportStep: React.FC<SignupSportStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
}) => {
  const categoryOptions = useMemo(
    () => [...defaultCategoriesForAppSpace(form.appSpace, form.productLine)],
    [form.appSpace, form.productLine]
  );

  const suggestedSpace = useMemo(() => {
    const parsed = parseInt(form.age.replace(/\D/g, ''), 10);
    if (!Number.isFinite(parsed) || parsed < 5) return null;
    return form.isWomanProduct
      ? suggestFeminineAppSpaceFromAge(parsed)
      : suggestAppSpaceFromAge(parsed);
  }, [form.age, form.isWomanProduct]);

  useEffect(() => {
    if (form.category && !categoryOptions.includes(form.category)) {
      form.setCategory('');
    }
  }, [categoryOptions, form.category, form.setCategory]);

  const willNeedParental = form.isMinor || isUnderU13AppSpace(form.appSpace);
  const meta = getPlayerStepMeta(form.productLine, 'sport');

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title={meta.title}
      subtitle={meta.subtitle}
      contentKey="player-sport"
      heroIcon={meta.heroIcon}
      onBack={onBack}
      footer={
        <SignupFooterButton label="Continuer" onPress={() => form.advanceFromCurrentPage()} />
      }
    >
      {form.ageSpaceMismatch && suggestedSpace ? (
        <View>
          <View style={styles.mismatchBox}>
            <Text style={styles.mismatchText}>{form.ageSpaceMismatch}</Text>
            <SignupPressable
              style={styles.mismatchBtn}
              onPress={() => form.setAppSpace(suggestedSpace)}
              scaleTo={0.96}
            >
              <Text style={styles.mismatchBtnText}>
                Passer à {APP_SPACE_LABELS[suggestedSpace]}
              </Text>
            </SignupPressable>
          </View>
        </View>
      ) : null}

      <View>
        <SignupOptionPicker
          label="Poste *"
          options={PLAYER_POSITIONS}
          value={form.position}
          onChange={form.setPosition}
          error={form.fieldErrors.position}
        />
      </View>
      <View>
        <SignupOptionPicker
          label="Catégorie *"
          options={categoryOptions}
          value={form.category}
          onChange={form.setCategory}
          error={form.fieldErrors.category}
        />
      </View>
      <View>
        <SignupOptionPicker
          label="Niveau *"
          options={PLAYER_LEVELS}
          value={form.level}
          onChange={form.setLevel}
          error={form.fieldErrors.level}
        />
      </View>
      <View>
        <AuthTextField
          label="Âge *"
          placeholder="Ex. 17"
          value={form.age}
          onChangeText={form.setAge}
          keyboardType="number-pad"
          error={form.fieldErrors.age}
        />
        {willNeedParental ? (
          <Text style={styles.minorHint}>Étape « Famille » prévue ensuite.</Text>
        ) : null}
      </View>
    </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
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
    marginBottom: spacing.sm,
  },
});
