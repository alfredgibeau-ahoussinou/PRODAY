import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { SignupRecapCard } from '../../components/signup/SignupRecapCard';
import { SignupPoleShell } from './SignupPoleShell';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getStepMetaForRole } from './signupRoleExperience';
import {
  getMedicalConfigById,
  getMedicalPracticeMetaById,
  getMedicalSpecialtyConfigs,
} from './signupMedicalI18n';
import { useSignupFlowTheme } from './SignupFlowContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { openCalComSignup } from '../../utils/calComBooking';
import { SignupFffAffiliationCard } from '../../components/signup/SignupFffAffiliationCard';
import { SignupClubFffFinder } from '../../components/signup/SignupClubFffFinder';
import { ProDayText } from '../../components/ui/ProDayText';
import { ProDayErrorBanner } from '../../components/ui/ProDayErrorBanner';
import { getSignupRoleStepCopy } from './signupRoleStepCopy';
import { fontFamily } from '../../theme/typography';

type StepProps = {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
  onClose?: () => void;
};

export const SignupCoachProStep: React.FC<StepProps> = (props) => {
  const { t } = useTranslation();
  const copy = getSignupRoleStepCopy(t);
  const cat = props.form.selectedFffCategory || props.form.category;
  const summaryReady = Boolean(props.form.selectedFffClub || !props.form.hasClub);

  return (
    <SignupPoleShell {...props} page="coach_pro" hint={copy.coach.hint}>
      <SignupFffAffiliationCard
        role="coach"
        hasClub={props.form.hasClub}
        onToggleHasClub={props.form.setHasClub}
        selectedClub={props.form.selectedFffClub}
        onSelectClub={(club) => {
          props.form.setSelectedFffClub(club);
          if (club?.city && !props.form.city) {
            props.form.setCity(club.city);
          }
          if (club?.department && !props.form.department) {
            props.form.setDepartment(club.department);
          }
        }}
        selectedCategory={cat}
        onSelectCategory={(c) => {
          props.form.setSelectedFffCategory(c);
          props.form.setCategory(c);
        }}
        selectedRosterMember={props.form.selectedRosterMember}
        onSelectRosterMember={(member) => {
          props.form.setSelectedRosterMember(member);
          if (member?.displayName && !props.form.displayName) {
            props.form.setDisplayName(member.displayName);
          }
        }}
        isCustomProfile={props.form.isCustomProfile}
        onToggleCustomProfile={props.form.setIsCustomProfile}
        identityDoc={props.form.identityDoc}
        onSetIdentityDoc={props.form.setIdentityDoc}
        defaultUserName={props.form.displayName}
        error={props.form.fieldErrors.club || props.form.fieldErrors.category}
      />
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
      {summaryReady ? (
        <SignupRecapCard
          club={props.form.selectedFffClub}
          category={cat}
          displayName={props.form.displayName}
          withoutClub={!props.form.hasClub}
          warn={!cat && props.form.hasClub ? 'Sélectionnez votre catégorie FFF ci-dessus.' : null}
          extraLines={
            props.form.professionalHeadline.trim()
              ? [`Diplôme : ${props.form.professionalHeadline.trim()}`]
              : undefined
          }
        />
      ) : null}
    </SignupPoleShell>
  );
};

export const SignupClubProStep: React.FC<StepProps> = (props) => {
  const form = props.form;
  const applyClubAutofill = React.useCallback(
    (fill: {
      structureName: string;
      city: string;
      department: string;
      teams: string[];
    }) => {
      if (fill.structureName) form.setStructureName(fill.structureName);
      if (fill.city) form.setCity(fill.city);
      if (fill.department) form.setDepartment(fill.department);
      if (fill.teams.length > 0) {
        form.setSelectedFffCategory(fill.teams[0]);
      }
      form.setHasClub(true);
      form.setFieldErrors({});
      form.setError(null);
    },
    [form],
  );

  return (
    <SignupPoleShell
      {...props}
      page="club_pro"
      continueLabel={
        props.form.selectedFffClub ? 'Continuer avec ce club' : 'Sélectionnez votre club FFF'
      }
    >
      <SignupClubFffFinder
        selectedClub={props.form.selectedFffClub}
        onSelectClub={(club) => {
          props.form.setSelectedFffClub(club);
          if (!club) {
            props.form.setStructureName('');
            props.form.setCity('');
            props.form.setDepartment('');
            props.form.setSelectedFffCategory('');
          }
        }}
        onAutofill={applyClubAutofill}
        identityDoc={props.form.identityDoc}
        onSetIdentityDoc={props.form.setIdentityDoc}
        error={props.form.fieldErrors.club}
      />
    </SignupPoleShell>
  );
};

