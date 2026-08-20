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

        {showHero ? (
          <View style={styles.hero}>
            <View style={styles.heroTop}>
              <Icon name={identity.icon} size={13} color={SUPPORTER_SITE.accent} />
              <ProDayText variant="caption" style={styles.eyebrow}>
                {identity.eyebrow}
              </ProDayText>
              {badge ? (
                <ProDayText variant="caption" style={styles.badgeText}>
                  {badge}
                </ProDayText>
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

function createStyles(_identity: SupporterPageIdentity) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: SUPPORTER_SITE.bg },
    hero: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: 8,
    },
    heroTop: { flexDirection: 'row', alignItems: 'center', gap: 8 },
    eyebrow: {
      color: SUPPORTER_SITE.accent,
      textTransform: 'uppercase',
      letterSpacing: 2.4,
      fontSize: 10,
      fontWeight: '600',
      flex: 1,
    },
    badgeText: {
      color: SUPPORTER_SITE.muted,
      fontSize: 9,
      fontWeight: '600',
      letterSpacing: 1.2,
      textTransform: 'uppercase',
    },
    title: {
      color: SUPPORTER_SITE.foreground,
      fontWeight: '700',
      letterSpacing: -0.8,
      fontSize: 28,
    },
    support: { color: SUPPORTER_SITE.muted, lineHeight: 20, fontSize: 13 },
    heroRule: {
      marginTop: 10,
      height: StyleSheet.hairlineWidth,
      backgroundColor: SUPPORTER_SITE.border,
    },
    body: { flex: 1, minHeight: 0 },
  });
}
