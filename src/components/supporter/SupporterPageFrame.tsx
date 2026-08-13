import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ProDayText } from '../ui/ProDayText';
import { Icon } from '../ui/Icon';
import {
  SUPPORTER_SITE,
  type SupporterPageIdentity,
} from '../../content/supporterPageIdentity';
import { spacing } from '../../theme/designTokens';

const Ctx = createContext<SupporterPageIdentity | null>(null);

export function useSupporterPageIdentity(): SupporterPageIdentity | null {
  return useContext(Ctx);
}

type Props = {
  identity: SupporterPageIdentity;
  showHero?: boolean;
  badge?: string;
  children: React.ReactNode;
};

export function SupporterPageFrame({
  identity,
  showHero = true,
  badge,
  children,
}: Props) {
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
          colors={['transparent', SUPPORTER_SITE.glow, 'transparent']}
          start={{ x: 0.85, y: 0.05 }}
          end={{ x: 0.15, y: 0.55 }}
          style={styles.glow}
          pointerEvents="none"
        />
        <View style={styles.accentBar} pointerEvents="none" />

        {showHero ? (
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <Icon name={identity.icon} size={14} color={SUPPORTER_SITE.accent} />
              <ProDayText variant="caption" style={styles.eyebrow}>
                {identity.eyebrow}
              </ProDayText>
              {badge ? (
                <View style={styles.badge}>
                  <ProDayText variant="caption" style={styles.badgeText}>
                    {badge}
                  </ProDayText>
                </View>
              ) : null}
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

function createStyles(identity: SupporterPageIdentity) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: SUPPORTER_SITE.bg },
    glow: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: '8%',
      height: 160,
      opacity: 0.5,
    },
    accentBar: {
      position: 'absolute',
      left: 0,
      top: 0,
      bottom: 0,
      width: 2,
      backgroundColor: identity.accent,
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
      color: SUPPORTER_SITE.accent,
      textTransform: 'uppercase',
      letterSpacing: 2.2,
      fontSize: 10,
      fontWeight: '800',
      flex: 1,
    },
    badge: {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: SUPPORTER_SITE.free,
      paddingHorizontal: 8,
      paddingVertical: 3,
      backgroundColor: 'rgba(167, 139, 250, 0.12)',
    },
    badgeText: {
      color: SUPPORTER_SITE.free,
      fontSize: 9,
      fontWeight: '800',
      letterSpacing: 1,
      textTransform: 'uppercase',
    },
    title: {
      color: SUPPORTER_SITE.foreground,
      fontWeight: '800',
      letterSpacing: -0.6,
      fontSize: 26,
    },
    support: { color: SUPPORTER_SITE.muted, lineHeight: 18 },
    heroRule: {
      marginTop: 8,
      height: StyleSheet.hairlineWidth,
      backgroundColor: SUPPORTER_SITE.border,
    },
    body: { flex: 1, minHeight: 0 },
  });
}
