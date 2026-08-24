import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  useWindowDimensions,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthHero } from './AuthHero';
import { AuthEnter } from './AuthMotion';
import { AUTH_XP } from './tokens';

type AuthExperienceShellProps = {
  children: React.ReactNode;
  /** Toolbar (back, language) — toujours au-dessus du contenu / des anims. */
  toolbar?: React.ReactNode;
  /** Hide brand copy on very tight layouts. */
  brandCopy?: boolean;
  /** Extra footer under the form (legal). */
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
};

/**
 * Composition asymétrique : brand panel (~58%) + form panel.
 * Mobile : hero court + formulaire immédiat (pas 2 écrans de scroll).
 * Toolbar flottante (zIndex) pour garantir un moyen de quitter même si
 * AuthEnter / overlays restent à opacity 0.
 */
export const AuthExperienceShell: React.FC<AuthExperienceShellProps> = ({
  children,
  toolbar,
  brandCopy = true,
  footer,
  contentStyle,
  scroll = true,
}) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const isWide = width >= 900;
  const compact = height < 780 || width < 390;
  const styles = useMemo(
    () => createStyles(isWide, compact, insets.top, insets.bottom),
    [isWide, compact, insets.top, insets.bottom],
  );

  const brand = (
    <AuthEnter fill style={styles.brandPanel}>
      <AuthHero compact={!isWide} showCopy={brandCopy && (isWide || !compact)} />
    </AuthEnter>
  );

  const formInner = (
    <AuthEnter delayMs={80} style={[styles.formInner, contentStyle]}>
      {toolbar ? <View style={styles.toolbarSpacer} /> : null}
      {children}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </AuthEnter>
  );

  const form = scroll ? (
    <ScrollView
      style={styles.formScroll}
      contentContainerStyle={styles.formScrollContent}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      {formInner}
    </ScrollView>
  ) : (
    <View style={styles.formScroll}>{formInner}</View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {isWide ? (
        <View style={styles.wideRow}>
          {brand}
          <View style={styles.formPanel}>{form}</View>
        </View>
      ) : (
        <View style={styles.mobileCol}>
          {brand}
          <View style={styles.formPanelMobile}>{form}</View>
        </View>
      )}
      {toolbar ? (
        <View
          style={[styles.toolbarOverlay, isWide && styles.toolbarOverlayWide]}
          pointerEvents="box-none"
        >
          {toolbar}
        </View>
      ) : null}
    </KeyboardAvoidingView>
  );
};

function createStyles(
  isWide: boolean,
  compact: boolean,
  topInset: number,
  bottomInset: number,
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: AUTH_XP.black,
    },
    wideRow: {
      flex: 1,
      flexDirection: 'row',
    },
    brandPanel: {
      flex: isWide ? AUTH_XP.brandShare : undefined,
      width: isWide ? undefined : '100%',
      height: isWide ? '100%' : compact ? 168 : 200,
      backgroundColor: AUTH_XP.black,
    },
    formPanel: {
      flex: AUTH_XP.formShare,
      backgroundColor: AUTH_XP.black,
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: AUTH_XP.border,
    },
    formPanelMobile: {
      flex: 1,
      backgroundColor: AUTH_XP.black,
      minHeight: 0,
    },
    mobileCol: {
      flex: 1,
    },
    formScroll: {
      flex: 1,
    },
    formScrollContent: {
      flexGrow: 1,
      paddingBottom: Math.max(bottomInset, 16) + 12,
    },
    formInner: {
      flexGrow: 1,
      paddingHorizontal: compact ? 20 : 28,
      paddingTop: isWide ? Math.max(topInset, 24) : 20,
      maxWidth: 480,
      width: '100%',
      alignSelf: 'center',
    },
    toolbarSpacer: {
      height: 48,
      marginBottom: 8,
    },
    toolbarOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 40,
      elevation: 40,
      paddingTop: Math.max(topInset, 8) + (isWide ? 8 : 4),
      paddingHorizontal: compact ? 12 : 16,
    },
    toolbarOverlayWide: {
      left: undefined,
      width: '42%',
      alignSelf: 'flex-end',
      right: 0,
    },
    footer: {
      marginTop: 'auto',
      paddingTop: 24,
    },
  });
}
