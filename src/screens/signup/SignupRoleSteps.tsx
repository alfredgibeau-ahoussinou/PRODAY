import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import {
  getStepMetaForRole,
  getMedicalPracticeMeta,
  MEDICAL_SPECIALTY_CONFIGS,
  getMedicalConfig,
} from './signupRoleExperience';
import { getProStepMeta } from './signupProConfig';
import { getSanteStepMeta } from './signupSanteConfig';
import type { SignupPageId } from './signupFlowConfig';
import { useSignupFlowTheme } from './SignupFlowContext';
import { spacing, radius } from '../../theme/designTokens';

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
  const meta = isSanteSignup
    ? getSanteStepMeta(page)
    : isProSignup
      ? getProStepMeta(page)
      : getStepMetaForRole(page, form.role);
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
        <SignupFooterButton label="Continuer" onPress={() => form.advanceFromCurrentPage()} />
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

export const SignupCoachProStep: React.FC<StepProps> = (props) => (
  <RoleStepShell
    {...props}
    page="coach_pro"
    hint="Diplôme BEF, UEFA ou équivalent — photographié après confirmation email."
  >
    <AuthTextField
      label="Diplôme ou certification *"
      icon="school"
      placeholder="Ex. BEF, UEFA B, DESJEPS…"
      value={props.form.professionalHeadline}
      onChangeText={props.form.setProfessionalHeadline}
      error={props.form.fieldErrors.professionalHeadline}
    />
    <AuthTextField
      label="Ville d’exercice *"
      icon="location"
      placeholder="Ex. Lyon, Marseille…"
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
    <AuthTextField
      label="Département (optionnel)"
      icon="location"
      placeholder="Ex. 69, 13…"
      value={props.form.department}
      onChangeText={props.form.setDepartment}
      error={props.form.fieldErrors.department}
    />
  </RoleStepShell>
);

export const SignupClubProStep: React.FC<StepProps> = (props) => (
  <RoleStepShell {...props} page="club_pro" hint="Mandat ou statuts du club — vérification IA après l’email.">
    <AuthTextField
      label="Nom du club / structure *"
      icon="business"
      placeholder="Ex. FC Exemple, AS Locale…"
      value={props.form.structureName}
      onChangeText={props.form.setStructureName}
      error={props.form.fieldErrors.structureName}
    />
    <AuthTextField
      label="Ville *"
      icon="location"
      placeholder="Ex. Paris, Lille…"
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
    <AuthTextField
      label="Département *"
      icon="location"
      placeholder="Ex. 75, 59, 971…"
      value={props.form.department}
      onChangeText={props.form.setDepartment}
      error={props.form.fieldErrors.department}
    />
  </RoleStepShell>
);

export const SignupAgentProStep: React.FC<StepProps> = (props) => (
  <RoleStepShell {...props} page="agent_pro" hint="Licence agent — contrôle automatique après validation email.">
    <AuthTextField
      label="N° licence ou agrément *"
      icon="document"
      placeholder="Ex. licence FIFA / FFF…"
      value={props.form.professionalHeadline}
      onChangeText={props.form.setProfessionalHeadline}
      error={props.form.fieldErrors.professionalHeadline}
    />
    <AuthTextField
      label="Ville principale *"
      icon="location"
      placeholder="Ex. Paris, Bordeaux…"
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
    <AuthTextField
      label="Département *"
      icon="location"
      placeholder="Ex. 75, 33…"
      value={props.form.department}
      onChangeText={props.form.setDepartment}
      error={props.form.fieldErrors.department}
    />
  </RoleStepShell>
);

