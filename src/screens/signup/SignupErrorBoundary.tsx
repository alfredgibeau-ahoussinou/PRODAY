import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { fontFamily } from '../../theme/typography';
import { colors, radius, spacing } from '../../theme/designTokens';

interface SignupErrorBoundaryProps {
  children: React.ReactNode;
  onRetry?: () => void;
  onClose?: () => void;
}

interface SignupErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Capture toute exception non gérée survenue lors du tunnel d'inscription
 * et fournit une interface d'auto-récupération sans perte de saisie.
 */
export class SignupErrorBoundary extends React.Component<
  SignupErrorBoundaryProps,
  SignupErrorBoundaryState
> {
  state: SignupErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  static getDerivedStateFromError(error: Error): SignupErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    if (__DEV__) {
      console.warn('[SignupErrorBoundary] Caught error in signup flow:', error, errorInfo);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container} accessibilityRole="alert">
          <View style={styles.card}>
            <View style={styles.iconWrap}>
              <Ionicons name="refresh" size={28} color="#0054F0" />
            </View>

            <Text style={styles.title}>Reprendre l’inscription</Text>
            <Text style={styles.subtitle}>
              Une anomalie passagère est survenue. Vos informations ont été conservées en sécurité.
            </Text>

            {this.state.error?.message ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText} numberOfLines={3}>
                  {this.state.error.message}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={styles.primaryButton}
              onPress={this.handleRetry}
              accessibilityRole="button"
              accessibilityLabel="Reprendre l'inscription"
            >
              <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>Reprendre l’inscription</Text>
            </Pressable>

            {this.props.onClose ? (
              <Pressable
                style={styles.secondaryButton}
                onPress={this.props.onClose}
                accessibilityRole="button"
                accessibilityLabel="Quitter l'inscription"
              >
                <Text style={styles.secondaryButtonText}>Quitter</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: radius.xxl,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 84, 240, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 20,
    fontFamily: fontFamily.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  errorBox: {
    width: '100%',
    backgroundColor: 'rgba(255, 69, 58, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255, 69, 58, 0.2)',
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.md,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fontFamily.regular,
    color: colors.error,
    textAlign: 'center',
  },
  primaryButton: {
    width: '100%',
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: '#0054F0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  primaryButtonText: {
    fontSize: 15,
    fontFamily: fontFamily.semibold,
    color: '#FFFFFF',
  },
  secondaryButton: {
    marginTop: spacing.md,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontFamily: fontFamily.regular,
    color: colors.textMuted,
  },
});
