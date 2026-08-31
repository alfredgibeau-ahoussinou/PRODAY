import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { PARENT_SITE, type ParentPageIdentity } from '../../content/parentPageIdentity';
import { spacing } from '../../theme/designTokens';
import { useThemedScreen } from '../../hooks/useThemedScreen';

const Ctx = createContext<ParentPageIdentity | null>(null);

export function useParentPageIdentity(): ParentPageIdentity | null {
  return useContext(Ctx);
}

type Props = {
  identity: ParentPageIdentity;
  /** Héros compact — désactivé par défaut (style Coach). */
  showHero?: boolean;
  children: React.ReactNode;
};

/** Cadre page Parent — fond calme, peu de chrome. */
export function ParentPageFrame({ identity, showHero = false, children }: Props) {
  const { colors: c } = useThemedScreen();
  const styles = useMemo(() => createStyles(c.background), [c.background]);

  return (
    <Ctx.Provider value={identity}>
      <View style={styles.root}>
        {showHero ? (
          <View style={styles.hero}>
            <ProDayText variant="caption" style={styles.eyebrow}>
              {identity.eyebrow}
            </ProDayText>
            <ProDayText variant="section" style={styles.title}>
              {identity.title}
            </ProDayText>
            <ProDayText variant="caption" style={styles.support}>
              {identity.support}
            </ProDayText>
          </View>
        ) : null}
        <View style={styles.body}>{children}</View>
      </View>
    </Ctx.Provider>
  );
}

function createStyles(bg: string) {
  return StyleSheet.create({
    root: { flex: 1, minHeight: 0, backgroundColor: bg || PARENT_SITE.bg },
    hero: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: 4,
    },
    eyebrow: {
      color: PARENT_SITE.accent,
      fontWeight: '700',
      letterSpacing: 0.8,
      textTransform: 'uppercase',
      fontSize: 11,
    },
    title: { color: PARENT_SITE.ink, fontWeight: '700', fontSize: 22 },
    support: { color: PARENT_SITE.muted, lineHeight: 18 },
    body: { flex: 1, minHeight: 0 },
  });
}
