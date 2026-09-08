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
import { useTranslation } from '../../context/LocaleContext';
import { APP_SPACE_LABELS } from '../../models/AppSpace';
import { isUnderU13AppSpace } from '../../models/AppSpace';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { PLAYER_POSITIONS } from '../../constants/playerProfile';
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

      {/* Uniquement données FFF/DOFA — plus de chips Catégorie/Niveau inventées */}
      <SignupFffAffiliationCard
        role="player"
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
          // Niveau ProDay = catégorie FFF retenue (plus de doublon inventé)
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

      {/* Poste = préférence ProDay (pas une donnée FFF inventée) — après club/catégorie */}
      {(form.selectedFffClub || !form.hasClub) && (
        <View style={styles.positionBlock}>
          <SignupOptionPicker
            label="Poste (optionnel)"
            options={PLAYER_POSITIONS}
            value={form.position}
            onChange={form.setPosition}
          />
        </View>
      )}

      {summaryReady ? (
        <View style={styles.summaryCard}>
          <ProDayText style={styles.summaryTitle}>Récapitulatif FFF</ProDayText>
          {form.hasClub && form.selectedFffClub ? (
            <>
              <ProDayText style={styles.summaryLine}>
                Club : {form.selectedFffClub.name}
                {form.selectedFffClub.fffNumber ? ` · N° ${form.selectedFffClub.fffNumber}` : ''}
              </ProDayText>
              <ProDayText style={styles.summaryMuted}>
                {[form.selectedFffClub.city, form.selectedFffClub.postalCode, form.selectedFffClub.league]
                  .filter(Boolean)
                  .join(' · ')}
              </ProDayText>
              {fffCategory ? (
                <ProDayText style={styles.summaryLine}>Équipe / catégorie : {fffCategory}</ProDayText>
              ) : (
                <ProDayText style={styles.summaryWarn}>Sélectionnez votre catégorie FFF ci-dessus.</ProDayText>
              )}
            </>
          ) : (
            <ProDayText style={styles.summaryLine}>Sans club · {form.displayName.trim()}</ProDayText>
          )}
          {form.displayName.trim() && form.hasClub ? (
            <ProDayText style={styles.summaryLine}>Identité : {form.displayName.trim()}</ProDayText>
          ) : null}
          {universeHint ? (
            <ProDayText style={styles.summaryMuted}>
              Univers ProDay : {universeHint.title} ({universeHint.range})
            </ProDayText>
          ) : null}
          {willNeedParental ? (
            <ProDayText style={styles.minorHint}>
              Accord du responsable légal requis à l'étape suivante (-18 ans).
            </ProDayText>
          ) : null}
        </View>
      ) : null}
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
    positionBlock: {
      marginTop: spacing.sm,
    },
    summaryCard: {
      backgroundColor: AUTH_XP.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: AUTH_XP.border,
      padding: spacing.md,
      marginTop: spacing.md,
      gap: 4,
    },
    summaryTitle: {
      fontSize: 13,
      fontFamily: fontFamily.bold,
      color: AUTH_XP.goldBright,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    summaryLine: {
      fontSize: 13,
      color: AUTH_XP.text,
      lineHeight: 18,
      fontFamily: fontFamily.semibold,
    },
    summaryMuted: {
      fontSize: 12,
      color: AUTH_XP.textMuted,
      lineHeight: 17,
      fontFamily: fontFamily.regular,
    },
    summaryWarn: {
      fontSize: 12,
      color: AUTH_XP.error,
      fontFamily: fontFamily.semibold,
      marginTop: 2,
    },
    minorHint: {
      fontSize: 12,
      color: '#FBBF24',
      fontFamily: fontFamily.semibold,
      marginTop: spacing.xs,
    },
  });
}
