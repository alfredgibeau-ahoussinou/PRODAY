import React, { useMemo } from 'react';
import { View, StyleSheet } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { spacing, radius } from '../../theme/designTokens';
import { fontFamily } from '../../theme/typography';
import type { OfficialFffClub } from '../../services/fffOfficialRegistry.service';
import { useSignupFlowTheme } from '../../screens/signup/SignupFlowContext';
import { ClubCrestThumb } from './ClubCrestThumb';
import { LiquidGlassSurface } from '../ui/LiquidGlassSurface';

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

/** Récapitulatif épuré avec surface Liquid Glass */
export const SignupRecapCard: React.FC<SignupRecapCardProps> = ({
  title = 'Récapitulatif',
  club,
  category,
  displayName,
  withoutClub,
  extraLines,
  warn,
  minorHint,
}) => {
  const { visual } = useSignupFlowTheme();

  return (
    <LiquidGlassSurface variant="card" style={styles.card} contentStyle={styles.content}>
      <ProDayText style={styles.title}>{title}</ProDayText>

      {withoutClub ? (
        <ProDayText style={styles.line}>
          Sans club{displayName?.trim() ? ` · ${displayName.trim()}` : ''}
        </ProDayText>
      ) : club ? (
        <>
          <View style={styles.clubRow}>
            <ClubCrestThumb
              name={club.name}
              logoUrl={club.logoUrl}
              size={40}
              accent={visual.accent}
            />
            <View style={styles.clubCopy}>
              <ProDayText style={styles.clubName}>
                {club.name}
                {club.fffNumber ? ` · N° ${club.fffNumber}` : ''}
              </ProDayText>
              <ProDayText style={styles.muted}>
                {[club.city, club.postalCode, club.league].filter(Boolean).join(' · ')}
              </ProDayText>
            </View>
          </View>
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
    </LiquidGlassSurface>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: spacing.sm,
    width: '100%',
  },
  content: {
    padding: 16,
    gap: 8,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 2,
  },
  clubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clubCopy: {
    flex: 1,
    gap: 2,
  },
  clubName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  line: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.9)',
  },
  muted: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  warn: {
    fontSize: 13,
    color: '#FBBF24',
    fontWeight: '500',
  },
  minor: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontStyle: 'italic',
  },
});
