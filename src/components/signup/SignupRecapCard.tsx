import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import type { OfficialFffClub } from '../../services/fffOfficialRegistry.service';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import type { SignupVisualChrome } from '../../screens/signup/signupVisualSystem';

type SignupRecapCardProps = {
  title?: string;
  club?: OfficialFffClub | null;
  category?: string;
  displayName?: string;
  withoutClub?: boolean;
  extraLines?: string[];
  warn?: string | null;
  minorHint?: string | null;
};

/** Récap FFF — surface shell + accent pôle (plus d’or générique). */
export const SignupRecapCard: React.FC<SignupRecapCardProps> = ({
  title = 'Récapitulatif FFF',
  club,
  category,
  displayName,
  withoutClub,
  extraLines,
  warn,
  minorHint,
}) => {
  const { visual } = useSignupFlowTheme();
  const styles = useMemo(() => createStyles(visual), [visual]);

  return (
    <View style={styles.card}>
      <View style={[styles.accentRail, { backgroundColor: visual.accent }]} />
      <View style={styles.content}>
        <ProDayText style={styles.title}>{title}</ProDayText>
        {withoutClub ? (
          <ProDayText style={styles.line}>
            Sans club{displayName?.trim() ? ` · ${displayName.trim()}` : ''}
          </ProDayText>
        ) : club ? (
          <>
            <ProDayText style={styles.line}>
              Club : {club.name}
              {club.fffNumber ? ` · N° ${club.fffNumber}` : ''}
            </ProDayText>
            <ProDayText style={styles.muted}>
              {[club.city, club.postalCode, club.league].filter(Boolean).join(' · ')}
            </ProDayText>
            {category ? (
              <ProDayText style={styles.line}>Équipe / catégorie : {category}</ProDayText>
            ) : warn ? (
              <ProDayText style={styles.warn}>{warn}</ProDayText>
            ) : null}
          </>
        ) : null}
        {displayName?.trim() && !withoutClub ? (
          <ProDayText style={styles.line}>Identité : {displayName.trim()}</ProDayText>
        ) : null}
        {extraLines?.map((line) => (
          <ProDayText key={line} style={styles.muted}>
            {line}
          </ProDayText>
        ))}
        {minorHint ? <ProDayText style={styles.minor}>{minorHint}</ProDayText> : null}
      </View>
    </View>
  );
};

function createStyles(v: SignupVisualChrome) {
  return StyleSheet.create({
    card: {
      flexDirection: 'row',
      backgroundColor: v.elevated,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: v.border,
      marginTop: spacing.sm,
      overflow: 'hidden',
    },
    accentRail: {
      width: 3,
    },
    content: {
      flex: 1,
      padding: spacing.md,
      gap: 4,
    },
    title: {
      fontSize: 11,
      fontFamily: fontFamily.bold,
      color: v.focus,
      textTransform: 'uppercase',
      letterSpacing: 1.1,
      marginBottom: spacing.xs,
    },
    line: {
      fontSize: 13,
      color: v.text,
      lineHeight: 18,
      fontFamily: fontFamily.semibold,
    },
    muted: {
      fontSize: 12,
      color: v.textMuted,
      lineHeight: 17,
      fontFamily: fontFamily.regular,
    },
    warn: {
      fontSize: 12,
      color: v.danger,
      fontFamily: fontFamily.semibold,
      marginTop: 2,
    },
    minor: {
      fontSize: 12,
      color: v.focus,
      fontFamily: fontFamily.semibold,
      marginTop: spacing.xs,
    },
  });
}
