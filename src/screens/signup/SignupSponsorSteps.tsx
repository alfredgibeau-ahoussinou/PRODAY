import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getStepMetaForRole } from './signupRoleExperience';
import { useSignupFlowTheme } from './SignupFlowContext';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import {
  SPONSOR_BUDGET_RANGES,
  SPONSOR_CAMPAIGN_GOALS,
  SPONSOR_REGIONS,
  SPONSOR_SECTORS,
  SPONSOR_SPORTS,
  SPONSOR_TARGET_AUDIENCES,
} from '../../content/sponsorSignupContent';
import type { SignupPageId } from './signupFlowTypes';

type StepProps = {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
};

const SponsorStepShell: React.FC<
  StepProps & { page: SignupPageId; children: React.ReactNode; hint?: string }
> = ({ form, page, children, hint, ...layout }) => {
  const { colors } = useSignupFlowTheme();
  const { t } = useTranslation();
  const meta = getStepMetaForRole(page, 'sponsor', t);
  return (
    <SignupStepLayout
      {...layout}
      title={meta.title}
      subtitle={meta.subtitle}
      heroIcon={meta.heroIcon}
      stepName={meta.stepName ?? layout.stepName}
      contentKey={`${page}-sponsor`}
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

const SignupChipMultiPicker: React.FC<{
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  error?: string;
}> = ({ label, options, selected, onToggle, error }) => {
  const { colors: c } = useSignupFlowTheme();
  const chipStyles = useMemo(() => createChipStyles(c), [c]);

  return (
    <View style={chipStyles.wrap}>
      <Text style={chipStyles.label}>{label}</Text>
      <View style={chipStyles.row}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <Pressable
              key={opt}
              style={[chipStyles.chip, active && chipStyles.chipActive]}
              onPress={() => onToggle(opt)}
            >
              <Text style={[chipStyles.chipText, active && chipStyles.chipTextActive]}>{opt}</Text>
            </Pressable>
          );
        })}
      </View>
      {error ? <Text style={chipStyles.error}>{error}</Text> : null}
    </View>
  );
};

export const SignupSponsorCompanyStep: React.FC<StepProps> = (props) => (
  <SponsorStepShell
    {...props}
    page="sponsor_company"
    hint="Ces informations servent à personnaliser votre espace sponsor ProDay."
  >
    <AuthTextField
      label="Raison sociale / marque"
      icon="business"
      placeholder="Ex. SportVision France"
      value={props.form.structureName}
      onChangeText={props.form.setStructureName}
      error={props.form.fieldErrors.structureName}
    />
    <SignupOptionPicker
      label="Secteur d'activité"
      options={SPONSOR_SECTORS}
      value={props.form.sponsorSector}
      onChange={props.form.setSponsorSector}
      error={props.form.fieldErrors.sponsorSector}
    />
    <AuthTextField
      label="Contact principal"
      icon="person"
      placeholder="Prénom Nom. Responsable marketing"
      value={props.form.displayName}
      onChangeText={props.form.setDisplayName}
      error={props.form.fieldErrors.displayName}
    />
  </SponsorStepShell>
);

export const SignupSponsorCampaignStep: React.FC<StepProps> = (props) => (
  <SponsorStepShell
    {...props}
    page="sponsor_campaign"
    hint="Définissez vos objectifs pour calibrer la formule adaptée à votre ambition."
  >
    <SignupOptionPicker
      label="Budget mensuel estimé"
      options={SPONSOR_BUDGET_RANGES}
      value={props.form.sponsorBudget}
      onChange={props.form.setSponsorBudget}
      error={props.form.fieldErrors.sponsorBudget}
    />
    <SignupChipMultiPicker
      label="Objectifs de campagne"
      options={SPONSOR_CAMPAIGN_GOALS}
      selected={props.form.sponsorGoals}
      onToggle={(value) => props.form.toggleSponsorListValue('goals', value)}
      error={props.form.fieldErrors.sponsorGoals}
    />
    <SignupChipMultiPicker
      label="Public cible"
      options={SPONSOR_TARGET_AUDIENCES}
      selected={props.form.sponsorAudience}
      onToggle={(value) => props.form.toggleSponsorListValue('audience', value)}
      error={props.form.fieldErrors.sponsorAudience}
    />
  </SponsorStepShell>
);

export const SignupSponsorTargetingStep: React.FC<StepProps> = (props) => (
  <SponsorStepShell
    {...props}
    page="sponsor_targeting"
    hint="Précisez vos zones géographiques et disciplines pour un ciblage optimal."
  >
    <SignupChipMultiPicker
      label="Régions ciblées"
      options={SPONSOR_REGIONS}
      selected={props.form.sponsorRegions}
      onToggle={(value) => props.form.toggleSponsorListValue('regions', value)}
      error={props.form.fieldErrors.sponsorRegions}
    />
    <SignupChipMultiPicker
      label="Catégories sportives"
      options={SPONSOR_SPORTS}
      selected={props.form.sponsorSports}
      onToggle={(value) => props.form.toggleSponsorListValue('sports', value)}
      error={props.form.fieldErrors.sponsorSports}
    />
    <AuthTextField
      label="Ville principale"
      icon="location"
      placeholder="Ex. Lyon, Marseille…"
      value={props.form.city}
      onChangeText={props.form.setCity}
      error={props.form.fieldErrors.city}
    />
    <AuthTextField
      label="Téléphone (optionnel)"
      icon="call"
      placeholder="+33 6 12 34 56 78"
      value={props.form.sponsorPhone}
      onChangeText={props.form.setSponsorPhone}
    />
    <AuthTextField
      label="Message complémentaire (optionnel)"
      icon="chat"
      placeholder="Calendrier souhaité, précisions sur le projet…"
      value={props.form.professionalHeadline}
      onChangeText={props.form.setProfessionalHeadline}
      multiline
    />
  </SponsorStepShell>
);

const styles = StyleSheet.create({
  hintBox: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  hintText: {
    fontSize: 13,
    lineHeight: 19,
  },
});

function createChipStyles(c: ReturnType<typeof useSignupFlowTheme>['colors']) {
  return StyleSheet.create({
    wrap: { marginBottom: spacing.lg },
    label: {
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      color: c.textMuted,
      marginBottom: spacing.sm,
    },
    row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: c.border,
      backgroundColor: c.surface,
    },
    chipActive: {
      borderColor: c.accent,
      backgroundColor: c.accentSoft,
    },
    chipText: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textSecondary,
    },
    chipTextActive: {
      color: c.accent,
      fontWeight: '700',
    },
    error: {
      marginTop: spacing.xs,
      fontSize: 12,
      color: c.error,
    },
  });
}
