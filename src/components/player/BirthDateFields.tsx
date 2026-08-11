import React, { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';
import { toBirthDateIso } from '../../utils/joueurBirthAge';

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
  /** dark = univers joueur · light = inscription. */
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
  accent = '#006CFC',
  error,
  label = 'Date de naissance',
  hint = 'Ton univers évolue automatiquement à chaque anniversaire.',
  variant = 'dark',
}: Props) {
  const styles = useMemo(() => createStyles(accent, variant), [accent, variant]);

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
      ) : (
        <ProDayText variant="caption" style={styles.hint}>
          {hint}
        </ProDayText>
      )}
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
  return (
    <TextInput
      value={value}
      onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, maxLength))}
      placeholder={placeholder}
      placeholderTextColor={
        styles.input.color === '#0a0a0a' ? 'rgba(0,0,0,0.35)' : 'rgba(245,245,240,0.35)'
      }
      keyboardType="number-pad"
      maxLength={maxLength}
      style={[styles.input, { flex }]}
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

function createStyles(accent: string, variant: 'dark' | 'light') {
  const dark = variant === 'dark';
  return StyleSheet.create({
    wrap: { gap: spacing.xs },
    label: {
      color: accent,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontSize: 10,
      fontWeight: '800',
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    input: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: dark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)',
      backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
      borderRadius: radius.sm,
      paddingVertical: 12,
      paddingHorizontal: spacing.sm,
      color: dark ? '#f5f5f0' : '#0a0a0a',
      fontWeight: '700',
      fontSize: 16,
      textAlign: 'center',
      minHeight: 48,
    },
    sep: { color: dark ? 'rgba(245,245,240,0.4)' : 'rgba(0,0,0,0.35)', fontWeight: '800' },
    hint: { color: dark ? 'rgba(245,245,240,0.5)' : 'rgba(0,0,0,0.5)', lineHeight: 18 },
    error: { color: '#fb7185', fontWeight: '600' },
  });
}
