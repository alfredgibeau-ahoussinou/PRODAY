import React, { createContext, useContext, useMemo } from 'react';
import { StyleSheet, View, useWindowDimensions } from 'react-native';
import { ProDayText } from '../ui/ProDayText';
import { PARENT_SITE, type ParentPageIdentity } from '../../content/parentPageIdentity';
import { spacing } from '../../theme/designTokens';
import { useThemedScreen } from '../../hooks/useThemedScreen';
import { AppBackButton } from '../ui/AppBackButton';
import { useParentShellNav } from '../../features/parent/shell/ParentShellNavContext';
import { useAppearance } from '../../context/AppearanceContext';
import type { ParentTabId } from '../../features/parent/navigation/parentNavConfig';

const Ctx = createContext<ParentPageIdentity | null>(null);

export function useParentPageIdentity(): ParentPageIdentity | null {
  return useContext(Ctx);
}

type Props = {
  identity: ParentPageIdentity;
  /** Héros compact — désactivé par défaut (style Coach). */
  showHero?: boolean;
  showBack?: boolean;
  onBack?: () => void;
  fallbackTab?: ParentTabId;
  children: React.ReactNode;
};

/** Cadre page Parent — fond calme, peu de chrome. */
export function ParentPageFrame({
  identity,
  showHero = false,
  showBack,
  onBack,
  fallbackTab,
  children,
}: Props) {
  const { colors: c } = useThemedScreen();
  const { tokens: glassTokens, isEffectiveGlass } = useAppearance();
  const { width } = useWindowDimensions();
  const wide = width >= 900;
  const parentNav = useParentShellNav();
  const styles = useMemo(() => createStyles(c.background), [c.background]);

  const isRootHome = identity.id === 'home';
  const shouldShowBack =
    showBack ?? (onBack ? true : Boolean(wide && (parentNav?.canGoBack || !isRootHome)));

  return (
    <Ctx.Provider value={identity}>
      <View style={styles.root}>
        {shouldShowBack && !showHero ? (
          <View
            style={[
              styles.navBar,
              isEffectiveGlass && glassTokens.blurStyle,
              isEffectiveGlass && {
                borderBottomWidth: 1,
                borderBottomColor: glassTokens.border,
              },
            ]}
          >
            <AppBackButton
              onPress={onBack}
              fallbackNavId={fallbackTab ?? 'home'}
              style={styles.backBtn}
            />
            <ProDayText variant="section" numberOfLines={1} style={styles.navBarTitle}>
              {identity.title}
            </ProDayText>
          </View>
        ) : null}

        {showHero ? (
          <View style={styles.hero}>
            <View style={styles.heroTopRow}>
              {shouldShowBack ? (
                <AppBackButton
                  onPress={onBack}
                  fallbackNavId={fallbackTab ?? 'home'}
                  style={styles.backBtn}
                />
              ) : null}
              <View style={{ flex: 1, minWidth: 0, gap: 4 }}>
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
            </View>
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
    navBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      paddingBottom: spacing.xs,
      gap: spacing.sm,
    },
    navBarTitle: {
      fontSize: 18,
      fontWeight: '700',
      color: PARENT_SITE.ink,
    },
    backBtn: {
      alignSelf: 'center',
    },
    hero: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.md,
      paddingBottom: spacing.sm,
      gap: 4,
    },
    heroTopRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
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
