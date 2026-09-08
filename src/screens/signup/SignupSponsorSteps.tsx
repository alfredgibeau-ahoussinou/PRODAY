import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { AuthTextField } from '../../components/auth/AuthTextField';
import { SignupOptionPicker } from '../../components/signup/SignupOptionPicker';
import { SignupPoleShell } from './SignupPoleShell';
import type { SignupForm } from './useSignupForm';
import { useSignupFlowTheme } from './SignupFlowContext';
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
import { ProDayText } from '../../components/ui/ProDayText';
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

const SignupChipMultiPicker: React.FC<{
  label: string;
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
  error?: string;
}> = ({ label, options, selected, onToggle, error }) => {
  const { colors: c } = useSignupFlowTheme();

  return (
    <View style={chipStyles.wrap}>
      <ProDayText style={[chipStyles.label, { color: c.textMuted }]}>{label}</ProDayText>
      <View style={chipStyles.row}>
        {options.map((opt) => {
          const active = selected.includes(opt);
          return (
            <Pressable
              key={opt}
              style={[
                chipStyles.chip,
                { borderColor: c.border, backgroundColor: c.surface },
                active && { borderColor: c.accent, backgroundColor: c.accentSoft },
              ]}
              onPress={() => onToggle(opt)}
            >
              <ProDayText
                style={[
                  chipStyles.chipText,
                  { color: c.textSecondary },
                  active && { color: c.accent, fontFamily: fontFamily.bold },
                ]}
              >
                {opt}
              </ProDayText>
            </Pressable>
          );
        })}
      </View>
      {error ? (
        <ProDayText style={[chipStyles.error, { color: c.error }]}>{error}</ProDayText>
      ) : null}
    </View>
  );
};

function SponsorShell(
  props: StepProps & { page: SignupPageId; hint: string; children: React.ReactNode }
) {
  const { page, hint, children, ...rest } = props;
  return (
    <SignupPoleShell {...rest} page={page} hint={hint}>
      {children}
    </SignupPoleShell>
  );
}

export const SignupSponsorCompanyStep: React.FC<StepProps> = (props) => (
  <SponsorShell
    {...props}
    page="sponsor_company"
    hint="Ces informations personnalisent votre espace sponsor ProDay."
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
      placeholder="Prénom Nom · Responsable marketing"
      value={props.form.displayName}
      onChangeText={props.form.setDisplayName}
      error={props.form.fieldErrors.displayName}
    />
  </SponsorShell>
);

export const SignupSponsorCampaignStep: React.FC<StepProps> = (props) => (
  <SponsorShell
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
  </SponsorShell>
);

export const SignupSponsorTargetingStep: React.FC<StepProps> = (props) => (
  <SponsorShell
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
  </SponsorShell>
);

const chipStyles = StyleSheet.create({
  wrap: { marginBottom: spacing.lg },
  label: {
    fontSize: 11,
    fontFamily: fontFamily.bold,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    paddingVertical: spacing.sm + 2,
    paddingHorizontal: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fontFamily.semibold,
  },
  error: {
    marginTop: spacing.xs,
    fontSize: 12,
    fontFamily: fontFamily.semibold,
  },
});
