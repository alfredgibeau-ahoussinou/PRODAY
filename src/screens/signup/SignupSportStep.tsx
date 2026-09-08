import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { SignupPressable } from '../../components/signup/SignupPressable';
import { birthPartsToIso } from '../../components/player/BirthDateFields';
import { JOUEUR_UNIVERSE_LABELS, isValidPlayerBirthDate } from '../../utils/joueurBirthAge';

import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { suggestAppSpaceFromAge } from './signupFlowConfig';
import { suggestFeminineAppSpaceFromAge } from '../../utils/signupAppSpace';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { getStepMetaForRole } from './signupRoleExperience';
import { useTranslation } from '../../context/LocaleContext';
import { APP_SPACE_LABELS } from '../../models/AppSpace';
import { isUnderU13AppSpace } from '../../models/AppSpace';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { PLAYER_POSITIONS } from '../../constants/playerProfile';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDayErrorBanner } from '../../components/ui/ProDayErrorBanner';
import { SignupFffAffiliationCard } from '../../components/signup/SignupFffAffiliationCard';
import { SignupRecapCard } from '../../components/signup/SignupRecapCard';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { SignupVisualChrome } from './signupVisualSystem';

interface SignupSportStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
  onClose?: () => void;
}

export const SignupSportStep: React.FC<SignupSportStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
  onClose,
}) => {
  const isParent = form.role === 'parent';
  const affiliationRole = isParent ? 'parent' : 'player';
  const isFeminineSpace = form.gender === 'women';
  const suggestedSpace = useMemo(() => {
    if (form.parsedAge == null || form.parsedAge < 5) return null;
    return isFeminineSpace
      ? suggestFeminineAppSpaceFromAge(form.parsedAge)
      : suggestAppSpaceFromAge(form.parsedAge);
  }, [form.parsedAge, isFeminineSpace]);

  const universeHint = useMemo(() => {
    if (isParent) return null;
    const iso = birthPartsToIso(form.birthDay, form.birthMonth, form.birthYear);
    const v = isValidPlayerBirthDate(iso);
    if (!v.ok) return null;
    return JOUEUR_UNIVERSE_LABELS[v.ageGroup];
  }, [form.birthDay, form.birthMonth, form.birthYear, isParent]);

  const { t } = useTranslation();
  const { visual } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(visual), [visual]);
  const willNeedParental = !isParent && (form.isMinor || isUnderU13AppSpace(form.appSpace));
  const meta = isParent
    ? getStepMetaForRole('sport', 'parent', t)
    : getPlayerStepMeta(form.productLine, 'sport', t);

  const fffCategory = form.selectedFffCategory || form.category;
  const summaryReady = Boolean(
    form.selectedFffClub || (!form.hasClub && form.displayName.trim().length >= 2)
  );

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title={meta.title}
      subtitle={meta.subtitle}
      contentKey={`${affiliationRole}-sport`}
      heroIcon={meta.heroIcon}
      onBack={onBack}
      onClose={onClose}
      footer={
        <SignupFooterButton label={t('signup.form.continue')} onPress={() => form.advanceFromCurrentPage()} />
      }
    >
      {form.error ? (
        <View style={{ marginBottom: spacing.md }}>
          <ProDayErrorBanner message={form.error} onDismiss={() => form.setError(null)} />
        </View>
      ) : null}

      {form.ageSpaceMismatch && suggestedSpace && !isParent ? (
        <View>
          <View style={styles.mismatchBox}>
            <ProDayText style={styles.mismatchText}>{form.ageSpaceMismatch}</ProDayText>
            <SignupPressable
              style={styles.mismatchBtn}
              onPress={() => form.setAppSpace(suggestedSpace)}
              scaleTo={0.96}
            >
              <ProDayText style={styles.mismatchBtnText}>
                {t('signup.sport.switchSpace', { space: APP_SPACE_LABELS[suggestedSpace] })}
              </ProDayText>
            </SignupPressable>
          </View>
        </View>
      ) : null}

      <SignupFffAffiliationCard
        role={affiliationRole}
        hasClub={form.hasClub}
        onToggleHasClub={(has) => {
          form.setHasClub(has);
          if (!has) {
            form.setSelectedFffClub(null);
            form.setSelectedFffCategory('');
            form.setSelectedRosterMember(null);
          }
          form.setFieldErrors({});
        }}
        selectedClub={form.selectedFffClub}
        onSelectClub={form.setSelectedFffClub}
        selectedCategory={fffCategory}
        onSelectCategory={(cat) => {
          form.setSelectedFffCategory(cat);
          form.setCategory(cat);
          form.setLevel(cat);
        }}
        selectedRosterMember={form.selectedRosterMember}
        onSelectRosterMember={(member) => {
          form.setSelectedRosterMember(member);
          if (member?.displayName && !form.displayName) {
            form.setDisplayName(member.displayName);
          }
          if (member?.position && !form.position) {
            form.setPosition(member.position);
          }
          if (member?.category) {
            form.setSelectedFffCategory(member.category);
            form.setCategory(member.category);
            form.setLevel(member.category);
          }
        }}
        isCustomProfile={form.isCustomProfile}
        onToggleCustomProfile={form.setIsCustomProfile}
        identityDoc={form.identityDoc}
        onSetIdentityDoc={form.setIdentityDoc}
        defaultUserName={form.displayName}
        onChangeCustomName={form.setDisplayName}
        error={form.fieldErrors.club || form.fieldErrors.category || form.fieldErrors.displayName}
      />

      {!isParent && (form.selectedFffClub || !form.hasClub) ? (
        <View style={styles.positionBlock}>
          <SignupOptionPicker
            label="Poste (optionnel)"
            options={PLAYER_POSITIONS}
            value={form.position}
            onChange={form.setPosition}
          />
        </View>
      ) : null}

      {summaryReady ? (
        <SignupRecapCard
          club={form.selectedFffClub}
          category={fffCategory}
          displayName={form.displayName}
          withoutClub={!form.hasClub}
          warn={
            form.hasClub && !fffCategory
              ? 'Sélectionnez votre catégorie FFF ci-dessus.'
              : null
          }
          extraLines={
            universeHint
              ? [`Univers ProDay : ${universeHint.title} (${universeHint.range})`]
              : undefined
          }
          minorHint={
            willNeedParental
              ? 'Accord du responsable légal requis avant le lancement (-18 ans).'
              : null
          }
        />
      ) : null}
    </SignupStepLayout>
  );
};

function createStyles(v: SignupVisualChrome) {
  return StyleSheet.create({
    mismatchBox: {
      backgroundColor: v.accentSoft,
      borderRadius: 12,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: v.borderStrong,
    },
    mismatchText: {
      fontSize: 13,
      color: v.text,
      lineHeight: 19,
      fontFamily: fontFamily.semibold,
    },
    mismatchBtn: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      backgroundColor: v.accent,
      borderRadius: radius.sm,
    },
    mismatchBtnText: {
      color: v.onAccent,
      fontSize: 12,
      fontFamily: fontFamily.bold,
    },
    positionBlock: {
      marginTop: spacing.sm,
    },
  });
}
