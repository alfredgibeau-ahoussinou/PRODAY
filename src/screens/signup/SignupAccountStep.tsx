import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { StaggerReveal } from '../../components/motion';
import { SignupFormCard } from '../../components/signup/SignupFormCard';
import { SignupPressable } from '../../components/signup/SignupPressable';
import { BirthDateFields } from '../../components/player/BirthDateFields';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { useTranslation } from '../../context/LocaleContext';
import { getProStepMeta } from './signupProConfig';
import { getSanteStepMeta } from './signupSanteConfig';
import { ProDayErrorBanner } from '../../components/ui/ProDayErrorBanner';
import { ProDayText } from '../../components/ui/ProDayText';
import { Icon } from '../../components/ui/Icon';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';
import { spacing, radius } from '../../theme/designTokens';
import { AUTH_XP } from '../../features/auth/experience/tokens';
import { fontFamily } from '../../theme/typography';

interface SignupAccountStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack?: () => void;
}

export const SignupAccountStep: React.FC<SignupAccountStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
}) => {
  const { t } = useTranslation();
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const meta = form.isSanteProduct
    ? getSanteStepMeta('account', t)
    : form.isProProduct
      ? getProStepMeta('account', t)
      : getPlayerStepMeta(form.productLine, 'account', t);

  const isPlayer = form.role === 'player';
  const showFffClubBanner = Boolean(form.selectedFffClub);

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title={meta.title}
      subtitle={meta.subtitle}
      contentKey={`account-${form.role}`}
      heroIcon={meta.heroIcon}
      onBack={onBack}
      footer={
        <SignupFooterButton label={t('signup.form.continue')} onPress={() => form.advanceFromCurrentPage()} />
      }
    >
      {form.error ? (
        <View>
          <ProDayErrorBanner message={form.error} onDismiss={() => form.setError(null)} />
        </View>
      ) : null}

      <SignupFormCard>
        {form.selectedRosterMember ? (
          <View style={styles.fffBanner}>
            <Icon name="shield" size={16} color={AUTH_XP.goldBright} />
            <ProDayText style={styles.fffBannerText}>
              Licencié FFF sélectionné : {form.selectedRosterMember.displayName} (Lic.{' '}
              {form.selectedRosterMember.licenseNumber})
            </ProDayText>
          </View>
        ) : showFffClubBanner ? (
          <View style={styles.fffBanner}>
            <Icon name="shield" size={16} color={AUTH_XP.goldBright} />
            <ProDayText style={styles.fffBannerText}>
              Club FFF : {form.selectedFffClub!.name}
              {form.selectedFffClub!.fffNumber
                ? ` · N° ${form.selectedFffClub!.fffNumber}`
                : ''}
            </ProDayText>
          </View>
        ) : null}

        <StaggerReveal index={0}>
          <AuthTextField
            label={isPlayer ? 'Nom et Prénom officiels' : t('signup.form.displayName')}
            icon="person"
            placeholder={isPlayer ? 'Ex. Kylian Mbappé' : t('signup.form.displayNamePlaceholder')}
            value={form.displayName}
            onChangeText={form.setDisplayName}
            error={form.fieldErrors.displayName}
          />
        </StaggerReveal>

        {isPlayer ? (
          <>
            <StaggerReveal index={1}>
              <View style={styles.birthBlock}>
                <BirthDateFields
                  day={form.birthDay}
                  month={form.birthMonth}
                  year={form.birthYear}
                  onDay={form.setBirthDay}
                  onMonth={form.setBirthMonth}
                  onYear={form.setBirthYear}
                  accent={AUTH_XP.gold}
                  error={form.fieldErrors.age}
                  hint="Date de naissance légale (calcul automatique de votre catégorie officielle FFF)"
                />
              </View>
            </StaggerReveal>

            <StaggerReveal index={2}>
              <View style={styles.genderBlock}>
                <ProDayText variant="caption" style={styles.genderLabel}>
                  Genre officiel
                </ProDayText>
                <View style={styles.genderRow}>
                  <SignupPressable
                    style={[styles.genderBtn, form.gender === 'men' && styles.genderBtnActive]}
                    onPress={() => form.setGender('men')}
                  >
                    <Icon
                      name="person"
                      size={16}
                      color={form.gender === 'men' ? AUTH_XP.goldBright : AUTH_XP.textMuted}
                    />
                    <ProDayText
                      variant="body"
                      style={[
                        styles.genderBtnText,
                        form.gender === 'men' && styles.genderBtnTextActive,
                      ]}
                    >
                      Masculin
                    </ProDayText>
                  </SignupPressable>
                  <SignupPressable
                    style={[styles.genderBtn, form.gender === 'women' && styles.genderBtnActive]}
                    onPress={() => form.setGender('women')}
                  >
                    <Icon
                      name="person"
                      size={16}
                      color={form.gender === 'women' ? AUTH_XP.goldBright : AUTH_XP.textMuted}
                    />
                    <ProDayText
                      variant="body"
                      style={[
                        styles.genderBtnText,
                        form.gender === 'women' && styles.genderBtnTextActive,
                      ]}
                    >
                      Féminin
                    </ProDayText>
                  </SignupPressable>
                </View>
                {form.fieldErrors.gender ? (
                  <ProDayText variant="caption" style={styles.fieldError}>
                    {form.fieldErrors.gender}
                  </ProDayText>
                ) : null}
              </View>
            </StaggerReveal>

            <StaggerReveal index={3}>
              <View style={styles.geoRow}>
                <View style={styles.geoColMain}>
                  <AuthTextField
                    label="Ville de résidence"
                    icon="location"
                    placeholder="Ex. Paris, Bondy, Lyon..."
                    value={form.city}
                    onChangeText={form.setCity}
                    error={form.fieldErrors.city}
                  />
                </View>
                <View style={styles.geoColSide}>
                  <AuthTextField
                    label="Département"
                    icon="location"
                    placeholder="Ex. 93, 75, 69..."
                    value={form.department}
                    onChangeText={form.setDepartment}
                    error={form.fieldErrors.department}
                    autoCapitalize="characters"
                  />
                </View>
              </View>
            </StaggerReveal>
          </>
        ) : null}

        <StaggerReveal index={isPlayer ? 4 : 1}>
          <AuthTextField
            label={t('signup.form.email')}
            icon="mail"
            placeholder={t('signup.form.emailPlaceholder')}
            value={form.email}
            onChangeText={form.setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            editable={form.isEmailEditable}
            error={form.fieldErrors.email}
          />
          {!form.isEmailEditable ? (
            <ProDayText variant="caption" style={styles.emailHint}>
              {t('signup.form.emailOAuthLocked')}
            </ProDayText>
          ) : null}
        </StaggerReveal>

        <StaggerReveal index={isPlayer ? 5 : 2}>
          <AuthTextField
            label={t('signup.form.referralCode')}
            icon="people"
            placeholder={t('signup.form.referralCodePlaceholder')}
            value={form.referralCode}
            onChangeText={form.setReferralCode}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          <ProDayText variant="caption" style={styles.emailHint}>
            {t('signup.form.referralCodeHint')}
          </ProDayText>
        </StaggerReveal>
      </SignupFormCard>

      {form.role === 'sponsor' ? (
        <View>
          <AuthTextField
            label={t('signup.form.cityRegion')}
            icon="location"
            placeholder={t('signup.form.cityPlaceholder')}
            value={form.city}
            onChangeText={form.setCity}
            error={form.fieldErrors.city}
          />
        </View>
      ) : null}
    </SignupStepLayout>
  );
};

