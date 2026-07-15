import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getStepMetaForRole } from './signupRoleExperience';
import {
  getMedicalConfigById,
  getMedicalPracticeMetaById,
  getMedicalSpecialtyConfigs,
} from './signupMedicalI18n';
import { getProStepMeta } from './signupProConfig';
import { getSanteStepMeta } from './signupSanteConfig';
import type { SignupPageId } from './signupFlowConfig';
import { useSignupFlowTheme } from './SignupFlowContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { openCalComSignup } from '../../utils/calComBooking';

type StepProps = {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
};

const RoleStepShell: React.FC<
  StepProps & { page: SignupPageId; children: React.ReactNode; hint?: string }
> = ({ form, page, children, hint, ...layout }) => {
  const { colors, isProSignup, isSanteSignup } = useSignupFlowTheme();
  const { t } = useTranslation();
  const meta = isSanteSignup
    ? getSanteStepMeta(page, t)
    : isProSignup
      ? getProStepMeta(page, t)
      : getStepMetaForRole(page, form.role, t);
  return (
    <SignupStepLayout
      {...layout}
      title={meta.title}
      subtitle={meta.subtitle}
      heroIcon={meta.heroIcon}
      stepName={meta.stepName ?? layout.stepName}
      contentKey={`${page}-${form.role}`}
      onBack={layout.onBack}
      footer={
        <SignupFooterButton label={t('common.continue')} onPress={() => form.advanceFromCurrentPage()} />
      }
    >
      {hint ? (
        <View style={[styles.hintBox, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
          <Text style={[styles.hintText, { color: colors.textSecondary }]}>{hint}</Text>
        </View>
      ) : null}
      {children}
    </SignupStepLayout>
  );
};

import { getSignupRoleStepCopy } from './signupRoleStepCopy';

export const SignupCoachProStep: React.FC<StepProps> = (props) => {
  const { t } = useTranslation();
  const copy = getSignupRoleStepCopy(t);
  return (
  <RoleStepShell {...props} page="coach_pro" hint={copy.coach.hint}>
    <AuthTextField
      label={copy.coach.diplomaLabel}
      icon="school"
      placeholder={copy.coach.diplomaPlaceholder}
      value={props.form.professionalHeadline}
      onChangeText={props.form.setProfessionalHeadline}
      error={props.form.fieldErrors.professionalHeadline}
    />
    <AuthTextField
      label={copy.coach.cityLabel}
      icon="location"
      placeholder={copy.coach.cityPlaceholder}
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
    <AuthTextField
      label={t('signup.form.departmentOptional')}
      icon="location"
      placeholder={copy.departmentPlaceholder}
      value={props.form.department}
      onChangeText={props.form.setDepartment}
      error={props.form.fieldErrors.department}
    />
  </RoleStepShell>
  );
};

export const SignupClubProStep: React.FC<StepProps> = (props) => {
  const { t } = useTranslation();
  const copy = getSignupRoleStepCopy(t);
  return (
  <RoleStepShell {...props} page="club_pro" hint={copy.club.hint}>
    <AuthTextField
      label={copy.club.nameLabel}
      icon="business"
      placeholder={copy.club.namePlaceholder}
      value={props.form.structureName}
      onChangeText={props.form.setStructureName}
      error={props.form.fieldErrors.structureName}
    />
    <AuthTextField
      label={copy.club.cityLabel}
      icon="location"
      placeholder={copy.club.cityPlaceholder}
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
    <AuthTextField
      label={t('signup.form.departmentRequired')}
      icon="location"
      placeholder={copy.departmentPlaceholderWide}
      value={props.form.department}
      onChangeText={props.form.setDepartment}
      error={props.form.fieldErrors.department}
    />
  </RoleStepShell>
  );
};

export const SignupAgentProStep: React.FC<StepProps> = (props) => {
  const { t } = useTranslation();
  const copy = getSignupRoleStepCopy(t);
  return (
  <RoleStepShell {...props} page="agent_pro" hint={copy.agent.hint}>
    <AuthTextField
      label={copy.agent.licenseLabel}
      icon="document"
      placeholder={copy.agent.licensePlaceholder}
      value={props.form.professionalHeadline}
      onChangeText={props.form.setProfessionalHeadline}
      error={props.form.fieldErrors.professionalHeadline}
    />
    <AuthTextField
      label={copy.agent.cityLabel}
      icon="location"
      placeholder={copy.agent.cityPlaceholder}
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
    <AuthTextField
      label={t('signup.form.departmentRequired')}
      icon="location"
      placeholder={copy.departmentPlaceholder}
      value={props.form.department}
      onChangeText={props.form.setDepartment}
      error={props.form.fieldErrors.department}
    />
  </RoleStepShell>
  );
};

export const SignupRecruiterProStep: React.FC<StepProps> = (props) => {
  const { t } = useTranslation();
  const copy = getSignupRoleStepCopy(t);
  return (
  <RoleStepShell
    {...props}
    page="recruiter_pro"
    hint={copy.recruiter.hint}
  >
    <AuthTextField
      label={copy.recruiter.specialtyLabel}
      icon="search"
      placeholder={copy.recruiter.specialtyPlaceholder}
      value={props.form.professionalHeadline}
      onChangeText={props.form.setProfessionalHeadline}
      error={props.form.fieldErrors.professionalHeadline}
    />
    <AuthTextField
      label={copy.recruiter.cityLabel}
      icon="location"
      placeholder={copy.recruiter.cityPlaceholder}
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
    <AuthTextField
      label={t('signup.form.departmentRequired')}
      icon="location"
      placeholder={copy.departmentPlaceholder}
      value={props.form.department}
      onChangeText={props.form.setDepartment}
      error={props.form.fieldErrors.department}
    />
  </RoleStepShell>
  );
};

export const SignupOrganizerProStep: React.FC<StepProps> = (props) => {
  const { t } = useTranslation();
  const copy = getSignupRoleStepCopy(t);
  return (
  <RoleStepShell {...props} page="organizer_pro" hint={copy.organizer.hint}>
    <AuthTextField
      label={copy.organizer.structureLabel}
      icon="trophy"
      placeholder={copy.organizer.structurePlaceholder}
      value={props.form.structureName}
      onChangeText={props.form.setStructureName}
      error={props.form.fieldErrors.structureName}
    />
    <AuthTextField
      label={copy.organizer.cityLabel}
      icon="location"
      placeholder={copy.organizer.cityPlaceholder}
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
    <AuthTextField
      label={t('signup.form.departmentOptional')}
      icon="location"
      placeholder={copy.departmentPlaceholder}
      value={props.form.department}
      onChangeText={props.form.setDepartment}
      error={props.form.fieldErrors.department}
    />
  </RoleStepShell>
  );
};

export const SignupSponsorProStep: React.FC<StepProps> = (props) => {
  const { t } = useTranslation();
  const copy = getSignupRoleStepCopy(t);
  return (
  <RoleStepShell {...props} page="sponsor_pro" hint={copy.sponsor.hint}>
    <AuthTextField
      label={copy.sponsor.brandLabel}
      icon="star-four-points"
      placeholder={copy.sponsor.brandPlaceholder}
      value={props.form.structureName}
      onChangeText={props.form.setStructureName}
      error={props.form.fieldErrors.structureName}
    />
    <AuthTextField
      label={copy.sponsor.territoryLabel}
      icon="location"
      placeholder={copy.sponsor.territoryPlaceholder}
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
  </RoleStepShell>
  );
};

export const SignupMedicalSpecialtyStep: React.FC<StepProps> = (props) => {
  const { colors } = useSignupFlowTheme();
  const { t } = useTranslation();
  const meta = getStepMetaForRole('medical_specialty', 'physio', t);
  const configs = getMedicalSpecialtyConfigs(t);

  return (
    <SignupStepLayout
      {...props}
      title={meta.title}
      subtitle={meta.subtitle}
      heroIcon={meta.heroIcon}
      stepName={meta.stepName}
      contentKey="medical-specialty"
      footer={
        <SignupFooterButton label={t('signup.form.continue')} onPress={() => props.form.advanceFromCurrentPage()} />
      }
    >
      <View style={styles.specialtyGrid}>
        {configs.map((cfg) => {
          const active = props.form.medicalSpecialty === cfg.id;
          return (
            <Pressable
              key={cfg.id}
              style={[
                styles.specialtyCard,
                { borderColor: colors.border, backgroundColor: colors.surface },
                active && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
              ]}
              onPress={() => props.form.setMedicalSpecialty(cfg.id)}
            >
              <Text style={[styles.specialtyTag, active && { color: colors.accent }]}>
                {cfg.shortLabel}
              </Text>
              <Text style={[styles.specialtyTitle, { color: colors.text }]}>{cfg.label}</Text>
              <Text style={[styles.specialtySub, { color: colors.textSecondary }]}>{cfg.tagline}</Text>
            </Pressable>
          );
        })}
      </View>
      {props.form.fieldErrors.medicalSpecialty ? (
        <Text style={[styles.fieldErr, { color: colors.error }]}>
          {props.form.fieldErrors.medicalSpecialty}
        </Text>
      ) : null}
    </SignupStepLayout>
  );
};

export const SignupMedicalPracticeStep: React.FC<StepProps> = (props) => {
  const { t } = useTranslation();
  const cfg = getMedicalConfigById(props.form.medicalSpecialty, t);
  const meta = getMedicalPracticeMetaById(props.form.medicalSpecialty, t);
  const { colors } = useSignupFlowTheme();

  return (
    <SignupStepLayout
      {...props}
      title={meta.title}
      subtitle={meta.subtitle}
      heroIcon={cfg.icon}
      stepName={meta.stepName}
      contentKey={`medical-practice-${cfg.id}`}
      footer={
        <SignupFooterButton label={t('signup.form.continue')} onPress={() => props.form.advanceFromCurrentPage()} />
      }
    >
      <View style={[styles.hintBox, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>{cfg.practiceHint}</Text>
      </View>
      <SignupOptionPicker
        label={cfg.practiceFocusLabel}
        options={cfg.practiceFocusOptions}
        value={props.form.medicalPracticeFocus}
        onChange={props.form.setMedicalPracticeFocus}
        error={props.form.fieldErrors.medicalPracticeFocus}
      />
      <AuthTextField
        label={t('signup.form.cityPractice')}
        icon="location"
        placeholder={t('signup.form.cityPracticePlaceholder')}
        value={props.form.city}
        onChangeText={props.form.setCity}
        error={props.form.fieldErrors.city}
      />
      <AuthTextField
        label={t('signup.form.departmentOptional')}
        icon="location"
        placeholder={t('signup.form.deptPlaceholderShort')}
        value={props.form.department}
        onChangeText={props.form.setDepartment}
        error={props.form.fieldErrors.department}
      />
      <View style={[styles.hintBox, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}>
        <Text style={[styles.hintText, { color: colors.textSecondary }]}>
          Créez (ou connectez) votre compte Cal.com — c’est votre agenda public pour les téléconsultations.
          Les sportifs réservent sans créer de compte Cal.com, via votre fiche ProDay.
        </Text>
        <Pressable
          onPress={() => {
            void openCalComSignup().catch(() => undefined);
          }}
          style={{ marginTop: spacing.sm }}
        >
          <Text style={{ color: colors.accent, fontWeight: '700', fontSize: 14 }}>
            Ouvrir l’inscription Cal.com →
          </Text>
        </Pressable>
      </View>
      <AuthTextField
        label="Username Cal.com"
        icon="globe"
        placeholder="ex. cabinet-martin-kine"
        autoCapitalize="none"
        autoCorrect={false}
        value={props.form.calComUsername}
        onChangeText={props.form.setCalComUsername}
        error={props.form.fieldErrors.calComUsername}
      />
    </SignupStepLayout>
  );
};

const styles = StyleSheet.create({
  hintBox: {
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  hintText: { fontSize: 13, lineHeight: 19, fontWeight: '500' },
  specialtyGrid: { gap: spacing.sm, width: '100%' },
  specialtyCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  specialtyTag: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  specialtyTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  specialtySub: { fontSize: 12, lineHeight: 17, marginTop: 4 },
  fieldErr: { fontSize: 12, fontWeight: '600', marginTop: spacing.sm, textAlign: 'center' },
});
