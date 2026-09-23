import React, { useMemo } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Icon } from '../../components/ui/Icon';
import { PressableSpring } from '../../components/motion';
import { ProDayText } from '../../components/ui/ProDayText';
import { useAuthLayout } from '../../components/auth/useAuthLayout';
import type { SignupPhase } from './signupFlowConfig';
import { useSignupFlowTheme } from './SignupFlowContext';
import type { SignupVisualChrome } from './signupVisualSystem';
import { LiquidGlassSurface } from '../../components/ui/LiquidGlassSurface';
import { radius, spacing } from '../../theme/designTokens';

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
  /** Étape précédente, ou fermer si étape 1. */
  onBack?: () => void;
  /** Toujours disponible — quitte l’inscription (gate). */
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/**
 * Nouveau layout d'inscription ProDay :
 * - Expérience épurée, une question/tâche claire par écran
 * - Navigation Liquid Glass progressive avec repli standard opaque
 * - Typographie Apple SF Pro haute lisibilité
 * - Zéro cartes imbriquées superflues, zéro bruit visuel
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
  const { visual } = useSignupFlowTheme();
  const total = Math.max(1, Math.min(stepTotal, 8));
  const active = Math.min(Math.max(stepIndex, 0), total - 1);
  const progress = (active + 1) / total;
  const canNavigateBack = Boolean(onBack);
  const canClose = Boolean(onClose);
  const scrollBottomPad = tabInset({ stickyFooter: Boolean(footer) }) + 32;
  const footerBottomPad = tabInset();
  const styles = useMemo(() => createStyles(contentMaxWidth, visual), [contentMaxWidth, visual]);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient
        colors={[visual.washTop, visual.washMid, visual.bg]}
        locations={[0, 0.4, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      {/* Header Liquid Glass épuré */}
      <View style={[styles.headerContainer, { paddingTop: headerTopPad + 4 }]}>
        <View style={styles.headerRow}>
          {canNavigateBack ? (
            <PressableSpring
              onPress={onBack}
              style={styles.navBtn}
              hitSlop={16}
              scaleTo={0.92}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Étape précédente"
              testID="signup-back"
            >
              <Icon name="arrow-back" size={20} color={visual.text} />
            </PressableSpring>
          ) : (
            <View style={styles.navSpacer} />
          )}

          {/* Indicateur de progression discret */}
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.round(progress * 100)}%`,
                    backgroundColor: visual.accent,
                  },
                ]}
              />
            </View>
            <ProDayText style={styles.progressLabel}>
              Étape {active + 1} sur {total}
            </ProDayText>
          </View>

          {canClose ? (
            <PressableSpring
              onPress={onClose}
              style={styles.navBtn}
              hitSlop={16}
              scaleTo={0.92}
              haptic
              accessibilityRole="button"
              accessibilityLabel="Fermer l’inscription"
              testID="signup-close"
            >
              <Icon name="close" size={20} color={visual.text} />
            </PressableSpring>
          ) : (
            <View style={styles.navSpacer} />
          )}
        </View>
      </View>

      {/* Contenu principal épuré et aéré */}
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: scrollBottomPad }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>
          <View style={styles.titleSection}>
            <ProDayText style={styles.title}>{title}</ProDayText>
            {subtitle ? (
              <ProDayText style={styles.subtitle}>{subtitle}</ProDayText>
            ) : null}
          </View>

          <View style={styles.bodyWrap}>{children}</View>
        </View>
      </ScrollView>

      {/* Footer d'action flottant Liquid Glass */}
      {footer ? (
        <LiquidGlassSurface
          variant="footer"
          style={styles.footerSurface}
          contentStyle={[styles.footerContent, { paddingBottom: footerBottomPad + 8 }]}
        >
          <View style={styles.footerInner}>{footer}</View>
        </LiquidGlassSurface>
      ) : null}
    </KeyboardAvoidingView>
  );
};

function createStyles(contentMaxWidth: number, v: SignupVisualChrome) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: v.bg,
    },
    headerContainer: {
      paddingHorizontal: 20,
      paddingBottom: 12,
      zIndex: 10,
    },
    headerRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 16,
    },
    navBtn: {
      width: 42,
      height: 42,
      borderRadius: radius.pill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
    },
    navSpacer: {
      width: 42,
      height: 42,
    },
    progressContainer: {
      flex: 1,
      alignItems: 'center',
      gap: 6,
    },
    progressTrack: {
      width: '100%',
      maxWidth: 160,
      height: 4,
      borderRadius: 2,
      backgroundColor: 'rgba(255, 255, 255, 0.12)',
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: 2,
    },
    progressLabel: {
      color: v.textMuted,
      fontSize: 12,
      fontWeight: '600',
      letterSpacing: 0.3,
    },
    scroll: {
      paddingHorizontal: 20,
      paddingTop: 12,
      width: '100%',
      alignSelf: 'center',
    },
    contentWrap: {
      width: '100%',
      maxWidth: Math.min(contentMaxWidth, 560),
      alignSelf: 'center',
    },
    titleSection: {
      marginBottom: 24,
    },
    title: {
      color: v.text,
      fontSize: 28,
      lineHeight: 34,
      fontWeight: '700',
      letterSpacing: -0.5,
      marginBottom: 8,
    },
    subtitle: {
      color: v.textMuted,
      fontSize: 15,
      lineHeight: 22,
      fontWeight: '400',
    },
    bodyWrap: {
      gap: 16,
    },
    footerSurface: {
      position: 'relative',
      zIndex: 10,
    },
    footerContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
    },
    footerInner: {
      width: '100%',
      maxWidth: Math.min(contentMaxWidth, 560),
      alignSelf: 'center',
    },
  });
}
