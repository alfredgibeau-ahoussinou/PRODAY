import React, { useMemo, useState } from 'react';
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
import type { AppColors } from '../theme/universeTheme';

interface EmailVerificationScreenProps {
  email: string;
  onCheckVerified: () => Promise<boolean>;
  onResend: () => Promise<void>;
  onSignOut: () => Promise<void>;
}

export const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({
  email,
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

  const handleCheck = async () => {
    setChecking(true);
    setError(null);
    try {
      const ok = await onCheckVerified();
      if (!ok) {
        setError('Email non encore confirmé. Ouvrez le lien reçu puis réessayez.');
      }
    } catch {
      setError('Impossible de vérifier le statut. Réessayez.');
    } finally {
      setChecking(false);
    }
  };

  const handleResend = async () => {
    setSending(true);
    setError(null);
    try {
      await onResend();
      setSent(true);
    } catch (e) {
      setError(
        authService.getAuthErrorMessage(e) ||
          'Envoi impossible. Réessayez dans quelques minutes.'
      );
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
          Étape 2 — Vos documents ont été analysés par l’IA. Confirmez maintenant{'\n'}
          <Text style={styles.email}>{email}</Text>
        </Text>
        <Text style={styles.body}>
          Ouvrez le mail ProDay et cliquez sur le lien. Cette étape sécurise votre compte après la
          vérification documentaire.
        </Text>

        {error ? (
          <ProDayErrorBanner message={error} onDismiss={() => setError(null)} />
        ) : null}
        {sent ? (
          <Text style={styles.sentHint}>Email renvoyé — vérifiez vos spams si besoin.</Text>
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
          style={styles.secondaryBtn}
          onPress={() => void handleResend()}
          disabled={sending}
        >
          {sending ? (
            <ActivityIndicator color={c.text} />
          ) : (
            <Text style={styles.secondaryBtnText}>Renvoyer l&apos;email</Text>
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
      backgroundColor: c.ink,
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
      backgroundColor: c.ink,
      borderRadius: radius.lg,
      paddingVertical: spacing.lg,
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    btnDisabled: { opacity: 0.7 },
    primaryBtnText: { color: c.brandInverse, fontSize: 16, fontWeight: '800' },
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
