import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { CLUB_SITE, type ClubPageIdentity } from '../../content/clubPageIdentity';
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
 * Cadre terminal cinéma — langage site `/pro-club`.
 * Mono kicker, wash navy→noir, accent électrique unique.
 */
export function ClubPageFrame({ identity, showHero = true, children }: Props) {
  const styles = useMemo(() => createStyles(identity), [identity]);

  return (
    <ClubPageIdentityContext.Provider value={identity}>
      <View style={styles.root}>
        <LinearGradient
          colors={identity.wash}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Glow bas — comme ImmersivePoleHero */}
        <LinearGradient
          colors={['transparent', CLUB_SITE.glow, 'transparent']}
          start={{ x: 0.5, y: 0.15 }}
          end={{ x: 0.5, y: 0.55 }}
          style={styles.glow}
          pointerEvents="none"
        />
        <View style={styles.accentBar} pointerEvents="none" />

        {identity.motif === 'grid' ? (
          <View style={styles.hairGrid} pointerEvents="none" />
        ) : null}
        {identity.motif === 'stripes' ? (
          <View style={styles.hairStripe} pointerEvents="none" />
        ) : null}

        {showHero ? (
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <Icon name={identity.icon} size={14} color={CLUB_SITE.accent} />
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

function createStyles(identity: ClubPageIdentity) {
  return StyleSheet.create({
    root: {
      flex: 1,
      minHeight: 0,
      overflow: 'hidden',
      backgroundColor: CLUB_SITE.bg,
    },
    glow: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      height: 180,
      opacity: 0.45,
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: CLUB_SITE.accent,
      opacity: 0.9,
    },
    hairGrid: {
      position: 'absolute',
      right: 0,
      top: 48,
      width: 120,
      height: 120,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: CLUB_SITE.border,
      opacity: 0.5,
    },
    hairStripe: {
      position: 'absolute',
      right: 24,
      top: 0,
      bottom: 0,
      width: StyleSheet.hairlineWidth,
      backgroundColor: CLUB_SITE.border,
    },
    hero: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: spacing.md,
      gap: 6,
      zIndex: 1,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: CLUB_SITE.border,
    },
    heroTop: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      marginBottom: 4,
    },
    eyebrow: {
      color: CLUB_SITE.accent,
      textTransform: 'uppercase',
      letterSpacing: 2.8,
      fontSize: 10,
      fontWeight: '700',
      fontVariant: ['tabular-nums'],
    },
    title: {
      color: CLUB_SITE.foreground,
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
      color: CLUB_SITE.muted,
      lineHeight: 18,
      maxWidth: 340,
      marginTop: 2,
    },
    heroRule: {
      marginTop: spacing.sm,
      height: 2,
      width: 48,
      backgroundColor: CLUB_SITE.accent,
      opacity: 0.85,
    },
    body: {
      flex: 1,
      minHeight: 0,
      zIndex: 1,
    },
  });
}
