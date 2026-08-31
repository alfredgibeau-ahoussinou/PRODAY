import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { type ClubPageIdentity } from '../../content/clubPageIdentity';
import { CLUB_TOKENS } from '../../features/club/theme/clubTokens';
import { spacing } from '../../theme/designTokens';

const ClubPageIdentityContext = createContext<ClubPageIdentity | null>(null);

export function useClubPageIdentity(): ClubPageIdentity | null {
  return useContext(ClubPageIdentityContext);
}

type Props = {
  identity: ClubPageIdentity;
  showHero?: boolean;
  children: React.ReactNode;
};

/**
 * Cadre page Club — fond noir pur (chrome app).
 * Conservé pour panels legacy / upsell ; le shell principal utilise ClubBrandHeader.
 */
export function ClubPageFrame({ identity, showHero = true, children }: Props) {
  const styles = useMemo(() => createStyles(identity), [identity]);

  return (
    <ClubPageIdentityContext.Provider value={identity}>
      <View style={styles.root}>
        <View style={[styles.accentBar, { backgroundColor: CLUB_TOKENS.pitch }]} pointerEvents="none" />

        {identity.motif === 'grid' ? (
          <View style={styles.hairGrid} pointerEvents="none" />
        ) : null}
        {identity.motif === 'stripes' ? (
          <View style={styles.hairStripe} pointerEvents="none" />
        ) : null}

        {showHero ? (
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <Icon name={identity.icon} size={14} color={CLUB_TOKENS.pitch} />
              <ProDayText variant="caption" style={styles.eyebrow}>
                {identity.eyebrow}
              </ProDayText>
            </View>
            <ProDayText
              variant="title"
              style={[
                styles.title,
                identity.layout === 'editorial' && styles.titleEditorial,
                identity.layout === 'map' && styles.titleMap,
              ]}
            >
              {identity.title}
            </ProDayText>
            <ProDayText variant="caption" style={styles.support}>
              {identity.support}
            </ProDayText>
            <View style={styles.heroRule} />
          </View>
        ) : null}

        <View style={styles.body}>{children}</View>
      </View>
    </ClubPageIdentityContext.Provider>
  );
}

function createStyles(_identity: ClubPageIdentity) {
  return StyleSheet.create({
    root: {
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      backgroundColor: CLUB_TOKENS.bg,
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      opacity: 0.85,
    },
    hairGrid: {
      position: 'absolute',
      right: 0,
      top: 48,
      width: 120,
      height: 120,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: CLUB_TOKENS.border,
      opacity: 0.45,
    },
    hairStripe: {
      position: 'absolute',
      right: 24,
      top: 0,
      bottom: 0,
      width: StyleSheet.hairlineWidth,
      backgroundColor: CLUB_TOKENS.border,
    },
    hero: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: 6,
      zIndex: 1,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: CLUB_TOKENS.border,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    eyebrow: {
      color: CLUB_TOKENS.pitch,
      textTransform: 'uppercase',
      letterSpacing: 2.4,
      fontSize: 10,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    title: {
      color: CLUB_TOKENS.foreground,
      fontWeight: '800',
      letterSpacing: -0.8,
      fontSize: 26,
      lineHeight: 30,
    },
    titleEditorial: {
      fontSize: 30,
      lineHeight: 34,
      letterSpacing: -1,
    },
    titleMap: {
      fontSize: 28,
      lineHeight: 32,
    },
    support: {
      color: CLUB_TOKENS.muted,
      lineHeight: 18,
      maxWidth: 340,
      marginTop: 2,
    },
    heroRule: {
      marginTop: spacing.sm,
      height: 2,
      width: 48,
      backgroundColor: CLUB_TOKENS.pitch,
      opacity: 0.9,
    },
    body: {
      flex: 1,
      minHeight: 0,
      zIndex: 1,
    },
  });
}
