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
  /** Toolbar (back, language) */
  toolbar?: React.ReactNode;
  /** Hide brand copy on very tight layouts. */
  brandCopy?: boolean;
  /** Extra footer under the form (legal). */
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
};

/**
 * Shell d'authentification épuré — Toolbar en flux naturel (pas d'overlay qui chevauche le logo),
 * logo officiel ProDay centré et formulaire aéré.
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

  const formContent = (
    <View style={[styles.formInner, contentStyle]}>
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
      {!isWide ? brand : null}
      {formContent}
    </ScrollView>
  ) : (
    <View style={styles.formScroll}>
      {!isWide ? brand : null}
      {formContent}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {toolbar ? (
        <View style={styles.toolbarRow}>
          {toolbar}
        </View>
      ) : null}

      {isWide ? (
        <View style={styles.wideRow}>
          <AuthEnter fill style={styles.brandPanel}>
            {brand}
          </AuthEnter>
          <View style={styles.formPanel}>{form}</View>
        </View>
      ) : (
        <View style={styles.mobileCol}>
          {form}
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
      backgroundColor: '#000000',
    },
    toolbarRow: {
      paddingTop: Math.max(topInset, 12),
      paddingHorizontal: compact ? 16 : 20,
      paddingBottom: 4,
      backgroundColor: '#000000',
      zIndex: 10,
    },
    wideRow: {
      flex: 1,
      flexDirection: 'row',
    },
    brandPanel: {
      width: '100%',
      backgroundColor: '#000000',
      paddingBottom: compact ? 8 : 14,
    },
    formPanel: {
      flex: AUTH_XP.formShare,
      backgroundColor: '#000000',
      borderLeftWidth: StyleSheet.hairlineWidth,
      borderLeftColor: 'rgba(255, 255, 255, 0.1)',
    },
    mobileCol: {
      flex: 1,
    },
    formScroll: {
      flex: 1,
    },
    formScrollContent: {
      flexGrow: 1,
      justifyContent: 'center',
      paddingBottom: Math.max(bottomInset, 16) + 24,
      paddingTop: compact ? 8 : 16,
    },
    formInner: {
      flexGrow: 0,
      paddingHorizontal: compact ? 20 : 28,
      maxWidth: 420,
      width: '100%',
      alignSelf: 'center',
    },
    footer: {
      marginTop: 'auto',
      paddingTop: 20,
    },
  });
}
