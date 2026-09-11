import React, { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';
import { toBirthDateIso } from '../../utils/joueurBirthAge';
import { fontFamily } from '../../theme/typography';
import { AUTH_XP } from '../../features/auth/experience/tokens';

type Props = {
  day: string;
  month: string;
  year: string;
  onDay: (v: string) => void;
  onMonth: (v: string) => void;
  onYear: (v: string) => void;
  accent?: string;
  error?: string | null;
  label?: string;
  hint?: string;
  variant?: 'dark' | 'light';
};

/** Saisie JJ / MM / AAAA → ISO via `toBirthDateIso`. */
export function BirthDateFields({
  day,
  month,
  year,
  onDay,
  onMonth,
  onYear,
  accent = AUTH_XP.gold,
  error,
  label = 'Date de naissance',
  hint = 'Votre catégorie officielle FFF évolue automatiquement à chaque anniversaire.',
}: Props) {
  const styles = useMemo(() => createStyles(accent), [accent]);

  return (
    <View style={styles.wrap}>
      <ProDayText variant="caption" style={styles.label}>
        {label}
      </ProDayText>
      <View style={styles.row}>
        <Field
          value={day}
          onChange={onDay}
          placeholder="JJ"
          maxLength={2}
          styles={styles}
        />
        <ProDayText variant="section" style={styles.sep}>
          /
        </ProDayText>
        <Field
          value={month}
          onChange={onMonth}
          placeholder="MM"
          maxLength={2}
          styles={styles}
        />
        <ProDayText variant="section" style={styles.sep}>
          /
        </ProDayText>
        <Field
          value={year}
          onChange={onYear}
          placeholder="AAAA"
          maxLength={4}
          styles={styles}
          flex={1.4}
        />
      </View>
      {error ? (
        <ProDayText variant="caption" style={styles.error}>
          {error}
        </ProDayText>
      ) : hint ? (
        <ProDayText variant="caption" style={styles.hint}>
          {hint}
        </ProDayText>
      ) : null}
    </View>
  );
}

function Field({
  value,
  onChange,
  placeholder,
  maxLength,
  styles,
  flex = 1,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  maxLength: number;
  styles: ReturnType<typeof createStyles>;
  flex?: number;
}) {
  const filled = Boolean(value && value.length > 0);

  return (
    <TextInput
      value={value}
      onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, maxLength))}
      placeholder={placeholder}
      placeholderTextColor={AUTH_XP.textDim}
      keyboardType="number-pad"
      maxLength={maxLength}
      selectionColor={AUTH_XP.gold}
      style={[styles.input, filled && styles.inputFilled, { flex }]}
    />
  );
}

export function birthPartsToIso(day: string, month: string, year: string): string | null {
  const d = parseInt(day, 10);
  const m = parseInt(month, 10);
  const y = parseInt(year, 10);
  if (!Number.isFinite(d) || !Number.isFinite(m) || !Number.isFinite(y)) return null;
  return toBirthDateIso(y, m, d);
}

function createStyles(accent: string) {
  return StyleSheet.create({
    wrap: {
      gap: 6,
      marginBottom: 16,
    },
    label: {
      color: AUTH_XP.textMuted,
      letterSpacing: 0.5,
      textTransform: 'uppercase',
      fontSize: 11,
      fontFamily: fontFamily.semibold,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    input: {
      borderWidth: 1,
      borderColor: AUTH_XP.border,
      backgroundColor: AUTH_XP.inputBg,
      borderRadius: radius.md,
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      color: AUTH_XP.text,
      fontFamily: fontFamily.bold,
      fontSize: 16,
      textAlign: 'center',
      minHeight: 50,
    },
    inputFilled: {
      backgroundColor: AUTH_XP.inputBgFilled,
      borderColor: 'rgba(255, 255, 255, 0.22)',
    },
    sep: {
      color: AUTH_XP.textDim,
      fontFamily: fontFamily.bold,
      fontSize: 18,
    },
    hint: {
      color: AUTH_XP.textDim,
      fontSize: 12,
      lineHeight: 17,
      fontFamily: fontFamily.regular,
    },
    error: {
      color: AUTH_XP.error,
      fontSize: 12,
      fontFamily: fontFamily.semibold,
    },
  });
}