function createStyles(_c: AppColors) {
  return StyleSheet.create({
    emailHint: {
      fontSize: 12,
      lineHeight: 17,
      color: AUTH_XP.textDim,
      marginTop: -spacing.xs,
      marginBottom: spacing.xs,
      fontFamily: fontFamily.regular,
    },
    birthBlock: {
      marginBottom: 4,
    },
    genderBlock: {
      marginBottom: 16,
      gap: 6,
    },
    genderLabel: {
      fontSize: 11,
      fontFamily: fontFamily.semibold,
      color: AUTH_XP.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    genderRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    genderBtn: {
      flex: 1,
      height: 48,
      flexDirection: 'row',
      gap: 8,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: AUTH_XP.border,
      backgroundColor: AUTH_XP.inputBg,
      alignItems: 'center',
      justifyContent: 'center',
    },
    genderBtnActive: {
      backgroundColor: 'rgba(245, 208, 74, 0.12)',
      borderColor: AUTH_XP.gold,
    },
    genderBtnText: {
      fontSize: 14,
      fontFamily: fontFamily.semibold,
      color: AUTH_XP.textMuted,
    },
    genderBtnTextActive: {
      color: AUTH_XP.goldBright,
      fontFamily: fontFamily.bold,
    },
    fieldError: {
      fontSize: 12,
      color: AUTH_XP.error,
      marginTop: spacing.xs,
      fontFamily: fontFamily.semibold,
    },
    geoRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    geoColMain: {
      flex: 3,
    },
    geoColSide: {
      flex: 2,
    },
    fffBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      backgroundColor: 'rgba(245, 208, 74, 0.12)',
      borderWidth: 1,
      borderColor: AUTH_XP.gold,
      borderRadius: radius.md,
      paddingVertical: 10,
      paddingHorizontal: 12,
      marginBottom: 12,
    },
    fffBannerText: {
      fontSize: 12,
      fontFamily: fontFamily.bold,
      color: AUTH_XP.goldBright,
      flex: 1,
    },
  });
}