export const SignupRecruiterProStep: React.FC<StepProps> = (props) => (
  <RoleStepShell
    {...props}
    page="recruiter_pro"
    hint="Mandat recruteur ou attestation club — vérification IA après l’email."
  >
    <AuthTextField
      label="Spécialité recrutement *"
      icon="search"
      placeholder="Ex. Scout indépendant, resp. recrutement, détection…"
      value={props.form.professionalHeadline}
      onChangeText={props.form.setProfessionalHeadline}
      error={props.form.fieldErrors.professionalHeadline}
    />
    <AuthTextField
      label="Ville principale *"
      icon="location"
      placeholder="Ex. Lyon, Lille…"
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
    <AuthTextField
      label="Département *"
      icon="location"
      placeholder="Ex. 69, 59…"
      value={props.form.department}
      onChangeText={props.form.setDepartment}
      error={props.form.fieldErrors.department}
    />
  </RoleStepShell>
);

export const SignupOrganizerProStep: React.FC<StepProps> = (props) => (
  <RoleStepShell {...props} page="organizer_pro" hint="Tournois, détections — justificatif structure après l’email.">
    <AuthTextField
      label="Structure / collectif *"
      icon="trophy"
      placeholder="Ex. Ligue locale, Asso events…"
      value={props.form.structureName}
      onChangeText={props.form.setStructureName}
      error={props.form.fieldErrors.structureName}
    />
    <AuthTextField
      label="Ville *"
      icon="location"
      placeholder="Ex. Toulouse, Nantes…"
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
    <AuthTextField
      label="Département (optionnel)"
      icon="location"
      placeholder="Ex. 31, 44…"
      value={props.form.department}
      onChangeText={props.form.setDepartment}
      error={props.form.fieldErrors.department}
    />
  </RoleStepShell>
);

export const SignupSponsorProStep: React.FC<StepProps> = (props) => (
  <RoleStepShell {...props} page="sponsor_pro" hint="Votre marque sera visible sur l’onglet Sponsors des clubs locaux.">
    <AuthTextField
      label="Marque ou enseigne *"
      icon="star-four-points"
      placeholder="Ex. Sport Shop, Banque locale…"
      value={props.form.structureName}
      onChangeText={props.form.setStructureName}
      error={props.form.fieldErrors.structureName}
    />
    <AuthTextField
      label="Ville / territoire *"
      icon="location"
      placeholder="Ex. Région Île-de-France, Lyon…"
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
  </RoleStepShell>
);

export const SignupMedicalSpecialtyStep: React.FC<StepProps> = (props) => {
  const { colors } = useSignupFlowTheme();
  const meta = getStepMetaForRole('medical_specialty', 'physio');

  return (
    <SignupStepLayout
      {...props}
      title={meta.title}
      subtitle={meta.subtitle}
      heroIcon={meta.heroIcon}
      stepName={meta.stepName}
      contentKey="medical-specialty"
      footer={
        <SignupFooterButton label="Continuer" onPress={() => props.form.advanceFromCurrentPage()} />
      }
    >
      <View style={styles.specialtyGrid}>
        {MEDICAL_SPECIALTY_CONFIGS.map((cfg) => {
          const active = props.form.medicalSpecialty === cfg.label;
          return (
            <Pressable
              key={cfg.id}
              style={[
                styles.specialtyCard,
                { borderColor: colors.border, backgroundColor: colors.surface },
                active && { borderColor: colors.accent, backgroundColor: colors.accentSoft },
              ]}
              onPress={() => props.form.setMedicalSpecialty(cfg.label)}
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
  const cfg = getMedicalConfig(props.form.medicalSpecialty);
  const meta = getMedicalPracticeMeta(props.form.medicalSpecialty);
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
        <SignupFooterButton label="Continuer" onPress={() => props.form.advanceFromCurrentPage()} />
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
        label="Ville d’exercice *"
        icon="location"
        placeholder="Ex. Paris, Strasbourg…"
        value={props.form.city}
        onChangeText={props.form.setCity}
        error={props.form.fieldErrors.city}
      />
      <AuthTextField
        label="Département (optionnel)"
        icon="location"
        placeholder="Ex. 67, 75…"
        value={props.form.department}
        onChangeText={props.form.setDepartment}
        error={props.form.fieldErrors.department}
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
