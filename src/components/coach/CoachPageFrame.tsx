import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../../components/ui/ProDayText';
import { Icon } from '../../components/ui/Icon';
import { COACH_SITE, type CoachPageIdentity } from '../../content/coachPageIdentity';
import { spacing } from '../../theme/designTokens';

const Ctx = createContext<CoachPageIdentity | null>(null);

export function useCoachPageIdentity(): CoachPageIdentity | null {
  return useContext(Ctx);
}

type Props = {
  identity: CoachPageIdentity;
  showHero?: boolean;
  children: React.ReactNode;
};

export function CoachPageFrame({ identity, showHero = true, children }: Props) {
  const styles = useMemo(() => createStyles(identity), [identity]);

  return (
    <Ctx.Provider value={identity}>
      <View style={styles.root}>
        <LinearGradient
          colors={identity.wash}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', COACH_SITE.glow, 'transparent']}
          start={{ x: 0.5, y: 0.15 }}
          end={{ x: 0.5, y: 0.55 }}
          style={styles.glow}
          pointerEvents="none"
        />
        <View style={styles.accentBar} pointerEvents="none" />

        {showHero ? (
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <Icon name={identity.icon} size={14} color={COACH_SITE.accent} />
              <ProDayText variant="caption" style={styles.eyebrow}>
                {identity.eyebrow}
              </ProDayText>
            </View>
            <ProDayText variant="title" style={styles.title}>
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
    </Ctx.Provider>
  );
}

function createStyles(identity: CoachPageIdentity) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: COACH_SITE.bg },
    glow: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: '18%',
      height: 120,
      opacity: 0.55,
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: identity.accent,
      opacity: 0.9,
    },
    hero: {
      paddingHorizontal: spacing.md,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: 4,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyebrow: {
      color: COACH_SITE.accent,
      textTransform: 'uppercase',
      letterSpacing: 2,
      fontSize: 10,
      fontWeight: '800',
    },
    title: {
      color: COACH_SITE.foreground,
      fontWeight: '800',
      letterSpacing: -0.6,
      fontSize: 28,
    },
    support: { color: COACH_SITE.muted, lineHeight: 18 },
    heroRule: {
      marginTop: spacing.sm,
      height: StyleSheet.hairlineWidth,
      backgroundColor: COACH_SITE.border,
    },
    body: { flex: 1, minHeight: 0 },
  });
}
