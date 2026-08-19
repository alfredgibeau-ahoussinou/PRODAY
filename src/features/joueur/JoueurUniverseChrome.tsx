import React from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import type { JoueurPageIdentity } from '../../content/joueurPageIdentity';
import { JOUEUR_SITE } from '../../content/joueurPageIdentity';
import {
  JoueurIdentityProvider,
} from '../../components/player/joueurPortalUi';
import { ProDayText } from '../../components/ui/ProDayText';
import { spacing } from '../../theme/designTokens';
import { useJoueurTheme } from '../../hooks/useJoueurTheme';

type Props = {
  identity: JoueurPageIdentity;
  title?: string;
  kicker?: string;
  children: React.ReactNode;
};

/**
 * Chrome léger pour onglets secondaires — fond + accent, sans plaque XP fake.
 */
export function JoueurUniverseChrome({
  identity,
  title,
  kicker,
  children,
}: Props) {
  const theme = useJoueurTheme();
  return (
    <JoueurIdentityProvider identity={identity}>
      <View style={[styles.root, { backgroundColor: JOUEUR_SITE.bg }]}>
        <LinearGradient
          colors={identity.wash}
          locations={[0, 0.45, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={[styles.accentBar, { backgroundColor: theme.accent }]} />
        {title ? (
          <View style={styles.head}>
            {kicker ? (
              <ProDayText
                variant="caption"
                style={[styles.kicker, { color: theme.accent }]}
              >
                {kicker.toUpperCase()}
              </ProDayText>
            ) : null}
            <ProDayText variant="title" style={styles.title}>
              {title}
            </ProDayText>
          </View>
        ) : null}
        <View style={styles.body}>{children}</View>
      </View>
    </JoueurIdentityProvider>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0 },
  accentBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    zIndex: 2,
  },
  head: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xs,
    gap: 4,
    zIndex: 1,
  },
  kicker: {
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  title: {
    color: JOUEUR_SITE.foreground,
    fontWeight: '900',
    fontSize: 22,
  },
  body: { flex: 1, minHeight: 0, zIndex: 1 },
});
