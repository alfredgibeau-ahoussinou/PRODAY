import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Icon } from '../components/ui/Icon';
import { ProDayErrorBanner } from '../components/ui/ProDayErrorBanner';
import { spacing, radius } from '../theme/designTokens';
import { useThemedScreen } from '../hooks/useThemedScreen';
import { authService } from '../services/auth.service';
import { AUTH_RATE_LIMIT_MESSAGE } from '../utils/authOAuthLink';
import { consumeVerificationEmailAutoResend } from '../utils/verificationEmailResend';
import type { AppColors } from '../theme/universeTheme';

const RESEND_COOLDOWN_SEC = 60;

interface EmailVerificationScreenProps {
  uid: string;
  email: string;
  /** Copie adaptée praticiens Santé (sans mention documents joueur). */
  variant?: 'default' | 'practitioner';
  onCheckVerified: () => Promise<boolean>;
  onResend: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  uid,
  email,
  variant = 'default',
  onCheckVerified,
  onResend,
  onSignOut,
}) => {
  const { colors: c, rootStyle } = useThemedScreen();
  const styles = useMemo(() => createStyles(c), [c]);
  const [checking, setChecking] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [autoSending, setAutoSending] = useState(false);

  useEffect(() => {
    if (!uid || !consumeVerificationEmailAutoResend(uid)) return;

    let cancelled = false;
    setAutoSending(true);
    setError(null);
    void (async () => {
      try {
        await onResend();
        if (!cancelled) {
          setSent(true);
          setResendCooldown(RESEND_COOLDOWN_SEC);
        }
      } catch (e) {
        if (!cancelled) {
          setError(
            authService.getAuthErrorMessage(e) ||
              'Premier envoi impossible. Utilisez « Renvoyer l’email » dans quelques minutes.'
          );
        }
      } finally {
        if (!cancelled) setAutoSending(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uid, onResend]);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((sec) => (sec <= 1 ? 0 : sec - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleCheck = async () => {
    setChecking(true);
    setError(null);
    try {
      const ok = await onCheckVerified();
      if (!ok) {
        setError('Email non encore confirmé. Ouvrez le lien reçu puis réessayez.');
      }
    } catch (e) {
      setError(
        authService.getAuthErrorMessage(e) ||
          'Impossible de vérifier le statut. Réessayez.'
      );
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0) return;
    setSending(true);
    setError(null);
    try {
      await onResend();
      setSent(true);
      setResendCooldown(RESEND_COOLDOWN_SEC);
    } catch (e) {
      const message =
        authService.getAuthErrorMessage(e) ||
        'Envoi impossible. Réessayez dans quelques minutes.';
      setError(message);
      if (message === AUTH_RATE_LIMIT_MESSAGE) {
        setResendCooldown(RESEND_COOLDOWN_SEC * 5);
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={[styles.root, rootStyle]} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          <Icon name="mail" size={40} color={c.brandInverse} />
        </View>
        <Text style={styles.title}>Vérifiez votre email</Text>
        <Text style={styles.subtitle}>
          {variant === 'practitioner'
            ? 'Confirmez votre adresse pour activer votre espace Pro Day Santé. \n'
            : 'Étape 2. Vos documents ont été analysés par l’IA. Confirmez maintenant\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>
        <Text style={styles.body}>
          {variant === 'practitioner'
            ? 'Ouvrez le mail ProDay et cliquez sur le lien de confirmation. Cette étape sécurise votre compte praticien avant l’accès à l’agenda et aux rendez-vous.'
            : 'Ouvrez le mail ProDay et cliquez sur le lien. Cette étape sécurise votre compte après la vérification documentaire.'}
        </Text>

        {error ? (
          <ProDayErrorBanner message={error} onDismiss={() => setError(null)} />
        ) : null}
        {sent ? (
          <Text style={styles.sentHint}>Email renvoyé. Vérifiez vos spams si besoin.</Text>
        ) : null}
        {autoSending ? (
          <Text style={styles.sentHint}>Envoi de l’e-mail de confirmation en cours…</Text>
        ) : null}

        <TouchableOpacity
          style={[styles.primaryBtn, checking && styles.btnDisabled]}
          onPress={() => void handleCheck()}
          disabled={checking}
        >
          {checking ? (
            <ActivityIndicator color={c.brandInverse} />
          ) : (
            <Text style={styles.primaryBtnText}>J&apos;ai confirmé mon email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, (resendCooldown > 0 || autoSending) && styles.btnDisabled]}
          onPress={() => void handleResend()}
          disabled={sending || resendCooldown > 0 || autoSending}
        >
          {sending ? (
            <ActivityIndicator color={c.text} />
          ) : (
            <Text style={styles.secondaryBtnText}>
              {resendCooldown > 0
                ? `Renvoyer l’email (${resendCooldown}s)`
                : 'Renvoyer l’email'}
            </Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={() => void onSignOut()}>
          <Text style={styles.linkText}>Utiliser un autre compte</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

function createStyles(c: AppColors) {
  return StyleSheet.create({
    root: { flex: 1 },
    content: {
      flex: 1,
      padding: spacing.xl,
      justifyContent: 'center',
    },
    iconWrap: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: c.accent,
      alignItems: 'center',
      justifyContent: 'center',
      alignSelf: 'center',
      marginBottom: spacing.lg,
    },
    title: {
      fontSize: 24,
      fontWeight: '900',
      color: c.text,
      textAlign: 'center',
      marginBottom: spacing.sm,
    },
    subtitle: {
      fontSize: 15,
      color: c.textSecondary,
      textAlign: 'center',
      lineHeight: 22,
      marginBottom: spacing.md,
    },
    email: { fontWeight: '800', color: c.text },
    body: {
      fontSize: 14,
      color: c.textMuted,
      textAlign: 'center',
      lineHeight: 21,
      marginBottom: spacing.lg,
    },
    sentHint: {
      fontSize: 13,
      color: c.success,
      textAlign: 'center',
      marginBottom: spacing.md,
      fontWeight: '600',
    },
    primaryBtn: {
      backgroundColor: c.accent,
      borderRadius: radius.lg,
      paddingVertical: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    btnDisabled: { opacity: 0.7 },
    primaryBtnText: { color: '#000000', fontSize: 16, fontWeight: '800' },
    secondaryBtn: {
      backgroundColor: c.surface,
      borderRadius: radius.lg,
      paddingVertical: spacing.lg,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: c.border,
      marginBottom: spacing.md,
    },
    secondaryBtnText: { color: c.text, fontSize: 15, fontWeight: '700' },
    linkBtn: { alignItems: 'center', paddingVertical: spacing.md },
    linkText: { color: c.textMuted, fontSize: 14, fontWeight: '600' },
  });
}
