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
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AuthHero } from './AuthHero';
import { AuthEnter } from './AuthMotion';
import { AUTH_XP } from './tokens';

type AuthExperienceShellProps = {
  children: React.ReactNode;
  toolbar?: React.ReactNode;
  brandCopy?: boolean;
  footer?: React.ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  scroll?: boolean;
  /** Wash pôle (inscription / gate) — comme les shells club/coach. */
  washTop?: string;
  washMid?: string;
};

/**
 * Shell auth — noir + wash pôle optionnel, logo ProDay, formulaire aéré.
 */
export const AuthExperienceShell: React.FC<AuthExperienceShellProps> = ({
  children,
  toolbar,
  brandCopy = true,
  footer,
  contentStyle,
  scroll = true,
  washTop,
  washMid,
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
      {washTop ? (
        <LinearGradient
          colors={[washTop, washMid ?? 'transparent', 'transparent']}
          locations={[0, 0.4, 1]}
          style={styles.wash}
          pointerEvents="none"
        />
      ) : null}

      {toolbar ? <View style={styles.toolbarRow}>{toolbar}</View> : null}

      {isWide ? (
        <View style={styles.wideRow}>
          <AuthEnter fill style={styles.brandPanel}>
            {brand}
          </AuthEnter>
          <View style={styles.formPanel}>{form}</View>
        </View>
      ) : (
        <View style={styles.mobileCol}>{form}</View>
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
    wash: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: 320,
      zIndex: 0,
    },
    toolbarRow: {
      paddingTop: Math.max(topInset, 12),
      paddingHorizontal: compact ? 16 : 20,
      paddingBottom: 4,
      backgroundColor: 'transparent',
      zIndex: 10,
    },
    wideRow: {
      flex: 1,
      flexDirection: 'row',
      zIndex: 1,
    },
    brandPanel: {
      width: '100%',
      backgroundColor: 'transparent',
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
      zIndex: 1,
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
