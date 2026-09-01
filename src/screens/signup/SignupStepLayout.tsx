import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Icon } from '../../components/ui/Icon';
import { PressableSpring } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuthLayout } from '../../components/auth/useAuthLayout';
import type { SignupPhase } from './signupFlowConfig';
import { AuthProgress } from '../../features/auth/experience';

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
 * Layout inscription épuré et minimaliste — fond noir pur, progression fine et typographie soignée.
 */
export const SignupStepLayout: React.FC<SignupStepLayoutProps> = ({
  stepIndex,
  stepTotal,
  stepName,
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
              hitSlop={14}
              scaleTo={0.92}
              haptic
              accessibilityRole="button"
              accessibilityLabel={onBack ? 'Retour' : 'Fermer'}
            >
              <Icon name={onBack ? 'arrow-back' : 'close'} size={18} color="#FFFFFF" />
            </PressableSpring>
          ) : (
            <View style={styles.headerSideSpacer} />
          )}
          <View style={styles.progressWrap}>
            <AuthProgress stepIndex={stepIndex} stepTotal={Math.min(stepTotal, 8)} />
          </View>
          <View style={styles.headerSideSpacer} />
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {stepName ? (
          <View style={styles.stepKickerWrap}>
            <ProDayText variant="eyebrow" style={styles.stepKicker}>
              {stepName.toUpperCase()} · ÉTAPE {stepIndex + 1}
            </ProDayText>
          </View>
        ) : null}
        <ProDayText variant="title" style={styles.title}>
          {title}
        </ProDayText>
        {subtitle ? (
          <ProDayText variant="body" style={styles.subtitle}>
            {subtitle}
          </ProDayText>
        ) : null}
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
      backgroundColor: '#000000',
    },
    header: {
      paddingHorizontal: 16,
      paddingBottom: 8,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    headerSideSpacer: { width: 38 },
    progressWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconBtn: {
      width: 38,
      height: 38,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: 19,
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 16,
      maxWidth: contentMaxWidth + 40,
      width: '100%',
      alignSelf: 'center',
    },
    stepKickerWrap: {
      marginBottom: 6,
    },
    stepKicker: {
      color: '#F5D04A',
      fontSize: 10,
      fontWeight: '700',
      letterSpacing: 1.2,
    },
    title: {
      color: '#FFFFFF',
      fontSize: 26,
      fontWeight: '800',
      letterSpacing: -0.5,
      marginBottom: 6,
    },
    subtitle: {
      color: 'rgba(255, 255, 255, 0.55)',
      fontSize: 14,
      lineHeight: 20,
      fontWeight: '400',
      marginBottom: 20,
    },
    body: {
      gap: 12,
    },
    footer: {
      paddingHorizontal: 20,
      paddingTop: 10,
      backgroundColor: '#000000',
    },
  });
}
