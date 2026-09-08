import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { defaultCategoriesForAppSpace } from '../../constants/appSpaces';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { SignupPressable } from '../../components/signup/SignupPressable';
import { birthPartsToIso } from '../../components/player/BirthDateFields';
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
import { AUTH_XP } from '../../features/auth/experience/tokens';
import { fontFamily } from '../../theme/typography';
import { ProDayText } from '../../components/ui/ProDayText';
import { SignupFffAffiliationCard } from '../../components/signup/SignupFffAffiliationCard';

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

  const styles = useMemo(() => createStyles(), []);
  const willNeedParental = form.isMinor || isUnderU13AppSpace(form.appSpace);
  const { t } = useTranslation();
  const meta = getPlayerStepMeta(form.productLine, 'sport', t);

  const showStandaloneCategoryPicker = !form.hasClub || !form.selectedFffClub;

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
        role="player"
        hasClub={form.hasClub}
        onToggleHasClub={form.setHasClub}
        selectedClub={form.selectedFffClub}
        onSelectClub={form.setSelectedFffClub}
        selectedCategory={form.selectedFffCategory || form.category}
        onSelectCategory={(cat) => {
          form.setSelectedFffCategory(cat);
          form.setCategory(cat);
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
          // ✅ Auto-sélectionner la catégorie du joueur depuis l'effectif
          if (member?.category) {
            form.setSelectedFffCategory(member.category);
            form.setCategory(member.category);
          }
        }}
        isCustomProfile={form.isCustomProfile}
        onToggleCustomProfile={form.setIsCustomProfile}
        identityDoc={form.identityDoc}
        onSetIdentityDoc={form.setIdentityDoc}
        defaultUserName={form.displayName}
        onChangeCustomName={form.setDisplayName}
      />

      <View>
        <SignupOptionPicker
          label={t('signup.form.position')}
          options={PLAYER_POSITIONS}
          value={form.position}
          onChange={form.setPosition}
          error={form.fieldErrors.position}
        />
      </View>

      {showStandaloneCategoryPicker && (
        <View>
          <SignupOptionPicker
            label={t('signup.form.category')}
            options={categoryOptions}
            value={form.category}
            onChange={form.setCategory}
            error={form.fieldErrors.category}
          />
        </View>
      )}

      <View>
        <SignupOptionPicker
          label={t('signup.form.level')}
          options={PLAYER_LEVELS}
          value={form.level}
          onChange={form.setLevel}
          error={form.fieldErrors.level}
        />
      </View>

      <View style={styles.summaryCard}>
        <ProDayText style={styles.summaryTitle}>Licence & Catégorie FFF</ProDayText>
        <ProDayText style={styles.summaryText}>
          {form.displayName || 'Joueur'}
          {form.hasClub && form.selectedFffClub ? ` · ${form.selectedFffClub.name}` : ''}
          {form.category ? ` · ${form.category}` : ''}
          {universeHint ? ` · ${universeHint.title} (${universeHint.range})` : ''}
          {form.city ? ` · ${form.city}` : ''}
        </ProDayText>
        {willNeedParental ? (
          <ProDayText style={styles.minorHint}>Accord du responsable légal requis à l'étape suivante (-18 ans).</ProDayText>
        ) : null}
      </View>
    </SignupStepLayout>
  );
};

function createStyles() {
  return StyleSheet.create({
    mismatchBox: {
      backgroundColor: 'rgba(245, 208, 74, 0.08)',
      borderRadius: radius.md,
      padding: spacing.md,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: AUTH_XP.borderHighlight,
    },
    mismatchText: {
      fontSize: 13,
      color: AUTH_XP.text,
      lineHeight: 19,
      fontFamily: fontFamily.semibold,
    },
    mismatchBtn: {
      marginTop: spacing.sm,
      alignSelf: 'flex-start',
      paddingVertical: spacing.xs,
      paddingHorizontal: spacing.sm,
      backgroundColor: AUTH_XP.goldBright,
      borderRadius: radius.sm,
    },
    mismatchBtnText: {
      color: '#000000',
      fontSize: 12,
      fontFamily: fontFamily.bold,
    },
    summaryCard: {
      backgroundColor: AUTH_XP.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: AUTH_XP.border,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    summaryTitle: {
      fontSize: 13,
      fontFamily: fontFamily.bold,
      color: AUTH_XP.goldBright,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    summaryText: {
      fontSize: 13,
      color: AUTH_XP.textMuted,
      lineHeight: 18,
      fontFamily: fontFamily.regular,
    },
    minorHint: {
      fontSize: 12,
      color: '#FBBF24',
      fontFamily: fontFamily.semibold,
      marginTop: spacing.xs,
    },
  });
}