export const SignupAgentProStep: React.FC<StepProps> = (props) => {
  const { t } = useTranslation();
  const copy = getSignupRoleStepCopy(t);
  return (
    <SignupPoleShell {...props} page="agent_pro" hint={copy.agent.hint}>
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
    </SignupPoleShell>
  );
};

export const SignupRecruiterProStep: React.FC<StepProps> = (props) => {
  const { t } = useTranslation();
  const copy = getSignupRoleStepCopy(t);
  return (
    <SignupPoleShell {...props} page="recruiter_pro" hint={copy.recruiter.hint}>
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
    </SignupPoleShell>
  );
};

export const SignupOrganizerProStep: React.FC<StepProps> = (props) => {
  const { t } = useTranslation();
  const copy = getSignupRoleStepCopy(t);
  return (
    <SignupPoleShell {...props} page="organizer_pro" hint={copy.organizer.hint}>
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
    </SignupPoleShell>
  );
};

export const SignupSponsorProStep: React.FC<StepProps> = (props) => {
  const { t } = useTranslation();
  const copy = getSignupRoleStepCopy(t);
  return (
    <SignupPoleShell {...props} page="sponsor_pro" hint={copy.sponsor.hint}>
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
    </SignupPoleShell>
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
        <SignupFooterButton
          label={t('signup.form.continue')}
          onPress={() => props.form.advanceFromCurrentPage()}
        />
      }
    >
      {props.form.error ? (
        <View style={{ marginBottom: spacing.md }}>
          <ProDayErrorBanner
            message={props.form.error}
            onDismiss={() => props.form.setError(null)}
          />
        </View>
      ) : null}
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
              <ProDayText style={[styles.specialtyTag, active && { color: colors.accent }]}>
                {cfg.shortLabel}
              </ProDayText>
              <ProDayText style={[styles.specialtyTitle, { color: colors.text }]}>
                {cfg.label}
              </ProDayText>
              <ProDayText style={[styles.specialtySub, { color: colors.textSecondary }]}>
                {cfg.tagline}
              </ProDayText>
            </Pressable>
          );
        })}
      </View>
      {props.form.fieldErrors.medicalSpecialty ? (
        <ProDayText style={[styles.fieldErr, { color: colors.error }]}>
          {props.form.fieldErrors.medicalSpecialty}
        </ProDayText>
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
        <SignupFooterButton
          label={t('signup.form.continue')}
          onPress={() => props.form.advanceFromCurrentPage()}
        />
      }
    >
      {props.form.error ? (
        <View style={{ marginBottom: spacing.md }}>
          <ProDayErrorBanner
            message={props.form.error}
            onDismiss={() => props.form.setError(null)}
          />
        </View>
      ) : null}
      <View
        style={[styles.hintBox, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
      >
        <ProDayText style={[styles.hintText, { color: colors.textSecondary }]}>
          {cfg.practiceHint}
        </ProDayText>
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
      <View
        style={[styles.hintBox, { backgroundColor: colors.accentSoft, borderColor: colors.border }]}
      >
        <ProDayText style={[styles.hintText, { color: colors.textSecondary }]}>
          Créez (ou connectez) votre compte Cal.com. C’est votre agenda public pour les
          téléconsultations. Les sportifs réservent sans créer de compte Cal.com, via votre fiche
          ProDay.
        </ProDayText>
        <Pressable
          onPress={() => {
            void openCalComSignup().catch(() => undefined);
          }}
          style={{ marginTop: spacing.sm }}
        >
          <ProDayText style={{ color: colors.accent, fontFamily: fontFamily.bold, fontSize: 14 }}>
            Ouvrir l’inscription Cal.com →
          </ProDayText>
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
  hintText: { fontSize: 13, lineHeight: 19, fontFamily: fontFamily.semibold },
  specialtyGrid: { gap: spacing.sm, width: '100%' },
  specialtyCard: {
    padding: spacing.md,
    borderRadius: radius.lg,
    borderWidth: 1.5,
  },
  specialtyTag: {
    fontSize: 10,
    fontFamily: fontFamily.bold,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  specialtyTitle: { fontSize: 15, fontFamily: fontFamily.bold, letterSpacing: -0.2 },
  specialtySub: { fontSize: 12, lineHeight: 17, marginTop: 4, fontFamily: fontFamily.regular },
  fieldErr: {
    fontSize: 12,
    fontFamily: fontFamily.semibold,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
});
