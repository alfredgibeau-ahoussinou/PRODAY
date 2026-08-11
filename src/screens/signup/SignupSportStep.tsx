import React, { useMemo, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { defaultCategoriesForAppSpace } from '../../constants/appSpaces';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { SignupPressable } from '../../components/signup/SignupPressable';
import { BirthDateFields, birthPartsToIso } from '../../components/player/BirthDateFields';
import { JOUEUR_UNIVERSE_LABELS, isValidPlayerBirthDate } from '../../utils/joueurBirthAge';

import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { suggestAppSpaceFromAge } from './signupFlowConfig';
import { suggestFeminineAppSpaceFromAge } from '../../utils/signupAppSpace';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { useTranslation } from '../../context/LocaleContext';
import { APP_SPACE_LABELS } from '../../models/AppSpace';
import { isUnderU13AppSpace } from '../../models/AppSpace';
import { PLAYER_LEVELS, PLAYER_POSITIONS } from '../../constants/playerProfile';
import { spacing, radius } from '../../theme/designTokens';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

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
    () => [...defaultCategoriesForAppSpace(form.appSpace, form.productLine, form.gender)],
    [form.appSpace, form.productLine, form.gender]
  );

  const isFeminineSpace = form.gender === 'women';
  const suggestedSpace = useMemo(() => {
    if (form.parsedAge == null || form.parsedAge < 5) return null;
    return isFeminineSpace
      ? suggestFeminineAppSpaceFromAge(form.parsedAge)
      : suggestAppSpaceFromAge(form.parsedAge);
  }, [form.parsedAge, isFeminineSpace]);

  const universeHint = useMemo(() => {
    const iso = birthPartsToIso(form.birthDay, form.birthMonth, form.birthYear);
    const v = isValidPlayerBirthDate(iso);
    if (!v.ok) return null;
    return JOUEUR_UNIVERSE_LABELS[v.ageGroup];
  }, [form.birthDay, form.birthMonth, form.birthYear]);

  useEffect(() => {
    if (form.category && !categoryOptions.includes(form.category)) {
      form.setCategory('');
    }
  }, [categoryOptions, form.category, form.setCategory]);

  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const willNeedParental = form.isMinor || isUnderU13AppSpace(form.appSpace);
  const { t } = useTranslation();
  const meta = getPlayerStepMeta(form.productLine, 'sport', t);

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
        <SignupFooterButton label={t('signup.form.continue')} onPress={() => form.advanceFromCurrentPage()} />
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
                {t('signup.sport.switchSpace', { space: APP_SPACE_LABELS[suggestedSpace] })}
              </Text>
            </SignupPressable>
          </View>
        </View>
      ) : null}

      <View>
        <SignupOptionPicker
          label={t('signup.form.position')}
          options={PLAYER_POSITIONS}
          value={form.position}
          onChange={form.setPosition}
          error={form.fieldErrors.position}
        />
      </View>
      <View>
        <SignupOptionPicker
          label={t('signup.form.category')}
          options={categoryOptions}
          value={form.category}
          onChange={form.setCategory}
          error={form.fieldErrors.category}
        />
      </View>
      <View>
        <SignupOptionPicker
          label={t('signup.form.level')}
          options={PLAYER_LEVELS}
          value={form.level}
          onChange={form.setLevel}
          error={form.fieldErrors.level}
        />
      </View>
      <View>
        <BirthDateFields
          variant="light"
          day={form.birthDay}
          month={form.birthMonth}
          year={form.birthYear}
          onDay={form.setBirthDay}
          onMonth={form.setBirthMonth}
          onYear={form.setBirthYear}
          accent={c.accent}
          error={form.fieldErrors.age}
          hint="L’univers (-13 / ado / 18+) évolue automatiquement à chaque anniversaire."
        />
        {universeHint ? (
          <Text style={styles.minorHint}>
            {universeHint.title} · {universeHint.range}
          </Text>
        ) : null}
        {willNeedParental ? (
          <Text style={styles.minorHint}>Étape « Famille » prévue ensuite.</Text>
        ) : null}
      </View>
    </SignupStepLayout>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    mismatchBox: {
      backgroundColor: c.brandSoft,
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: c.warning,
    },
    mismatchText: { fontSize: 13, color: c.text, lineHeight: 19, fontWeight: '600' },
    mismatchBtn: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      backgroundColor: c.accent,
      borderRadius: radius.sm,
    },
    mismatchBtnText: { color: c.brandInverse, fontSize: 12, fontWeight: '800' },
    minorHint: {
      fontSize: 12,
      color: c.warning,
      fontWeight: '600',
      marginTop: -spacing.sm,
      marginBottom: spacing.sm,
    },
  });
}
