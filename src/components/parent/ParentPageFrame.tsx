import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import { PARENT_SITE, type ParentPageIdentity } from '../../content/parentPageIdentity';
import { spacing } from '../../theme/designTokens';

const Ctx = createContext<ParentPageIdentity | null>(null);

export function useParentPageIdentity(): ParentPageIdentity | null {
  return useContext(Ctx);
}

type Props = {
  identity: ParentPageIdentity;
  showHero?: boolean;
  children: React.ReactNode;
};

export function ParentPageFrame({ identity, showHero = true, children }: Props) {
  const styles = useMemo(() => createStyles(), []);

  return (
    <Ctx.Provider value={identity}>
      <View style={styles.root}>
        <LinearGradient
          colors={[...identity.wash]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <LinearGradient
          colors={['transparent', PARENT_SITE.glow, 'transparent']}
          start={{ x: 0.5, y: 0.12 }}
          end={{ x: 0.5, y: 0.5 }}
          style={styles.glow}
          pointerEvents="none"
        />
        <View style={styles.accentBar} pointerEvents="none" />

        {showHero ? (
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <Icon name={identity.icon} size={14} color={PARENT_SITE.accent} />
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

function createStyles() {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: PARENT_SITE.bg },
    glow: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: '16%',
      height: 120,
      opacity: 0.55,
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 3,
      backgroundColor: PARENT_SITE.accent,
      opacity: 0.85,
    },
    hero: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: 6,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyebrow: {
      color: PARENT_SITE.accent,
      fontWeight: '800',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
      fontSize: 11,
    },
    title: { color: PARENT_SITE.ink, fontWeight: '900', fontSize: 26 },
    support: { color: PARENT_SITE.muted, lineHeight: 18 },
    heroRule: {
      marginTop: spacing.xs,
      height: StyleSheet.hairlineWidth,
      backgroundColor: 'rgba(45, 212, 191, 0.35)',
    },
    body: { flex: 1, minHeight: 0 },
  });
}
