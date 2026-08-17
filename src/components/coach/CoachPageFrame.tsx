import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { CoachText } from './coachPortalUi';
import { COACH_SITE, type CoachPageIdentity } from '../../content/coachPageIdentity';
import { spacing } from '../../theme/designTokens';
import { useCoachTheme } from '../../features/coach/shell/CoachThemeContext';

const Ctx = createContext<CoachPageIdentity | null>(null);

export function useCoachPageIdentity(): CoachPageIdentity | null {
  return useContext(Ctx);
}

type Props = {
  identity: CoachPageIdentity;
  showHero?: boolean;
  children: React.ReactNode;
};

export function CoachPageFrame({ identity, showHero = false, children }: Props) {
  const { tokens } = useCoachTheme();
  const styles = useMemo(() => createStyles(tokens), [tokens]);
  const wash = useMemo(
    (): [string, string] => [tokens.soft, tokens.bg],
    [tokens.soft, tokens.bg],
  );

  return (
    <Ctx.Provider value={identity}>
      <View style={styles.root}>
        <LinearGradient
          colors={wash}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {showHero ? (
          <View style={styles.hero}>
            <CoachText variant="title" style={styles.title}>
              {identity.title}
            </CoachText>
            <CoachText variant="caption" muted style={styles.support}>
              {identity.support}
            </CoachText>
          </View>
        ) : null}

        <View style={styles.body}>{children}</View>
      </View>
    </Ctx.Provider>
  );
}

function createStyles(tokens: { bg: string; foreground: string; muted: string }) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: tokens.bg },
    hero: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: 4,
    },
    title: {
      color: tokens.foreground,
      fontWeight: '700',
      letterSpacing: -0.4,
      fontSize: 26,
    },
    support: { color: tokens.muted, lineHeight: 20 },
    body: { flex: 1, minHeight: 0 },
  });
}

/** Fallback statique hors shell coach. */
export const COACH_PAGE_FRAME_FALLBACK_BG = COACH_SITE.bg;
