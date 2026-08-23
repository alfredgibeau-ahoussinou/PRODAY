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
import { AUTH_XP } from './tokens';

type AuthExperienceShellProps = {
  children: React.ReactNode;
  /** Toolbar (back, language) overlaid on brand or form. */
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
    <View style={styles.brandPanel}>
      <AuthHero compact={!isWide} showCopy={brandCopy && (isWide || !compact)} />
    </View>
  );

  const formInner = (
    <View style={[styles.formInner, contentStyle]}>
      {toolbar ? <View style={styles.toolbar}>{toolbar}</View> : null}
      {children}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
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
    toolbar: {
      marginBottom: 16,
    },
    footer: {
      marginTop: 'auto',
      paddingTop: 24,
    },
  });
}
