import React, { useMemo } from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { SignupStepLayout } from './SignupStepLayout';
import { SignupFooterButton } from './SignupFooterButton';
import type { SignupForm } from './useSignupForm';
import { getPlayerStepMeta } from './signupPlayerStepMeta';
import { useTranslation } from '../../context/LocaleContext';
import { spacing, radius } from '../../theme/designTokens';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { AppColors } from '../../theme/universeTheme';

interface SignupStatsStepProps {
  form: SignupForm;
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupForm['phases'];
  phaseIndex?: number;
  onBack: () => void;
}

export const SignupStatsStep: React.FC<SignupStatsStepProps> = ({
  form,
  stepIndex,
  stepTotal,
  stepName,
  phases,
  phaseIndex,
  onBack,
}) => {
  const { colors: c } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(c), [c]);
  const { t } = useTranslation();
  const meta = getPlayerStepMeta(form.productLine, 'stats', t);

  return (
    <SignupStepLayout
      stepIndex={stepIndex}
      stepTotal={stepTotal}
      stepName={stepName}
      phases={phases}
      phaseIndex={phaseIndex}
      title={meta.title}
      subtitle={meta.subtitle}
      contentKey="player-stats"
      heroIcon={meta.heroIcon}
      onBack={onBack}
      footer={
        <>
          <SignupFooterButton label={t('signup.form.continue')} onPress={() => form.advanceFromCurrentPage()} />
          <View style={styles.skipWrap}>
            <SignupFooterButton
              label={t('signup.form.skipStep')}
              variant="secondary"
              showArrow={false}
              onPress={() => form.goNext()}
            />
          </View>
        </>
      }
    >
      <View>
        <View style={styles.statRow}>
          {(
            [
              [t('signup.form.stats.matches'), form.statMatches, form.setStatMatches, form.fieldErrors.statMatches],
              [t('signup.form.stats.goals'), form.statGoals, form.setStatGoals, form.fieldErrors.statGoals],
              [t('signup.form.stats.assists'), form.statAssists, form.setStatAssists, form.fieldErrors.statAssists],
            ] as const
          ).map(([label, value, setter, err]) => (
            <View key={label} style={styles.statCell}>
              <Text style={styles.statLabel}>{label}</Text>
              <TextInput
                style={[styles.statInput, err ? styles.statInputError : null]}
                placeholder="0"
                placeholderTextColor={c.textMuted}
                value={value}
                onChangeText={setter}
                keyboardType="number-pad"
              />
              {err ? <Text style={styles.statError}>{err}</Text> : null}
            </View>
          ))}
        </View>
      </View>
    </SignupStepLayout>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    skipWrap: { marginTop: spacing.sm },
    statRow: { flexDirection: 'row', gap: spacing.sm },
    statCell: { flex: 1 },
    statLabel: { fontSize: 11, fontWeight: '700', color: c.textMuted, marginBottom: 4 },
    statInput: {
      backgroundColor: c.surface,
      borderRadius: radius.md,
      padding: spacing.md,
      color: c.text,
      borderWidth: 1,
      borderColor: c.border,
      fontSize: 16,
      textAlign: 'center',
    },
    statInputError: { borderColor: c.error },
    statError: {
      fontSize: 10,
      color: c.error,
      fontWeight: '600',
      marginTop: 4,
      textAlign: 'center',
    },
  });
}
