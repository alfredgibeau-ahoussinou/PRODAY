import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { AnimatedEntrance, PressableSpring } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuthLayout } from '../../components/auth/useAuthLayout';
import type { SignupPhase } from './signupFlowConfig';
import { AuthProgress, AUTH_XP } from '../../features/auth/experience';

interface SignupStepLayoutProps {
  stepIndex: number;
  stepTotal: number;
  stepName?: string;
  phases?: SignupPhase[];
  phaseIndex?: number;
  title: string;
  subtitle?: string;
  contentKey?: string;
  heroIcon?: string;
  onBack?: () => void;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Layout inscription — même DA que Auth Experience (noir, progress dots).
 */
export const SignupStepLayout: React.FC<SignupStepLayoutProps> = ({
  stepIndex,
  stepTotal,
  title,
  subtitle,
  onBack,
  onClose,
  children,
  footer,
}) => {
  const { headerTopPad, contentMaxWidth, tabBarScrollInset: tabInset } = useAuthLayout();
  const scrollBottomPad = tabInset({ stickyFooter: Boolean(footer) });
  const footerBottomPad = tabInset();
  const styles = useMemo(() => createStyles(contentMaxWidth), [contentMaxWidth]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.header, { paddingTop: headerTopPad }]}>
        <View style={styles.headerRow}>
          {onBack || onClose ? (
            <PressableSpring
              onPress={onBack ?? onClose}
              style={styles.iconBtn}
              hitSlop={8}
              scaleTo={0.97}
              haptic
              accessibilityLabel={onBack ? 'Retour' : 'Fermer'}
            >
              <Icon name={onBack ? 'arrow-back' : 'close'} size={20} color={AUTH_XP.white} />
            </PressableSpring>
          ) : (
            <View style={styles.headerSideSpacer} />
          )}
          <AuthProgress stepIndex={stepIndex} stepTotal={Math.min(stepTotal, 8)} />
          <View style={styles.headerSideSpacer} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AnimatedEntrance kind="fadeUp">
          <ProDayText variant="title" style={styles.title}>
            {title}
          </ProDayText>
          {subtitle ? (
            <ProDayText variant="body" style={styles.subtitle}>
              {subtitle}
            </ProDayText>
          ) : null}
        </AnimatedEntrance>
        <View style={styles.body}>{children}</View>
      </ScrollView>

      {footer ? (
        <View style={[styles.footer, { paddingBottom: footerBottomPad }]}>{footer}</View>
      ) : null}
    </KeyboardAvoidingView>
  );
};

function createStyles(contentMaxWidth: number) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: AUTH_XP.black,
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 8,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: AUTH_XP.border,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerSideSpacer: { width: 40 },
    iconBtn: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 2,
      borderWidth: 1,
      borderColor: AUTH_XP.border,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 20,
      maxWidth: contentMaxWidth + 40,
      width: '100%',
      alignSelf: 'center',
    },
    title: {
      color: AUTH_XP.white,
      fontSize: 26,
      letterSpacing: -0.3,
      marginBottom: 8,
    },
    subtitle: {
      color: AUTH_XP.textMuted,
      lineHeight: 22,
      marginBottom: 20,
    },
    body: {
      gap: 12,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 12,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: AUTH_XP.border,
      backgroundColor: AUTH_XP.black,
    },
  });
}
