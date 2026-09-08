import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';
import { AUTH_XP } from '../../features/auth/experience/tokens';
import { fontFamily } from '../../theme/typography';
import type { OfficialFffClub } from '../../services/fffOfficialRegistry.service';

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

/** Récap affiliation FFF partagé (joueur, coach, club, parent). */
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
  const styles = useMemo(() => createStyles(), []);

  return (
    <View style={styles.card}>
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
  );
};

function createStyles() {
  return StyleSheet.create({
    card: {
      backgroundColor: AUTH_XP.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: AUTH_XP.border,
      padding: spacing.md,
      marginTop: spacing.md,
      gap: 4,
    },
    title: {
      fontSize: 13,
      fontFamily: fontFamily.bold,
      color: AUTH_XP.goldBright,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    line: {
      fontSize: 13,
      color: AUTH_XP.text,
      lineHeight: 18,
      fontFamily: fontFamily.semibold,
    },
    muted: {
      fontSize: 12,
      color: AUTH_XP.textMuted,
      lineHeight: 17,
      fontFamily: fontFamily.regular,
    },
    warn: {
      fontSize: 12,
      color: AUTH_XP.error,
      fontFamily: fontFamily.semibold,
      marginTop: 2,
    },
    minor: {
      fontSize: 12,
      color: '#FBBF24',
      fontFamily: fontFamily.semibold,
      marginTop: spacing.xs,
    },
  });
}
